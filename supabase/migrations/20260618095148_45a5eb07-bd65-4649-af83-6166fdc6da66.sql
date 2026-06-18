
-- Brands
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  business_name text,
  industry text,
  tone text,
  target_audience text,
  brand_color text DEFAULT '#10B981',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Policies: brands
CREATE POLICY "Users manage own brands" ON public.brands FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all brands" ON public.brands FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policies: user_roles (users see own roles; only service_role writes)
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin extra policy on generated_content (existing user policy already covers self)
CREATE POLICY "Admins view all content" ON public.generated_content FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add active_brand_id to profiles and brand_id to generated_content
ALTER TABLE public.profiles ADD COLUMN active_brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
ALTER TABLE public.generated_content ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;

-- updated_at trigger
CREATE TRIGGER brands_updated_at BEFORE UPDATE ON public.brands
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
