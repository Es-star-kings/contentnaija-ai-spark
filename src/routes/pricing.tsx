import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell, CtaStrip } from "@/components/marketing/MarketingShell";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — ContentNaija AI" },
      { name: "description", content: "Simple pricing for Nigerian brands. Start free with 20 generations a month. Upgrade for unlimited captions, WhatsApp, flyers and images." },
      { property: "og:title", content: "Pricing — ContentNaija AI" },
      { property: "og:description", content: "Simple, naira-friendly plans for Nigerian small businesses and agencies." },
      { property: "og:url", content: "https://contentnaija-ai-spark.vercel.app/pricing" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://contentnaija-ai-spark.vercel.app/pricing" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: "ContentNaija AI",
        description: "AI content generation for Nigerian small businesses and agencies.",
        offers: [
          { "@type": "Offer", name: "Free", price: "0", priceCurrency: "NGN" },
          { "@type": "Offer", name: "Growth", price: "9900", priceCurrency: "NGN" },
          { "@type": "Offer", name: "Agency", price: "29900", priceCurrency: "NGN" },
        ],
      }),
    }],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: "Free", price: "₦0", period: "forever",
    tag: "For testing the waters",
    features: ["20 generations / month", "Instagram captions & WhatsApp broadcasts", "1 brand kit", "History & basic exports"],
    ctaLabel: "Start free", highlight: false,
  },
  {
    name: "Growth", price: "₦9,900", period: "/month",
    tag: "For serious solo creators",
    features: ["500 generations / month", "All generators (flyers, calendar, images)", "3 brand kits", "Scheduling & shareable links", "Priority AI queue"],
    ctaLabel: "Start Growth", highlight: true,
  },
  {
    name: "Agency", price: "₦29,900", period: "/month",
    tag: "For teams & agencies",
    features: ["Unlimited generations", "Unlimited brand kits", "Team workspaces & seats", "Client sharing", "Priority support"],
    ctaLabel: "Talk to us", highlight: false,
  },
];

function PricingPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-8 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Naira-friendly pricing
          </span>
          <h1 className="mt-4 text-3xl font-bold sm:text-5xl">Pricing that fits Nigerian businesses</h1>
          <p className="mt-4 text-muted-foreground">Start free. Upgrade when your content is doing the work of a small team.</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-2xl border p-6 shadow-card ${p.highlight ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
              {p.highlight && <span className="mb-3 inline-block rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">Most popular</span>}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="text-xs text-muted-foreground">{p.tag}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
              <Link to="/auth" search={{ mode: "register" }} className="mt-6 block">
                <Button className={`w-full ${p.highlight ? "bg-gradient-primary text-primary-foreground" : ""}`} variant={p.highlight ? "default" : "outline"}>
                  {p.ctaLabel}
                </Button>
              </Link>
              <ul className="mt-6 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Prices in NGN. All plans include our Nigerian voice models and brand-context AI.
        </p>
      </section>
      <CtaStrip />
    </MarketingShell>
  );
}
