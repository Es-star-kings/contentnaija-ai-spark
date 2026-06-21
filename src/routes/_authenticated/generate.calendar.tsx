import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateCalendar, type CalendarOutput } from "@/lib/generators.functions";
import { Wand2, Copy, Check, Loader2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { GeneratorShell, GeneratorEmpty, GeneratorSkeleton } from "@/components/generators/GeneratorShell";

export const Route = createFileRoute("/_authenticated/generate/calendar")({
  head: () => ({ meta: [{ title: "Content Calendar — ContentNaija AI" }] }),
  component: CalendarGen,
});

type Result = CalendarOutput & { remaining: number | null };

function CalendarGen() {
  const fn = useServerFn(generateCalendar);
  const qc = useQueryClient();
  const [businessType, setBusinessType] = useState("");
  const [goals, setGoals] = useState("");
  const [platform, setPlatform] = useState<"Instagram" | "WhatsApp" | "Facebook" | "TikTok" | "X (Twitter)">("Instagram");
  const [days, setDays] = useState(7);
  const [postsPerDay, setPostsPerDay] = useState(1);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: () => fn({ data: { businessType, goals, platform, days, postsPerDay } }),
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["history"] });
      toast.success("Calendar ready!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to generate"),
  });

  function copyAll() {
    if (!result) return;
    const text = result.plan.map((d) =>
      `Day ${d.day} — ${d.date_label} • ${d.theme}\n${d.posts.map((p) => `  ${p.time} (${p.format}) — ${p.hook}\n  ${p.caption}`).join("\n")}`
    ).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Calendar copied");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessType.trim() || !goals.trim()) return toast.error("Business type and goals are required");
    mutation.mutate();
  }

  const form = (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label>Business type</Label>
        <Input value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="e.g. Port Harcourt skincare brand" className="mt-1.5" />
      </div>
      <div>
        <Label>Goals for this period</Label>
        <Textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={3} placeholder="Grow followers, launch new serum, drive 50 orders" className="mt-1.5" />
      </div>
      <div>
        <Label>Platform</Label>
        <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(["Instagram", "WhatsApp", "Facebook", "TikTok", "X (Twitter)"] as const).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Days</Label>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[3, 5, 7, 10, 14].map((n) => <SelectItem key={n} value={String(n)}>{n} days</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Posts / day</Label>
          <Select value={String(postsPerDay)} onValueChange={(v) => setPostsPerDay(Number(v))}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" className="h-11 w-full bg-gradient-primary text-primary-foreground" disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
        Build calendar
      </Button>
    </form>
  );

  const output = (
    <>
      {!result && !mutation.isPending && <GeneratorEmpty icon={CalendarDays} message="Your content plan will appear here" />}
      {mutation.isPending && <GeneratorSkeleton count={4} />}
      {result && (
        <>
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={copyAll}>
              {copied ? <><Check className="mr-1.5 h-3.5 w-3.5" />Copied</> : <><Copy className="mr-1.5 h-3.5 w-3.5" />Copy whole plan</>}
            </Button>
          </div>
          {result.plan.map((d) => (
            <div key={d.day} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">Day {d.day} • {d.date_label}</span>
                  <h3 className="mt-1 font-semibold">{d.theme}</h3>
                </div>
              </div>
              <div className="mt-3 space-y-3 border-t border-border pt-3">
                {d.posts.map((p, i) => (
                  <div key={i} className="rounded-lg bg-muted/30 p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{p.time}</span>
                      <span>•</span>
                      <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">{p.format}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium">{p.hook}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{p.caption}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );

  return <GeneratorShell title="Content Calendar Builder" description="A full week of post ideas, hooks and captions." form={form} output={output} remaining={result?.remaining ?? null} />;
}
