# ContentNaija AI — Production Upgrade Plan

This is a very large scope (20 workstreams). Trying to ship it all in a single turn would blow through credits, produce shallow work, and almost certainly break the app. I'm proposing to split it into **6 focused phases**. Each phase is independently shippable and testable. You approve, I build, we verify, then move to the next.

Existing WhatsApp Suite, AI Image "Coming Soon" + waitlist, feature_waitlist table, brand memory table, history/analytics scaffolding, marketing pages, i18n, forgot/reset password, and Gemini retry logic are already in place — I'll keep them and only patch what's broken.

---

## Phase 1 — Reliability & Auth Fixes (foundation)
Small, high-impact fixes the rest depends on.

- **Google OAuth**: audit `lovable.auth.signInWithOAuth` call sites, force `redirect_uri: window.location.origin`, add a public `/auth/callback` route that hydrates session then routes to `/dashboard` (or saved `?next=` path), redirect already-signed-in users away from `/auth`.
- **Post-signup UX**: auto sign-in, welcome toast, redirect to `/onboarding` if no brand yet, else `/dashboard`.
- **AI reliability wrapper**: single `runWithRetry()` helper in `ai-gateway.server.ts` for `chatCompletion` (mirrors what `generateImageBytes` already does). Retries 429/5xx/network with 2s/4s/8s backoff, 60s abort, friendly errors. Replace raw Gemini errors thrown to client with sanitized messages.
- **Client UX**: rotating loading messages ("Generating…", "AI is busy, retrying…", "Optimizing…") in a shared `useGenerating()` hook, disabled Generate buttons while pending, dedupe via react-query mutation keys.

## Phase 2 — Subscriptions, Credits & Paystack
The biggest new system.

- **DB migration**: `subscription_plans` (seed Free/Pro/Agency), `subscriptions` (user_id, plan, status, paystack_ref, current_period_end), `usage_credits` (user_id, month, generations_used, plan_at_time), `payment_history`. RLS + GRANTs + monthly reset function.
- **Paystack**: server fns `initializeSubscription`, `verifyPayment`; public webhook route `/api/public/webhooks/paystack` with HMAC signature verify → updates subscription + writes payment_history. Requires `PAYSTACK_SECRET_KEY` secret.
- **Enforcement**: server-side `assertCanGenerate(userId)` middleware called at top of every generator server fn — checks plan quota, increments usage, throws friendly "Upgrade to continue" error.
- **UI**: Pricing page wired to Paystack checkout; Settings → Billing (current plan, next renewal, cancel, invoices, payment history); premium-route guard component; usage meter on dashboard.

## Phase 3 — Admin Dashboard
- `admin` role check via existing `has_role()` function.
- `/admin` route with tabs: Users, Revenue, AI Requests, Waitlist, Subscriptions breakdown, Popular generators.
- **Grant plan by email**: admin server fn that looks up user by email and creates/extends a subscription (7d / 30d / forever) for free — writes to `subscriptions` with `granted_by_admin=true`.

## Phase 4 — Feature Polish
- **History**: search, delete, favorite, duplicate, reuse, download TXT/PDF, copy, share (extend existing `history.tsx`).
- **Analytics**: add avg response time (log timings in `generated_content`), words generated, favorite generator, remaining credits.
- **Settings**: theme toggle, notification prefs, language, delete account (calls admin API via server fn), change password, manage subscription section.
- **Brand memory auto-injection**: pass active brand into every generator's system prompt automatically.

## Phase 5 — Landing, SEO & PWA
- Landing: trust badges, live AI counter (public read-only server fn), animated stats, refined FAQ/CTA.
- SEO: sitemap regenerate, robots.txt review, JSON-LD Organization + Product, per-route OG images, twitter cards audit.
- PWA: `manifest.webmanifest`, service worker (with `/~oauth` exclusion), favicons, install prompt.

## Phase 6 — Security, Performance, QA
- Zod validation on every server fn input.
- Simple in-memory rate limiter per user per generator (Cloudflare Worker friendly: use Supabase table `rate_limits`).
- Route-level `errorComponent` + `notFoundComponent` audit.
- Lazy imports for heavy generators, bundle-size sweep, remove dead code.
- Full click-through on desktop + 375px mobile with Playwright, fix broken links & console errors.

---

## Technical notes
- **Do NOT** touch: `src/integrations/supabase/*` generated files, `.env`, Supabase auth/storage schemas.
- **Secrets needed** (I'll request via `add_secret` when we reach Phase 2): `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` (public one stored in `.env` as `VITE_PAYSTACK_PUBLIC_KEY` is fine).
- All new tables follow the CREATE → GRANT → RLS → POLICY order and get monthly-reset triggers where relevant.
- Admin grant tool uses `supabaseAdmin` inside handler after `has_role('admin')` check.

---

## What I need from you
1. **Confirm phase order** — or tell me which phase to start with. I recommend **Phase 1** first (auth is currently broken, blocks users) then **Phase 2** (subscriptions unlock monetization).
2. **Currency confirmation**: Pro ₦9,900 / Agency ₦29,900 monthly — do you also want yearly pricing (typically 2 months free)?
3. **Paystack account**: you'll need a Paystack account to grab the secret key when we get to Phase 2. Get one at paystack.com if you haven't.

Reply "start phase 1" (or whichever) and I'll build it.
