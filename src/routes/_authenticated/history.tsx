import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listHistory, toggleFavorite, deleteHistoryItem, createShareLink } from "@/lib/generators.functions";
import { previewText, exportPDF, exportCalendarICS } from "@/lib/exporters";
import { History as HistoryIcon, Star, Trash2, Copy, Search, Check, Download, Calendar as CalIcon, Share2 } from "lucide-react";
import { toast } from "sonner";


export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — ContentNaija AI" }] }),
  component: HistoryPage,
});

const TYPES = [
  { v: "all", label: "All generators" },
  { v: "instagram_caption", label: "Instagram captions" },
  { v: "whatsapp_campaign", label: "WhatsApp campaigns" },
  { v: "flyer_copy", label: "Flyer copy" },
  { v: "content_calendar", label: "Content calendars" },
];

const LABELS: Record<string, string> = {
  instagram_caption: "Instagram",
  whatsapp_campaign: "WhatsApp",
  flyer_copy: "Flyer",
  content_calendar: "Calendar",
};

function HistoryPage() {
  const listFn = useServerFn(listHistory);
  const favFn = useServerFn(toggleFavorite);
  const delFn = useServerFn(deleteHistoryItem);
  const shareFn = useServerFn(createShareLink);
  const qc = useQueryClient();


  const [type, setType] = useState<string>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["history", type, favoritesOnly, search],
    queryFn: () => listFn({ data: { type, favoritesOnly, search } }),
  });

  const favMut = useMutation({
    mutationFn: (vars: { id: string; favorited: boolean }) => favFn({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["history"] }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["history"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Deleted");
    },
  });

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    toast.success("Copied");
  }

  async function share(id: string) {
    try {
      const { token } = await shareFn({ data: { contentId: id, expiresInDays: 30 } });
      const url = `${window.location.origin}/s/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied", { description: url });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create share link");
    }
  }

  function preview(row: { generator_type: string; output: any }): string {
    return previewText(row.generator_type, row.output ?? {});
  }


  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8">
      <h1 className="text-2xl font-bold sm:text-3xl">History</h1>
      <p className="mt-1 text-sm text-muted-foreground">Everything you've generated, ready to reuse.</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search content…" className="pl-9" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant={favoritesOnly ? "default" : "outline"} onClick={() => setFavoritesOnly((v) => !v)}>
          <Star className={`mr-1.5 h-4 w-4 ${favoritesOnly ? "fill-current" : ""}`} /> Favorites
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (data?.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <HistoryIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium">Nothing here yet</p>
            <p className="text-sm text-muted-foreground">Try adjusting filters or generate fresh content.</p>
          </div>
        ) : (
          data?.map((r) => {
            const text = preview(r);
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">{LABELS[r.generator_type] ?? r.generator_type}</span>
                  <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm line-clamp-6">{text}</p>
                <div className="mt-3 flex items-center justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => favMut.mutate({ id: r.id, favorited: !r.favorited })}>
                    <Star className={`h-4 w-4 ${r.favorited ? "fill-primary text-primary" : ""}`} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => copy(text, r.id)}>
                    {copiedId === r.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this generation?")) delMut.mutate(r.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
