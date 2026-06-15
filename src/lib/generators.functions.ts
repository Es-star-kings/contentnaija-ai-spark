import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatCompletion } from "./ai-gateway.server";

const FREE_MONTHLY_LIMIT = 20;

const CaptionInput = z.object({
  businessType: z.string().min(1).max(120),
  goal: z.string().min(1).max(160),
  tone: z.string().min(1).max(60),
  length: z.enum(["short", "medium", "long"]),
  cta: z.string().max(160).optional().default(""),
  variations: z.number().int().min(1).max(5).default(3),
});

export type CaptionOutput = {
  captions: Array<{ text: string; hashtags: string[] }>;
};

export const generateCaption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CaptionInput.parse(input))
  .handler(async ({ data, context }): Promise<CaptionOutput & { remaining: number }> => {
    const { supabase, userId } = context;

    // Monthly usage check
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("generated_content")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStart.toISOString());

    const used = count ?? 0;
    if (used >= FREE_MONTHLY_LIMIT) {
      throw new Error(`Free plan limit reached (${FREE_MONTHLY_LIMIT}/month). Upgrade to keep generating.`);
    }

    const system = `You are an expert Nigerian social media copywriter. You write Instagram captions tailored for Nigerian audiences — culturally relevant, using light pidgin or local references when it fits, and always conversion-focused. Always reply with valid JSON only.`;

    const lengthGuide = data.length === "short" ? "1-2 short lines" : data.length === "medium" ? "3-5 lines" : "6-10 lines with rich storytelling";

    const user = `Write ${data.variations} Instagram caption variations for a Nigerian ${data.businessType}.
Goal: ${data.goal}
Tone: ${data.tone}
Length: ${lengthGuide}
${data.cta ? `Call to action to include: ${data.cta}` : ""}

For each caption include 6-10 highly relevant hashtags mixing Nigerian/local and niche tags.
Use tasteful emojis. Avoid clichés. Sound like a real person, not a brand template.

Return JSON exactly in this shape:
{"captions":[{"text":"...","hashtags":["#tag1","#tag2"]}]}`;

    const raw = await chatCompletion({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });

    let parsed: CaptionOutput;
    try {
      parsed = JSON.parse(raw) as CaptionOutput;
    } catch {
      // Try to extract JSON if model wrapped it
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("AI returned an unparseable response. Please try again.");
      parsed = JSON.parse(match[0]) as CaptionOutput;
    }
    if (!parsed.captions || !Array.isArray(parsed.captions)) {
      throw new Error("AI returned an unexpected shape. Please try again.");
    }

    // Persist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("generated_content").insert({
      user_id: userId,
      generator_type: "instagram_caption",
      inputs: data as any,
      output: parsed as any,
    });

    return { ...parsed, remaining: Math.max(0, FREE_MONTHLY_LIMIT - used - 1) };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const [{ count: monthlyCount }, { count: totalCount }, recent] = await Promise.all([
      supabase.from("generated_content").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", monthStart.toISOString()),
      supabase.from("generated_content").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("generated_content").select("id, generator_type, output, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);

    return {
      monthlyCount: monthlyCount ?? 0,
      totalCount: totalCount ?? 0,
      monthlyLimit: FREE_MONTHLY_LIMIT,
      recent: recent.data ?? [],
    };
  });
