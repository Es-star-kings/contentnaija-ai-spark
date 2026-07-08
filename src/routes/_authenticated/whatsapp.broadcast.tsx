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
import { generateWABroadcast, type WABroadcastOutput } from "@/lib/generators.functions";
import { Wand2, Loader2, Radio } from "lucide-react";
import { toast } from "sonner";
import { GeneratorShell, GeneratorEmpty, GeneratorSkeleton } from "@/components/generators/GeneratorShell";
import { WAMessageCard, WA_TONES } from "@/components/generators/WAMessageCard";

export const Route = createFileRoute("/_authenticated/whatsapp/broadcast")({
  head: () => ({ meta: [{ title: "WhatsApp Broadcast Generator — ContentNaija AI" }] }),
  component: Page,
});

type Result = WABroadcastOutput & { remaining: number | null };

function Page() {
  const fn = useServerFn(generateWABroadcast);
  const qc = useQueryClient();
  const [businessName, setBusinessName] = useState("");
  const [product, setProduct] = useState("");
  const [offer, setOffer] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<string>("Friendly");
  const [cta, setCta] = useState("");
  const [includePidgin, setIncludePidgin] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const m = useMutation({
    mutationFn: () => fn({ data: { businessName, product, offer, audience, tone, cta, includePidgin } }),
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["history"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Broadcasts ready!");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to generate"),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim() || !product.trim()) return toast.error("Business name and product are required");
    m.mutate();
  }

  const form = (
    <form onSubmit={submit} className="space-y-4">
      <div><Label>Business name</Label><Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Ada's Kitchen" className="mt-1.5" /></div>
      <div><Label>Product / Service</Label><Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Small chops trays" className="mt-1.5" /></div>
      <div><Label>Offer (optional)</Label><Input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="10% off weekend orders" className="mt-1.5" /></div>
      <div><Label>Target audience (optional)</Label><Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Lagos office workers" className="mt-1.5" /></div>
      <div>
        <Label>Tone</Label>
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>{WA_TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Call to action (optional)</Label><Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Order via wa.me/234..." className="mt-1.5" /></div>
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div><Label htmlFor="pidgin" className="text-sm">Mix in Naija pidgin</Label><p className="text-xs text-muted-foreground">Adds warmth for local audiences.</p></div>
        <Switch id="pidgin" checked={includePidgin} onCheckedChange={setIncludePidgin} />
      </div>
      <Button type="submit" className="h-11 w-full bg-gradient-primary text-primary-foreground" disabled={m.isPending}>
        {m.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
        Generate broadcasts
      </Button>
    </form>
  );

  const output = (
    <>
      {!result && !m.isPending && <GeneratorEmpty icon={Radio} message="Your WhatsApp broadcasts will appear here" />}
      {m.isPending && <GeneratorSkeleton />}
      {result?.messages.map((msg, i) => (
        <WAMessageCard key={i} label={msg.label} body={msg.body} title={`Broadcast ${i + 1}`} onRegenerate={() => m.mutate()} />
      ))}
    </>
  );

  return <GeneratorShell title="WhatsApp Broadcast" description="Promotional broadcasts your audience will actually read." form={form} output={output} remaining={result?.remaining ?? null} />;
}
