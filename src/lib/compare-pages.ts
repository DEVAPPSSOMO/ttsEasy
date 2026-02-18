import { LOCALES, type Locale } from "@/lib/i18n/config";

export type SearchIntent = "commercial" | "transactional" | "informational";
export type CtaVariant = "generate_now" | "compare_and_try";

export interface EditorialContract {
  searchIntent: SearchIntent;
  primaryKeyword: string;
  secondaryKeywords: string[];
  faq: { question: string; answer: string }[];
  internalLinksRequired: string[];
  ctaVariant: CtaVariant;
}

export interface ComparePage {
  slug: string;
  locale: Locale;
  title: string;
  description: string;
  h1: string;
  intro: string[];
  strengths: { title: string; detail: string }[];
  whenToUse: string[];
  contract: EditorialContract;
}

type ComparePageMap = Record<string, Partial<Record<Locale, ComparePage>>>;

const PAGES: ComparePageMap = {
  "elevenlabs-alternative": {
    en: {
      slug: "elevenlabs-alternative",
      locale: "en",
      title: "ElevenLabs Alternative for Fast TTS Workflows",
      description:
        "Compare ElevenLabs with TTS Easy for script-to-MP3 speed, multilingual coverage, and zero-signup generation.",
      h1: "Best ElevenLabs Alternative for Instant Text to Speech",
      intro: [
        "If your goal is fast script-to-MP3 production with no setup friction, TTS Easy can be a better fit than ElevenLabs for many daily workflows.",
        "Use this page to decide which tool matches your priorities: speed, language handling, and publishing cadence.",
      ],
      strengths: [
        {
          title: "Zero-friction generation",
          detail: "No signup required for web generation and immediate MP3 output.",
        },
        {
          title: "Built for multilingual scripts",
          detail: "Automatic language detection and accent routing reduce manual configuration overhead.",
        },
        {
          title: "Workflow speed",
          detail: "Fast iteration loop for creators publishing short-form content on a daily basis.",
        },
      ],
      whenToUse: [
        "Need quick voiceovers for Shorts, TikTok, and YouTube explainers.",
        "Need repeatable voice output without long prompt tuning cycles.",
        "Need to publish across multiple locales from one script base.",
      ],
      contract: {
        searchIntent: "commercial",
        primaryKeyword: "elevenlabs alternative",
        secondaryKeywords: [
          "best elevenlabs alternative",
          "text to speech alternative to elevenlabs",
          "free elevenlabs alternative",
        ],
        faq: [
          {
            question: "Is TTS Easy fully free?",
            answer:
              "The public web generator is free to use with MP3 download. API usage follows separate pricing.",
          },
          {
            question: "When should I keep using ElevenLabs?",
            answer:
              "If your primary requirement is advanced voice cloning control, ElevenLabs may remain preferable.",
          },
        ],
        internalLinksRequired: [
          "/en",
          "/en/use-cases/text-to-speech-for-youtube",
          "/en/use-cases/tts-for-podcasts",
          "/en/tools/character-counter",
          "/en/blog/text-to-speech-api-comparison",
        ],
        ctaVariant: "compare_and_try",
      },
    },
  },
  "openai-tts-alternative": {
    en: {
      slug: "openai-tts-alternative",
      locale: "en",
      title: "OpenAI TTS Alternative for Content Teams",
      description:
        "Compare OpenAI TTS and TTS Easy for creator workflows, multilingual output, and production-ready MP3 delivery.",
      h1: "OpenAI TTS Alternative for High-Volume Publishing",
      intro: [
        "OpenAI TTS is strong for teams already deep in the OpenAI stack. TTS Easy is built for fast creator execution and multilingual publishing without setup drag.",
        "This comparison helps you choose based on content velocity and operational simplicity.",
      ],
      strengths: [
        {
          title: "Creator-first UX",
          detail: "Direct text-to-audio path with fewer operational steps for non-technical teams.",
        },
        {
          title: "Accent handling",
          detail: "Regional variants are surfaced directly for practical localization workflows.",
        },
        {
          title: "Built-in share loop",
          detail: "Share links make quick stakeholder validation easier before publishing.",
        },
      ],
      whenToUse: [
        "Need fast content ops with minimal engineering involvement.",
        "Need consistent narration format for recurring social campaigns.",
        "Need multilingual voiceover iteration with simple controls.",
      ],
      contract: {
        searchIntent: "commercial",
        primaryKeyword: "openai tts alternative",
        secondaryKeywords: [
          "alternative to openai text to speech",
          "best openai tts alternative",
          "tts tool for content creators",
        ],
        faq: [
          {
            question: "Is this only for developers?",
            answer:
              "No. The web app supports no-code workflows, and the API is available for product teams.",
          },
          {
            question: "Can I use this for paid campaigns?",
            answer:
              "Yes, generated MP3 files are suitable for ad creatives, explainers, and social publishing workflows.",
          },
        ],
        internalLinksRequired: [
          "/en",
          "/en/use-cases/tts-for-presentations",
          "/en/use-cases/text-to-speech-for-youtube",
          "/en/tools/language-detector",
          "/en/blog/text-to-speech-api-comparison",
        ],
        ctaVariant: "compare_and_try",
      },
    },
  },
  "free-tts-vs-paid-tools": {
    en: {
      slug: "free-tts-vs-paid-tools",
      locale: "en",
      title: "Free vs Paid Text to Speech Tools",
      description:
        "Understand when free text to speech tools are enough and when paid platforms are worth the cost for scaling production.",
      h1: "Free vs Paid Text to Speech: What Actually Matters",
      intro: [
        "Most teams overpay for TTS too early. The real decision is workflow fit: speed, consistency, and output quality for your channel mix.",
        "Use this framework to decide when a free tool is sufficient and when paid tiers become necessary.",
      ],
      strengths: [
        {
          title: "Cost-efficient validation",
          detail: "Start with free workflows to validate content-market fit before committing to larger spend.",
        },
        {
          title: "Channel-based decision model",
          detail: "Select tooling by publishing channel needs instead of feature checklist inflation.",
        },
        {
          title: "Operational clarity",
          detail: "Reduce tool churn by mapping volume thresholds to upgrade decisions.",
        },
      ],
      whenToUse: [
        "You are launching new content formats and need low-risk experimentation.",
        "You want stable narration quality without immediate enterprise features.",
        "You need to align TTS spend with measurable growth milestones.",
      ],
      contract: {
        searchIntent: "informational",
        primaryKeyword: "free vs paid text to speech",
        secondaryKeywords: [
          "best free text to speech tools",
          "when to pay for text to speech",
          "text to speech pricing comparison",
        ],
        faq: [
          {
            question: "When should I move from free to paid TTS?",
            answer:
              "Upgrade when volume, API automation, or specialized voice controls become clear bottlenecks to growth.",
          },
          {
            question: "Can free tools support consistent publishing?",
            answer:
              "Yes, for many creator workflows free tools are enough through early and mid-stage growth.",
          },
        ],
        internalLinksRequired: [
          "/en",
          "/en/use-cases/free-text-to-speech-online",
          "/en/use-cases/tts-for-students",
          "/en/tools/character-counter",
          "/en/blog/best-free-text-to-speech-tools-2025",
        ],
        ctaVariant: "generate_now",
      },
    },
  },
};

export function getComparePage(slug: string, locale: Locale): ComparePage | null {
  return PAGES[slug]?.[locale] ?? null;
}

export function getCompareSlugs(): string[] {
  return Object.keys(PAGES);
}

export function getCompareLocalizedLocales(slug: string): Locale[] {
  const present = new Set(Object.keys(PAGES[slug] ?? {}));
  return LOCALES.filter((locale) => present.has(locale));
}

export function hasCompareLocalizedContent(slug: string, locale: Locale): boolean {
  return getCompareLocalizedLocales(slug).includes(locale);
}
