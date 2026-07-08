import { createFileRoute, Link } from "@tanstack/react-router";
import { Instagram, MessageCircle, FileImage, CalendarDays, ArrowRight, ImageIcon, Rocket } from "lucide-react";


export const Route = createFileRoute("/_authenticated/generate/")({
  head: () => ({ meta: [{ title: "Generators — ContentNaija AI" }] }),
  component: GenerateHub,
});

const tools = [
  { to: "/generate/instagram", title: "Instagram Caption", desc: "High-converting captions with Naija-flavoured hashtags.", icon: Instagram },
  { to: "/whatsapp", title: "WhatsApp Marketing Suite", desc: "Broadcasts, Status, follow-ups, promos & holiday campaigns.", icon: MessageCircle, highlight: true },
  { to: "/generate/whatsapp", title: "WhatsApp Campaign (classic)", desc: "The original 3-angle campaign writer.", icon: MessageCircle },
  { to: "/generate/flyer", title: "Flyer Copy", desc: "Headline, bullets and CTA copy ready for your designer.", icon: FileImage },
  { to: "/generate/calendar", title: "Content Calendar", desc: "Plan a full week of posts in under 60 seconds.", icon: CalendarDays },
  { to: "/generate/image", title: "AI Image", desc: "Product, flyer & social images.", icon: ImageIcon, comingSoon: true },
] as const;

function GenerateHub() {
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">What do you want to create?</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick a generator to get started.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="group relative rounded-2xl border border-border bg-card p-6 shadow-card transition hover:border-primary/40 hover:shadow-elegant"
          >
            {"comingSoon" in t && t.comingSoon && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-primary px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
                <Rocket className="h-3 w-3" /> Soon
              </span>
            )}
            {"highlight" in t && t.highlight && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                New
              </span>
            )}
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                <t.icon className="h-5 w-5" />
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">{t.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
