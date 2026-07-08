import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateWAFollowUp, type WAFollowUpOutput } from "@/lib/generators.functions";
import { Wand2, Loader2, Reply } from "lucide-react";
import { toast } from "sonner";
import { GeneratorShell, GeneratorEmpty, GeneratorSkeleton } from "@/components/generators/GeneratorShell";
import { WAMessageCard } from "@/components/generators/WAMessageCard";

export const Route = createFileRoute("/_authenticated/whatsapp/followup")({
  head: () => ({ meta: [{ title: "WhatsApp Follow-up Generator — ContentNaija AI" }] }),
  component: Page,
});

const SCENARIOS = ["No reply", "Payment reminder", "Order confirmation", "Delivery update", "Abandoned cart", "Appointment reminder", "Customer feedback request"] as const;
const TONES = ["Friendly", "Professional", "Persuasive"] as const;
type Result = WAFollowUpOutput & { remaining: number | null };

function Page() {
  const fn = useServerFn(generateWAFollowUp);
  const qc = useQueryClient();
  const [businessName, setBusinessName] = useState("");
  const [scenario, setScenario] = useState<typeof SCENARIOS[number]>("No reply");
  const [ctx, setCtx] = useState("");
  const [tone, setTone] = useState<typeof TONES[number]>("Friendly");
  const [result, setResult] = useState<Result | null>(null);

  const m = useMutation({
    mutationFn: () => fn({ data: { businessName, scenario, context: ctx, tone } }),
    onSuccess: (r) => { setResult(r); qc.invalidateQueries({ queryKey: ["history"] }); qc.invalidateQueries({ queryKey: ["analytics"] }); toast.success("Follow-ups ready!"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim()) return toast.error("Business name is required");
    m.mutate();
  }

  const form = (
    <form onSubmit={submit} className="space-y-4">
      <div><Label>Business name</Label><Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Kola Interiors" className="mt-1.5" /></div>
      <div>
        <Label>Scenario</Label>
        <Select value={scenario} onValueChange={(v) => setScenario(v as typeof SCENARIOS[number])}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>{SCENARIOS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Context (optional)</Label>
        <Textarea rows={3} value={ctx} onChange={(e) => setCtx(e.target.value)} placeholder="Any specifics — order ID, amount, date, etc." className="mt-1.5" />
      </div>
      <div>
        <Label>Tone</Label>
        <Select value={tone} onValueChange={(v) => setTone(v as typeof TONES[number])}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Button type="submit" className="h-11 w-full bg-gradient-primary text-primary-foreground" disabled={m.isPending}>
        {m.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
        Generate follow-ups
      </Button>
    </form>
  );

  const output = (
    <>
      {!result && !m.isPending && <GeneratorEmpty icon={Reply} message="Your follow-up messages will appear here" />}
      {m.isPending && <GeneratorSkeleton />}
      {result?.messages.map((msg, i) => (
        <WAMessageCard key={i} label={msg.label} body={msg.body} title={`Follow-up ${i + 1}`} onRegenerate={() => m.mutate()} />
      ))}
    </>
  );

  return <GeneratorShell title="Follow-up Messages" description="Recover replies, payments and repeat orders." form={form} output={output} remaining={result?.remaining ?? null} />;
}
