import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-20%,oklch(0.85_0.15_160/0.25),transparent_60%)]" />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t("hero.badge")}
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("hero.title1")}{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">{t("hero.title2")}</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {t("hero.subtitle")}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/auth" search={{ mode: "register" }}>
              <Button size="lg" className="h-12 bg-gradient-primary px-7 text-base text-primary-foreground shadow-elegant hover:opacity-95">
                {t("hero.cta")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="h-12 px-7 text-base">{t("hero.secondary")}</Button>
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary" /> {t("hero.free")}</span>
            <span>•</span>
            <span>{t("hero.nocard")}</span>
          </div>
        </div>

        {/* Visual mock */}
        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="absolute -inset-x-8 -inset-y-4 -z-10 bg-gradient-primary opacity-20 blur-3xl" />
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-muted-foreground">contentnaija.ai / generate</span>
            </div>
            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Brief</div>
                <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
                  <p><span className="font-semibold">Business:</span> Lagos jollof spot 🍚</p>
                  <p><span className="font-semibold">Goal:</span> Promote Friday party packs</p>
                  <p><span className="font-semibold">Tone:</span> Playful, energetic</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary">AI Caption</div>
                <div className="rounded-xl bg-gradient-primary p-[1px]">
                  <div className="rounded-[calc(theme(borderRadius.xl)-1px)] bg-card p-4 text-sm">
                    <p className="leading-relaxed">No be every Friday you go chop jollof wey go make you forget your password 😮‍💨🔥 Party packs don land — link in bio, no dulling.</p>
                    <p className="mt-3 text-xs text-primary">#LagosFoodie #JollofWars #NaijaEats #FridayMood</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
