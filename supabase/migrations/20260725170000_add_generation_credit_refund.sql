CREATE OR REPLACE FUNCTION public.refund_generation_credit(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  month_d DATE := public.current_period_month();
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE public.usage_credits
  SET generations_used = GREATEST(generations_used - 1, 0),
      updated_at = now()
  WHERE user_id = _user_id
    AND period_month = month_d
    AND generations_used > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refund_generation_credit(UUID)
TO authenticated, service_role;