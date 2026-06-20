ALTER TABLE public.generated_content
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;

CREATE INDEX IF NOT EXISTS idx_generated_content_user_scheduled
  ON public.generated_content (user_id, scheduled_for)
  WHERE scheduled_for IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_generated_content_user_status
  ON public.generated_content (user_id, status);