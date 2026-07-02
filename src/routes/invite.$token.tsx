import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getInvitation, acceptInvitation } from "@/lib/generators.functions";
import { supabase } from "@/integrations/supabase/client";
import { Users, LogIn } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/invite/$token")({
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const getInv = useServerFn(getInvitation);
  const accept = useServerFn(acceptInvitation);
  const q = useQuery({ queryKey: ["invite", token], queryFn: () => getInv({ data: { token } }) });
  const [busy, setBusy] = useState(false);

  const inv = (q.data as any)?.invitation;

  async function onAccept() {
    setBusy(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        sessionStorage.setItem("pending_invite", token);
        navigate({ to: "/auth" });
        return;
      }
      const r = await accept({ data: { token } });
      toast.success("Joined workspace");
      navigate({ to: "/team" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to accept");
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Users className="h-6 w-6" /></div>
          <CardTitle>Team invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {q.isLoading && <p className="text-sm text-muted-foreground">Loading invitation…</p>}
          {!q.isLoading && !inv && <p className="text-sm text-destructive">This invitation is invalid or has expired.</p>}
          {inv && (
            <>
              <div>
                <p className="text-sm text-muted-foreground">You've been invited to join</p>
                <p className="text-xl font-bold">{inv.workspace?.name ?? "workspace"}</p>
                <p className="text-xs text-muted-foreground mt-1">as <span className="capitalize font-medium">{inv.role}</span> · {inv.email}</p>
              </div>
              <Button className="w-full gap-2" onClick={onAccept} disabled={busy}><LogIn className="h-4 w-4" /> {busy ? "Joining…" : "Accept invitation"}</Button>
              <p className="text-xs text-muted-foreground">You'll need to sign in with <span className="font-medium">{inv.email}</span> to accept.</p>
              <Link to="/" className="block text-xs text-primary hover:underline">Back to home</Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
