import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { verifyPaystackPayment } from "@/lib/generators.functions";

export const Route = createFileRoute("/payment/callback")({
  component: PaymentCallbackPage,
});

function PaymentCallbackPage() {
  const navigate = useNavigate();
  const verifyPayment = useServerFn(verifyPaystackPayment);

  const [status, setStatus] = useState<
    "verifying" | "success" | "error"
  >("verifying");

  const [message, setMessage] = useState(
    "Verifying your payment...",
  );

  useEffect(() => {
    const verify = async () => {
      const params = new URLSearchParams(window.location.search);
      const reference = params.get("reference");

      if (!reference) {
        setStatus("error");
        setMessage("No payment reference was found.");
        return;
      }

      try {
        const result = await verifyPayment({
          data: { reference },
        });

        if (result.success) {
          setStatus("success");
          setMessage(
            `Payment successful! Your ${result.tier.toUpperCase()} plan is now active.`,
          );

          setTimeout(() => {
            navigate({ to: "/dashboard" });
          }, 2500);
        }
      } catch (error) {
        console.error(error);

        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to verify payment.",
        );
      }
    };

    verify();
  }, [navigate, verifyPayment]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {status === "verifying" && (
          <>
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold">
              Verifying payment
            </h1>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-4xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold">
              Payment successful!
            </h1>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-2xl font-bold">
              Payment verification failed
            </h1>
          </>
        )}

        <p className="mt-3 text-muted-foreground">
          {message}
        </p>
      </div>
    </div>
  );
}