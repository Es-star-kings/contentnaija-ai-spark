import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function GeneratorShell({
  title,
  description,
  form,
  output,
  remaining,
}: {
  title: string;
  description: string;
  form: ReactNode;
  output: ReactNode;
  remaining?: number | null;
}) {
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <Link to="/generate" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> All generators
      </Link>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {typeof remaining === "number" && (
          <span className="hidden shrink-0 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground sm:inline-block">
            {remaining} left this month
          </span>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">{form}</div>
        <div className="space-y-4">{output}</div>
      </div>
    </div>
  );
}

export function GeneratorEmpty({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="grid h-full min-h-[280px] place-items-center rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <p className="mt-4 font-medium">{message}</p>
        <p className="mt-1 text-sm text-muted-foreground">Fill in the brief and hit generate.</p>
      </div>
    </div>
  );
}

export function GeneratorSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-2 rounded-2xl border border-border bg-card p-5">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-4/5 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
