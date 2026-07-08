
CREATE TABLE public.feature_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  feature_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature_name)
);

GRANT SELECT, INSERT ON public.feature_waitlist TO authenticated;
GRANT ALL ON public.feature_waitlist TO service_role;

ALTER TABLE public.feature_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own waitlist entries"
  ON public.feature_waitlist FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view their own waitlist entries"
  ON public.feature_waitlist FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
