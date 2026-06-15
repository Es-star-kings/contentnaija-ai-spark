const items = [
  { name: "Adaeze O.", role: "Owner, Adaeze's Kitchen, Lagos", quote: "I went from struggling for caption ideas to posting twice a day. Engagement is up 3x." },
  { name: "Tunde A.", role: "Social Media Manager", quote: "The WhatsApp campaign generator alone saves me 10 hours a week. Worth every Naira." },
  { name: "Ifeoma N.", role: "Founder, Ifeoma Beauty", quote: "Finally an AI that sounds Nigerian. Captions actually convert to DMs and orders." },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Loved by founders</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">From Lagos to Lekki to Lugbe</h2>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {items.map((t) => (
            <figure key={t.name} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <blockquote className="text-base leading-relaxed">"{t.quote}"</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary font-semibold text-primary-foreground">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
