import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSharedContent } from "@/lib/generators.functions";
import { previewText, exportPDF, exportCalendarICS } from "@/lib/exporters";
import { Button } from "@/components/ui/button";
import { Download, Calendar as CalIcon, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/s/$token")({
  head: () => ({ meta: [{ title: "Shared content — ContentNaija AI" }, { name: "robots", content: "noindex" }] }),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-xl p-10 text-center">
      <h1 className="text-xl font-semibold">Link unavailable</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Link to="/" className="mt-4 inline-flex text-primary hover:underline">Back home</Link>
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Not found</div>,
  component: SharedPage,
});

const LABELS: Record<string, string> = {
  instagram_caption: "Instagram captions",
  whatsapp_campaign: "WhatsApp campaign",
  flyer_copy: "Flyer copy",
  content_calendar: "Content calendar",
  image: "AI image",
};

function SharedPage() {
  const { token } = Route.useParams();
  const fetchFn = useServerFn(getSharedContent);
  const { data, isLoading, error } = useQuery({
    queryKey: ["shared", token],
    queryFn: () => fetchFn({ data: { token } }),
    retry: false,
  });

  if (isLoading) return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;
  if (error) throw error;
  if (!data) return null;

  const title = LABELS[data.generator_type] ?? "Shared content";
  const body = previewText(data.generator_type, data.output as any);

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-10">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← ContentNaija AI</Link>
        <span className="text-xs text-muted-foreground">{new Date(data.created_at).toLocaleDateString()}</span>
      </div>
      <h1 className="mt-6 text-3xl font-bold">{title}</h1>
      {data.brand_name && <p className="mt-1 text-sm text-muted-foreground">Shared by {data.brand_name}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => { navigator.clipboard.writeText(body); toast.success("Copied"); }}>
          <Copy className="mr-1.5 h-4 w-4" /> Copy
        </Button>
        <Button size="sm" variant="outline" onClick={() => exportPDF({ title, body, brand: data.brand_name ?? undefined })}>
          <Download className="mr-1.5 h-4 w-4" /> PDF
        </Button>
        {data.generator_type === "content_calendar" && (
          <Button size="sm" variant="outline" onClick={() => exportCalendarICS((data.output as any)?.plan ?? [], { brand: data.brand_name ?? undefined })}>
            <CalIcon className="mr-1.5 h-4 w-4" /> Add to calendar (.ics)
          </Button>
        )}
        {data.generator_type === "image" && (data.output as any)?.url && (
          <a href={(data.output as any).url} target="_blank" rel="noreferrer" className="inline-flex">
            <Button size="sm" variant="outline"><ExternalLink className="mr-1.5 h-4 w-4" /> Open image</Button>
          </a>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-card">
        {data.generator_type === "image" && (data.output as any)?.url ? (
          <img src={(data.output as any).url} alt="" className="mx-auto max-h-[600px] rounded-lg" />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{body}</pre>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Want to create your own? <Link to="/" className="text-primary hover:underline">Try ContentNaija AI</Link>
      </p>
    </div>
  );
}
