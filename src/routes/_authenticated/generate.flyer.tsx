import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateFlyer, type FlyerOutput } from "@/lib/generators.functions";
import { Wand2, Copy, Check, Loader2, FileImage } from "lucide-react";
import { toast } from "sonner";
import { GeneratorShell, GeneratorEmpty, GeneratorSkeleton } from "@/components/generators/GeneratorShell";

export const Route = createFileRoute("/_authenticated/generate/flyer")({
  head: () => ({ meta: [{ title: "Flyer Copy — ContentNaija AI" }] }),
  component: FlyerGen,
});

type Result = FlyerOutput & { remaining: number };

function FlyerGen() {
  const fn = useServerFn(generateFlyer);
  const qc = useQueryClient();
  const [businessType, setBusinessType] = useState("");
  const [eventOrOffer, setEventOrOffer] = useState("");
  const [keyDetails, setKeyDetails] = useState("");
  const [tone, setTone] = useState("Bold");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: () => fn({ data: { businessType, eventOrOffer, keyDetails, tone } }),
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["history"] });
      toast.success("Flyer copy ready!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to generate"),
  });

  function copyAll() {
    if (!result) return;
    const text = `${result.headline}\n${result.subheadline}\n\n${result.bullets.map((b) => `• ${b}`).join("\n")}\n\n${result.cta}\n\n${result.footer}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Copied to clipboard");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessType.trim() || !eventOrOffer.trim()) return toast.error("Business type and event/offer are required");
    mutation.mutate();
  }

  const form = (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label>Business type</Label>
        <Input value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="e.g. Ibadan barbing salon" className="mt-1.5" />
      </div>
      <div>
        <Label>Event or offer</Label>
        <Input value={eventOrOffer} onChange={(e) => setEventOrOffer(e.target.value)} placeholder="Grand opening, Detty December sale" className="mt-1.5" />
      </div>
      <div>
        <Label>Key details (optional)</Label>
        <Textarea value={keyDetails} onChange={(e) => setKeyDetails(e.target.value)} rows={3} placeholder="Date, location, prices, special perks" className="mt-1.5" />
      </div>
      <div>
        <Label>Tone</Label>
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["Bold", "Elegant", "Playful", "Premium", "Festive"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="h-11 w-full bg-gradient-primary text-primary-foreground" disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
        Write flyer copy
      </Button>
    </form>
  );

  const output = (
    <>
      {!result && !mutation.isPending && <GeneratorEmpty icon={FileImage} message="Your flyer copy will appear here" />}
      {mutation.isPending && <GeneratorSkeleton count={2} />}
      {result && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Preview</span>
              <Button size="sm" variant="ghost" onClick={copyAll}>
                {copied ? <><Check className="mr-1.5 h-3.5 w-3.5" />Copied</> : <><Copy className="mr-1.5 h-3.5 w-3.5" />Copy all</>}
              </Button>
            </div>
            <h2 className="mt-4 text-2xl font-bold leading-tight">{result.headline}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{result.subheadline}</p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {result.bullets.map((b, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{b}</li>)}
            </ul>
            <div className="mt-4 rounded-lg bg-gradient-primary p-3 text-center text-sm font-semibold text-primary-foreground">{result.cta}</div>
            <p className="mt-3 text-center text-xs text-muted-foreground">{result.footer}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Color suggestion:</span> {result.colorSuggestion}
          </div>
        </div>
      )}
    </>
  );

  return <GeneratorShell title="Flyer Copy Generator" description="Headline, bullets and CTA — ready for your designer." form={form} output={output} remaining={result?.remaining ?? null} />;
}
