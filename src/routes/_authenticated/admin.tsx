import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminOverview, getMyRoles, setUserRole } from "@/lib/generators.functions";
import { Shield, Users, FileText, Building2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const roles = useServerFn(getMyRoles);
  const overview = useServerFn(getAdminOverview);
  const grant = useServerFn(setUserRole);

  const rolesQ = useQuery({ queryKey: ["my-roles"], queryFn: () => roles() });
  const isAdmin = rolesQ.data?.roles.includes("admin");

  const dataQ = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => overview(),
    enabled: !!isAdmin,
    retry: false,
  });

  if (rolesQ.isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Admin access required</h1>
            <p className="text-sm text-muted-foreground">Your account is not an admin. Ask an existing admin to grant you the role.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function toggleAdmin(userId: string, makeAdmin: boolean) {
    try {
      await grant({ data: { user_id: userId, role: "admin", grant: makeAdmin } });
      toast.success(makeAdmin ? "Admin granted" : "Admin revoked");
      await dataQ.refetch();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }

  const d = dataQ.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div>
        <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold md:text-3xl">Admin</h1></div>
        <p className="text-sm text-muted-foreground">Platform overview and user management.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Users} label="Users" value={d?.totalUsers ?? "—"} />
        <Stat icon={FileText} label="Generations" value={d?.totalContent ?? "—"} />
        <Stat icon={Building2} label="Brands" value={d?.totalBrands ?? "—"} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Generations by type</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(d?.byType ?? []).length === 0 && <p className="text-sm text-muted-foreground">No generations yet.</p>}
          {(d?.byType ?? []).map((b) => (
            <div key={b.type} className="flex items-center justify-between border-b border-border/50 py-2 text-sm last:border-0">
              <span className="capitalize">{b.type.replace(/_/g, " ")}</span>
              <Badge variant="secondary">{b.count}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Recent users</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(d?.users ?? []).map((u: any) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 py-2 text-sm last:border-0">
              <div>
                <p className="font-medium">{u.full_name || u.email || u.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">{u.email} {u.business_name ? `• ${u.business_name}` : ""}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleAdmin(u.id, true)}>Make admin</Button>
                <Button size="sm" variant="ghost" onClick={() => toggleAdmin(u.id, false)}>Revoke</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Recent activity</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {(d?.recent ?? []).map((r: any) => (
            <div key={r.id} className="flex items-center justify-between border-b border-border/50 py-1.5 text-sm last:border-0">
              <span className="capitalize text-muted-foreground">{r.generator_type.replace(/_/g, " ")}</span>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-6 w-6 text-primary" />
      </CardContent>
    </Card>
  );
}
