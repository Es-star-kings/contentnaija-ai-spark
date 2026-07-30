import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { verifyPaystackPayment } from "@/lib/generators.functions";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";

export const Route = createFileRoute("/payment/callback")({
  component: PaymentCallbackPage,
});

function PaymentCallbackPage() {
  const navigate = useNavigate();
  const verifyPayment = useServerFn(verifyPaystackPayment);

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your payment...");
  const [planName, setPlanName] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const title = useMemo(() => {
    if (status === "success") return "Payment successful";
    if (status === "error") return "Payment verification failed";
    return "Verifying payment";
  }, [status]);

  useEffect(() => {
    const verify = async () => {
      const params = new URLSearchParams(window.location.search);
      const referenceValue = params.get("reference");
      setReference(referenceValue);

      if (!referenceValue) {
        setStatus("error");
        setMessage("No payment reference was found. Please try the upgrade again.");
        return;
      }

      try {
        const result = await verifyPayment({
          data: { reference: referenceValue },
        });

        if (result.success) {
          setStatus("success");
          setPlanName(result.tier === "agency" ? "Agency" : "Pro");
          setMessage(
            result.alreadyProcessed
              ? `Your ${result.tier === "agency" ? "Agency" : "Pro"} plan is already active.`
              : `Your ${result.tier === "agency" ? "Agency" : "Pro"} plan is now active.`,
          );
        }
      } catch (error) {
        console.error(error);
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "We could not verify your payment. Please try again.",
        );
      }
    };

    verify();
  }, [navigate, verifyPayment]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-card">
        {status === "verifying" && (
          <>
            <div className="mb-5 flex justify-center">
              <div className="rounded-full bg-accent p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mb-5 flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{message}</p>
            {planName && (
              <div className="mt-5 rounded-2xl border border-border bg-background/80 p-4 text-left">
                <p className="text-sm font-medium">Activated plan</p>
                <p className="mt-1 text-lg font-semibold">{planName}</p>
                {reference && <p className="mt-2 text-xs text-muted-foreground">Reference: {reference}</p>}
              </div>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/dashboard">
                <Button className="w-full bg-gradient-primary text-primary-foreground">Go to dashboard</Button>
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-5 flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <CircleAlert className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{message}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/pricing">
                <Button variant="default" className="w-full">Retry payment</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" className="w-full">Return to dashboard</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}