
-- Role enum for workspace membership
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'member');

-- workspaces
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- workspace_members
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.workspace_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT ALL ON public.workspace_members TO service_role;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Security definer helpers to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id = _workspace_id AND user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.workspace_role_of(_workspace_id UUID, _user_id UUID)
RETURNS public.workspace_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.workspace_members WHERE workspace_id = _workspace_id AND user_id = _user_id
$$;

-- workspaces policies
CREATE POLICY "Members view workspace" ON public.workspaces
  FOR SELECT TO authenticated USING (public.is_workspace_member(id, auth.uid()));
CREATE POLICY "Owner creates workspace" ON public.workspaces
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admins update workspace" ON public.workspaces
  FOR UPDATE TO authenticated
  USING (public.workspace_role_of(id, auth.uid()) IN ('owner','admin'))
  WITH CHECK (public.workspace_role_of(id, auth.uid()) IN ('owner','admin'));
CREATE POLICY "Owner deletes workspace" ON public.workspaces
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- workspace_members policies
CREATE POLICY "Members view roster" ON public.workspace_members
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Admins add members" ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (public.workspace_role_of(workspace_id, auth.uid()) IN ('owner','admin') OR auth.uid() = user_id);
CREATE POLICY "Admins update members" ON public.workspace_members
  FOR UPDATE TO authenticated
  USING (public.workspace_role_of(workspace_id, auth.uid()) IN ('owner','admin'))
  WITH CHECK (public.workspace_role_of(workspace_id, auth.uid()) IN ('owner','admin'));
CREATE POLICY "Admins remove members" ON public.workspace_members
  FOR DELETE TO authenticated
  USING (public.workspace_role_of(workspace_id, auth.uid()) IN ('owner','admin') OR auth.uid() = user_id);

-- workspace_invitations
CREATE TABLE public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.workspace_role NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_invitations TO authenticated;
GRANT SELECT ON public.workspace_invitations TO anon;
GRANT ALL ON public.workspace_invitations TO service_role;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invitations" ON public.workspace_invitations
  FOR ALL TO authenticated
  USING (public.workspace_role_of(workspace_id, auth.uid()) IN ('owner','admin'))
  WITH CHECK (public.workspace_role_of(workspace_id, auth.uid()) IN ('owner','admin'));
CREATE POLICY "Public can read invitation by token" ON public.workspace_invitations
  FOR SELECT TO anon USING (accepted_at IS NULL AND expires_at > now());
CREATE POLICY "Authenticated can read pending invitations" ON public.workspace_invitations
  FOR SELECT TO authenticated USING (accepted_at IS NULL AND expires_at > now());

-- Extend brands with workspace_id
ALTER TABLE public.brands ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- Add workspace-scoped brand policies (personal-brand policy already exists)
CREATE POLICY "Workspace members view brands" ON public.brands
  FOR SELECT TO authenticated USING (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members insert brands" ON public.brands
  FOR INSERT TO authenticated WITH CHECK (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "Workspace admins update brands" ON public.brands
  FOR UPDATE TO authenticated
  USING (workspace_id IS NOT NULL AND public.workspace_role_of(workspace_id, auth.uid()) IN ('owner','admin'))
  WITH CHECK (workspace_id IS NOT NULL AND public.workspace_role_of(workspace_id, auth.uid()) IN ('owner','admin'));
CREATE POLICY "Workspace admins delete brands" ON public.brands
  FOR DELETE TO authenticated
  USING (workspace_id IS NOT NULL AND public.workspace_role_of(workspace_id, auth.uid()) IN ('owner','admin'));

-- Profile: active workspace
ALTER TABLE public.profiles ADD COLUMN active_workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- Update triggers
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-add owner as workspace_members row on workspace creation
CREATE OR REPLACE FUNCTION public.add_owner_as_member()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_workspace_created_add_owner
  AFTER INSERT ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_member();
