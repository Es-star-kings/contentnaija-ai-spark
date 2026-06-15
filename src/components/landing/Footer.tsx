import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold">ContentNaija AI</span>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} ContentNaija AI. Made with 💚 in Nigeria.</p>
      </div>
    </footer>
  );
}
