import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { joinFeatureWaitlist } from "@/lib/generators.functions";
import { ArrowLeft, ImageIcon, Rocket, Bell, Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/generate/image")({
  head: () => ({ meta: [{ title: "AI Image Generator — Coming Soon | ContentNaija AI" }] }),
  component: ImageComingSoon,
});

const CAPABILITIES = [
  "AI Product Images",
  "Social Media Flyers",
  "Marketing Posters",
  "Instagram Creatives",
  "Facebook Ad Images",
  "WhatsApp Status Designs",
];

function ImageComingSoon() {
  const fn = useServerFn(joinFeatureWaitlist);
  const [joined, setJoined] = useState(false);
  const notify = useMutation({
    mutationFn: () => fn({ data: { feature_name: "ai_image_generator" } }),
    onSuccess: (r) => {
      setJoined(true);
      toast.success(r.already ? "You're already on the list!" : "You're on the waitlist 🎉");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not join"),
  });

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">
      <Link to="/generate" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> All generators
      </Link>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="relative bg-gradient-primary p-8 text-primary-foreground sm:p-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Rocket className="h-3.5 w-3.5" /> Coming Soon
          </span>
          <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur">
              <ImageIcon className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-4xl">AI Image Generator</h1>
              <p className="mt-2 max-w-xl text-sm text-white/90 sm:text-base">
                We're building a professional-grade image studio tuned for Nigerian brands — flyers,
                product shots, ads and social creatives in one click.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[1fr_320px]">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" /> What's coming
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {CAPABILITIES.map((c) => (
                <li key={c} className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-xs text-muted-foreground">
              This feature is currently under development. Join the waiting list and we'll email you
              the moment it goes live.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-5">
            <p className="text-sm font-medium">Be the first to try it</p>
            <Button disabled className="h-11 cursor-not-allowed opacity-70">
              <Rocket className="mr-2 h-4 w-4" /> Coming Soon
            </Button>
            <Button
              onClick={() => notify.mutate()}
              disabled={notify.isPending || joined}
              variant={joined ? "outline" : "default"}
              className="h-11 bg-gradient-primary text-primary-foreground disabled:bg-gradient-primary disabled:opacity-90"
            >
              {notify.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding you…</>
              ) : joined ? (
                <><Check className="mr-2 h-4 w-4" /> On the waitlist</>
              ) : (
                <><Bell className="mr-2 h-4 w-4" /> Notify Me</>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              In the meantime, try our WhatsApp Marketing Suite and Instagram caption generator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
