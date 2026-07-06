import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const plans = [
  {
    name: "Free", price: "₦0", period: "forever",
    tag: "For testing the waters",
    features: ["20 generations / month", "Instagram captions & WhatsApp broadcasts", "1 brand kit", "History & basic exports"],
    cta: "Start Free", highlight: false,
  },
  {
    name: "Growth", price: "₦9,900", period: "/month",
    tag: "For serious solo creators",
    features: ["500 generations / month", "All generators (flyers, calendar, images)", "3 brand kits", "Scheduling & shareable links", "Priority AI queue"],
    cta: "Start Growth", highlight: true,
  },
  {
    name: "Agency", price: "₦29,900", period: "/month",
    tag: "For teams & agencies",
    features: ["Unlimited generations", "Unlimited brand kits", "Team workspaces & seats", "Client sharing", "Priority support"],
    cta: "Talk to us", highlight: false,
  },
];

export function Pricing() {
  const { t } = useI18n();
  return (
    <section id="pricing" className="border-t border-border bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">{t("pricing.eyebrow")}</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{t("pricing.title")}</h2>
          <p className="mt-4 text-muted-foreground">{t("pricing.subtitle")}</p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border bg-card p-6 shadow-card transition hover:-translate-y-1 ${p.highlight ? "border-primary shadow-elegant" : "border-border"}`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Most popular</span>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="text-xs text-muted-foreground">{p.tag}</p>
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
