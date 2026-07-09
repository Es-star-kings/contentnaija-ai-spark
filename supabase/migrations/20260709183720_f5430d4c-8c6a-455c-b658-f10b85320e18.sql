
-- ============ Phase 2: Subscriptions, Credits, Paystack ============

-- Plans enum
DO $$ BEGIN
  CREATE TYPE public.plan_tier AS ENUM ('free', 'pro', 'agency');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- subscription_plans (catalog) ----------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  tier public.plan_tier PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_price_kobo INTEGER NOT NULL DEFAULT 0,
  yearly_price_kobo INTEGER NOT NULL DEFAULT 0,
  monthly_generation_quota INTEGER NOT NULL, -- -1 = unlimited
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Plans are public" ON public.subscription_plans FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO public.subscription_plans(tier, name, monthly_price_kobo, yearly_price_kobo, monthly_generation_quota, features) VALUES
  ('free',   'Free',   0,        0,         20, '["Basic generators","Community support","History"]'::jsonb),
  ('pro',    'Pro',    990000,   9900000,   500, '["Premium generators","Unlimited history","Brand memory","Priority AI","Export PDF"]'::jsonb),
  ('agency', 'Agency', 2990000,  29900000, -1,  '["Everything in Pro","Unlimited generations","Unlimited brands","Team workspace","Advanced analytics","Priority support"]'::jsonb)
ON CONFLICT (tier) DO UPDATE
  SET name = EXCLUDED.name,
      monthly_price_kobo = EXCLUDED.monthly_price_kobo,
      yearly_price_kobo = EXCLUDED.yearly_price_kobo,
      monthly_generation_quota = EXCLUDED.monthly_generation_quota,
      features = EXCLUDED.features;

-- ---------- subscriptions (per user) ----------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier public.plan_tier NOT NULL DEFAULT 'free',
  status public.subscription_status NOT NULL DEFAULT 'active',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- 'monthly' | 'yearly'
  paystack_customer_code TEXT,
  paystack_subscription_code TEXT,
  paystack_email_token TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  granted_by_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users read own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- usage_credits (monthly buckets) ----------
CREATE TABLE IF NOT EXISTS public.usage_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_month DATE NOT NULL, -- first day of month (UTC)
  tier public.plan_tier NOT NULL,
  generations_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_month)
);
GRANT SELECT ON public.usage_credits TO authenticated;
GRANT ALL ON public.usage_credits TO service_role;
ALTER TABLE public.usage_credits ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users read own usage" ON public.usage_credits FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TRIGGER trg_usage_credits_updated_at BEFORE UPDATE ON public.usage_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- payment_history ----------
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paystack_reference TEXT UNIQUE,
  amount_kobo INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL, -- success | failed | pending
  tier public.plan_tier,
  billing_cycle TEXT,
  channel TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_history TO authenticated;
GRANT ALL ON public.payment_history TO service_role;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users read own payments" ON public.payment_history FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- Helpers ----------
CREATE OR REPLACE FUNCTION public.current_period_month()
RETURNS DATE
LANGUAGE sql
STABLE
AS $$ SELECT date_trunc('month', timezone('utc', now()))::date $$;

CREATE OR REPLACE FUNCTION public.get_active_tier(_user_id UUID)
RETURNS public.plan_tier
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tier FROM public.subscriptions
      WHERE user_id = _user_id
        AND status = 'active'
        AND (current_period_end IS NULL OR current_period_end > now())
      LIMIT 1),
    'free'::public.plan_tier
  );
$$;

-- Atomic quota check + increment. Returns new generations_used, or raises if over quota.
CREATE OR REPLACE FUNCTION public.consume_generation_credit(_user_id UUID)
RETURNS TABLE(tier public.plan_tier, used INTEGER, quota INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_tier public.plan_tier;
  quota_val INTEGER;
  new_used INTEGER;
  month_d DATE := public.current_period_month();
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  active_tier := public.get_active_tier(_user_id);
  SELECT monthly_generation_quota INTO quota_val FROM public.subscription_plans WHERE subscription_plans.tier = active_tier;

  INSERT INTO public.usage_credits(user_id, period_month, tier, generations_used)
  VALUES (_user_id, month_d, active_tier, 1)
  ON CONFLICT (user_id, period_month) DO UPDATE
    SET generations_used = public.usage_credits.generations_used + 1,
        tier = active_tier,
        updated_at = now()
  RETURNING generations_used INTO new_used;

  IF quota_val >= 0 AND new_used > quota_val THEN
    -- rollback the increment
    UPDATE public.usage_credits SET generations_used = generations_used - 1
      WHERE user_id = _user_id AND period_month = month_d;
    RAISE EXCEPTION 'quota_exceeded' USING ERRCODE = 'P0001';
  END IF;
  RETURN QUERY SELECT active_tier, new_used, quota_val;
END; $$;

GRANT EXECUTE ON FUNCTION public.get_active_tier(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_generation_credit(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_period_month() TO authenticated, service_role;

-- Auto-create free subscription for new users
CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions(user_id, tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_default_subscription();

-- Backfill for existing users
INSERT INTO public.subscriptions(user_id, tier, status)
SELECT id, 'free', 'active' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
