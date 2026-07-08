import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateWAPromo, type WAPromoOutput } from "@/lib/generators.functions";
import { Wand2, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { GeneratorShell, GeneratorEmpty, GeneratorSkeleton } from "@/components/generators/GeneratorShell";
import { WAMessageCard, WA_TONES } from "@/components/generators/WAMessageCard";

export const Route = createFileRoute("/_authenticated/whatsapp/promo")({
  head: () => ({ meta: [{ title: "WhatsApp Promotional Messages — ContentNaija AI" }] }),
  component: Page,
});

const TYPES = ["Product Launch", "Flash Sale", "Discount", "Clearance Sale", "New Arrival", "Referral Program", "Giveaway"] as const;
type Result = WAPromoOutput & { remaining: number | null };

function Page() {
  const fn = useServerFn(generateWAPromo);
  const qc = useQueryClient();
  const [businessName, setBusinessName] = useState("");
  const [product, setProduct] = useState("");
  const [promoType, setPromoType] = useState<typeof TYPES[number]>("Flash Sale");
  const [offer, setOffer] = useState("");
  const [tone, setTone] = useState("Youthful");
  const [includePidgin, setIncludePidgin] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const m = useMutation({
    mutationFn: () => fn({ data: { businessName, product, promoType, offer, tone, includePidgin } }),
    onSuccess: (r) => { setResult(r); qc.invalidateQueries({ queryKey: ["history"] }); qc.invalidateQueries({ queryKey: ["analytics"] }); toast.success("Promotional messages ready!"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim() || !product.trim()) return toast.error("Business name and product are required");
    m.mutate();
  }

  const form = (
    <form onSubmit={submit} className="space-y-4">
      <div><Label>Business name</Label><Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1.5" /></div>
      <div><Label>Product / Service</Label><Input value={product} onChange={(e) => setProduct(e.target.value)} className="mt-1.5" /></div>
      <div>
        <Label>Promo type</Label>
        <Select value={promoType} onValueChange={(v) => setPromoType(v as typeof TYPES[number])}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Offer details (optional)</Label><Input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="Buy 2 get 1 free, ends Sunday" className="mt-1.5" /></div>
      <div>
        <Label>Tone</Label>
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>{WA_TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div><Label htmlFor="pidgin" className="text-sm">Mix in Naija pidgin</Label></div>
        <Switch id="pidgin" checked={includePidgin} onCheckedChange={setIncludePidgin} />
      </div>
      <Button type="submit" className="h-11 w-full bg-gradient-primary text-primary-foreground" disabled={m.isPending}>
        {m.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
        Generate promotions
      </Button>
    </form>
  );

  const output = (
    <>
      {!result && !m.isPending && <GeneratorEmpty icon={Tag} message="Your promotional messages will appear here" />}
      {m.isPending && <GeneratorSkeleton />}
      {result?.messages.map((msg, i) => (
        <WAMessageCard key={i} label={msg.label} body={msg.body} title={`Promo ${i + 1}`} onRegenerate={() => m.mutate()} />
      ))}
    </>
  );

  return <GeneratorShell title="Promotional Messages" description="Launches, flash sales and referral hype." form={form} output={output} remaining={result?.remaining ?? null} />;
}
