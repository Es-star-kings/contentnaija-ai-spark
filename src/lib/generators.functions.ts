import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatCompletion } from "./ai-gateway.server";

export const FREE_MONTHLY_LIMIT = 20;

const UNLIMITED_EMAILS = new Set<string>([
  "kingsleyadesina1@gmail.com",
]);

export function planForClaims(claims: any): { name: string; limit: number | null } {
  const email = (claims?.email ?? "").toString().toLowerCase();
  if (email && UNLIMITED_EMAILS.has(email)) {
    return { name: "Agency", limit: null };
  }
  return { name: "Free", limit: FREE_MONTHLY_LIMIT };
}

// ---------- Shared helpers ----------

function monthStartISO() {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

async function assertWithinLimit(supabase: any, userId: string, claims: any) {
  const plan = planForClaims(claims);
  const { count } = await supabase
    .from("generated_content")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", monthStartISO());
  const used = count ?? 0;
  if (plan.limit !== null && used >= plan.limit) {
    throw new Error(`${plan.name} plan limit reached (${plan.limit}/month). Upgrade to keep generating.`);
  }
  return { used, limit: plan.limit, planName: plan.name };
}

function remainingFrom(used: number, limit: number | null): number | null {
  if (limit === null) return null;
  return Math.max(0, limit - used - 1);
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
  .handler(async ({ data, context }): Promise<CaptionOutput & { remaining: number | null }> => {
    const { supabase, userId } = context;
    const { used, limit } = await assertWithinLimit(supabase, userId, context.claims);
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
    return { ...parsed, remaining: remainingFrom(used, limit) };
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
  .handler(async ({ data, context }): Promise<WhatsAppOutput & { remaining: number | null }> => {
    const { supabase, userId } = context;
    const { used, limit } = await assertWithinLimit(supabase, userId, context.claims);
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
    return { ...parsed, remaining: remainingFrom(used, limit) };
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
  .handler(async ({ data, context }): Promise<FlyerOutput & { remaining: number | null }> => {
    const { supabase, userId } = context;
    const { used, limit } = await assertWithinLimit(supabase, userId, context.claims);
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
    return { ...parsed, remaining: remainingFrom(used, limit) };
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
  .handler(async ({ data, context }): Promise<CalendarOutput & { remaining: number | null }> => {
    const { supabase, userId } = context;
    const { used, limit } = await assertWithinLimit(supabase, userId, context.claims);
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
    return { ...parsed, remaining: remainingFrom(used, limit) };
  });

// ---------- Image generation ----------

const ImageInput = z.object({
  prompt: z.string().min(3).max(800),
  style: z.string().max(60).optional().default("Vibrant marketing photo"),
  purpose: z.enum(["flyer", "social", "product", "logo"]).default("social"),
  aspect: z.enum(["1024x1024", "1024x1536", "1536x1024"]).default("1024x1024"),
});

export type ImageOutput = { url: string; path: string; prompt: string };

export const generateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ImageInput.parse(input))
  .handler(async ({ data, context }): Promise<ImageOutput & { remaining: number | null }> => {
    const { supabase, userId } = context;
    const { used, limit } = await assertWithinLimit(supabase, userId, context.claims);
    const { data: brand, brandId } = await loadBrand(supabase, userId);

    const brandHint = brand?.business_name
      ? `Brand: ${brand.business_name}. Industry: ${brand.industry || "general"}. Brand color hint: ${brand.brand_color || "#10B981"}.`
      : "";
    const purposeHint =
      data.purpose === "flyer"
        ? "Designed as a poster/flyer with strong focal subject and clean negative space for overlay text. No legible text in the image."
        : data.purpose === "product"
        ? "Clean product photography style, soft studio lighting, neutral background."
        : data.purpose === "logo"
        ? "Minimal flat icon-style mark, centered on a clean background, vector-like."
        : "Eye-catching social media image, vivid colors, on-trend composition. No text overlays.";

    const finalPrompt = `${data.prompt}\n\nStyle: ${data.style}. ${purposeHint} ${brandHint} Tailored for a Nigerian audience — authentic, culturally relevant.`;

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "X-Lovable-AIG-SDK": "raw-fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-image-2",
        prompt: finalPrompt,
        size: data.aspect,
        quality: "low",
        n: 1,
      }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in your workspace.");
      const text = await res.text();
      throw new Error(`Image generation failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("AI returned no image data.");

    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const { error: upErr } = await supabase.storage
      .from("generated-images")
      .upload(filename, bytes, { contentType: "image/png", upsert: false });
    if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);

    const { data: signed, error: signErr } = await supabase.storage
      .from("generated-images")
      .createSignedUrl(filename, 60 * 60 * 24 * 7);
    if (signErr || !signed) throw new Error("Could not create signed URL.");

    const output = { url: signed.signedUrl, path: filename, prompt: finalPrompt };

    await supabase.from("generated_content").insert({
      user_id: userId,
      generator_type: "image",
      brand_id: brandId,
      inputs: data as any,
      output: output as any,
    });

    return { ...output, remaining: remainingFrom(used, limit) };
  });

const SignInput = z.object({ path: z.string().min(1) });
export const signImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SignInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage
      .from("generated-images")
      .createSignedUrl(data.path, 60 * 60 * 24 * 7);
    if (error || !signed) throw new Error("Could not refresh image URL.");
    return { url: signed.signedUrl };
  });

// ---------- Dashboard / history ----------

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const plan = planForClaims(context.claims);
    const [{ count: monthlyCount }, { count: totalCount }, recent] = await Promise.all([
      supabase.from("generated_content").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", monthStartISO()),
      supabase.from("generated_content").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("generated_content").select("id, generator_type, output, created_at, favorited").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);
    return {
      monthlyCount: monthlyCount ?? 0,
      totalCount: totalCount ?? 0,
      monthlyLimit: plan.limit,
      planName: plan.name,
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
      .select("id, email, full_name, business_name, industry, tone, target_audience, brand_color, preferred_platform, language, onboarding_complete, active_brand_id")
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

// ---------- Brands (multi-brand) ----------

export const listBrands = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("brands")
      .select("id, name, business_name, industry, tone, target_audience, brand_color, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("active_brand_id")
      .eq("id", context.userId)
      .maybeSingle();
    return { brands: data ?? [], activeBrandId: profile?.active_brand_id ?? null };
  });

const BrandInput = z.object({
  name: z.string().min(1).max(80),
  business_name: z.string().max(120).optional().nullable(),
  industry: z.string().max(120).optional().nullable(),
  tone: z.string().max(60).optional().nullable(),
  target_audience: z.string().max(200).optional().nullable(),
  brand_color: z.string().regex(/^#?[0-9a-fA-F]{6}$/).optional().nullable(),
});

export const createBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BrandInput.parse(input))
  .handler(async ({ data, context }) => {
    const patch: any = { ...data, user_id: context.userId };
    if (patch.brand_color && !patch.brand_color.startsWith("#")) patch.brand_color = "#" + patch.brand_color;
    const { data: row, error } = await context.supabase.from("brands").insert(patch).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

const BrandUpdateInput = BrandInput.extend({ id: z.string().uuid() });
export const updateBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BrandUpdateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data as any;
    if (patch.brand_color && !patch.brand_color.startsWith("#")) patch.brand_color = "#" + patch.brand_color;
    const { error } = await context.supabase.from("brands").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const BrandIdInput = z.object({ id: z.string().uuid() });
export const deleteBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BrandIdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("brands").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const SetActiveInput = z.object({ id: z.string().uuid().nullable() });
export const setActiveBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SetActiveInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ active_brand_id: data.id })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Admin ----------

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    return { roles: (data ?? []).map((r: any) => r.role as string) };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ count: totalContent }, { count: totalBrands }, recentRows, byTypeRows, users] = await Promise.all([
      supabaseAdmin.from("generated_content").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("brands").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("generated_content")
        .select("id, user_id, generator_type, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin.from("generated_content").select("generator_type"),
      supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, business_name, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const byType: Record<string, number> = {};
    for (const r of byTypeRows.data ?? []) {
      byType[r.generator_type] = (byType[r.generator_type] ?? 0) + 1;
    }

    return {
      totalContent: totalContent ?? 0,
      totalBrands: totalBrands ?? 0,
      totalUsers: users.data?.length ?? 0,
      byType: Object.entries(byType).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
      recent: recentRows.data ?? [],
      users: users.data ?? [],
    };
  });

const GrantRoleInput = z.object({ user_id: z.string().uuid(), role: z.enum(["admin", "user"]), grant: z.boolean() });
export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GrantRoleInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.user_id, role: data.role })
        .select("id");
      if (error && !String(error.message).includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ---------- Onboarding ----------

const OnboardingInput = z.object({
  full_name: z.string().trim().min(1).max(120),
  business_name: z.string().trim().min(1).max(120),
  industry: z.string().trim().min(1).max(120),
  target_audience: z.string().trim().min(1).max(200),
  tone: z.string().trim().min(1).max(60),
  brand_color: z.string().regex(/^#?[0-9a-fA-F]{6}$/).optional().nullable(),
  preferred_platform: z.string().max(60).optional().nullable(),
  language: z.string().max(40).optional().nullable(),
});

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => OnboardingInput.parse(input))
  .handler(async ({ data, context }) => {
    const brand_color = data.brand_color
      ? (data.brand_color.startsWith("#") ? data.brand_color : "#" + data.brand_color)
      : "#10B981";

    // 1. Create the first brand
    const { data: brand, error: brandErr } = await context.supabase
      .from("brands")
      .insert({
        user_id: context.userId,
        name: data.business_name,
        business_name: data.business_name,
        industry: data.industry,
        tone: data.tone,
        target_audience: data.target_audience,
        brand_color,
      })
      .select("id")
      .single();
    if (brandErr) throw new Error(brandErr.message);

    // 2. Update the profile and mark onboarding complete
    const { error: profErr } = await context.supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        business_name: data.business_name,
        industry: data.industry,
        tone: data.tone,
        target_audience: data.target_audience,
        brand_color,
        preferred_platform: data.preferred_platform ?? null,
        language: data.language ?? "English",
        active_brand_id: brand.id,
        onboarding_complete: true,
      })
      .eq("id", context.userId);
    if (profErr) throw new Error(profErr.message);

    return { ok: true, brandId: brand.id };
  });

export const skipOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ onboarding_complete: true })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Share links ----------

function randomToken(len = 24) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (const b of bytes) out += chars[b % chars.length];
  return out;
}

const CreateShareInput = z.object({
  contentId: z.string().uuid(),
  expiresInDays: z.number().int().min(0).max(365).optional().default(0),
});

export const createShareLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateShareInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error: chk } = await supabase
      .from("generated_content")
      .select("id")
      .eq("id", data.contentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (chk) throw new Error(chk.message);
    if (!row) throw new Error("Content not found");
    const expires_at = data.expiresInDays && data.expiresInDays > 0
      ? new Date(Date.now() + data.expiresInDays * 86400_000).toISOString()
      : null;
    const token = randomToken();
    const { data: inserted, error } = await supabase
      .from("share_links")
      .insert({ user_id: userId, content_id: data.contentId, token, expires_at })
      .select("token")
      .single();
    if (error) throw new Error(error.message);
    return { token: inserted.token };
  });

const ListSharesInput = z.object({ contentId: z.string().uuid() });
export const listShareLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListSharesInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("share_links")
      .select("id, token, expires_at, view_count, created_at")
      .eq("content_id", data.contentId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const RevokeShareInput = z.object({ id: z.string().uuid() });
export const revokeShareLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RevokeShareInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("share_links").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const GetSharedInput = z.object({ token: z.string().min(8).max(64) });
export const getSharedContent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => GetSharedInput.parse(input))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data: link, error } = await sb
      .from("share_links")
      .select("id, content_id, expires_at, user_id, view_count")
      .eq("token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!link) throw new Error("Link not found or expired");
    if (link.expires_at && new Date(link.expires_at) < new Date()) throw new Error("Link expired");

    // Use service role to read the linked content (RLS would otherwise block anon)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: content, error: cerr } = await supabaseAdmin
      .from("generated_content")
      .select("generator_type, output, inputs, created_at")
      .eq("id", link.content_id)
      .maybeSingle();
    if (cerr) throw new Error(cerr.message);
    if (!content) throw new Error("Content unavailable");

    // best-effort view count increment
    await supabaseAdmin
      .from("share_links")
      .update({ view_count: (link as any).view_count != null ? (link as any).view_count + 1 : 1 })
      .eq("id", link.id);

    let brand_name: string | null = null;
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("business_name")
      .eq("id", link.user_id)
      .maybeSingle();
    brand_name = prof?.business_name ?? null;

    return { generator_type: content.generator_type, output: content.output, created_at: content.created_at, brand_name };
  });

// ---------- Scheduling / drafts ----------

const ScheduleRangeInput = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  includeDrafts: z.boolean().optional().default(true),
});

export const listScheduled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ScheduleRangeInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q: any = supabase
      .from("generated_content")
      .select("id, generator_type, output, inputs, created_at, scheduled_for, status, favorited")
      .eq("user_id", userId)
      .order("scheduled_for", { ascending: true, nullsFirst: false })
      .limit(500);
    if (data.from) q = q.gte("scheduled_for", data.from);
    if (data.to) q = q.lte("scheduled_for", data.to);
    if (!data.includeDrafts) q = q.not("scheduled_for", "is", null);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const UpdateScheduleInput = z.object({
  id: z.string().uuid(),
  scheduled_for: z.string().nullable(),
  status: z.enum(["draft", "scheduled", "published"]).optional(),
});

export const updateSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateScheduleInput.parse(input))
  .handler(async ({ data, context }) => {
    const patch: any = { scheduled_for: data.scheduled_for };
    patch.status = data.status ?? (data.scheduled_for ? "scheduled" : "draft");
    const { error } = await context.supabase
      .from("generated_content")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const SetStatusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "scheduled", "published"]),
});

export const setContentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SetStatusInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("generated_content")
      .update({ status: data.status } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

