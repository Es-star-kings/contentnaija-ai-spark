import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateWAStatus, type WAStatusOutput } from "@/lib/generators.functions";
import { Wand2, Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { GeneratorShell, GeneratorEmpty, GeneratorSkeleton } from "@/components/generators/GeneratorShell";
import { WAMessageCard, WA_TONES } from "@/components/generators/WAMessageCard";

export const Route = createFileRoute("/_authenticated/whatsapp/status")({
  head: () => ({ meta: [{ title: "WhatsApp Status Generator — ContentNaija AI" }] }),
  component: Page,
});

const CATEGORIES = ["Promotional", "Educational", "Storytelling", "Behind the Scenes", "Customer Testimonial", "Daily Tip"] as const;
type Result = WAStatusOutput & { remaining: number | null };

function Page() {
  const fn = useServerFn(generateWAStatus);
  const qc = useQueryClient();
  const [businessType, setBusinessType] = useState("");
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("Promotional");
  const [tone, setTone] = useState<string>("Casual");
  const [variations, setVariations] = useState(4);
  const [includePidgin, setIncludePidgin] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const m = useMutation({
    mutationFn: () => fn({ data: { businessType, topic, category, tone, variations, includePidgin } }),
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["history"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Status updates ready!");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessType.trim() || !topic.trim()) return toast.error("Business type and topic are required");
    m.mutate();
  }

  const form = (
    <form onSubmit={submit} className="space-y-4">
      <div><Label>Business type</Label><Input value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="e.g. Abuja skincare brand" className="mt-1.5" /></div>
      <div><Label>Topic</Label><Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="New Vitamin C serum" className="mt-1.5" /></div>
      <div>
        <Label>Category</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as typeof CATEGORIES[number])}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Tone</Label>
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>{WA_TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Variations</Label>
        <Select value={String(variations)} onValueChange={(v) => setVariations(Number(v))}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>{[2, 3, 4, 5, 6].map((n) => <SelectItem key={n} value={String(n)}>{n} variations</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div><Label htmlFor="pidgin" className="text-sm">Mix in Naija pidgin</Label></div>
        <Switch id="pidgin" checked={includePidgin} onCheckedChange={setIncludePidgin} />
      </div>
      <Button type="submit" className="h-11 w-full bg-gradient-primary text-primary-foreground" disabled={m.isPending}>
        {m.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
        Generate status updates
      </Button>
    </form>
  );

  const output = (
    <>
      {!result && !m.isPending && <GeneratorEmpty icon={Megaphone} message="Your WhatsApp status ideas will appear here" />}
      {m.isPending && <GeneratorSkeleton />}
      {result?.statuses.map((s, i) => (
        <WAMessageCard key={i} label={`Status ${i + 1}`} body={s.body} title={`Status ${i + 1}`} onRegenerate={() => m.mutate()} />
      ))}
    </>
  );

  return <GeneratorShell title="WhatsApp Status" description="Punchy status updates that stop the scroll." form={form} output={output} remaining={result?.remaining ?? null} />;
}
