import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  listWorkspaces, createWorkspace, renameWorkspace, deleteWorkspace, setActiveWorkspace,
  listWorkspaceMembers, inviteToWorkspace, revokeInvitation, updateMemberRole, removeMember,
} from "@/lib/generators.functions";
import { Users, Plus, Star, Copy, Trash2, UserPlus, Building, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/team")({
  component: TeamPage,
});

function TeamPage() {
  const list = useServerFn(listWorkspaces);
  const create = useServerFn(createWorkspace);
  const rename = useServerFn(renameWorkspace);
  const del = useServerFn(deleteWorkspace);
  const setActive = useServerFn(setActiveWorkspace);

  const wsQ = useQuery({ queryKey: ["workspaces"], queryFn: () => list() });
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);

  const workspaces = wsQ.data?.workspaces ?? [];
  const activeId = wsQ.data?.activeWorkspaceId ?? null;
  const activeWs = workspaces.find((w: any) => w.id === activeId) ?? workspaces[0] ?? null;

  async function onCreate() {
    if (!newName.trim()) return;
    try {
      const ws = await create({ data: { name: newName.trim() } });
      toast.success("Workspace created");
      setNewName("");
      await setActive({ data: { id: (ws as any).id } });
      await wsQ.refetch();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold md:text-3xl">Team & Workspaces</h1>
      </div>
      <p className="text-sm text-muted-foreground -mt-4">Share brands, content and calendars with your agency team.</p>

      <Card>
        <CardHeader><CardTitle className="text-lg">Your workspaces</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input placeholder="New workspace name (e.g. Acme Agency)" value={newName} onChange={(e) => setNewName(e.target.value)} className="max-w-xs" />
            <Button onClick={onCreate} className="gap-1.5"><Plus className="h-4 w-4" /> Create</Button>
          </div>
          {workspaces.length === 0 && <p className="text-sm text-muted-foreground">You have no workspaces yet. Create one to invite teammates.</p>}
          {workspaces.map((w: any) => {
            const isActive = w.id === activeId;
            const isRenaming = renaming?.id === w.id;
            return (
              <div key={w.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 ${isActive ? "border-primary" : "border-border"}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                  {isRenaming ? (
                    <Input value={renaming!.name} onChange={(e) => setRenaming({ ...renaming!, name: e.target.value })} className="h-8 max-w-[200px]" />
                  ) : (
                    <span className="font-medium truncate">{w.name}</span>
                  )}
                  <Badge variant="outline" className="text-[10px] capitalize">{w.role}</Badge>
                  {isActive && <Badge className="gap-1 text-[10px]"><Star className="h-3 w-3" /> Active</Badge>}
                </div>
                <div className="flex gap-1.5">
                  {isRenaming ? (
                    <>
                      <Button size="sm" onClick={async () => { await rename({ data: { id: w.id, name: renaming!.name.trim() } }); toast.success("Renamed"); setRenaming(null); await wsQ.refetch(); }}><Check className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setRenaming(null)}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      {!isActive && <Button size="sm" variant="outline" onClick={async () => { await setActive({ data: { id: w.id } }); await wsQ.refetch(); toast.success("Switched"); }}>Set active</Button>}
                      {(w.role === "owner" || w.role === "admin") && <Button size="sm" variant="ghost" onClick={() => setRenaming({ id: w.id, name: w.name })}>Rename</Button>}
                      {w.role === "owner" && <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => { if (!confirm("Delete workspace?")) return; await del({ data: { id: w.id } }); toast.success("Deleted"); await wsQ.refetch(); }}><Trash2 className="h-3.5 w-3.5" /></Button>}
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {activeId && <Button size="sm" variant="ghost" onClick={async () => { await setActive({ data: { id: null } }); await wsQ.refetch(); }}>Switch to personal account</Button>}
        </CardContent>
      </Card>

      {activeWs && (activeWs.role === "owner" || activeWs.role === "admin") && (
        <MembersPanel workspaceId={activeWs.id} workspaceName={activeWs.name} canManage />
      )}
      {activeWs && !(activeWs.role === "owner" || activeWs.role === "admin") && (
        <MembersPanel workspaceId={activeWs.id} workspaceName={activeWs.name} canManage={false} />
      )}
    </div>
  );
}

function MembersPanel({ workspaceId, workspaceName, canManage }: { workspaceId: string; workspaceName: string; canManage: boolean }) {
  const list = useServerFn(listWorkspaceMembers);
  const invite = useServerFn(inviteToWorkspace);
  const revoke = useServerFn(revokeInvitation);
  const updateRole = useServerFn(updateMemberRole);
  const remove = useServerFn(removeMember);
  const q = useQuery({ queryKey: ["members", workspaceId], queryFn: () => list({ data: { workspace_id: workspaceId } }) });
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");

  async function onInvite() {
    try {
      const r = await invite({ data: { workspace_id: workspaceId, email: email.trim(), role } });
      const url = `${window.location.origin}/invite/${(r as any).token}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Invite link copied");
      setEmail(""); setOpen(false);
      await q.refetch();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  }

  const members = q.data?.members ?? [];
  const invitations = q.data?.invitations ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-lg">{workspaceName} — members ({members.length})</CardTitle>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="gap-1.5"><UserPlus className="h-4 w-4" /> Invite</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite teammate</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" /></div>
                <div><Label className="text-xs">Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member — can view & create content</SelectItem>
                      <SelectItem value="admin">Admin — can also manage members & brands</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={onInvite} className="w-full">Create invite link</Button>
                <p className="text-xs text-muted-foreground">The invite link will be copied to your clipboard. Share it with the teammate — they'll sign in and join automatically.</p>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {members.map((m: any) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 py-2 text-sm last:border-0">
            <div className="min-w-0">
              <p className="font-medium truncate">{m.full_name || m.email || m.user_id.slice(0, 8)}</p>
              <p className="text-xs text-muted-foreground truncate">{m.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {canManage && m.role !== "owner" ? (
                <Select value={m.role} onValueChange={async (v) => { await updateRole({ data: { id: m.id, role: v as any } }); await q.refetch(); toast.success("Role updated"); }}>
                  <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="member">Member</SelectItem></SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="capitalize">{m.role}</Badge>
              )}
              {canManage && m.role !== "owner" && (
                <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => { if (!confirm("Remove member?")) return; await remove({ data: { id: m.id } }); await q.refetch(); toast.success("Removed"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
              )}
            </div>
          </div>
        ))}
        {invitations.length > 0 && (
          <div className="pt-2">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Pending invitations</p>
            {invitations.map((inv: any) => (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 py-2 text-sm last:border-0">
                <div>
                  <p className="truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">Expires {new Date(inv.expires_at).toLocaleDateString()} · <span className="capitalize">{inv.role}</span></p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" className="gap-1" onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}/invite/${inv.token}`); toast.success("Link copied"); }}><Copy className="h-3.5 w-3.5" /> Copy link</Button>
                  {canManage && <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => { await revoke({ data: { id: inv.id } }); await q.refetch(); toast.success("Revoked"); }}><Trash2 className="h-3.5 w-3.5" /></Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
