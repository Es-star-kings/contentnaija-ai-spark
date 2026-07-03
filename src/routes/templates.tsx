import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell, CtaStrip } from "@/components/marketing/MarketingShell";
import { templates } from "@/lib/content-data";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Templates — ContentNaija AI" },
      { name: "description", content: "Ready-made AI generators for Nigerian brands: Instagram captions, WhatsApp broadcasts, flyer copy, 30-day content calendars and AI images." },
      { property: "og:title", content: "Templates — ContentNaija AI" },
      { property: "og:description", content: "AI generators for every Nigerian marketing surface." },
      { property: "og:url", content: "https://contentnaija-ai-spark.lovable.app/templates" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://contentnaija-ai-spark.lovable.app/templates" }],
  }),
  component: TemplatesList,
});

function TemplatesList() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-16 sm:px-6 sm:pt-24">
        <h1 className="text-3xl font-bold sm:text-5xl">Templates & generators</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">Every generator is tuned for Nigerian voice, tone and audience. Pick one and go.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Link key={t.slug} to="/templates/$slug" params={{ slug: t.slug }} className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary hover:shadow-card">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">{t.category}</span>
              <h2 className="mt-3 text-lg font-bold group-hover:text-primary">{t.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
              <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">{t.cta} <ArrowRight className="h-3.5 w-3.5" /></p>
            </Link>
          ))}
        </div>
      </section>
      <CtaStrip />
    </MarketingShell>
  );
}
