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
  alternativeName: string;
  title: string;
  description: string;
  h1: string;
  intro: string[];
  strengths: { title: string; detail: string }[];
  whenToUse: string[];
  methodology: string[];
  benchmarks: { metric: string; ttsEasy: string; alternative: string; whyItMatters: string }[];
  affiliateUrl?: string;
  contract: EditorialContract;
}

type ComparePageMap = Record<string, Partial<Record<Locale, ComparePage>>>;

const PAGES: ComparePageMap = {
  "elevenlabs-alternative": {
    en: {
      slug: "elevenlabs-alternative",
      locale: "en",
      alternativeName: "ElevenLabs",
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
      methodology: [
        "Benchmarked the path from finished script to downloadable MP3 for a creator shipping in the same session.",
        "Weighted the score toward multilingual publishing speed, not voice cloning depth or studio editing features.",
        "Compared how much product setup is required before a non-technical operator can produce usable narration.",
      ],
      benchmarks: [
        {
          metric: "Web onboarding",
          ttsEasy: "Open the generator and produce MP3 without signup.",
          alternative: "Typically starts after account creation and project setup.",
          whyItMatters: "Fewer gates help when you need one-off or same-day publishing.",
        },
        {
          metric: "Localization path",
          ttsEasy: "Accent variants are visible directly in one workflow.",
          alternative: "Richer customization usually means more voice decisions per output.",
          whyItMatters: "This matters when the same script ships across multiple regions.",
        },
        {
          metric: "Export handoff",
          ttsEasy: "MP3 is the default final artifact for publishing.",
          alternative: "Output flow depends more on project setup and voice assets.",
          whyItMatters: "Direct handoff reduces post-production friction for social teams.",
        },
        {
          metric: "Best fit",
          ttsEasy: "Daily explainers, Shorts, and repeatable narration.",
          alternative: "Teams that prioritize deeper voice customization.",
          whyItMatters: "The right choice depends on whether speed or voice control is the bottleneck.",
        },
      ],
      affiliateUrl: "https://elevenlabs.io/",
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
      alternativeName: "OpenAI TTS",
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
      methodology: [
        "Compared the amount of engineering support a content team needs before it can publish from written scripts.",
        "Benchmarks focus on browser-first execution, regional voice routing, and stakeholder review speed.",
        "The table favors production simplicity for marketers and editors over deeper platform extensibility.",
      ],
      benchmarks: [
        {
          metric: "Team setup",
          ttsEasy: "Browser workflow works for non-technical operators.",
          alternative: "Often sits inside an API or app-driven implementation.",
          whyItMatters: "Marketing teams move faster when narration is not blocked on engineering.",
        },
        {
          metric: "Regional routing",
          ttsEasy: "Accent choices are surfaced explicitly in the UI.",
          alternative: "Locale behavior depends on model selection and implementation details.",
          whyItMatters: "Direct routing reduces review loops for multilingual assets.",
        },
        {
          metric: "Approval loop",
          ttsEasy: "Share links and direct MP3 export support quick review.",
          alternative: "Review flow is usually embedded in a broader product stack.",
          whyItMatters: "Faster approvals help when campaigns ship on tight schedules.",
        },
        {
          metric: "Best fit",
          ttsEasy: "Creator teams optimizing for output cadence.",
          alternative: "Products already standardized on a broader OpenAI stack.",
          whyItMatters: "Choose the stack that matches your operating model, not just the model brand.",
        },
      ],
      affiliateUrl: "https://openai.com/",
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
      alternativeName: "Typical paid TTS suite",
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
      methodology: [
        "Compared free and paid workflows by publishing output, not by enterprise feature checklist length.",
        "Used creator operations criteria: validation cost, configuration overhead, and when upgrades become justified.",
        "Benchmarks assume the team already has scripts and needs to turn them into repeatable audio quickly.",
      ],
      benchmarks: [
        {
          metric: "Validation cost",
          ttsEasy: "Start with a free browser workflow before committing budget.",
          alternative: "Recurring subscription or API spend starts earlier.",
          whyItMatters: "Lower upfront cost keeps experimentation cheap while you test channel fit.",
        },
        {
          metric: "Operational overhead",
          ttsEasy: "Minimal setup for straightforward voiceover production.",
          alternative: "More controls usually come with more configuration and QA work.",
          whyItMatters: "Simple workflows are often enough until scale or compliance becomes complex.",
        },
        {
          metric: "Upgrade trigger",
          ttsEasy: "Works well until automation, governance, or higher volume becomes the priority.",
          alternative: "Becomes worth it when scale or workflow controls drive clear ROI.",
          whyItMatters: "Upgrades should follow bottlenecks, not feature anxiety.",
        },
        {
          metric: "Best fit",
          ttsEasy: "Solo creators and early-stage teams validating output fast.",
          alternative: "Ops-heavy teams with established voice pipelines.",
          whyItMatters: "Tooling should match the maturity of your publishing operation.",
        },
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
