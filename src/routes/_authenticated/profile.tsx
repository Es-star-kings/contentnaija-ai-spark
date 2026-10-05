import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProfile, updateProfile, listBrands } from "@/lib/generators.functions";
import { AlertCircle, Building2, CheckCircle2, Loader2, Save, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — ContentNaija AI" },
      { name: "description", content: "Manage your account and business preferences that personalise every AI generation." },
    ],
  }),
  component: ProfilePage,
});

const TONES = ["Friendly", "Formal", "Casual", "Luxury", "Youthful", "Corporate", "Humorous", "Playful", "Professional", "Bold", "Warm", "Inspirational"];
const PLATFORMS = ["Instagram", "WhatsApp", "Facebook", "TikTok", "X (Twitter)"];
const LANGUAGES = ["English", "Pidgin", "Yoruba-mix", "Igbo-mix", "Hausa-mix"];

const LIMITS = { full_name: 120, business_name: 120, industry: 120, target_audience: 200 } as const;

type Form = {
  full_name: string;
  business_name: string;
  industry: string;
  tone: string;
  target_audience: string;
  brand_color: string;
  preferred_platform: string;
  language: string;
};

const EMPTY: Form = {
  full_name: "", business_name: "", industry: "", tone: "Friendly", target_audience: "",
  brand_color: "#10B981", preferred_platform: "Instagram", language: "English",
};

function withOption(list: string[], v: string) {
  return v && !list.includes(v) ? [v, ...list] : list;
}

function ProfilePage() {
  const getFn = useServerFn(getProfile);
  const updateFn = useServerFn(updateProfile);
  const brandsFn = useServerFn(listBrands);
  const qc = useQueryClient();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getFn() });
  const brandsQ = useQuery({ queryKey: ["brands"], queryFn: () => brandsFn() });
  const profile = profileQ.data;

  const initial = useMemo<Form>(() => {
    if (!profile) return EMPTY;
    return {
      full_name: profile.full_name ?? "",
      business_name: profile.business_name ?? "",
      industry: profile.industry ?? "",
      tone: profile.tone ?? "Friendly",
      target_audience: profile.target_audience ?? "",
      brand_color: profile.brand_color ?? "#10B981",
      preferred_platform: profile.preferred_platform ?? "Instagram",
      language: profile.language ?? "English",
    };
  }, [profile]);

  const [form, setForm] = useState<Form>(EMPTY);
  useEffect(() => setForm(initial), [initial]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const colorValid = /^#?[0-9a-fA-F]{6}$/.test(form.brand_color);
  const overLimit = (Object.keys(LIMITS) as (keyof typeof LIMITS)[]).some((k) => form[k].length > LIMITS[k]);

  const mutation = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          ...form,
          full_name: form.full_name.trim() || null,
          business_name: form.business_name.trim() || null,
          industry: form.industry.trim() || null,
          target_audience: form.target_audience.trim() || null,
        },
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved — your next generations will use it");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save your profile"),
  });

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mutation.isPending || !dirty || !colorValid || overLimit) return;
    mutation.mutate();
  }

  const activeBrand = brandsQ.data?.brands.find((b) => b.id === brandsQ.data?.activeBrandId);
  const initials = (form.full_name || profile?.email || "?").trim().slice(0, 1).toUpperCase();

  if (profileQ.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (profileQ.isError) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <p className="mt-3 font-semibold">We couldn't load your profile</p>
          <Button variant="outline" className="mt-4" onClick={() => profileQ.refetch()}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-60 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />
      <form onSubmit={submit} className="relative mx-auto max-w-4xl space-y-6 p-4 pb-28 sm:p-8 sm:pb-28">
        <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card/80 p-6 shadow-card backdrop-blur sm:flex-row sm:items-center">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-2xl font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold sm:text-3xl">{form.full_name || "Your profile"}</h1>
            <p className="truncate text-sm text-muted-foreground">{profile?.email}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Personalises every generation
          </div>
        </header>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card transition hover:border-primary/30">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">Account</h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="full_name" count={form.full_name.length} max={LIMITS.full_name}>
              <Input id="full_name" value={form.full_name} maxLength={LIMITS.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Adaeze Okafor" />
            </Field>
            <Field label="Email" htmlFor="email" hint={<>Change it in <Link to="/settings" className="text-primary underline-offset-2 hover:underline">Settings → Account security</Link></>}>
              <Input id="email" value={profile?.email ?? ""} readOnly disabled />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card transition hover:border-primary/30">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">Business & AI personalisation</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">The AI uses these details automatically in every generator.</p>
          {activeBrand && (
            <p className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Active brand <span className="font-medium text-foreground">{activeBrand.name}</span> is selected — its details take priority, and anything it leaves blank comes from here.{" "}
              <Link to="/brands" className="text-primary hover:underline">Manage brands</Link>
            </p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Business name" htmlFor="business_name" count={form.business_name.length} max={LIMITS.business_name}>
              <Input id="business_name" value={form.business_name} maxLength={LIMITS.business_name} onChange={(e) => set("business_name", e.target.value)} placeholder="Mama Cee Foods" />
            </Field>
            <Field label="Industry" htmlFor="industry" count={form.industry.length} max={LIMITS.industry}>
              <Input id="industry" value={form.industry} maxLength={LIMITS.industry} onChange={(e) => set("industry", e.target.value)} placeholder="Food & beverage" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Target audience" htmlFor="target_audience" count={form.target_audience.length} max={LIMITS.target_audience}>
                <Textarea id="target_audience" rows={2} value={form.target_audience} maxLength={LIMITS.target_audience} onChange={(e) => set("target_audience", e.target.value)} placeholder="Young Lagos professionals who love fresh local meals" />
              </Field>
            </div>
            <Field label="Preferred tone">
              <Select value={form.tone} onValueChange={(v) => set("tone", v)}>
                <SelectTrigger aria-label="Preferred tone"><SelectValue /></SelectTrigger>
                <SelectContent>{withOption(TONES, form.tone).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Preferred platform">
              <Select value={form.preferred_platform} onValueChange={(v) => set("preferred_platform", v)}>
                <SelectTrigger aria-label="Preferred platform"><SelectValue /></SelectTrigger>
                <SelectContent>{withOption(PLATFORMS, form.preferred_platform).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Language style">
              <Select value={form.language} onValueChange={(v) => set("language", v)}>
                <SelectTrigger aria-label="Language style"><SelectValue /></SelectTrigger>
                <SelectContent>{withOption(LANGUAGES, form.language).map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Brand color" htmlFor="brand_color" error={colorValid ? undefined : "Use a hex color like #10B981"}>
              <div className="flex items-center gap-2">
                <input type="color" aria-label="Pick brand color" value={colorValid ? (form.brand_color.startsWith("#") ? form.brand_color : `#${form.brand_color}`) : "#10B981"} onChange={(e) => set("brand_color", e.target.value)} className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent" />
                <Input id="brand_color" value={form.brand_color} maxLength={7} onChange={(e) => set("brand_color", e.target.value)} />
              </div>
            </Field>
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur md:left-64">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {mutation.isPending ? <>Saving…</> : dirty ? <>Unsaved changes</> : <><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> All changes saved</>}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" disabled={!dirty || mutation.isPending} onClick={() => setForm(initial)}>Reset</Button>
              <Button type="submit" className="bg-gradient-primary text-primary-foreground" disabled={!dirty || !colorValid || overLimit || mutation.isPending}>
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save profile
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, htmlFor, count, max, hint, error, children }: {
  label: string; htmlFor?: string; count?: number; max?: number; hint?: React.ReactNode; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label htmlFor={htmlFor}>{label}</Label>
        {max !== undefined && <span className={`text-[11px] ${count! > max * 0.9 ? "text-destructive" : "text-muted-foreground"}`}>{count}/{max}</span>}
      </div>
      <div className="mt-1.5">{children}</div>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
