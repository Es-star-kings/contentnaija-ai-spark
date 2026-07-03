import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { MarketingShell, CtaStrip } from "@/components/marketing/MarketingShell";
import { getTemplate, templates } from "@/lib/content-data";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";

export const Route = createFileRoute("/templates/$slug")({
  loader: ({ params }) => {
    const template = getTemplate(params.slug);
    if (!template) throw notFound();
    return { template };
  },
  head: ({ loaderData, params }) => {
    const t = loaderData?.template;
    if (!t) return { meta: [{ title: "Not found" }] };
    return {
      meta: [
        { title: `${t.title} — ContentNaija AI` },
        { name: "description", content: t.description },
        { property: "og:title", content: t.title },
        { property: "og:description", content: t.description },
        { property: "og:url", content: `https://contentnaija-ai-spark.lovable.app/templates/${params.slug}` },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: `https://contentnaija-ai-spark.lovable.app/templates/${params.slug}` }],
    };
  },
  notFoundComponent: () => (
    <MarketingShell>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Template not found</h1>
        <Link to="/templates" className="mt-4 inline-block text-primary hover:underline">All templates</Link>
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
  component: TemplateDetail,
});

function TemplateDetail() {
  const { template: t } = Route.useLoaderData();
  const others = templates.filter((x) => x.slug !== t.slug).slice(0, 3);
  return (
    <MarketingShell>
      <section className="mx-auto max-w-5xl px-4 pt-12 pb-16 sm:px-6 sm:pt-20">
        <Link to="/templates" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> All templates
        </Link>
        <div className="mt-6 grid gap-10 md:grid-cols-[1fr_320px]">
          <div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">{t.category}</span>
            <h1 className="mt-4 text-3xl font-bold sm:text-5xl">{t.title}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{t.description}</p>

            <h2 className="mt-10 text-xl font-semibold">What you get</h2>
            <ul className="mt-4 space-y-2">
              {t.bullets.map((b: string) => (
                <li key={b} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> <span>{b}</span>
                </li>
              ))}
            </ul>

            <h2 className="mt-10 text-xl font-semibold">Example output</h2>
            <div className="mt-4 space-y-3">
              {t.examples.map((ex, i) => (
                <blockquote key={i} className="rounded-xl border border-border bg-card p-4 text-sm italic">
                  "{ex}"
                </blockquote>
              ))}
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6 md:sticky md:top-24">
            <p className="text-sm text-muted-foreground">Ready in seconds.</p>
            <Link to="/auth" search={{ mode: "register" }} className="mt-4 block">
              <Button className="w-full bg-gradient-primary text-primary-foreground">{t.cta}</Button>
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">Free plan: 20 generations / month. No card required.</p>
          </aside>
        </div>

        <div className="mt-16">
          <h3 className="text-lg font-semibold">Try another generator</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {others.map((o) => (
              <Link key={o.slug} to="/templates/$slug" params={{ slug: o.slug }} className="rounded-xl border border-border bg-card p-4 hover:border-primary">
                <p className="font-semibold">{o.title}</p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{o.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CtaStrip />
    </MarketingShell>
  );
}
