import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { listBrands, createBrand, updateBrand, deleteBrand, setActiveBrand } from "@/lib/generators.functions";
import { Plus, Star, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/brands")({
  component: BrandsPage,
});

type BrandForm = {
  id?: string;
  name: string;
  business_name: string;
  industry: string;
  tone: string;
  target_audience: string;
  brand_color: string;
};

const empty: BrandForm = { name: "", business_name: "", industry: "", tone: "", target_audience: "", brand_color: "#10B981" };

function BrandsPage() {
  const router = useRouter();
  const list = useServerFn(listBrands);
  const create = useServerFn(createBrand);
  const update = useServerFn(updateBrand);
  const del = useServerFn(deleteBrand);
  const setActive = useServerFn(setActiveBrand);

  const { data, refetch, isLoading } = useQuery({ queryKey: ["brands"], queryFn: () => list() });
  const [editing, setEditing] = useState<BrandForm | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!editing?.name.trim()) return toast.error("Brand name required");
    setSaving(true);
    try {
      if (editing.id) {
        await update({ data: editing as any });
        toast.success("Brand updated");
      } else {
        await create({ data: editing as any });
        toast.success("Brand created");
      }
      setEditing(null);
      await refetch();
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this brand?")) return;
    await del({ data: { id } });
    toast.success("Deleted");
    await refetch();
  }

  async function activate(id: string | null) {
    await setActive({ data: { id } });
    toast.success(id ? "Brand activated" : "Switched to default profile");
    await refetch();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Brands</h1>
          <p className="text-sm text-muted-foreground">Manage multiple brand profiles. The active brand is used for all generations.</p>
        </div>
        {!editing && (
          <Button onClick={() => setEditing({ ...empty })} className="gap-1.5">
            <Plus className="h-4 w-4" /> New brand
          </Button>
        )}
      </div>

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{editing.id ? "Edit brand" : "New brand"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Brand name *">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Mama Put Cafe" />
            </Field>
            <Field label="Business name">
              <Input value={editing.business_name} onChange={(e) => setEditing({ ...editing, business_name: e.target.value })} />
            </Field>
            <Field label="Industry">
              <Input value={editing.industry} onChange={(e) => setEditing({ ...editing, industry: e.target.value })} placeholder="Food & Beverage" />
            </Field>
            <Field label="Tone">
              <Input value={editing.tone} onChange={(e) => setEditing({ ...editing, tone: e.target.value })} placeholder="Friendly, witty" />
            </Field>
            <Field label="Target audience">
              <Input value={editing.target_audience} onChange={(e) => setEditing({ ...editing, target_audience: e.target.value })} placeholder="Young Lagos professionals" />
            </Field>
            <Field label="Brand color">
              <div className="flex items-center gap-2">
                <Input type="color" value={editing.brand_color} onChange={(e) => setEditing({ ...editing, brand_color: e.target.value })} className="h-10 w-16 p-1" />
                <Input value={editing.brand_color} onChange={(e) => setEditing({ ...editing, brand_color: e.target.value })} />
              </div>
            </Field>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Button onClick={save} disabled={saving} className="gap-1.5"><Check className="h-4 w-4" /> Save</Button>
              <Button variant="ghost" onClick={() => setEditing(null)} className="gap-1.5"><X className="h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (data?.brands.length ?? 0) === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No brands yet. Create your first brand to switch context between clients or projects.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data!.brands.map((b: any) => {
            const isActive = data!.activeBrandId === b.id;
            return (
              <Card key={b.id} className={isActive ? "border-primary" : ""}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full border" style={{ background: b.brand_color || "#10B981" }} />
                    <CardTitle className="text-base">{b.name}</CardTitle>
                  </div>
                  {isActive && <Badge className="gap-1"><Star className="h-3 w-3" /> Active</Badge>}
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {b.business_name && <p><span className="text-muted-foreground">Business:</span> {b.business_name}</p>}
                  {b.industry && <p><span className="text-muted-foreground">Industry:</span> {b.industry}</p>}
                  {b.tone && <p><span className="text-muted-foreground">Tone:</span> {b.tone}</p>}
                  {b.target_audience && <p><span className="text-muted-foreground">Audience:</span> {b.target_audience}</p>}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {!isActive && <Button size="sm" variant="outline" onClick={() => activate(b.id)}>Set active</Button>}
                    {isActive && <Button size="sm" variant="ghost" onClick={() => activate(null)}>Deactivate</Button>}
                    <Button size="sm" variant="ghost" className="gap-1" onClick={() => setEditing({
                      id: b.id, name: b.name, business_name: b.business_name ?? "", industry: b.industry ?? "",
                      tone: b.tone ?? "", target_audience: b.target_audience ?? "", brand_color: b.brand_color ?? "#10B981",
                    })}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                    <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={() => remove(b.id)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
