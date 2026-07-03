// Static content for marketing/SEO pages. No DB, no server hits.

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO
  author: string;
  readMin: number;
  cover?: string;
  tags: string[];
  content: string; // simple markdown-ish (rendered with basic converter)
};

export type Template = {
  slug: string;
  title: string;
  description: string;
  category: "captions" | "broadcast" | "flyer" | "calendar" | "image";
  cta: string;
  href: string; // in-app generator
  examples: string[];
  bullets: string[];
};

export type UseCase = {
  slug: string;
  industry: string;
  headline: string;
  subheadline: string;
  painPoints: string[];
  wins: string[];
  sampleCaption: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-ai-captions-grow-nigerian-brands",
    title: "How AI captions grow Nigerian small brands 3x faster",
    description:
      "A practical playbook for Lagos SMEs: how AI-written captions in local voice outperform generic templates on Instagram and WhatsApp.",
    date: "2026-06-01",
    author: "Team ContentNaija",
    readMin: 6,
    tags: ["Instagram", "AI", "Small business"],
    content: `# How AI captions grow Nigerian brands 3x faster\n\nMost caption tools sound like they were written for New York. Nigerian audiences respond to something specific — a rhythm, a warm hello, sometimes a small pidgin phrase where it fits.\n\n## Why voice matters\nWhen a caption sounds Nigerian, engagement climbs. It's why "Good morning oo, we open by 9" outperforms "Open from 9 AM daily" for a Lagos salon.\n\n## Three rules for AI-assisted captions\n1. **Feed the AI your brand context** — business, tone, target audience.\n2. **Ask for variations** — pick the one that sounds like you.\n3. **Always end with a call to action** — DM, WhatsApp, or a link.\n\n## What to measure\nTrack saves and DMs — not just likes. That's where conversion begins.\n`,
  },
  {
    slug: "whatsapp-broadcast-templates-that-convert",
    title: "5 WhatsApp broadcast templates that actually convert",
    description:
      "Copy-and-paste WhatsApp broadcasts for restaurants, salons, fashion and services — written in a voice your customers already trust.",
    date: "2026-05-14",
    author: "Team ContentNaija",
    readMin: 5,
    tags: ["WhatsApp", "Templates"],
    content: `# 5 WhatsApp broadcast templates that convert\n\nWhatsApp is where Nigerian buying decisions happen. These 5 templates work across industries — swap the specifics.\n\n## 1. Restock alert\n"Hi 👋 we just restocked your favourite [product]. Reply YES to reserve — first come first served."\n\n## 2. Flash discount\n"Weekend special: 15% off any [category] till Sunday 8pm. Reply CODE and we'll send yours."\n\n## 3. Loyalty check-in\n"Long time! It's been a month since your last order — here's a small thank you: [offer]."\n\n## 4. Behind-the-scenes\n"Watch how we prep your [product] this morning 🎥 — quality that speaks for itself."\n\n## 5. Referral ask\n"Enjoyed us? Share our number with one friend and we'll send you a small gift on your next visit."\n`,
  },
  {
    slug: "instagram-content-ideas-lagos-smes",
    title: "30 Instagram content ideas for Lagos SMEs (never run out)",
    description:
      "A month of Instagram post ideas built for Nigerian small businesses — with captions you can adapt in minutes.",
    date: "2026-04-22",
    author: "Team ContentNaija",
    readMin: 7,
    tags: ["Instagram", "Content calendar"],
    content: `# 30 Instagram content ideas for Lagos SMEs\n\nStop staring at Canva. Use one idea per day for a full month.\n\n## Product week\n- Product close-up\n- Before/after using product\n- Customer holding product\n- "Which one would you choose?" carousel\n- Behind the scenes making it\n\n## Story week\n- Founder story\n- Team member spotlight\n- Where we started vs now\n- The moment we knew it was working\n- A lesson we learned this year\n\n## Community week\n- Customer testimonial screenshot\n- Repost a customer's story\n- Answer a common DM publicly\n- Ask a poll question\n- Share a customer's win\n\n## Value week\n- 3 tips your audience needs\n- A myth about your industry\n- Common mistake we fix\n- "Save this for later" educational post\n- Answer a frequently asked question\n\n## Promo week\n- Weekly special\n- New arrival drop\n- Countdown reminder\n- Bundle offer\n- Last day CTA\n\n## Fun week\n- Meme relevant to industry\n- Lagos-life reference\n- Employee choice of the week\n- Behind-the-scenes blooper\n- "Vote your favourite" fun poll\n`,
  },
];

export const templates: Template[] = [
  {
    slug: "instagram-captions",
    title: "Instagram captions generator",
    description: "Nigerian-voice Instagram captions with hooks, hashtags and CTAs — 3+ variations in one click.",
    category: "captions",
    cta: "Generate captions",
    href: "/generate/instagram",
    bullets: [
      "3–5 variations per prompt",
      "Auto hashtag suggestions",
      "Length control (short/medium/long)",
      "Uses your brand tone & audience",
    ],
    examples: [
      "New drop alert 🚨 The Adire tote you've been asking for is finally here — DM 'ADIRE' to reserve yours.",
      "Sunday reset 🌿 Fresh grilled fish, jollof, and hibiscus tea from 12. Come chop belleful.",
      "Founder tip: your brand's voice > your logo. Sound like a friend, not a billboard.",
    ],
  },
  {
    slug: "whatsapp-broadcasts",
    title: "WhatsApp broadcast writer",
    description: "Short, high-converting WhatsApp broadcasts your customers actually reply to.",
    category: "broadcast",
    cta: "Write a broadcast",
    href: "/generate/whatsapp",
    bullets: ["Restock, promo, loyalty templates", "Emoji-tuned for WhatsApp", "Reply-driven CTAs", "Under 320 chars"],
    examples: [
      "Hi 👋 fresh puff-puff hot from 10am today. Reply YES and we'll set aside a pack for you.",
      "Last day for the 15% off Adire tote — reply CODE and we'll send yours.",
    ],
  },
  {
    slug: "flyer-copy",
    title: "Flyer & poster copy",
    description: "Headline, subhead and CTA copy for flyers, posters and print ads — ready for your designer.",
    category: "flyer",
    cta: "Generate flyer copy",
    href: "/generate/flyer",
    bullets: ["Headline + subhead + CTA", "Multiple angles", "Occasion-aware (Detty December, Easter…)", "Print-ready length"],
    examples: [
      "SALON THAT KNOWS YOUR HAIR — Same-day silk press, walk-ins welcome. Yaba, Fridays.",
    ],
  },
  {
    slug: "content-calendar",
    title: "30-day content calendar",
    description: "A month of posts across Instagram, WhatsApp and Facebook — themed and ready to schedule.",
    category: "calendar",
    cta: "Build a calendar",
    href: "/generate/calendar",
    bullets: ["30 posts in seconds", "Themed weeks", "Platform-mixed", "One-click to Schedule"],
    examples: ["Mon: product spotlight • Tue: testimonial • Wed: educational tip • Thu: BTS • Fri: promo"],
  },
  {
    slug: "ai-image-generator",
    title: "AI image generator",
    description: "Product mocks, flyers and social visuals — no designer needed.",
    category: "image",
    cta: "Generate an image",
    href: "/generate/image",
    bullets: ["Multiple aspect ratios", "Brand color-aware", "High-res download", "Instagram/WhatsApp presets"],
    examples: ["A vibrant flat-lay of jollof rice for a Lagos restaurant's Sunday promo."],
  },
];

export const useCases: UseCase[] = [
  {
    slug: "restaurants",
    industry: "Restaurants & food",
    headline: "AI content for Nigerian restaurants that actually fills tables",
    subheadline:
      "From Sunday jollof promos to weekday specials — captions, WhatsApp broadcasts and flyers built for food brands.",
    painPoints: [
      "Same 'come and enjoy' captions every week",
      "No time to design flyers for daily specials",
      "WhatsApp broadcasts get ignored",
    ],
    wins: [
      "5x more Instagram saves with hunger-inducing hooks",
      "Same-day flyer copy for every special",
      "WhatsApp replies from 8% of your list, not 1%",
    ],
    sampleCaption:
      "Sunday jollof loading 🍚🔥 Fresh party rice, smoky chicken, hibiscus drink — from 12pm at Yaba. DM 'PLATE' to reserve.",
  },
  {
    slug: "salons",
    industry: "Salons & beauty",
    headline: "AI captions and flyers built for Lagos salons",
    subheadline:
      "Book chairs faster with content that sounds like your clients' favourite stylist — not a stiff brand.",
    painPoints: [
      "Instagram posts get views, no DMs",
      "No time between clients to design flyers",
      "Repeat clients forget to rebook",
    ],
    wins: [
      "DM-driving CTAs on every post",
      "Same-day promo flyers ready to print",
      "Rebook broadcasts your clients actually read",
    ],
    sampleCaption:
      "Silk-press specialists 💇🏾‍♀️ Same-day appointments this Friday — book by 6pm Thursday. Reply BOOK on WhatsApp.",
  },
  {
    slug: "fashion",
    industry: "Fashion & thrift",
    headline: "AI content that sells your drops — before they hit the racks",
    subheadline:
      "Captions, WhatsApp broadcasts and image ideas made for Nigerian fashion brands and thrift sellers.",
    painPoints: ["Drops that don't sell out", "Story views, no swipe-ups", "Slow WhatsApp response rate"],
    wins: [
      "Countdown-style captions that create urgency",
      "Broadcasts with 3–5x reply rate",
      "Content calendar for every drop week",
    ],
    sampleCaption:
      "Drop 06 lands Saturday 6pm 🖤 Only 12 pieces. Reply DROP on WhatsApp to get first look 30 min early.",
  },
  {
    slug: "real-estate",
    industry: "Real estate & interiors",
    headline: "AI-written listings & captions that qualify buyers faster",
    subheadline:
      "Copy that speaks directly to Nigerian home-buyers and tenants — with the trust cues that convert enquiries.",
    painPoints: ["Vague listing captions", "Slow WhatsApp lead qualification", "Generic 'DM for price' fatigue"],
    wins: [
      "Trust-cue-heavy listing captions",
      "Structured WhatsApp qualifiers (budget, location, timeline)",
      "Flyer copy for open houses",
    ],
    sampleCaption:
      "3-bed terrace • Lekki Phase 1 • ₦45m 🏡 Fully serviced, 24/7 power, gym in estate. WhatsApp 'LEKKI' for a full brochure.",
  },
];

export function getBlogPost(slug: string) {
  return blogPosts.find((p) => p.slug === slug) ?? null;
}
export function getTemplate(slug: string) {
  return templates.find((t) => t.slug === slug) ?? null;
}
export function getUseCase(slug: string) {
  return useCases.find((u) => u.slug === slug) ?? null;
}

// Extremely small markdown renderer for blog bodies (no external dep).
export function renderMarkdown(md: string): string {
  const escape = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;
  const flushList = () => { if (inList) { out.push("</ul>"); inList = false; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("# ")) { flushList(); out.push(`<h1>${escape(line.slice(2))}</h1>`); continue; }
    if (line.startsWith("## ")) { flushList(); out.push(`<h2>${escape(line.slice(3))}</h2>`); continue; }
    if (line.startsWith("### ")) { flushList(); out.push(`<h3>${escape(line.slice(4))}</h3>`); continue; }
    if (/^[-*]\s+/.test(line)) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${escape(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${escape(line.replace(/^\d+\.\s+/, ""))}</li>`);
      continue;
    }
    if (line.trim() === "") { flushList(); continue; }
    flushList();
    const html = escape(line).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    out.push(`<p>${html}</p>`);
  }
  flushList();
  return out.join("\n");
}
