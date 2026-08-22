-- Server-owned Paystack transaction and webhook ledgers.
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference TEXT NOT NULL UNIQUE,
  tier public.plan_tier NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount_kobo INTEGER NOT NULL CHECK (amount_kobo > 0),
  currency TEXT NOT NULL DEFAULT 'NGN' CHECK (currency = 'NGN'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'cancelled')),
  paystack_transaction_id TEXT,
  paystack_customer_code TEXT,
  paystack_subscription_code TEXT,
  authorization_url TEXT,
  access_code TEXT,
  paid_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  failure_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_transactions_user_id_idx ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS payment_transactions_status_idx ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS payment_transactions_subscription_code_idx ON public.payment_transactions(paystack_subscription_code);
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;
DROP POLICY IF EXISTS "Users read own payment transactions" ON public.payment_transactions;
CREATE POLICY "Users read own payment transactions" ON public.payment_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER trg_payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payment_webhook_events_type_idx ON public.payment_webhook_events(event_type);
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.payment_webhook_events TO service_role;

CREATE TABLE IF NOT EXISTS public.generation_credit_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_key TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_month DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.generation_credit_refunds ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.generation_credit_refunds TO service_role;

-- Payment state and entitlement changes occur in one transaction and are safe to replay.
CREATE OR REPLACE FUNCTION public.process_paystack_payment(
  _reference TEXT,
  _paystack_transaction_id TEXT,
  _paystack_customer_code TEXT,
  _paystack_subscription_code TEXT,
  _paid_at TIMESTAMPTZ,
  _channel TEXT,
  _raw JSONB
)
RETURNS TABLE(success BOOLEAN, tier public.plan_tier, billing_cycle TEXT, amount_kobo INTEGER, period_end TIMESTAMPTZ, already_processed BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  payment public.payment_transactions%ROWTYPE;
  existing_subscription public.subscriptions%ROWTYPE;
  start_at TIMESTAMPTZ := COALESCE(_paid_at, now());
  new_period_end TIMESTAMPTZ;
BEGIN
  IF current_user <> 'service_role' THEN RAISE EXCEPTION 'not authorized'; END IF;

  SELECT * INTO payment FROM public.payment_transactions WHERE reference = _reference FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment transaction not found'; END IF;

  IF payment.status = 'success' THEN
    RETURN QUERY SELECT true, payment.tier, payment.billing_cycle, payment.amount_kobo,
      payment.paid_at + CASE WHEN payment.billing_cycle = 'monthly' THEN interval '1 month' ELSE interval '1 year' END,
      true;
    RETURN;
  END IF;

  UPDATE public.payment_transactions
    SET status = 'processing', paystack_transaction_id = _paystack_transaction_id,
        paystack_customer_code = COALESCE(_paystack_customer_code, paystack_customer_code),
        paystack_subscription_code = COALESCE(_paystack_subscription_code, paystack_subscription_code),
        paid_at = start_at, failure_reason = NULL
    WHERE id = payment.id;

  INSERT INTO public.payment_history(user_id, paystack_reference, amount_kobo, currency, status, tier, billing_cycle, channel, raw)
  VALUES (payment.user_id, payment.reference, payment.amount_kobo, payment.currency, 'success', payment.tier, payment.billing_cycle, _channel, _raw)
  ON CONFLICT (paystack_reference) DO NOTHING;

  SELECT * INTO existing_subscription FROM public.subscriptions WHERE user_id = payment.user_id FOR UPDATE;
  new_period_end := GREATEST(COALESCE(existing_subscription.current_period_end, start_at), start_at)
    + CASE WHEN payment.billing_cycle = 'monthly' THEN interval '1 month' ELSE interval '1 year' END;

  INSERT INTO public.subscriptions(user_id, tier, status, billing_cycle, paystack_customer_code, paystack_subscription_code, current_period_end, cancel_at_period_end)
  VALUES (payment.user_id, payment.tier, 'active', payment.billing_cycle,
    _paystack_customer_code, _paystack_subscription_code, new_period_end, false)
  ON CONFLICT (user_id) DO UPDATE SET
    tier = EXCLUDED.tier, status = 'active', billing_cycle = EXCLUDED.billing_cycle,
    paystack_customer_code = COALESCE(EXCLUDED.paystack_customer_code, subscriptions.paystack_customer_code),
    paystack_subscription_code = COALESCE(EXCLUDED.paystack_subscription_code, subscriptions.paystack_subscription_code),
    current_period_end = new_period_end, cancel_at_period_end = false, updated_at = now();

  UPDATE public.payment_transactions SET status = 'success', processed_at = now() WHERE id = payment.id;
  RETURN QUERY SELECT true, payment.tier, payment.billing_cycle, payment.amount_kobo, new_period_end, false;
END; $$;
REVOKE ALL ON FUNCTION public.process_paystack_payment(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_paystack_payment(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT, JSONB) TO service_role;

-- Prevent authenticated callers from operating on another user's credits.
CREATE OR REPLACE FUNCTION public.consume_generation_credit(_user_id UUID)
RETURNS TABLE(tier public.plan_tier, used INTEGER, quota INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  active_tier public.plan_tier;
  quota_val INTEGER;
  new_used INTEGER;
  month_d DATE := public.current_period_month();
BEGIN
  IF _user_id IS NULL OR (auth.uid() IS NULL AND current_user <> 'service_role') OR (auth.uid() IS NOT NULL AND auth.uid() <> _user_id) THEN RAISE EXCEPTION 'not authorized'; END IF;
  active_tier := public.get_active_tier(_user_id);
  SELECT monthly_generation_quota INTO quota_val FROM public.subscription_plans WHERE subscription_plans.tier = active_tier;
  INSERT INTO public.usage_credits(user_id, period_month, tier, generations_used) VALUES (_user_id, month_d, active_tier, 1)
  ON CONFLICT (user_id, period_month) DO UPDATE SET generations_used = public.usage_credits.generations_used + 1, tier = active_tier, updated_at = now()
  RETURNING generations_used INTO new_used;
  IF quota_val >= 0 AND new_used > quota_val THEN
    UPDATE public.usage_credits SET generations_used = generations_used - 1 WHERE user_id = _user_id AND period_month = month_d;
    RAISE EXCEPTION 'quota_exceeded' USING ERRCODE = 'P0001';
  END IF;
  RETURN QUERY SELECT active_tier, new_used, quota_val;
END; $$;

DROP FUNCTION IF EXISTS public.refund_generation_credit(UUID);
CREATE OR REPLACE FUNCTION public.refund_generation_credit(_user_id UUID, _operation_key TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE month_d DATE := public.current_period_month();
BEGIN
  IF _user_id IS NULL OR _operation_key IS NULL OR length(_operation_key) < 8
    OR (auth.uid() IS NULL AND current_user <> 'service_role')
    OR (auth.uid() IS NOT NULL AND auth.uid() <> _user_id) THEN RAISE EXCEPTION 'not authorized'; END IF;
  INSERT INTO public.generation_credit_refunds(operation_key, user_id, period_month) VALUES (_operation_key, _user_id, month_d) ON CONFLICT (operation_key) DO NOTHING;
  IF NOT FOUND THEN RETURN; END IF;
  UPDATE public.usage_credits SET generations_used = GREATEST(generations_used - 1, 0), updated_at = now()
    WHERE user_id = _user_id AND period_month = month_d AND generations_used > 0;
END; $$;
REVOKE ALL ON FUNCTION public.refund_generation_credit(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refund_generation_credit(UUID, TEXT) TO authenticated, service_role;
