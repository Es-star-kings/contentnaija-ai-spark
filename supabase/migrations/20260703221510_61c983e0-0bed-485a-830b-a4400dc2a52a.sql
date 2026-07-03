
-- Secure helper: create workspace + insert owner membership in a single trusted call.
CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(_name TEXT)
RETURNS public.workspaces
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_ws public.workspaces;
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _name IS NULL OR length(btrim(_name)) = 0 THEN
    RAISE EXCEPTION 'Workspace name required';
  END IF;
  INSERT INTO public.workspaces (name, owner_id)
  VALUES (btrim(_name), uid)
  RETURNING * INTO new_ws;
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_ws.id, uid, 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  RETURN new_ws;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_workspace_with_owner(TEXT) TO authenticated;

-- Secure helper: accept invitation by token (adds caller as member and marks invitation accepted).
CREATE OR REPLACE FUNCTION public.accept_workspace_invitation(_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT * INTO inv FROM public.workspace_invitations
   WHERE token = _token AND accepted_at IS NULL AND expires_at > now()
   LIMIT 1;
  IF inv IS NULL THEN
    RAISE EXCEPTION 'Invitation invalid or expired';
  END IF;
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (inv.workspace_id, uid, inv.role)
  ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role;
  UPDATE public.workspace_invitations SET accepted_at = now() WHERE id = inv.id;
  RETURN inv.workspace_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_workspace_invitation(TEXT) TO authenticated;
