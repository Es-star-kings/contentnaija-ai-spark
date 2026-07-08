import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateWAHoliday, type WAHolidayOutput } from "@/lib/generators.functions";
import { Wand2, Loader2, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { GeneratorShell, GeneratorEmpty, GeneratorSkeleton } from "@/components/generators/GeneratorShell";
import { WAMessageCard, WA_TONES } from "@/components/generators/WAMessageCard";

export const Route = createFileRoute("/_authenticated/whatsapp/holiday")({
  head: () => ({ meta: [{ title: "Holiday Campaign Generator — ContentNaija AI" }] }),
  component: Page,
});

const HOLIDAYS = [
  "Christmas", "New Year", "Easter", "Eid al-Fitr", "Eid al-Adha",
  "Black Friday", "Cyber Monday", "Valentine's Day", "Mother's Day",
  "Father's Day", "Children's Day", "Nigerian Independence Day",
  "Democracy Day", "Back to School", "End of Month Sales",
] as const;

type Result = WAHolidayOutput & { remaining: number | null };

function Page() {
  const fn = useServerFn(generateWAHoliday);
  const qc = useQueryClient();
  const [businessName, setBusinessName] = useState("");
  const [product, setProduct] = useState("");
  const [holiday, setHoliday] = useState<typeof HOLIDAYS[number]>("Christmas");
  const [offer, setOffer] = useState("");
  const [tone, setTone] = useState("Friendly");
  const [includePidgin, setIncludePidgin] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const m = useMutation({
    mutationFn: () => fn({ data: { businessName, product, holiday, offer, tone, includePidgin } }),
    onSuccess: (r) => { setResult(r); qc.invalidateQueries({ queryKey: ["history"] }); qc.invalidateQueries({ queryKey: ["analytics"] }); toast.success("Campaign ready!"); },
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
        <Label>Holiday</Label>
        <Select value={holiday} onValueChange={(v) => setHoliday(v as typeof HOLIDAYS[number])}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>{HOLIDAYS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Offer (optional)</Label><Input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="25% off site-wide" className="mt-1.5" /></div>
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
        Generate campaign
      </Button>
    </form>
  );

  const output = (
    <>
      {!result && !m.isPending && <GeneratorEmpty icon={PartyPopper} message="Your holiday campaign will appear here" />}
      {m.isPending && <GeneratorSkeleton />}
      {result && (
        <>
          <WAMessageCard label="📣 WhatsApp Broadcast" body={result.whatsapp_broadcast} title="Holiday broadcast" onRegenerate={() => m.mutate()} />
          <WAMessageCard label="📱 WhatsApp Status" body={result.whatsapp_status} title="Holiday status" />
          <WAMessageCard label="📸 Instagram Caption" body={result.instagram_caption} title="Instagram caption" />
          <WAMessageCard label="👍 Facebook Caption" body={result.facebook_caption} title="Facebook caption" />
          <WAMessageCard label="🎯 Call to action" body={result.cta} title="CTA" />
          <WAMessageCard
            label="# Hashtags"
            body={(result.hashtags ?? []).map((h) => `#${h.replace(/^#/, "")}`).join(" ")}
            title="Hashtags"
          />
        </>
      )}
    </>
  );

  return <GeneratorShell title="Holiday Campaign" description="Multi-channel campaign for every Nigerian holiday." form={form} output={output} remaining={result?.remaining ?? null} />;
}
