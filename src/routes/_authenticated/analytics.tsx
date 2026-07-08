import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAnalytics } from "@/lib/generators.functions";
import { BarChart3, Sparkles, Star, TrendingUp, Calendar as CalIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — ContentNaija AI" }] }),
  component: AnalyticsPage,
});

const TYPE_LABEL: Record<string, string> = {
  instagram_caption: "Instagram",
  whatsapp_campaign: "WhatsApp",
  wa_broadcast: "WA Broadcast",
  wa_status: "WA Status",
  wa_followup: "WA Follow-up",
  wa_promo: "WA Promo",
  wa_holiday: "Holiday Campaign",
  flyer_copy: "Flyer",
  content_calendar: "Calendar",
};

const WA_TYPES = new Set(["whatsapp_campaign", "wa_broadcast", "wa_status", "wa_followup", "wa_promo", "wa_holiday"]);

function AnalyticsPage() {
  const fn = useServerFn(getAnalytics);
  const { data, isLoading } = useQuery({ queryKey: ["analytics"], queryFn: () => fn() });

  const monthly = data?.monthCount ?? 0;
  const limit = data?.monthlyLimit ?? null;
  const unlimited = limit === null;
  const pct = unlimited ? 0 : Math.min(100, (monthly / (limit || 1)) * 100);
  const maxDay = Math.max(1, ...(data?.days ?? []).map((d) => d.count));
  const totalByType = (data?.generators ?? []).reduce((s, g) => s + g.count, 0) || 1;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your content generation at a glance.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Sparkles} label="This month" value={isLoading ? "—" : unlimited ? `${monthly} / ∞` : `${monthly}/${limit}`}>
          {!unlimited && <Progress value={pct} className="mt-3" />}
        </Stat>
        <Stat icon={TrendingUp} label="Last 30 days" value={isLoading ? "—" : String(data?.last30 ?? 0)} hint="Pieces generated" />
        <Stat icon={CalIcon} label="All-time" value={isLoading ? "—" : String(data?.total ?? 0)} hint="Total content" />
        <Stat icon={Star} label="Favorites" value={isLoading ? "—" : String(data?.favorites ?? 0)} hint="Saved for later" />
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Daily activity — last 30 days</h2>
        </div>
        {isLoading ? (
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
        ) : (
          <div className="flex h-40 items-end gap-1">
            {(data?.days ?? []).map((d, i) => (
              <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end">
                <div
                  className="w-full rounded-t bg-gradient-primary transition-opacity hover:opacity-80"
                  style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count > 0 ? "4px" : "2px", opacity: d.count > 0 ? 1 : 0.15 }}
                  title={`${d.label}: ${d.count}`}
                />
                {i % 5 === 0 && <span className="mt-1 text-[10px] text-muted-foreground">{d.label}</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">By generator</h2>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-6 animate-pulse rounded bg-muted" />)}</div>
          ) : (data?.generators?.length ?? 0) === 0 ? (
            <EmptyMsg />
          ) : (
            <ul className="space-y-3">
              {data!.generators.map((g) => {
                const p = (g.count / totalByType) * 100;
                return (
                  <li key={g.type}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{TYPE_LABEL[g.type] ?? g.type}</span>
                      <span className="text-muted-foreground">{g.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${p}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Top tones</h2>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-6 animate-pulse rounded bg-muted" />)}</div>
          ) : (data?.topTones?.length ?? 0) === 0 ? (
            <EmptyMsg />
          ) : (
            <ul className="space-y-2">
              {data!.topTones.map((t) => (
                <li key={t.tone} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="capitalize">{t.tone}</span>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{t.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint, children }: { icon: React.ElementType; label: string; value: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground"><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function EmptyMsg() {
  return <p className="text-sm text-muted-foreground">No data yet — generate some content to see insights here.</p>;
}
