import { createFileRoute, Link } from "@tanstack/react-router";
import { Instagram, MessageCircle, FileImage, CalendarDays, ArrowRight, ImageIcon } from "lucide-react";


export const Route = createFileRoute("/_authenticated/generate/")({
  head: () => ({ meta: [{ title: "Generators — ContentNaija AI" }] }),
  component: GenerateHub,
});

const tools = [
  {
    to: "/generate/instagram",
    title: "Instagram Caption",
    desc: "High-converting captions with Naija-flavoured hashtags.",
    icon: Instagram,
  },
  {
    to: "/generate/whatsapp",
    title: "WhatsApp Campaign",
    desc: "Broadcast messages that get DMs, calls and orders.",
    icon: MessageCircle,
  },
  {
    to: "/generate/flyer",
    title: "Flyer Copy",
    desc: "Headline, bullets and CTA copy ready for your designer.",
    icon: FileImage,
  },
  {
    to: "/generate/calendar",
    title: "Content Calendar",
    desc: "Plan a full week of posts in under 60 seconds.",
    icon: CalendarDays,
  },
  {
    to: "/generate/image",
    title: "AI Image",
    desc: "Generate flyer, product and social images for your brand.",
    icon: ImageIcon,
  },
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
            className="group rounded-2xl border border-border bg-card p-6 shadow-card transition hover:border-primary/40 hover:shadow-elegant"
          >
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
