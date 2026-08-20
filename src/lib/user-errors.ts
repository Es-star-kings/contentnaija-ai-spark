export type UserFriendlyError = {
  title: string;
  message: string;
  retryable: boolean;
};

const errors: Record<string, UserFriendlyError> = {
  RATE_LIMITED: {
    title: "AI is busy right now",
    message: "We're receiving a lot of requests. Please wait a moment and try again.",
    retryable: true,
  },
  TIMEOUT: {
    title: "Generation timed out",
    message: "The AI took too long to respond. Please try again.",
    retryable: true,
  },
  NETWORK_ERROR: {
    title: "Connection problem",
    message: "We couldn't connect to the AI service. Check your connection and try again.",
    retryable: true,
  },
  INVALID_RESPONSE: {
    title: "Generation failed",
    message: "We couldn't generate your content correctly. Please try again.",
    retryable: true,
  },
  VALIDATION_ERROR: {
    title: "Generation failed",
    message: "We couldn't generate your content correctly. Please try again.",
    retryable: true,
  },
  QUOTA_EXCEEDED: {
    title: "AI usage limit reached",
    message: "The AI service has reached its current usage limit. Please try again later.",
    retryable: false,
  },
  INSUFFICIENT_CREDITS: {
    title: "No generations remaining",
    message: "You've used your available generations. Upgrade your plan to continue creating content.",
    retryable: false,
  },
  SUPABASE_ERROR: {
    title: "Couldn't save your content",
    message: "Your content could not be saved. Please try again.",
    retryable: true,
  },
  AUTH_ERROR: {
    title: "Session expired",
    message: "Please sign in again to continue.",
    retryable: false,
  },
  PAYMENT_ERROR: {
    title: "Payment verification failed",
    message: "We couldn't verify your payment yet. Please check your transaction status or try again.",
    retryable: true,
  },
  UNKNOWN_ERROR: {
    title: "Something went wrong",
    message: "We couldn't complete your request. Please try again.",
    retryable: true,
  },
};

function codeFrom(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const value = error as { code?: unknown; errorCode?: unknown };
  const code = value.code ?? value.errorCode;
  return typeof code === "string" ? code.toUpperCase() : undefined;
}

export function getUserFriendlyError(error: unknown): UserFriendlyError {
  const code = codeFrom(error);
  if (code && errors[code]) return errors[code];

  const raw = error instanceof Error ? error.message.toLowerCase() : "";
  if (raw.includes("invalid login") || raw.includes("invalid credentials")) {
    return { title: "Sign-in failed", message: "Incorrect email or password. Please try again.", retryable: true };
  }
  if (raw.includes("already registered") || raw.includes("user already exists")) {
    return { title: "Account already exists", message: "An account with this email already exists. Try signing in instead.", retryable: false };
  }
  if (raw.includes("payment") || raw.includes("transaction")) return errors.PAYMENT_ERROR;
  if (raw.includes("session") || raw.includes("jwt") || raw.includes("auth")) return errors.AUTH_ERROR;
  return errors.UNKNOWN_ERROR;
}

export function getUserFriendlyErrorText(error: unknown): string {
  const friendly = getUserFriendlyError(error);
  return `${friendly.title}: ${friendly.message}`;
}

export function getValidationError(field: string): UserFriendlyError {
  return { title: "Check your details", message: `Please enter your ${field}.`, retryable: false };
}