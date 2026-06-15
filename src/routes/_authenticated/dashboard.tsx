import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/generators.functions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wand2, Sparkles, FileText, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ContentNaija AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(getDashboardStats);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fn(),
  });
  const router = useRouter();

  const monthly = data?.monthlyCount ?? 0;
  const limit = data?.monthlyLimit ?? 20;
  const pct = Math.min(100, (monthly / limit) * 100);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Welcome back 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">Let's create something today.</p>
        </div>
        <Link to="/generate">
          <Button className="bg-gradient-primary text-primary-foreground shadow-elegant">
            <Wand2 className="mr-2 h-4 w-4" /> New caption
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Sparkles} label="This month" value={isLoading ? "—" : `${monthly}/${limit}`} hint="Generations used">
          <Progress value={pct} className="mt-3" />
        </StatCard>
        <StatCard icon={FileText} label="Total content" value={isLoading ? "—" : String(data?.totalCount ?? 0)} hint="All-time pieces created" />
        <StatCard icon={TrendingUp} label="Plan" value="Free" hint="20 generations / month" />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <button onClick={() => router.invalidate()} className="text-xs text-muted-foreground hover:text-foreground">Refresh</button>
        </div>
        {isLoading ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (data?.recent?.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-4 font-medium">No content yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Generate your first caption to see it here.</p>
            <Link to="/generate">
              <Button className="mt-5 bg-gradient-primary text-primary-foreground"><Wand2 className="mr-2 h-4 w-4" />Generate now</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {data?.recent.map((r) => {
              const out = r.output as { captions?: Array<{ text: string }> } | null;
              const preview = out?.captions?.[0]?.text ?? "(no preview)";
              return (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">{r.generator_type.replace("_", " ")}</span>
                    <span>{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm">{preview}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, children }: { icon: React.ElementType; label: string; value: string; hint: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground"><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      {children}
    </div>
  );
}
