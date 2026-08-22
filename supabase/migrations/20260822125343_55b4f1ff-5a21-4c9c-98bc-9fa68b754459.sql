CREATE OR REPLACE FUNCTION public.current_period_month()
RETURNS date
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$ SELECT date_trunc('month', timezone('utc', now()))::date $$;