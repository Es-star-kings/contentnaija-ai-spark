import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { MarketingShell, CtaStrip } from "@/components/marketing/MarketingShell";
import { getUseCase, useCases } from "@/lib/content-data";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X } from "lucide-react";

export const Route = createFileRoute("/for/$industry")({
  loader: ({ params }) => {
    const uc = getUseCase(params.industry);
    if (!uc) throw notFound();
    return { uc };
  },
  head: ({ loaderData, params }) => {
    const uc = loaderData?.uc;
    if (!uc) return { meta: [{ title: "Not found" }] };
    return {
      meta: [
        { title: `AI content for ${uc.industry} — ContentNaija AI` },
        { name: "description", content: uc.subheadline },
        { property: "og:title", content: uc.headline },
        { property: "og:description", content: uc.subheadline },
        { property: "og:url", content: `https://contentnaija-ai-spark.lovable.app/for/${params.industry}` },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: `https://contentnaija-ai-spark.lovable.app/for/${params.industry}` }],
    };
  },
  notFoundComponent: () => (
    <MarketingShell>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">Back home</Link>
      </div>
    </MarketingShell>
  ),
  errorComponent: ({ error }) => (
    <MarketingShell>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{(error as Error).message}</p>
      </div>
    </MarketingShell>
  ),
  component: UseCasePage,
});

function UseCasePage() {
  const { uc } = Route.useLoaderData();
  const others = useCases.filter((x) => x.slug !== uc.slug);
  return (
    <MarketingShell>
      <section className="mx-auto max-w-5xl px-4 pt-12 pb-16 sm:px-6 sm:pt-20">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Home
        </Link>
        <span className="mt-6 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">For {uc.industry}</span>
        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">{uc.headline}</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{uc.subheadline}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/auth" search={{ mode: "register" }}>
            <Button size="lg" className="bg-gradient-primary text-primary-foreground">Start free</Button>
          </Link>
          <Link to="/templates">
            <Button size="lg" variant="outline">See templates</Button>
          </Link>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">What most {uc.industry.toLowerCase()} brands struggle with</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {uc.painPoints.map((p: string) => (
                <li key={p} className="flex items-start gap-2"><X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> <span>{p}</span></li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-6">
            <h2 className="text-lg font-semibold">What changes with ContentNaija AI</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {uc.wins.map((w: string) => (
                <li key={w} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> <span>{w}</span></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Sample generated caption</p>
          <blockquote className="mt-3 text-lg italic">"{uc.sampleCaption}"</blockquote>
        </div>

        <div className="mt-16">
          <h3 className="text-lg font-semibold">Other industries</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {others.map((o) => (
              <Link key={o.slug} to="/for/$industry" params={{ industry: o.slug }} className="rounded-xl border border-border bg-card p-4 hover:border-primary">
                <p className="font-semibold text-sm">{o.industry}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CtaStrip />
    </MarketingShell>
  );
}
