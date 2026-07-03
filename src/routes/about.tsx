import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell, CtaStrip } from "@/components/marketing/MarketingShell";
import { Heart, Users, Sparkles } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ContentNaija AI — Nigerian-voice AI for small brands" },
      { name: "description", content: "We're building AI content tools that actually sound Nigerian — for the salons, restaurants, and creators shaping our economy." },
      { property: "og:title", content: "About ContentNaija AI" },
      { property: "og:description", content: "Nigerian-voice AI for the businesses shaping our economy." },
      { property: "og:url", content: "https://contentnaija-ai-spark.lovable.app/about" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://contentnaija-ai-spark.lovable.app/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-4xl px-4 pt-16 pb-16 sm:px-6 sm:pt-24">
        <h1 className="text-3xl font-bold sm:text-5xl">We're building AI that sounds Nigerian.</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Most AI content tools sound like they were built for Manhattan. That's a problem when your customers are in Lagos, Abuja or Port Harcourt.
          ContentNaija AI is trained and prompted for the tone, rhythm and cultural cues Nigerian buyers actually respond to.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            { icon: Sparkles, title: "Made for our voice", body: "Prompts and models tuned for Nigerian English, warmth and light pidgin when it fits." },
            { icon: Users, title: "Built for small teams", body: "One-person shops, salons, restaurants, agencies — the businesses driving Nigerian growth." },
            { icon: Heart, title: "Naira-first", body: "Pricing that respects our economy — start free, upgrade only when it's paying you back." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-border bg-card p-8">
          <h2 className="text-2xl font-bold">Our mission</h2>
          <p className="mt-3 text-muted-foreground">
            Give every Nigerian small business the marketing team of a Fortune 500 — for the price of a plate of jollof.
            We believe great content shouldn't be a luxury reserved for brands with agencies on retainer.
          </p>
        </div>
      </section>
      <CtaStrip />
    </MarketingShell>
  );
}
