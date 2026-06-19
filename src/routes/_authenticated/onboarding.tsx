import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeOnboarding, skipOnboarding } from "@/lib/generators.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, ArrowRight, ArrowLeft, Check, Palette, Building2, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — ContentNaija AI" }] }),
  component: OnboardingPage,
});

const TONES = ["Friendly", "Professional", "Playful", "Bold", "Inspirational", "Witty", "Luxury"];
const INDUSTRIES = [
  "Fashion & Apparel",
  "Food & Restaurant",
  "Beauty & Skincare",
  "Tech & Software",
  "Health & Fitness",
  "Education",
  "Real Estate",
  "Finance",
  "E-commerce",
  "Entertainment",
  "Travel",
  "Other",
];
const PLATFORMS = ["Instagram", "WhatsApp", "Facebook", "TikTok", "Twitter/X", "LinkedIn"];
const SWATCHES = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#0F172A"];

type FormState = {
  full_name: string;
  business_name: string;
  industry: string;
  target_audience: string;
  tone: string;
  brand_color: string;
  preferred_platform: string;
  language: string;
};

function OnboardingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const complete = useServerFn(completeOnboarding);
  const skip = useServerFn(skipOnboarding);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    full_name: "",
    business_name: "",
    industry: "",
    target_audience: "",
    tone: "Friendly",
    brand_color: "#10B981",
    preferred_platform: "Instagram",
    language: "English",
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const completeMut = useMutation({
    mutationFn: () => complete({ data: form }),
    onSuccess: async () => {
      await qc.invalidateQueries();
      toast.success("You're all set! Let's create something.");
      navigate({ to: "/dashboard" });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not finish setup"),
  });

  const skipMut = useMutation({
    mutationFn: () => skip({}),
    onSuccess: async () => {
      await qc.invalidateQueries();
      navigate({ to: "/dashboard" });
    },
  });

  const steps = [
    {
      title: "Welcome to ContentNaija AI",
      subtitle: "Let's set up your brand so we can write content that actually sounds like you.",
      icon: Sparkles,
      valid: () => form.full_name.trim().length > 0,
      body: (
        <div className="space-y-2">
          <Label htmlFor="full_name">What should we call you?</Label>
          <Input
            id="full_name"
            placeholder="e.g. Chidera Okafor"
            value={form.full_name}
            maxLength={120}
            onChange={(e) => set("full_name", e.target.value)}
            autoFocus
          />
        </div>
      ),
    },
    {
      title: "Your business",
      subtitle: "Tell us about the brand you're creating content for.",
      icon: Building2,
      valid: () => form.business_name.trim().length > 0 && form.industry.length > 0,
      body: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_name">Business name</Label>
            <Input
              id="business_name"
              placeholder="e.g. Naija Threads"
              value={form.business_name}
              maxLength={120}
              onChange={(e) => set("business_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Select value={form.industry} onValueChange={(v) => set("industry", v)}>
              <SelectTrigger><SelectValue placeholder="Pick an industry" /></SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      title: "Your audience & voice",
      subtitle: "Who are you talking to, and how should we sound?",
      icon: User,
      valid: () => form.target_audience.trim().length > 0 && form.tone.length > 0,
      body: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="audience">Target audience</Label>
            <Textarea
              id="audience"
              placeholder="e.g. Young Nigerian professionals, 22–35, fashion-conscious, Lagos-based"
              value={form.target_audience}
              maxLength={200}
              rows={3}
              onChange={(e) => set("target_audience", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Brand tone</Label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("tone", t)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    form.tone === t
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Brand look & preferences",
      subtitle: "Optional polish — you can change these any time.",
      icon: Palette,
      valid: () => true,
      body: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Brand color</Label>
            <div className="flex flex-wrap items-center gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("brand_color", c)}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    form.brand_color === c ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ background: c }}
                  aria-label={`Choose ${c}`}
                />
              ))}
              <Input
                type="color"
                value={form.brand_color}
                onChange={(e) => set("brand_color", e.target.value)}
                className="h-8 w-12 cursor-pointer p-1"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Preferred platform</Label>
              <Select value={form.preferred_platform} onValueChange={(v) => set("preferred_platform", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={form.language} onValueChange={(v) => set("language", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Pidgin">Pidgin</SelectItem>
                  <SelectItem value="Yoruba">Yoruba</SelectItem>
                  <SelectItem value="Igbo">Igbo</SelectItem>
                  <SelectItem value="Hausa">Hausa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;
  const canNext = current.valid();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-2xl flex-col px-4 py-8 sm:py-12">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition ${
              i <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary">
            <Icon className="h-5 w-5 text-primary-foreground" />
          </span>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Step {step + 1} of {steps.length}
            </p>
            <h1 className="text-xl font-bold sm:text-2xl">{current.title}</h1>
          </div>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">{current.subtitle}</p>

        <div>{current.body}</div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => (step === 0 ? skipMut.mutate() : setStep(step - 1))}
          disabled={completeMut.isPending || skipMut.isPending}
        >
          {step === 0 ? (
            "Skip for now"
          ) : (
            <>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </>
          )}
        </Button>
        {isLast ? (
          <Button
            onClick={() => completeMut.mutate()}
            disabled={!canNext || completeMut.isPending}
          >
            {completeMut.isPending ? "Setting up..." : (<>Finish <Check className="ml-1 h-4 w-4" /></>)}
          </Button>
        ) : (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
            Continue <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
