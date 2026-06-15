import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  { name: "Free", price: "₦0", period: "forever", features: ["20 generations / month", "Instagram captions", "Basic templates", "Community support"], cta: "Start Free", highlight: false },
  { name: "Creator", price: "₦5,000", period: "/month", features: ["Unlimited captions", "Content calendar", "WhatsApp campaigns", "Email support"], cta: "Choose Creator", highlight: true },
  { name: "Business", price: "₦15,000", period: "/month", features: ["Everything in Creator", "Branded templates", "Analytics dashboard", "Priority support"], cta: "Choose Business", highlight: false },
  { name: "Agency", price: "₦40,000", period: "/month", features: ["Multi-brand workspaces", "Team accounts", "Content approval", "Dedicated manager"], cta: "Choose Agency", highlight: false },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-border bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Pricing</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Naira pricing. No surprises.</h2>
          <p className="mt-4 text-muted-foreground">Start free. Upgrade only when you're winning.</p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border bg-card p-6 shadow-card transition hover:-translate-y-1 ${p.highlight ? "border-primary shadow-elegant" : "border-border"}`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Most popular</span>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth" search={{ mode: "register" }}>
                <Button className={`mt-8 w-full ${p.highlight ? "bg-gradient-primary text-primary-foreground" : ""}`} variant={p.highlight ? "default" : "outline"}>
                  {p.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
