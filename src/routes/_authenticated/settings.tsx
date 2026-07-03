import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProfile, updateProfile } from "@/lib/generators.functions";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Palette, ShieldCheck, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — ContentNaija AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const getFn = useServerFn(getProfile);
  const updateFn = useServerFn(updateProfile);
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: () => getFn() });

  const [form, setForm] = useState({
    full_name: "",
    business_name: "",
    industry: "",
    tone: "Friendly",
    target_audience: "",
    brand_color: "#10B981",
    preferred_platform: "Instagram",
    language: "English",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        business_name: profile.business_name ?? "",
        industry: profile.industry ?? "",
        tone: profile.tone ?? "Friendly",
        target_audience: profile.target_audience ?? "",
        brand_color: profile.brand_color ?? "#10B981",
        preferred_platform: profile.preferred_platform ?? "Instagram",
        language: profile.language ?? "English",
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () => updateFn({ data: form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Settings saved");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to save"),
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  if (isLoading) {
    return <div className="mx-auto max-w-3xl p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your brand kit powers every generator with your unique voice.</p>

      <form onSubmit={submit} className="mt-8 space-y-8">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">How we address you.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Full name</Label>
              <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={profile?.email ?? ""} disabled className="mt-1.5" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">Brand kit</h2>
          </div>
          <p className="text-sm text-muted-foreground">Used as context in every AI generation.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Business name</Label>
              <Input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} placeholder="Mama Cee Foods" className="mt-1.5" />
            </div>
            <div>
              <Label>Industry</Label>
              <Input value={form.industry} onChange={(e) => set("industry", e.target.value)} placeholder="Food & beverage" className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label>Target audience</Label>
              <Textarea value={form.target_audience} onChange={(e) => set("target_audience", e.target.value)} rows={2} placeholder="Young Lagos professionals who love fresh local meals" className="mt-1.5" />
            </div>
            <div>
              <Label>Brand tone</Label>
              <Select value={form.tone} onValueChange={(v) => set("tone", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Friendly", "Playful", "Professional", "Bold", "Luxury", "Warm", "Inspirational"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preferred platform</Label>
              <Select value={form.preferred_platform} onValueChange={(v) => set("preferred_platform", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Instagram", "WhatsApp", "Facebook", "TikTok", "X (Twitter)"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Brand color</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="color"
                  value={form.brand_color}
                  onChange={(e) => set("brand_color", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent"
                  aria-label="Brand color"
                />
                <Input value={form.brand_color} onChange={(e) => set("brand_color", e.target.value)} className="flex-1" />
              </div>
            </div>
            <div>
              <Label>Language</Label>
              <Select value={form.language} onValueChange={(v) => set("language", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["English", "Pidgin", "Yoruba-mix", "Igbo-mix", "Hausa-mix"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" className="bg-gradient-primary text-primary-foreground" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save settings
          </Button>
        </div>
      </form>

      <AccountSecuritySection currentEmail={profile?.email ?? ""} />
    </div>
  );
}

function AccountSecuritySection({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setEmailBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      toast.success("Confirmation sent — check both inboxes to complete the change");
      setNewEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update email");
    } finally { setEmailBusy(false); }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords don't match");
    setPwBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated");
      setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally { setPwBusy(false); }
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Account security</h2>
        </div>
        <p className="text-sm text-muted-foreground">Update the email and password on your account.</p>

        <form onSubmit={changeEmail} className="mt-6 space-y-3">
          <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Change email</Label>
          <p className="text-xs text-muted-foreground">Current: <span className="font-medium text-foreground">{currentEmail}</span></p>
          <div className="flex flex-wrap gap-2">
            <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@business.ng" className="max-w-xs" />
            <Button type="submit" variant="outline" disabled={emailBusy || !newEmail.trim()}>
              {emailBusy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />} Send confirmation
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">You'll get confirmation emails at both the old and new addresses.</p>
        </form>

        <form onSubmit={changePassword} className="mt-8 space-y-3">
          <Label className="flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" /> Change password</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" minLength={6} />
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" minLength={6} />
          </div>
          <Button type="submit" variant="outline" disabled={pwBusy || !newPassword}>
            {pwBusy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />} Update password
          </Button>
        </form>
      </section>
    </div>
  );
}
