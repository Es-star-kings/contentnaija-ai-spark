
CREATE TABLE public.share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.generated_content(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX share_links_token_idx ON public.share_links(token);
CREATE INDEX share_links_user_idx ON public.share_links(user_id);

GRANT SELECT ON public.share_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.share_links TO authenticated;
GRANT ALL ON public.share_links TO service_role;

ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own share links"
ON public.share_links FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read by token"
ON public.share_links FOR SELECT TO anon
USING (expires_at IS NULL OR expires_at > now());
