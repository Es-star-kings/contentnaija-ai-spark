-- 1. payment_transactions
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference TEXT NOT NULL UNIQUE,
  tier public.plan_tier NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly','yearly')),
  amount_kobo INTEGER NOT NULL CHECK (amount_kobo > 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','success','failed','cancelled')),
  paystack_transaction_id TEXT,
  paystack_customer_code TEXT,
  paystack_subscription_code TEXT,
  authorization_url TEXT,
  access_code TEXT,
  paid_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  failure_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_transactions_user ON public.payment_transactions(user_id, created_at DESC);

GRANT SELECT ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own payment transactions"
  ON public.payment_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER trg_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. payment_webhook_events
CREATE TABLE public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload_hash TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','processing','processed','failed','ignored')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.payment_webhook_events TO service_role;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- 3. generation_credit_refunds
CREATE TABLE public.generation_credit_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_key TEXT NOT NULL UNIQUE,
  period_month DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.generation_credit_refunds TO authenticated;
GRANT ALL ON public.generation_credit_refunds TO service_role;

ALTER TABLE public.generation_credit_refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own refunds"
  ON public.generation_credit_refunds FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 4. idempotent, ownership-protected refund RPC
CREATE OR REPLACE FUNCTION public.refund_generation_credit(_user_id uuid, _operation_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  month_d DATE := public.current_period_month();
  inserted BOOLEAN := false;
BEGIN
  IF _user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  IF _operation_key IS NULL OR length(btrim(_operation_key)) = 0 THEN
    RAISE EXCEPTION 'operation_key_required';
  END IF;

  INSERT INTO public.generation_credit_refunds(user_id, operation_key, period_month)
  VALUES (_user_id, _operation_key, month_d)
  ON CONFLICT (operation_key) DO NOTHING;

  GET DIAGNOSTICS inserted = ROW_COUNT;
  IF NOT inserted THEN
    RETURN false;
  END IF;

  UPDATE public.usage_credits
     SET generations_used = GREATEST(0, generations_used - 1),
         updated_at = now()
   WHERE user_id = _user_id AND period_month = month_d;

  RETURN true;
END; $$;

REVOKE ALL ON FUNCTION public.refund_generation_credit(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.refund_generation_credit(uuid, text) TO authenticated, service_role;

-- 5. consume_generation_credit: reject cross-user calls
CREATE OR REPLACE FUNCTION public.consume_generation_credit(_user_id uuid)
RETURNS TABLE(tier plan_tier, used integer, quota integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  active_tier public.plan_tier;
  quota_val INTEGER;
  new_used INTEGER;
  month_d DATE := public.current_period_month();
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF auth.uid() IS NOT NULL AND auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
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
    UPDATE public.usage_credits SET generations_used = generations_used - 1
      WHERE user_id = _user_id AND period_month = month_d;
    RAISE EXCEPTION 'quota_exceeded' USING ERRCODE = 'P0001';
  END IF;
  RETURN QUERY SELECT active_tier, new_used, quota_val;
END; $$;

-- 6. atomic, idempotent payment activation (service role only)
CREATE OR REPLACE FUNCTION public.apply_successful_payment(
  _reference text,
  _paystack_transaction_id text,
  _paystack_customer_code text,
  _channel text,
  _paid_at timestamptz,
  _raw jsonb
)
RETURNS TABLE(already_processed boolean, tier plan_tier, billing_cycle text, amount_kobo integer, period_end timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  tx public.payment_transactions;
  new_period_end TIMESTAMPTZ;
BEGIN
  SELECT * INTO tx FROM public.payment_transactions
   WHERE reference = _reference FOR UPDATE;

  IF tx IS NULL THEN
    RAISE EXCEPTION 'unknown_reference';
  END IF;

  IF tx.status = 'success' THEN
    RETURN QUERY SELECT true, tx.tier, tx.billing_cycle, tx.amount_kobo,
      (SELECT s.current_period_end FROM public.subscriptions s WHERE s.user_id = tx.user_id);
    RETURN;
  END IF;

  new_period_end := CASE WHEN tx.billing_cycle = 'monthly'
    THEN now() + interval '1 month' ELSE now() + interval '1 year' END;

  INSERT INTO public.subscriptions(user_id, tier, status, billing_cycle, current_period_end, cancel_at_period_end)
  VALUES (tx.user_id, tx.tier, 'active', tx.billing_cycle, new_period_end, false)
  ON CONFLICT (user_id) DO UPDATE
    SET tier = EXCLUDED.tier,
        status = 'active',
        billing_cycle = EXCLUDED.billing_cycle,
        current_period_end = EXCLUDED.current_period_end,
        cancel_at_period_end = false,
        updated_at = now();

  INSERT INTO public.payment_history(user_id, paystack_reference, amount_kobo, currency, status, tier, billing_cycle, channel, raw)
  VALUES (tx.user_id, tx.reference, tx.amount_kobo, tx.currency, 'success', tx.tier, tx.billing_cycle, _channel, _raw)
  ON CONFLICT (paystack_reference) DO UPDATE
    SET status = 'success', raw = EXCLUDED.raw, channel = EXCLUDED.channel;

  UPDATE public.payment_transactions
     SET status = 'success',
         paystack_transaction_id = COALESCE(_paystack_transaction_id, paystack_transaction_id),
         paystack_customer_code = COALESCE(_paystack_customer_code, paystack_customer_code),
         paid_at = COALESCE(_paid_at, now()),
         processed_at = now()
   WHERE id = tx.id;

  RETURN QUERY SELECT false, tx.tier, tx.billing_cycle, tx.amount_kobo, new_period_end;
END; $$;

REVOKE ALL ON FUNCTION public.apply_successful_payment(text, text, text, text, timestamptz, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.apply_successful_payment(text, text, text, text, timestamptz, jsonb) TO service_role;