import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateWhatsApp, type WhatsAppOutput } from "@/lib/generators.functions";
import { Wand2, Copy, Check, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { GeneratorShell, GeneratorEmpty, GeneratorSkeleton } from "@/components/generators/GeneratorShell";

export const Route = createFileRoute("/_authenticated/generate/whatsapp")({
  head: () => ({ meta: [{ title: "WhatsApp Campaign — ContentNaija AI" }] }),
  component: WhatsAppGen,
});

type Result = WhatsAppOutput & { remaining: number | null };

function WhatsAppGen() {
  const fn = useServerFn(generateWhatsApp);
  const qc = useQueryClient();
  const [businessType, setBusinessType] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [offer, setOffer] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("Friendly");
  const [includePidgin, setIncludePidgin] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: () => fn({ data: { businessType, campaignGoal, offer, audience, tone, includePidgin } }),
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["history"] });
      toast.success("Campaign ready!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to generate"),
  });

  function copy(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
    toast.success("Copied to clipboard");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessType.trim() || !campaignGoal.trim()) return toast.error("Business type and campaign goal are required");
    mutation.mutate();
  }

  const form = (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label>Business type</Label>
        <Input value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="e.g. Abuja fashion store" className="mt-1.5" />
      </div>
      <div>
        <Label>Campaign goal</Label>
        <Textarea value={campaignGoal} onChange={(e) => setCampaignGoal(e.target.value)} placeholder="Sell out December Ankara collection" rows={2} className="mt-1.5" />
      </div>
      <div>
        <Label>Offer / promo (optional)</Label>
        <Input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="20% off, free delivery in Lagos" className="mt-1.5" />
      </div>
      <div>
        <Label>Audience (optional)</Label>
        <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Young women, ages 22-35" className="mt-1.5" />
      </div>
      <div>
        <Label>Tone</Label>
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["Friendly", "Urgent", "Professional", "Hype", "Warm"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <Label htmlFor="pidgin" className="text-sm">Mix in Naija pidgin</Label>
          <p className="text-xs text-muted-foreground">Adds light pidgin for warmth.</p>
        </div>
        <Switch id="pidgin" checked={includePidgin} onCheckedChange={setIncludePidgin} />
      </div>
      <Button type="submit" className="h-11 w-full bg-gradient-primary text-primary-foreground" disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
        Write campaign
      </Button>
    </form>
  );

  const output = (
    <>
      {!result && !mutation.isPending && <GeneratorEmpty icon={MessageCircle} message="Your WhatsApp messages will appear here" />}
      {mutation.isPending && <GeneratorSkeleton />}
      {result?.messages.map((m, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">{m.label}</span>
            <Button size="sm" variant="ghost" onClick={() => copy(m.body, i)}>
              {copiedIdx === i ? <><Check className="mr-1.5 h-3.5 w-3.5" />Copied</> : <><Copy className="mr-1.5 h-3.5 w-3.5" />Copy</>}
            </Button>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
        </div>
      ))}
    </>
  );

  return <GeneratorShell title="WhatsApp Campaign Writer" description="3 message angles your customers will actually read." form={form} output={output} remaining={result?.remaining ?? null} />;
}
