import { Instagram, MessageCircle, Calendar, Palette, Sparkles, BarChart3 } from "lucide-react";

const features = [
  { icon: Instagram, title: "Instagram Captions", desc: "Multiple variations with hashtags, emojis and Nigerian context — copy-ready." },
  { icon: MessageCircle, title: "WhatsApp Campaigns", desc: "Short, medium and long broadcast messages that actually convert." },
  { icon: Calendar, title: "30-Day Calendars", desc: "Full monthly content plans with daily captions and posting tips." },
  { icon: Palette, title: "Flyer Copy", desc: "Headlines, offer text and CTAs ready to drop into Canva." },
  { icon: Sparkles, title: "Brand Brain", desc: "AI learns your tone, audience and colors for consistent voice." },
  { icon: BarChart3, title: "Analytics", desc: "Track content output, top performers and monthly growth." },
];

export function Features() {
  return (
    <section id="features" className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Everything you need</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">One platform. Every content type.</h2>
          <p className="mt-4 text-muted-foreground">From your first caption to a full quarterly calendar — built for the Nigerian market.</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-elegant">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground transition group-hover:bg-gradient-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
