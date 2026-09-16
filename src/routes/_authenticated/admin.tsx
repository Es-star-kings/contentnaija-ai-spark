import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminOverview, getMyRoles, setUserRole } from "@/lib/generators.functions";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Building2,
  CheckCircle2,
  FileText,
  Inbox,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — ContentNaija AI" },
      { name: "description", content: "Secure ContentNaija AI platform administration console." },
      { property: "og:title", content: "Admin Console — ContentNaija AI" },
      { property: "og:description", content: "Secure ContentNaija AI platform administration console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type AdminUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  business_name: string | null;
  created_at: string;
};

type RecentGeneration = {
  id: string;
  user_id: string;
  generator_type: string;
  created_at: string;
};

function AdminPage() {
  const roles = useServerFn(getMyRoles);
  const overview = useServerFn(getAdminOverview);
  const grant = useServerFn(setUserRole);
  const [userSearch, setUserSearch] = useState("");
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const rolesQ = useQuery({ queryKey: ["my-roles"], queryFn: () => roles(), retry: false });
  const isAdmin = rolesQ.data?.roles.includes("admin") ?? false;
  const dataQ = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => overview(),
    enabled: isAdmin,
    retry: false,
  });

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    const users = (dataQ.data?.users ?? []) as AdminUser[];
    if (!term) return users;
    return users.filter((user) =>
      [user.full_name, user.email, user.business_name].some((value) => value?.toLowerCase().includes(term)),
    );
  }, [dataQ.data?.users, userSearch]);

  if (rolesQ.isLoading) return <AdminSkeleton />;

  if (rolesQ.isError) {
    return (
      <CenteredState
        title="We couldn't verify admin access"
        description="Try checking your access again."
        action={<Button onClick={() => rolesQ.refetch()}><RefreshCw />Retry</Button>}
      />
    );
  }

  if (!isAdmin) {
    return (
      <CenteredState
        title="Admin access required"
        description="This console is restricted to approved administrators."
        icon={<ShieldCheck className="h-7 w-7" />}
      />
    );
  }

  async function toggleAdmin(userId: string, makeAdmin: boolean) {
    setUpdatingUser(userId);
    try {
      await grant({ data: { user_id: userId, role: "admin", grant: makeAdmin } });
      toast.success(makeAdmin ? "Admin access granted" : "Admin access revoked");
      await dataQ.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The role could not be updated");
    } finally {
      setUpdatingUser(null);
    }
  }

  const d = dataQ.data;
  const byType = d?.byType ?? [];
  const largestTypeCount = Math.max(...byType.map((item) => item.count), 1);

  return (
    <div className="min-h-full bg-muted/20">
      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border pb-5 sm:flex sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 text-primary">
                <ShieldCheck className="h-3.5 w-3.5" /> Secure admin
              </Badge>
              <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Live data
              </span>
            </div>
            <h1 className="truncate text-2xl font-bold sm:text-3xl">ContentNaija AI Admin</h1>
            <p className="mt-1 hidden text-sm text-muted-foreground sm:block">Platform health, users, content and support operations.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => dataQ.refetch()}
            disabled={dataQ.isFetching}
            aria-label="Refresh admin data"
          >
            <RefreshCw className={dataQ.isFetching ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </header>

        {dataQ.isLoading ? (
          <DashboardSkeleton />
        ) : dataQ.isError ? (
          <Card className="border-destructive/30 shadow-none">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <h2 className="font-semibold">Admin data is unavailable</h2>
                <p className="mt-1 text-sm text-muted-foreground">No changes were made. Refresh to try again.</p>
              </div>
              <Button variant="outline" onClick={() => dataQ.refetch()}><RefreshCw />Retry</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <section aria-label="Platform overview" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard icon={Users} label="Users" value={d?.totalUsers ?? 0} detail="Registered accounts" />
              <MetricCard icon={FileText} label="Generations" value={d?.totalContent ?? 0} detail="All-time content" />
              <MetricCard icon={Building2} label="Brands" value={d?.totalBrands ?? 0} detail="Brand profiles" />
              <MetricCard icon={Mail} label="Unread messages" value="—" detail="Inbox not connected" muted />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)]">
              <Card className="shadow-card">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-primary" />Generations by type</CardTitle>
                      <CardDescription className="mt-1">Content mix across all generators</CardDescription>
                    </div>
                    <Badge variant="secondary">{byType.length} types</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {byType.length === 0 ? (
                    <EmptyState icon={<BarChart3 />} title="No generation data yet" description="Usage will appear here after content is generated." />
                  ) : (
                    <div className="space-y-4">
                      {byType.map((item) => (
                        <div key={item.type}>
                          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                            <span className="min-w-0 truncate font-medium capitalize">{formatType(item.type)}</span>
                            <span className="shrink-0 tabular-nums text-muted-foreground">{item.count.toLocaleString()}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted" aria-label={`${formatType(item.type)}: ${item.count}`}>
                            <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${Math.max((item.count / largestTypeCount) * 100, 3)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="border-b border-border pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base"><Inbox className="h-4 w-4 text-primary" />Contact inbox</CardTitle>
                      <CardDescription className="mt-1">Customer enquiries and support messages</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" disabled aria-label="Refresh contact messages"><RefreshCw /></Button>
                  </div>
                  <div className="relative mt-3">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search messages" disabled aria-label="Search contact messages" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <EmptyState
                    icon={<Inbox />}
                    title="Inbox data isn't connected"
                    description="No message source is available in this project version."
                    className="min-h-64 px-6"
                  />
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
              <Card className="overflow-hidden shadow-card">
                <CardHeader className="border-b border-border pb-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" />Recent users</CardTitle>
                      <CardDescription className="mt-1">Manage administrator access</CardDescription>
                    </div>
                    <Badge variant="secondary">{filteredUsers.length}</Badge>
                  </div>
                  <div className="relative mt-3">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="Search name, email or business"
                      className="pl-9"
                      aria-label="Search recent users"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredUsers.length === 0 ? (
                    <EmptyState icon={<Users />} title="No users found" description={userSearch ? "Try a different search." : "New users will appear here."} className="min-h-56" />
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredUsers.map((user) => (
                        <div key={user.id} className="grid gap-3 px-4 py-4 transition-colors hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {userInitials(user)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{user.full_name || user.email || `User ${user.id.slice(0, 8)}`}</p>
                              <p className="truncate text-xs text-muted-foreground">{[user.email, user.business_name].filter(Boolean).join(" · ")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pl-12 sm:pl-0">
                            <Button size="sm" variant="outline" disabled={updatingUser === user.id} onClick={() => toggleAdmin(user.id, true)}>
                              {updatingUser === user.id ? <Loader2 className="animate-spin" /> : <UserPlus />}Grant admin
                            </Button>
                            <Button size="sm" variant="ghost" disabled={updatingUser === user.id} onClick={() => toggleAdmin(user.id, false)} aria-label={`Revoke admin access for ${user.full_name || user.email || "user"}`}>
                              <UserMinus /><span className="hidden sm:inline">Revoke</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-primary" />Recent activity</CardTitle>
                  <CardDescription>Latest content generations</CardDescription>
                </CardHeader>
                <CardContent>
                  {((d?.recent ?? []) as RecentGeneration[]).length === 0 ? (
                    <EmptyState icon={<Activity />} title="No recent activity" description="New generations will appear here." />
                  ) : (
                    <ol className="space-y-1">
                      {((d?.recent ?? []) as RecentGeneration[]).map((item) => (
                        <li key={item.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md px-2 py-2.5 hover:bg-muted/50">
                          <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary"><FileText className="h-3.5 w-3.5" /></span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium capitalize">{formatType(item.generator_type)}</p>
                            <time className="text-xs text-muted-foreground" dateTime={item.created_at}>{formatDate(item.created_at)}</time>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail, muted = false }: { icon: typeof Users; label: string; value: string | number; detail: string; muted?: boolean }) {
  return (
    <Card className="overflow-hidden shadow-card">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums sm:text-3xl">{typeof value === "number" ? value.toLocaleString() : value}</p>
          </div>
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${muted ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}><Icon className="h-4 w-4" /></span>
        </div>
        <p className="mt-3 truncate text-[11px] text-muted-foreground sm:text-xs">{detail}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, title, description, className = "min-h-48" }: { icon: React.ReactNode; title: string; description: string; className?: string }) {
  return (
    <div className={`flex ${className} flex-col items-center justify-center text-center`}>
      <span className="mb-3 grid h-10 w-10 place-items-center rounded-md bg-muted text-muted-foreground [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function CenteredState({ title, description, icon, action }: { title: string; description: string; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-12">
      <Card className="w-full shadow-card">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-md bg-primary/10 text-primary">{icon ?? <AlertCircle className="h-7 w-7" />}</span>
          <div><h1 className="text-lg font-semibold">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
          {action}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminSkeleton() {
  return <div className="mx-auto max-w-[1440px] space-y-6 p-4 sm:p-6 lg:p-8" aria-label="Loading admin console"><Skeleton className="h-20 w-full" /><DashboardSkeleton /></div>;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading dashboard data">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)}</div>
      <div className="grid gap-6 xl:grid-cols-2"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>
    </div>
  );
}

function formatType(type: string) {
  return type.replace(/_/g, " ");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function userInitials(user: AdminUser) {
  const value = user.full_name || user.email || "U";
  return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}