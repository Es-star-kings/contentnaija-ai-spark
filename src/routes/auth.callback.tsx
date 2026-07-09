import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Signing you in — ContentNaija AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallback,
});

function isSafeRelativePath(p: string | null | undefined): p is string {
  return !!p && p.startsWith("/") && !p.startsWith("//");
}

function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Finishing sign in…");

  useEffect(() => {
    let cancelled = false;

    async function resolveDestination(): Promise<string> {
      const stored = typeof window !== "undefined" ? sessionStorage.getItem("post_login_redirect") : null;
      if (isSafeRelativePath(stored)) {
        sessionStorage.removeItem("post_login_redirect");
        return stored;
      }
      const pendingInvite = typeof window !== "undefined" ? sessionStorage.getItem("pending_invite") : null;
      if (pendingInvite) return `/invite/${pendingInvite}`;
      return "/dashboard";
    }

    async function go() {
      // Give supabase-js up to ~10s to hydrate the session that lovable OAuth just set.
      for (let i = 0; i < 20 && !cancelled; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const dest = await resolveDestination();
          toast.success("Signed in");
          navigate({ to: dest, replace: true });
          return;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      if (cancelled) return;
      setMessage("We couldn't complete sign in. Please try again.");
      toast.error("Sign in didn't complete — please try again");
      setTimeout(() => navigate({ to: "/auth", replace: true }), 1500);
    }

    void go();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-muted/30 p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </span>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
