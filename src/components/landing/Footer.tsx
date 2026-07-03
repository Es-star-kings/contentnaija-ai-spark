import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function Footer() {
  const cols = [
    {
      title: "Product",
      links: [
        { label: "Templates", to: "/templates" as const },
        { label: "Pricing", to: "/pricing" as const },
      ],
    },
    {
      title: "For",
      links: [
        { label: "Restaurants", to: "/for/$industry" as const, params: { industry: "restaurants" } },
        { label: "Salons", to: "/for/$industry" as const, params: { industry: "salons" } },
        { label: "Fashion", to: "/for/$industry" as const, params: { industry: "fashion" } },
        { label: "Real estate", to: "/for/$industry" as const, params: { industry: "real-estate" } },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Blog", to: "/blog" as const },
        { label: "About", to: "/about" as const },
        { label: "Contact", to: "/contact" as const },
      ],
    },
  ];
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </span>
              <span className="text-sm font-semibold">ContentNaija AI</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">AI content that sounds Nigerian — for the brands shaping our economy.</p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{col.title}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((l: any) => (
                  <li key={l.label}>
                    <Link to={l.to} params={l.params} className="text-muted-foreground hover:text-foreground">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 text-xs text-muted-foreground">© {new Date().getFullYear()} ContentNaija AI. Made with 💚 in Nigeria.</p>
      </div>
    </footer>
  );
}
