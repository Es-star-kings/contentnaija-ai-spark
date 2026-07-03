import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Mail, MessageCircle, Instagram } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact ContentNaija AI" },
      { name: "description", content: "Get in touch with the ContentNaija AI team. We're here for questions, partnerships, and agency pricing." },
      { property: "og:title", content: "Contact ContentNaija AI" },
      { property: "og:description", content: "Questions, partnerships, agency pricing — we're a message away." },
      { property: "og:url", content: "https://contentnaija-ai-spark.lovable.app/contact" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://contentnaija-ai-spark.lovable.app/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    // TODO: wire to email/inbox pipeline once email infra is provisioned.
    setTimeout(() => {
      toast.success("Thanks — we'll be in touch within 1 business day");
      setForm({ name: "", email: "", message: "" });
      setBusy(false);
    }, 600);
  }

  return (
    <MarketingShell>
      <section className="mx-auto max-w-4xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24">
        <h1 className="text-3xl font-bold sm:text-5xl">Let's talk</h1>
        <p className="mt-4 text-muted-foreground">Questions, partnerships, or agency pricing — we're a message away.</p>

        <div className="mt-10 grid gap-8 md:grid-cols-[1fr_320px]">
          <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Your name</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>How can we help?</Label>
              <Textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1.5" />
            </div>
            <Button type="submit" disabled={busy} className="bg-gradient-primary text-primary-foreground">
              {busy ? "Sending…" : "Send message"}
            </Button>
          </form>

          <aside className="space-y-4">
            {[
              { icon: Mail, label: "Email", value: "hello@contentnaija.ai" },
              { icon: MessageCircle, label: "WhatsApp", value: "+234 800 000 0000" },
              { icon: Instagram, label: "Instagram", value: "@contentnaija.ai" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </section>
    </MarketingShell>
  );
}
