import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell, CtaStrip } from "@/components/marketing/MarketingShell";
import { blogPosts } from "@/lib/content-data";
import { Calendar, Clock } from "lucide-react";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — ContentNaija AI" },
      { name: "description", content: "Playbooks, templates and tips for Nigerian small businesses using AI to grow — captions, WhatsApp, flyers and more." },
      { property: "og:title", content: "Blog — ContentNaija AI" },
      { property: "og:description", content: "AI marketing playbooks for Nigerian brands." },
      { property: "og:url", content: "https://contentnaija-ai-spark.lovable.app/blog" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://contentnaija-ai-spark.lovable.app/blog" }],
  }),
  component: BlogListPage,
});

function BlogListPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-5xl px-4 pt-16 pb-16 sm:px-6 sm:pt-24">
        <h1 className="text-3xl font-bold sm:text-5xl">The Playbook</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Real tactics and templates for Nigerian small businesses using AI to grow — no fluff, no US-centric advice.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {blogPosts.map((p) => (
            <Link key={p.slug} to="/blog/$slug" params={{ slug: p.slug }} className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary hover:shadow-card">
              <div className="flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{t}</span>
                ))}
              </div>
              <h2 className="mt-3 text-xl font-bold group-hover:text-primary">{p.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.description}</p>
              <p className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.readMin} min read</span>
              </p>
            </Link>
          ))}
        </div>
      </section>
      <CtaStrip />
    </MarketingShell>
  );
}
