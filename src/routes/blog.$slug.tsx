import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { MarketingShell, CtaStrip } from "@/components/marketing/MarketingShell";
import { getBlogPost, renderMarkdown, blogPosts } from "@/lib/content-data";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getBlogPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData, params }) => {
    const post = loaderData?.post;
    if (!post) return { meta: [{ title: "Not found — ContentNaija AI" }] };
    return {
      meta: [
        { title: `${post.title} — ContentNaija AI` },
        { name: "description", content: post.description },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.description },
        { property: "og:url", content: `https://contentnaija-ai-spark.lovable.app/blog/${params.slug}` },
        { property: "og:type", content: "article" },
        { property: "article:published_time", content: post.date },
        { property: "article:author", content: post.author },
      ],
      links: [{ rel: "canonical", href: `https://contentnaija-ai-spark.lovable.app/blog/${params.slug}` }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.description,
          author: { "@type": "Organization", name: post.author },
          datePublished: post.date,
        }),
      }],
    };
  },
  notFoundComponent: () => (
    <MarketingShell>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <p className="mt-2 text-muted-foreground">The article you're looking for isn't here.</p>
        <Link to="/blog" className="mt-6 inline-block text-primary hover:underline">Back to blog</Link>
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
  component: BlogPostPage,
});

function BlogPostPage() {
  const { post } = Route.useLoaderData();
  const html = renderMarkdown(post.content);
  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-4 pt-12 pb-12 sm:px-6 sm:pt-20">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> All posts
        </Link>
        <div className="mt-6 flex flex-wrap gap-1.5">
          {post.tags.map((t: string) => (
            <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{t}</span>
          ))}
        </div>
        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">{post.title}</h1>
        <p className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><User className="h-3 w-3" /> {post.author}</span>
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(post.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readMin} min read</span>
        </p>
        <div
          className="prose prose-neutral mt-10 max-w-none text-foreground [&>h1]:mt-8 [&>h1]:text-3xl [&>h1]:font-bold [&>h2]:mt-8 [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:mt-6 [&>h3]:text-lg [&>h3]:font-semibold [&>p]:mt-4 [&>p]:leading-relaxed [&>ul]:mt-3 [&>ul]:ml-6 [&>ul]:list-disc [&>ul]:space-y-1"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
      {related.length > 0 && (
        <section className="border-t border-border bg-muted/30 py-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-lg font-semibold">Keep reading</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {related.map((r) => (
                <Link key={r.slug} to="/blog/$slug" params={{ slug: r.slug }} className="rounded-xl border border-border bg-card p-5 hover:border-primary">
                  <p className="font-semibold">{r.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      <CtaStrip />
    </MarketingShell>
  );
}
