import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatCompletion } from "./ai-gateway.server";

export const FREE_MONTHLY_LIMIT = 20;

// ---------- Shared helpers ----------

function monthStartISO() {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

async function assertWithinLimit(supabase: any, userId: string) {
  const { count } = await supabase
    .from("generated_content")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", monthStartISO());
  const used = count ?? 0;
  if (used >= FREE_MONTHLY_LIMIT) {
    throw new Error(`Free plan limit reached (${FREE_MONTHLY_LIMIT}/month). Upgrade to keep generating.`);
  }
  return used;
}

function parseJSON<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("AI returned an unparseable response. Please try again.");
    return JSON.parse(m[0]) as T;
  }
}

async function loadBrand(supabase: any, userId: string): Promise<{ data: any; brandId: string | null }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, industry, tone, target_audience, brand_color, active_brand_id")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.active_brand_id) {
    const { data: brand } = await supabase
      .from("brands")
      .select("id, business_name, industry, tone, target_audience, brand_color")
      .eq("id", profile.active_brand_id)
      .maybeSingle();
    if (brand) return { data: brand, brandId: brand.id };
  }
  return { data: profile ?? {}, brandId: null };
}

function brandLine(brand: any) {
  const parts: string[] = [];
  if (brand.business_name) parts.push(`Brand: ${brand.business_name}`);
  if (brand.industry) parts.push(`Industry: ${brand.industry}`);
  if (brand.target_audience) parts.push(`Audience: ${brand.target_audience}`);
  if (brand.tone) parts.push(`Brand tone: ${brand.tone}`);
  return parts.length ? `\nBrand context — ${parts.join(" • ")}\n` : "";
}

const SYSTEM_BASE = `You are an expert Nigerian marketing copywriter who writes content tailored for Nigerian audiences — culturally relevant, naturally weaving in light pidgin or local references when it fits, and always conversion-focused. Always reply with valid JSON only.`;

// ---------- Instagram captions ----------

const CaptionInput = z.object({
  businessType: z.string().min(1).max(120),
  goal: z.string().min(1).max(160),
  tone: z.string().min(1).max(60),
  length: z.enum(["short", "medium", "long"]),
  cta: z.string().max(160).optional().default(""),
  variations: z.number().int().min(1).max(5).default(3),
});

export type CaptionOutput = { captions: Array<{ text: string; hashtags: string[] }> };

export const generateCaption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CaptionInput.parse(input))
  .handler(async ({ data, context }): Promise<CaptionOutput & { remaining: number }> => {
    const { supabase, userId } = context;
    const used = await assertWithinLimit(supabase, userId);
    const { data: brand, brandId } = await loadBrand(supabase, userId);

    const lengthGuide =
      data.length === "short" ? "1-2 short lines" : data.length === "medium" ? "3-5 lines" : "6-10 lines with rich storytelling";

    const user = `Write ${data.variations} Instagram caption variations for a Nigerian ${data.businessType}.
${brandLine(brand)}Goal: ${data.goal}
Tone: ${data.tone}
Length: ${lengthGuide}
${data.cta ? `Call to action to include: ${data.cta}` : ""}

For each caption include 6-10 highly relevant hashtags mixing Nigerian/local and niche tags.
Use tasteful emojis. Avoid clichés. Sound like a real person, not a brand template.

Return JSON exactly: {"captions":[{"text":"...","hashtags":["#tag1"]}]}`;

    const raw = await chatCompletion({
      messages: [{ role: "system", content: SYSTEM_BASE }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    });
    const parsed = parseJSON<CaptionOutput>(raw);
    if (!Array.isArray(parsed.captions)) throw new Error("AI returned an unexpected shape.");

    await supabase.from("generated_content").insert({
      user_id: userId,
      generator_type: "instagram_caption",
      brand_id: brandId,
      inputs: data as any,
      output: parsed as any,
    });
    return { ...parsed, remaining: Math.max(0, FREE_MONTHLY_LIMIT - used - 1) };
  });

// ---------- WhatsApp campaign ----------

const WhatsAppInput = z.object({
  businessType: z.string().min(1).max(120),
  campaignGoal: z.string().min(1).max(200),
  offer: z.string().max(200).optional().default(""),
  audience: z.string().max(160).optional().default(""),
  tone: z.string().min(1).max(60),
  includePidgin: z.boolean().default(false),
});

export type WhatsAppOutput = {
  messages: Array<{ label: string; body: string }>;
};

export const generateWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => WhatsAppInput.parse(input))
  .handler(async ({ data, context }): Promise<WhatsAppOutput & { remaining: number }> => {
    const { supabase, userId } = context;
    const used = await assertWithinLimit(supabase, userId);
    const { data: brand, brandId } = await loadBrand(supabase, userId);

    const user = `Write 3 WhatsApp broadcast messages for a Nigerian ${data.businessType}.
${brandLine(brand)}Campaign goal: ${data.campaignGoal}
${data.offer ? `Offer / promo: ${data.offer}` : ""}
${data.audience ? `Audience: ${data.audience}` : ""}
Tone: ${data.tone}
${data.includePidgin ? "Mix in light Nigerian pidgin naturally." : "Use clear conversational English."}

Rules:
- WhatsApp friendly formatting: short paragraphs, use *bold* with asterisks, line breaks for breathing room
- Open with a hook in the first line (most users only see the preview)
- End with a strong, single call to action with a clickable link placeholder or phone number cue
- Keep under 600 characters per message
- Provide 3 variations with different angles: (1) Direct offer (2) Story / social proof (3) Urgency / scarcity

Return JSON exactly: {"messages":[{"label":"Direct offer","body":"..."}]}`;

    const raw = await chatCompletion({
      messages: [{ role: "system", content: SYSTEM_BASE }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    });
    const parsed = parseJSON<WhatsAppOutput>(raw);
    if (!Array.isArray(parsed.messages)) throw new Error("AI returned an unexpected shape.");

    await supabase.from("generated_content").insert({
      user_id: userId,
      generator_type: "whatsapp_campaign",
      brand_id: brandId,
      inputs: data as any,
      output: parsed as any,
    });
    return { ...parsed, remaining: Math.max(0, FREE_MONTHLY_LIMIT - used - 1) };
  });

// ---------- Flyer copy ----------

const FlyerInput = z.object({
  businessType: z.string().min(1).max(120),
  eventOrOffer: z.string().min(1).max(200),
  keyDetails: z.string().max(400).optional().default(""),
  tone: z.string().min(1).max(60),
});

export type FlyerOutput = {
  headline: string;
  subheadline: string;
  bullets: string[];
  cta: string;
  footer: string;
  colorSuggestion: string;
};

export const generateFlyer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => FlyerInput.parse(input))
  .handler(async ({ data, context }): Promise<FlyerOutput & { remaining: number }> => {
    const { supabase, userId } = context;
    const used = await assertWithinLimit(supabase, userId);
    const { data: brand, brandId } = await loadBrand(supabase, userId);

    const user = `Write flyer copy for a Nigerian ${data.businessType}.
${brandLine(brand)}Event / Offer: ${data.eventOrOffer}
${data.keyDetails ? `Key details: ${data.keyDetails}` : ""}
Tone: ${data.tone}

Return JSON exactly with these fields (concise, punchy, ready to print):
{
  "headline": "max 8 words, attention-grabbing",
  "subheadline": "max 14 words, supporting line",
  "bullets": ["3-5 short benefits / features"],
  "cta": "1 strong CTA line with phone/whatsapp cue",
  "footer": "venue • date • IG handle placeholder",
  "colorSuggestion": "two-color palette in hex e.g. #10B981 + #0F172A"
}`;

    const raw = await chatCompletion({
      messages: [{ role: "system", content: SYSTEM_BASE }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    });
    const parsed = parseJSON<FlyerOutput>(raw);
    if (!parsed.headline) throw new Error("AI returned an unexpected shape.");

    await supabase.from("generated_content").insert({
      user_id: userId,
      generator_type: "flyer_copy",
      brand_id: brandId,
      inputs: data as any,
      output: parsed as any,
    });
    return { ...parsed, remaining: Math.max(0, FREE_MONTHLY_LIMIT - used - 1) };
  });

// ---------- Content calendar ----------

const CalendarInput = z.object({
  businessType: z.string().min(1).max(120),
  goals: z.string().min(1).max(300),
  platform: z.enum(["Instagram", "WhatsApp", "Facebook", "TikTok", "X (Twitter)"]),
  days: z.number().int().min(3).max(14).default(7),
  postsPerDay: z.number().int().min(1).max(3).default(1),
});

export type CalendarOutput = {
  plan: Array<{
    day: number;
    date_label: string;
    theme: string;
    posts: Array<{ time: string; format: string; hook: string; caption: string }>;
  }>;
};

export const generateCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CalendarInput.parse(input))
  .handler(async ({ data, context }): Promise<CalendarOutput & { remaining: number }> => {
    const { supabase, userId } = context;
    const used = await assertWithinLimit(supabase, userId);
    const { data: brand, brandId } = await loadBrand(supabase, userId);

    const user = `Build a ${data.days}-day ${data.platform} content calendar for a Nigerian ${data.businessType}.
${brandLine(brand)}Goals: ${data.goals}
Posts per day: ${data.postsPerDay}

Mix content pillars: educational, entertaining, promotional, social proof, behind-the-scenes.
Reference Nigerian context (timing — e.g. lunch break, Friday vibes, weekend church/family), local culture, and trends where natural.

Return JSON exactly:
{"plan":[{"day":1,"date_label":"Mon","theme":"Pillar / theme of the day","posts":[{"time":"9:00 AM","format":"Reel / Carousel / Story","hook":"first-line hook","caption":"full caption draft, 2-4 lines"}]}]}`;

    const raw = await chatCompletion({
      messages: [{ role: "system", content: SYSTEM_BASE }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    });
    const parsed = parseJSON<CalendarOutput>(raw);
    if (!Array.isArray(parsed.plan)) throw new Error("AI returned an unexpected shape.");

    await supabase.from("generated_content").insert({
      user_id: userId,
      generator_type: "content_calendar",
      brand_id: brandId,
      inputs: data as any,
      output: parsed as any,
    });
    return { ...parsed, remaining: Math.max(0, FREE_MONTHLY_LIMIT - used - 1) };
  });

// ---------- Dashboard / history ----------

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ count: monthlyCount }, { count: totalCount }, recent] = await Promise.all([
      supabase.from("generated_content").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", monthStartISO()),
      supabase.from("generated_content").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("generated_content").select("id, generator_type, output, created_at, favorited").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);
    return {
      monthlyCount: monthlyCount ?? 0,
      totalCount: totalCount ?? 0,
      monthlyLimit: FREE_MONTHLY_LIMIT,
      recent: recent.data ?? [],
    };
  });

// ---------- Analytics ----------

export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 29);
    since.setUTCHours(0, 0, 0, 0);

    const { data: rows, error } = await supabase
      .from("generated_content")
      .select("id, generator_type, inputs, favorited, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);

    const all = rows ?? [];

    // Daily series for the last 30 days
    const days: { date: string; label: string; count: number }[] = [];
    const dayIndex = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setUTCDate(since.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dayIndex.set(key, days.length);
      days.push({ date: key, label, count: 0 });
    }
    const sinceMs = since.getTime();
    let last30 = 0;
    let monthCount = 0;
    const monthStart = new Date(monthStartISO()).getTime();
    const byType: Record<string, number> = {};
    const toneCount: Record<string, number> = {};
    let favorites = 0;

    for (const r of all) {
      const t = new Date(r.created_at).getTime();
      if (t >= sinceMs) {
        last30++;
        const key = r.created_at.slice(0, 10);
        const idx = dayIndex.get(key);
        if (idx !== undefined) days[idx].count++;
      }
      if (t >= monthStart) monthCount++;
      byType[r.generator_type] = (byType[r.generator_type] ?? 0) + 1;
      if (r.favorited) favorites++;
      const tone = (r.inputs as any)?.tone;
      if (typeof tone === "string" && tone.trim()) {
        const k = tone.trim();
        toneCount[k] = (toneCount[k] ?? 0) + 1;
      }
    }

    const generators = Object.entries(byType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    const topTones = Object.entries(toneCount)
      .map(([tone, count]) => ({ tone, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total: all.length,
      last30,
      monthCount,
      monthlyLimit: FREE_MONTHLY_LIMIT,
      favorites,
      days,
      generators,
      topTones,
    };
  });

const HistoryInput = z.object({
  type: z.string().optional(),
  favoritesOnly: z.boolean().optional(),
  search: z.string().optional(),
});

export const listHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => HistoryInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase
      .from("generated_content")
      .select("id, generator_type, inputs, output, created_at, favorited")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.type && data.type !== "all") q = q.eq("generator_type", data.type);
    if (data.favoritesOnly) q = q.eq("favorited", true);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const filtered = data.search
      ? (rows ?? []).filter((r) => JSON.stringify(r.output).toLowerCase().includes(data.search!.toLowerCase()))
      : rows ?? [];
    return filtered;
  });

const ToggleInput = z.object({ id: z.string().uuid(), favorited: z.boolean() });
export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ToggleInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("generated_content")
      .update({ favorited: data.favorited })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const DeleteInput = z.object({ id: z.string().uuid() });
export const deleteHistoryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeleteInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("generated_content").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Brand kit / profile ----------

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, email, full_name, business_name, industry, tone, target_audience, brand_color, preferred_platform, language")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const ProfileInput = z.object({
  full_name: z.string().max(120).optional().nullable(),
  business_name: z.string().max(120).optional().nullable(),
  industry: z.string().max(120).optional().nullable(),
  tone: z.string().max(60).optional().nullable(),
  target_audience: z.string().max(200).optional().nullable(),
  brand_color: z.string().regex(/^#?[0-9a-fA-F]{6}$/).optional().nullable(),
  preferred_platform: z.string().max(60).optional().nullable(),
  language: z.string().max(40).optional().nullable(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileInput.parse(input))
  .handler(async ({ data, context }) => {
    const patch = { ...data };
    if (patch.brand_color && !patch.brand_color.startsWith("#")) {
      patch.brand_color = "#" + patch.brand_color;
    }
    const { error } = await context.supabase
      .from("profiles")
      .update(patch)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
