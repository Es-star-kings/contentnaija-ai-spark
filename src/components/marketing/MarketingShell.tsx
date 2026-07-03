import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export function CtaStrip({ headline = "Try it free — 20 generations a month, no card." }: { headline?: string }) {
  return (
    <section className="border-t border-border bg-gradient-dark py-14 text-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 text-center sm:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5" /> Built for Nigerian brands
        </span>
        <h2 className="text-2xl font-bold sm:text-3xl">{headline}</h2>
        <Link to="/auth" search={{ mode: "register" }}>
          <Button size="lg" className="bg-white text-neutral-900 hover:bg-white/90">
            Start generating <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
