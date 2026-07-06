import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { LanguageSelector } from "@/components/LanguageSelector";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const links = [
    { label: t("nav.templates"), to: "/templates" as const },
    { label: t("nav.pricing"), to: "/pricing" as const },
    { label: t("nav.blog"), to: "/blog" as const },
    { label: t("nav.about"), to: "/about" as const },
    { label: t("nav.contact"), to: "/contact" as const },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-primary shadow-elegant">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="truncate text-lg font-bold tracking-tight">ContentNaija<span className="text-primary"> AI</span></span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-muted-foreground transition hover:text-foreground">{l.label}</Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSelector />
          <Link to="/auth"><Button variant="ghost" size="sm">{t("nav.login")}</Button></Link>
          <Link to="/auth" search={{ mode: "register" }}>
            <Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">{t("nav.getStarted")}</Button>
          </Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <LanguageSelector compact />
          <button onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" className="p-1">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="py-2 text-sm font-medium">{l.label}</Link>
            ))}
            <Link to="/auth" onClick={() => setOpen(false)}><Button variant="outline" className="w-full">{t("nav.login")}</Button></Link>
            <Link to="/auth" search={{ mode: "register" }} onClick={() => setOpen(false)}>
              <Button className="w-full bg-gradient-primary text-primary-foreground">{t("nav.getStarted")}</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
