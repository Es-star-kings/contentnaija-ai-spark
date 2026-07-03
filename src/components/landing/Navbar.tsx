import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Templates", to: "/templates" as const },
    { label: "Pricing", to: "/pricing" as const },
    { label: "Blog", to: "/blog" as const },
    { label: "About", to: "/about" as const },
    { label: "Contact", to: "/contact" as const },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-elegant">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="text-lg font-bold tracking-tight">ContentNaija<span className="text-primary"> AI</span></span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-muted-foreground transition hover:text-foreground">{l.label}</Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/auth"><Button variant="ghost" size="sm">Login</Button></Link>
          <Link to="/auth" search={{ mode: "register" }}>
            <Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">Get Started</Button>
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-2 text-sm font-medium">{l.label}</a>
            ))}
            <Link to="/auth" onClick={() => setOpen(false)}><Button variant="outline" className="w-full">Login</Button></Link>
            <Link to="/auth" search={{ mode: "register" }} onClick={() => setOpen(false)}>
              <Button className="w-full bg-gradient-primary text-primary-foreground">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
