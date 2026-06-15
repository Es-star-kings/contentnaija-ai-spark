// Server-only Lovable AI Gateway helper.
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatCompletion(opts: {
  model?: string;
  messages: AIMessage[];
  temperature?: number;
  response_format?: { type: "json_object" };
}): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
      "X-Lovable-AIG-SDK": "raw-fetch",
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-3-flash-preview",
      messages: opts.messages,
      temperature: opts.temperature ?? 0.9,
      ...(opts.response_format ? { response_format: opts.response_format } : {}),
    }),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in your workspace.");
    const text = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}
