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
import { GeneratorShell, GeneratorEmpty, GeneratorSkeleton } from "@/components/generators/GeneratorShell";

export const Route = createFileRoute("/_authenticated/generate/instagram")({
  head: () => ({ meta: [{ title: "Instagram Captions — ContentNaija AI" }] }),
  component: InstagramGen,
});

type Result = CaptionOutput & { remaining: number | null };

function InstagramGen() {
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
    mutationFn: () => fn({ data: { businessType, goal, tone, length, cta, variations: 3 } }),
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["history"] });
      toast.success("Generated!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to generate"),
  });

  function handleCopy(text: string, hashtags: string[], idx: number) {
    navigator.clipboard.writeText(`${text}\n\n${hashtags.join(" ")}`);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
    toast.success("Copied to clipboard");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessType.trim() || !goal.trim()) return toast.error("Business type and goal are required");
    mutation.mutate();
  }

  const form = (
    <form onSubmit={submit} className="space-y-4">
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
              {["Playful", "Professional", "Bold", "Friendly", "Luxury", "Inspirational"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
  );

  const output = (
    <>
      {!result && !mutation.isPending && <GeneratorEmpty icon={Instagram} message="Your captions will appear here" />}
      {mutation.isPending && <GeneratorSkeleton />}
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
            {c.hashtags.map((h) => <span key={h} className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{h}</span>)}
          </div>
        </div>
      ))}
    </>
  );

  return <GeneratorShell title="Instagram Caption Generator" description="Tell us about your post — we'll write 3 ready-to-publish variations." form={form} output={output} remaining={result?.remaining ?? null} />;
}
