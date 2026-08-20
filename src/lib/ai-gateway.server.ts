// Server-only Google Gemini API helper.
// Uses the user's GEMINI_API_KEY directly (no Lovable AI Gateway).
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_TEXT_MODEL = "gemini-2.5-flash";
const DEFAULT_IMAGE_MODEL = "gemini-2.5-flash-image";
const TEXT_TIMEOUT_MS = 60_000;
const IMAGE_TIMEOUT_MS = 90_000;
const MAX_ATTEMPTS = 3;

export type AIErrorCode =
  | "MISSING_API_KEY"
  | "INVALID_API_KEY"
  | "RATE_LIMITED"
  | "QUOTA_EXCEEDED"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE"
  | "VALIDATION_ERROR"
  | "UNKNOWN_ERROR";

export class AIError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "AIError";
  }
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function getKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new AIError(
      "MISSING_API_KEY",
      "AI generation is temporarily unavailable. Please try again later.",
      false,
    );
  }
  return key;
}

function waitForRetry(attempt: number): Promise<void> {
  const delay = 500 * 2 ** (attempt - 1) + Math.random() * 250;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function classifyStatus(status: number): AIError {
  if (status === 401 || status === 403) {
    return new AIError(
      "INVALID_API_KEY",
      "AI generation is temporarily unavailable. Please try again later.",
      false,
    );
  }
  if (status === 429) {
    return new AIError(
      "RATE_LIMITED",
      "AI generation is busy right now. Please wait a moment and try again.",
      true,
    );
  }
  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return new AIError(
      "UNKNOWN_ERROR",
      "The AI service is temporarily unavailable. Please try again shortly.",
      true,
    );
  }
  return new AIError(
    "UNKNOWN_ERROR",
    "We couldn't generate your content correctly. Please try again.",
    false,
  );
}

function classifyThrownError(error: unknown): AIError {
  if (error instanceof AIError) return error;
  if (error instanceof Error && error.name === "AbortError") {
    return new AIError("TIMEOUT", "The AI took too long to respond. Please try again.", true);
  }
  if (error instanceof TypeError) {
    return new AIError(
      "NETWORK_ERROR",
      "We couldn't connect to the AI service. Check your connection and try again.",
      true,
    );
  }
  if (error instanceof SyntaxError) {
    return new AIError(
      "INVALID_RESPONSE",
      "We couldn't generate your content correctly. Please try again.",
      false,
    );
  }
  return new AIError(
    "UNKNOWN_ERROR",
    "We couldn't generate your content correctly. Please try again.",
    false,
  );
}

function toGeminiParts(messages: AIMessage[]) {
  const systemText = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  return { systemText, contents };
}

export async function chatCompletion(opts: {
  model?: string;
  messages: AIMessage[];
  temperature?: number;
  response_format?: { type: "json_object" };
}): Promise<string> {
  const key = getKey();
  const model = opts.model ?? DEFAULT_TEXT_MODEL;
  const { systemText, contents } = toGeminiParts(opts.messages);

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.9,
      ...(opts.response_format?.type === "json_object"
        ? { responseMimeType: "application/json" }
        : {}),
    },
  };
  if (systemText) body.systemInstruction = { parts: [{ text: systemText }] };
  const payload = JSON.stringify(body);

  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    try {
      const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const classified = classifyStatus(res.status);
        lastErr = classified;
        if (classified.retryable && attempt < MAX_ATTEMPTS) {
          await waitForRetry(attempt);
          continue;
        }
        throw classified;
      }

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const parts = data.candidates?.[0]?.content?.parts ?? [];
      const text = parts.map((p) => p.text ?? "").join("");
      if (!text.trim()) {
        throw new AIError(
          "INVALID_RESPONSE",
          "We couldn't generate your content correctly. Please try again.",
          false,
        );
      }
      return text;
    } catch (err) {
      clearTimeout(timeout);
      const classified = classifyThrownError(err);
      lastErr = classified;
      if (classified.retryable && attempt < MAX_ATTEMPTS) {
        await waitForRetry(attempt);
        continue;
      }
      throw classified;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new AIError(
        "UNKNOWN_ERROR",
        "We couldn't generate your content correctly. Please try again.",
        false,
      );
}

/**
 * Generate an image with Gemini (gemini-2.5-flash-image / "Nano Banana").
 * Returns raw PNG bytes.
 */
export async function generateImageBytes(
  prompt: string,
  model = DEFAULT_IMAGE_MODEL,
): Promise<Uint8Array> {
  const key = getKey();
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${key}`;
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  });

  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const classified = classifyStatus(res.status);
        lastErr = classified;
        if (classified.retryable && attempt < MAX_ATTEMPTS) {
          await waitForRetry(attempt);
          continue;
        }
        throw classified;
      }

      const data = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
        }>;
      };
      const parts = data.candidates?.[0]?.content?.parts ?? [];
      const b64 = parts.find((p) => p.inlineData?.data)?.inlineData?.data;
      if (!b64)
        throw new AIError(
          "INVALID_RESPONSE",
          "We couldn't generate your content correctly. Please try again.",
          false,
        );
      return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    } catch (err) {
      clearTimeout(timeout);
      const classified = classifyThrownError(err);
      lastErr = classified;
      if (classified.retryable && attempt < MAX_ATTEMPTS) {
        await waitForRetry(attempt);
        continue;
      }
      throw classified;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Gemini image generation failed.");
}
