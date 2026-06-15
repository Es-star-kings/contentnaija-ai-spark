import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/generators.functions";
import { History as HistoryIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — ContentNaija AI" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const fn = useServerFn(getDashboardStats);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-stats"], queryFn: () => fn() });

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">
      <h1 className="text-2xl font-bold sm:text-3xl">History</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your recent generations.</p>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (data?.recent.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <HistoryIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium">Nothing yet</p>
            <p className="text-sm text-muted-foreground">Generated content will appear here.</p>
          </div>
        ) : (
          data?.recent.map((r) => {
            const out = r.output as { captions?: Array<{ text: string; hashtags: string[] }> } | null;
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">{r.generator_type.replace("_", " ")}</span>
                  <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                {out?.captions?.map((c, i) => (
                  <div key={i} className="mt-3 border-t border-border pt-3 first:border-0 first:pt-0">
                    <p className="text-sm whitespace-pre-wrap">{c.text}</p>
                    <p className="mt-1.5 text-xs text-primary">{c.hashtags.join(" ")}</p>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
