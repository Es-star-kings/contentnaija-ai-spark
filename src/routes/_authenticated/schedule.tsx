import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listScheduled, updateSchedule, setContentStatus } from "@/lib/generators.functions";
import { previewText } from "@/lib/exporters";
import { Calendar as CalIcon, ChevronLeft, ChevronRight, FileEdit, Clock, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/schedule")({
  head: () => ({ meta: [{ title: "Schedule — ContentNaija AI" }] }),
  component: SchedulePage,
});

const LABELS: Record<string, string> = {
  instagram_caption: "Instagram",
  whatsapp_campaign: "WhatsApp",
  flyer_copy: "Flyer",
  content_calendar: "Calendar",
  image: "Image",
};

type Row = {
  id: string;
  generator_type: string;
  output: any;
  inputs: any;
  created_at: string;
  scheduled_for: string | null;
  status: string;
  favorited: boolean;
};

function monthRange(d: Date) {
  const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59));
  return { from: first.toISOString(), to: last.toISOString(), first, last };
}

function buildGrid(first: Date) {
  // weeks starting Monday
  const start = new Date(first);
  const dow = (first.getUTCDay() + 6) % 7; // Mon=0
  start.setUTCDate(first.getUTCDate() - dow);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    cells.push(d);
  }
  return cells;
}

function dateKey(d: string | Date) {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toISOString().slice(0, 10);
}

function SchedulePage() {
  const listFn = useServerFn(listScheduled);
  const updateFn = useServerFn(updateSchedule);
  const statusFn = useServerFn(setContentStatus);
  const qc = useQueryClient();

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  });
  const [editing, setEditing] = useState<Row | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("09:00");

  const { from, to, first, last } = useMemo(() => monthRange(cursor), [cursor]);
  const cells = useMemo(() => buildGrid(first), [first]);

  const { data, isLoading } = useQuery({
    queryKey: ["schedule", from, to],
    queryFn: () => listFn({ data: { from, to, includeDrafts: true } }) as Promise<Row[]>,
  });

  const scheduledByDay = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of data ?? []) {
      if (!r.scheduled_for) continue;
      const k = dateKey(r.scheduled_for);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return m;
  }, [data]);

  const drafts = (data ?? []).filter((r) => !r.scheduled_for && r.status !== "published");

  const updMut = useMutation({
    mutationFn: (vars: { id: string; scheduled_for: string | null; status?: "draft" | "scheduled" | "published" }) =>
      updateFn({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule"] });
      qc.invalidateQueries({ queryKey: ["history"] });
      toast.success("Saved");
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save"),
  });

  const statMut = useMutation({
    mutationFn: (vars: { id: string; status: "draft" | "scheduled" | "published" }) => statusFn({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule"] }),
  });

  function openEdit(r: Row, presetDate?: Date) {
    setEditing(r);
    const src = presetDate ?? (r.scheduled_for ? new Date(r.scheduled_for) : new Date());
    setEditDate(src.toISOString().slice(0, 10));
    setEditTime(
      r.scheduled_for
        ? new Date(r.scheduled_for).toISOString().slice(11, 16)
        : "09:00"
    );
  }

  function save() {
    if (!editing) return;
    const iso = new Date(`${editDate}T${editTime}:00Z`).toISOString();
    updMut.mutate({ id: editing.id, scheduled_for: iso, status: "scheduled" });
  }

  function unschedule(id: string) {
    updMut.mutate({ id, scheduled_for: null, status: "draft" });
  }

  function shift(dir: -1 | 1) {
    const d = new Date(cursor);
    d.setUTCMonth(d.getUTCMonth() + dir);
    setCursor(d);
  }

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const today = dateKey(new Date());

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Schedule</h1>
          <p className="mt-1 text-sm text-muted-foreground">Plan when your generated content goes out.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="min-w-[140px] text-center text-sm font-medium">{monthLabel}</span>
          <Button size="sm" variant="outline" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar grid */}
        <div className="rounded-xl border border-border bg-card p-3 shadow-card">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              const inMonth = d.getUTCMonth() === cursor.getUTCMonth();
              const k = dateKey(d);
              const items = scheduledByDay.get(k) ?? [];
              const isToday = k === today;
              return (
                <div
                  key={i}
                  className={`min-h-[88px] rounded-md border p-1.5 text-left transition ${
                    inMonth ? "bg-background" : "bg-muted/40 text-muted-foreground"
                  } ${isToday ? "border-primary" : "border-border"}`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={isToday ? "font-bold text-primary" : ""}>{d.getUTCDate()}</span>
                    {items.length > 0 && (
                      <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                        {items.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-1">
                    {items.slice(0, 3).map((r) => (
                      <button
                        key={r.id}
                        onClick={() => openEdit(r)}
                        className="block w-full truncate rounded bg-accent px-1.5 py-1 text-left text-[10px] hover:bg-accent/80"
                        title={previewText(r.generator_type, r.output ?? {})}
                      >
                        <span className="font-medium">
                          {r.scheduled_for ? new Date(r.scheduled_for).toISOString().slice(11, 16) : ""}
                        </span>{" "}
                        <span className="text-muted-foreground">{LABELS[r.generator_type] ?? r.generator_type}</span>
                      </button>
                    ))}
                    {items.length > 3 && (
                      <div className="px-1 text-[10px] text-muted-foreground">+{items.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drafts panel */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-2">
            <FileEdit className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Drafts & unscheduled</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Move items into the calendar by scheduling them.</p>

          <div className="mt-3 space-y-2">
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : drafts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-center">
                <CalIcon className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-xs text-muted-foreground">Nothing waiting. </p>
                <Link to="/generate" className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
                  Generate something →
                </Link>
              </div>
            ) : (
              drafts.map((r) => (
                <div key={r.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">
                      {LABELS[r.generator_type] ?? r.generator_type}
                    </span>
                    <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs">{previewText(r.generator_type, r.output ?? {})}</p>
                  <div className="mt-2 flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                      <Clock className="mr-1 h-3.5 w-3.5" /> Schedule
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => statMut.mutate({ id: r.id, status: "published" })}
                      title="Mark published"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule post</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <p className="line-clamp-3 rounded-md bg-muted p-2 text-xs">
                {previewText(editing.generator_type, editing.output ?? {})}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium">Date</label>
                  <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium">Time (UTC)</label>
                  <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Status</label>
                <Select
                  value={editing.status}
                  onValueChange={(v) => setEditing({ ...editing, status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
            {editing?.scheduled_for ? (
              <Button variant="ghost" onClick={() => unschedule(editing!.id)} disabled={updMut.isPending}>
                <X className="mr-1 h-4 w-4" /> Unschedule
              </Button>
            ) : <span />}
            <Button onClick={save} disabled={updMut.isPending}>
              {updMut.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
