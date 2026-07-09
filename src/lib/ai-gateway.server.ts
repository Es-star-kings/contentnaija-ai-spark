// Server-only Google Gemini API helper.
// Uses the user's GEMINI_API_KEY directly (no Lovable AI Gateway).
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_TEXT_MODEL = "gemini-2.5-flash";
const DEFAULT_IMAGE_MODEL = "gemini-2.5-flash-image";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function getKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY. Add it in project secrets.");
  return key;
}

function toGeminiParts(messages: AIMessage[]) {
  const systemText = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
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

  const MAX_ATTEMPTS = 4;
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

      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`AI upstream ${res.status}`);
        if (attempt < MAX_ATTEMPTS) {
          const wait = 1000 * Math.pow(2, attempt - 1) + Math.random() * 400; // 1s,2s,4s
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
        throw new Error(
          res.status === 429
            ? "Our AI is a bit busy right now — please try again in a moment."
            : "The AI service is temporarily unavailable. Please try again shortly.",
        );
      }
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error("AI service configuration error. Please contact support.");
        throw new Error("We couldn't generate that just now. Please try again.");
      }

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const parts = data.candidates?.[0]?.content?.parts ?? [];
      const text = parts.map((p) => p.text ?? "").join("");
      if (!text.trim()) throw new Error("AI returned an empty response. Please try again.");
      return text;
    } catch (err) {
      clearTimeout(timeout);
      lastErr = err;
      const isAbort = err instanceof Error && err.name === "AbortError";
      const isNetwork = err instanceof TypeError;
      if ((isAbort || isNetwork) && attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
        continue;
      }
      if (isAbort) throw new Error("The AI took too long to respond. Please try again.");
      throw err instanceof Error ? err : new Error("We couldn't generate that just now. Please try again.");
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("We couldn't generate that just now.");
}

/**
 * Generate an image with Gemini (gemini-2.5-flash-image / "Nano Banana").
 * Returns raw PNG bytes.
 */
export async function generateImageBytes(prompt: string, model = DEFAULT_IMAGE_MODEL): Promise<Uint8Array> {
  const key = getKey();
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${key}`;
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  });

  // Retry with exponential backoff on 429 / 5xx / transient network errors.
  const MAX_ATTEMPTS = 4;
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

      if (res.status === 429 || res.status >= 500) {
        const text = await res.text().catch(() => "");
        lastErr = new Error(`Gemini ${res.status}: ${text.slice(0, 200)}`);
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 1500 * attempt + Math.random() * 500));
          continue;
        }
        if (res.status === 429) throw new Error("Gemini is rate-limiting your key. Wait a minute and try again, or upgrade your Gemini quota.");
        throw lastErr;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (res.status === 401 || res.status === 403) throw new Error("Invalid GEMINI_API_KEY.");
        throw new Error(`Gemini image error ${res.status}: ${text.slice(0, 300)}`);
      }

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>;
      };
      const parts = data.candidates?.[0]?.content?.parts ?? [];
      const b64 = parts.find((p) => p.inlineData?.data)?.inlineData?.data;
      if (!b64) throw new Error("Gemini returned no image data.");
      return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    } catch (err) {
      clearTimeout(timeout);
      lastErr = err;
      const isAbort = err instanceof Error && err.name === "AbortError";
      const isNetwork = err instanceof TypeError; // fetch failed
      if ((isAbort || isNetwork) && attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Gemini image generation failed.");
}

