import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Megaphone, Radio, Reply, Tag, PartyPopper, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/whatsapp/")({
  head: () => ({
    meta: [
      { title: "WhatsApp Marketing Suite — ContentNaija AI" },
      { name: "description", content: "Broadcast, Status, Follow-up, Promotional and Holiday campaign generators tuned for Nigerian businesses on WhatsApp." },
    ],
  }),
  component: WAHub,
});

const tools = [
  { to: "/whatsapp/broadcast", title: "Broadcast Generator", desc: "Engaging promotional broadcast messages that get replies.", icon: Radio },
  { to: "/whatsapp/status", title: "Status Generator", desc: "High-converting WhatsApp Status — promo, story, tips & more.", icon: Megaphone },
  { to: "/whatsapp/followup", title: "Follow-up Messages", desc: "No-reply, payment reminders, delivery updates, feedback.", icon: Reply },
  { to: "/whatsapp/promo", title: "Promotional Messages", desc: "Launches, flash sales, referral programs, giveaways.", icon: Tag },
  { to: "/whatsapp/holiday", title: "Holiday Campaign", desc: "Full multi-channel campaign for every major Nigerian holiday.", icon: PartyPopper },
] as const;

function WAHub() {
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <header className="mb-8 flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
          <MessageCircle className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">WhatsApp Marketing Suite</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything you need to sell more on WhatsApp — written for Nigerian businesses.
          </p>
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="group rounded-2xl border border-border bg-card p-6 shadow-card transition hover:border-primary/40 hover:shadow-elegant"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-primary">
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
