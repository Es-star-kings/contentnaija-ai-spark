import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "pcm" | "yo" | "ha" | "ig";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "pcm", label: "Pidgin", flag: "🇳🇬" },
  { code: "yo", label: "Yorùbá", flag: "🇳🇬" },
  { code: "ha", label: "Hausa", flag: "🇳🇬" },
  { code: "ig", label: "Igbo", flag: "🇳🇬" },
];

type Dict = Record<string, string>;

const dictionaries: Record<Locale, Dict> = {
  en: {
    "nav.templates": "Templates",
    "nav.pricing": "Pricing",
    "nav.blog": "Blog",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.login": "Login",
    "nav.getStarted": "Get Started",
    "hero.badge": "Built for Nigerian businesses",
    "hero.title1": "Create Nigerian Social Media Content in",
    "hero.title2": "Seconds",
    "hero.subtitle": "Generate captions, WhatsApp campaigns and 30-day content calendars powered by AI — localized for Lagos, Abuja, PH and beyond.",
    "hero.cta": "Start Free",
    "hero.secondary": "See how it works",
    "hero.free": "20 free generations / month",
    "hero.nocard": "No credit card required",
    "pricing.eyebrow": "Pricing",
    "pricing.title": "Naira pricing. No surprises.",
    "pricing.subtitle": "Start free. Upgrade only when you're winning.",
  },
  pcm: {
    "nav.templates": "Templates",
    "nav.pricing": "Price",
    "nav.blog": "Blog",
    "nav.about": "About Us",
    "nav.contact": "Contact",
    "nav.login": "Login",
    "nav.getStarted": "Start Am",
    "hero.badge": "We build am for Naija businesses",
    "hero.title1": "Make Naija content for social media for",
    "hero.title2": "Seconds",
    "hero.subtitle": "AI go help you write captions, WhatsApp broadcast, and 30-day content plan — proper Naija flavour, from Lag to Abuja to PH.",
    "hero.cta": "Start Free",
    "hero.secondary": "See how e dey work",
    "hero.free": "20 free gens every month",
    "hero.nocard": "No credit card, no wahala",
    "pricing.eyebrow": "Price",
    "pricing.title": "Naira price. No surprise.",
    "pricing.subtitle": "Start free. Upgrade when money don enter.",
  },
  yo: {
    "nav.templates": "Àwọn Àpẹẹrẹ",
    "nav.pricing": "Iye",
    "nav.blog": "Blog",
    "nav.about": "Nípa Wa",
    "nav.contact": "Kàn Sí Wa",
    "nav.login": "Wọlé",
    "nav.getStarted": "Bẹ̀rẹ̀",
    "hero.badge": "A ṣe é fún àwọn oníṣòwò Nàìjíríà",
    "hero.title1": "Ṣe àkóónú Social Media Nàìjíríà ní",
    "hero.title2": "Ìṣẹ́jú",
    "hero.subtitle": "AI á ràn ọ́ lọ́wọ́ láti kọ caption, WhatsApp campaign àti ètò àkóónú ọjọ́ 30 — tí ó bá Lagos, Abuja àti PH mu.",
    "hero.cta": "Bẹ̀rẹ̀ Ọfẹ́",
    "hero.secondary": "Wo bí ó ṣe ń ṣiṣẹ́",
    "hero.free": "20 ọfẹ́ ní oṣù kan",
    "hero.nocard": "Kò sí kaadi",
    "pricing.eyebrow": "Iye",
    "pricing.title": "Iye ní Naira. Kò sí ìjàǹbá.",
    "pricing.subtitle": "Bẹ̀rẹ̀ ọfẹ́. Ṣe upgrade nígbà tí owó bá wọlé.",
  },
  ha: {
    "nav.templates": "Samfura",
    "nav.pricing": "Farashi",
    "nav.blog": "Blog",
    "nav.about": "Game da Mu",
    "nav.contact": "Tuntube Mu",
    "nav.login": "Shiga",
    "nav.getStarted": "Fara",
    "hero.badge": "An gina shi don kasuwancin Najeriya",
    "hero.title1": "Ƙirƙiri abun ciki na Social Media Najeriya cikin",
    "hero.title2": "Daƙiƙa",
    "hero.subtitle": "AI zai taimake ka rubuta caption, kamfen na WhatsApp da tsarin abun ciki na kwanaki 30 — na Lagos, Abuja da PH.",
    "hero.cta": "Fara Kyauta",
    "hero.secondary": "Duba yadda yake aiki",
    "hero.free": "20 kyauta kowane wata",
    "hero.nocard": "Ba a bukatar katin banki",
    "pricing.eyebrow": "Farashi",
    "pricing.title": "Farashin Naira. Babu mamaki.",
    "pricing.subtitle": "Fara kyauta. Yi upgrade lokacin da kake nasara.",
  },
  ig: {
    "nav.templates": "Ihe Nlere",
    "nav.pricing": "Ọnụ ahịa",
    "nav.blog": "Blog",
    "nav.about": "Banyere Anyị",
    "nav.contact": "Kpọtụrụ Anyị",
    "nav.login": "Banye",
    "nav.getStarted": "Bido",
    "hero.badge": "Ewubere ya maka azụmaahịa Naịjirịa",
    "hero.title1": "Mepụta ọdịnaya Social Media Naịjirịa n'ime",
    "hero.title2": "Sekọnd",
    "hero.subtitle": "AI ga-enyere gị aka ide caption, mgbasa ozi WhatsApp na atụmatụ ọdịnaya ụbọchị 30 — maka Lagos, Abuja na PH.",
    "hero.cta": "Bido n'efu",
    "hero.secondary": "Hụ ka ọ si arụ ọrụ",
    "hero.free": "20 n'efu kwa ọnwa",
    "hero.nocard": "Enweghị mkpa kaadị",
    "pricing.eyebrow": "Ọnụ ahịa",
    "pricing.title": "Ọnụ ahịa Naira. Enweghị ihe iju anya.",
    "pricing.subtitle": "Bido n'efu. Kwalite mgbe ị na-emeri.",
  },
};

const I18nContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void; t: (key: string) => string }>({
  locale: "en",
  setLocale: () => {},
  t: (k) => k,
});

const STORAGE_KEY = "cn_locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored && dictionaries[stored]) setLocaleState(stored);
    } catch {}
  }, []);

  const value = useMemo(() => ({
    locale,
    setLocale: (l: Locale) => {
      setLocaleState(l);
      try { localStorage.setItem(STORAGE_KEY, l); } catch {}
    },
    t: (key: string) => dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? key,
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
