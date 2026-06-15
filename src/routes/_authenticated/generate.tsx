import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateCaption, type CaptionOutput } from "@/lib/generators.functions";
import { Wand2, Copy, Check, Loader2, Instagram } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/generate")({
  head: () => ({ meta: [{ title: "Generate — ContentNaija AI" }] }),
  component: GeneratePage,
});

type Result = CaptionOutput & { remaining: number };

function GeneratePage() {
  const fn = useServerFn(generateCaption);
  const qc = useQueryClient();
  const [businessType, setBusinessType] = useState("");
  const [goal, setGoal] = useState("");
  const [tone, setTone] = useState("Playful");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [cta, setCta] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: async () => fn({ data: { businessType, goal, tone, length, cta, variations: 3 } }),
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Generated!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to generate"),
  });

  function handleCopy(text: string, hashtags: string[], idx: number) {
    const full = `${text}\n\n${hashtags.join(" ")}`;
    navigator.clipboard.writeText(full);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
    toast.success("Copied to clipboard");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessType.trim() || !goal.trim()) {
      toast.error("Business type and goal are required");
      return;
    }
    mutation.mutate();
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Instagram Caption Generator</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tell us about your post — we'll write 3 ready-to-publish variations.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div>
            <Label htmlFor="biz">Business type</Label>
            <Input id="biz" value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="e.g. Lagos jollof restaurant" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="goal">Goal</Label>
            <Textarea id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Promote Friday party packs, drive DMs" className="mt-1.5" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Playful", "Professional", "Bold", "Friendly", "Luxury", "Inspirational"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Length</Label>
              <Select value={length} onValueChange={(v) => setLength(v as typeof length)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="cta">Call to action (optional)</Label>
            <Input id="cta" value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Order via WhatsApp 0801…" className="mt-1.5" />
          </div>
          <Button type="submit" className="h-11 w-full bg-gradient-primary text-primary-foreground" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate captions
          </Button>
        </form>

        <div className="space-y-4">
          {!result && !mutation.isPending && (
            <div className="grid h-full place-items-center rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <div>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent">
                  <Instagram className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 font-medium">Your captions will appear here</p>
                <p className="mt-1 text-sm text-muted-foreground">Fill in the brief and hit generate.</p>
              </div>
            </div>
          )}

          {mutation.isPending && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-2 rounded-2xl border border-border bg-card p-5">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-4/5 rounded bg-muted" />
                </div>
              ))}
            </div>
          )}

          {result?.captions.map((c, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Variation {i + 1}</span>
                <Button size="sm" variant="ghost" onClick={() => handleCopy(c.text, c.hashtags, i)}>
                  {copiedIdx === i ? <><Check className="mr-1.5 h-3.5 w-3.5" />Copied</> : <><Copy className="mr-1.5 h-3.5 w-3.5" />Copy</>}
                </Button>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{c.text}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.hashtags.map((h) => (
                  <span key={h} className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{h}</span>
                ))}
              </div>
            </div>
          ))}

          {result && (
            <p className="text-xs text-muted-foreground">
              {result.remaining} generations remaining this month.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
