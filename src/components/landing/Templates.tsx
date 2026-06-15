const templates = [
  { tag: "Restaurant", title: "Friday Jollof Drop", preview: "Weekend dey here! Our party pack don land — link in bio." },
  { tag: "Fashion", title: "Owambe Collection Launch", preview: "Aso-ebi season just got real. Pre-orders open till Sunday 💃" },
  { tag: "Beauty", title: "Glow-up Tuesday", preview: "Soft girl era starts at ₦15k. Slide into our DMs 🌸" },
  { tag: "E-commerce", title: "Black Friday Teaser", preview: "Save the date — 70% off, one day only. Get on the list." },
  { tag: "Agency", title: "Client Win Carousel", preview: "How we grew @brand from 2k to 40k followers in 90 days." },
  { tag: "Freelancer", title: "Service Launch", preview: "Booking 5 brand voice projects this month. First come, first served." },
];

export function Templates() {
  return (
    <section id="templates" className="border-t border-border bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Templates</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Battle-tested for Naija brands</h2>
          <p className="mt-4 text-muted-foreground">Start from a template, tweak in seconds, ship today.</p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.title} className="rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-elegant">
              <span className="inline-flex rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">{t.tag}</span>
              <h3 className="mt-4 text-lg font-semibold">{t.title}</h3>
              <p className="mt-2 text-sm italic text-muted-foreground">"{t.preview}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
