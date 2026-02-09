import { LocaleCandidate } from "@/lib/types";

const DEFAULT_LOCALE_BY_LANGUAGE: Record<string, string> = {
  de: "de-DE",
  en: "en-US",
  es: "es-MX",
  fr: "fr-FR",
  it: "it-IT",
  pt: "pt-BR"
};

const LANGUAGE_VARIANTS: Record<string, string[]> = {
  en: ["en-US", "en-GB", "en-AU"],
  es: ["es-MX", "es-ES", "es-AR"],
  pt: ["pt-BR", "pt-PT"]
};

const LOCALE_LABELS: Record<string, string> = {
  "de-DE": "Deutsch (Deutschland)",
  "en-AU": "English (Australia)",
  "en-GB": "English (United Kingdom)",
  "en-US": "English (United States)",
  "es-AR": "Español (Argentina)",
  "es-ES": "Español (España)",
  "es-MX": "Español (México)",
  "fr-FR": "Français (France)",
  "it-IT": "Italiano (Italia)",
  "pt-BR": "Português (Brasil)",
  "pt-PT": "Português (Portugal)"
};

const LOCALE_HINTS: Record<string, RegExp[]> = {
  "en-AU": [/\bmate\b/gi, /\barvo\b/gi, /\bservo\b/gi, /\bbrekkie\b/gi],
  "en-GB": [/\bcolour\b/gi, /\bflat\b/gi, /\blorry\b/gi, /\bpetrol\b/gi, /\blift\b/gi],
  "en-US": [/\bcolor\b/gi, /\bapartment\b/gi, /\btruck\b/gi, /\bgasoline\b/gi, /\bsidewalk\b/gi],
  "es-AR": [/\bvos\b/gi, /\bche\b/gi, /\bbondi\b/gi, /\blaburo\b/gi],
  "es-ES": [/\bvosotros\b/gi, /\bcoche\b/gi, /\bordenador\b/gi, /\bmóvil\b/gi, /\bvale\b/gi],
  "es-MX": [/\bustedes\b/gi, /\bcarro\b/gi, /\bcomputadora\b/gi, /\bcelular\b/gi, /\bahorita\b/gi],
  "pt-BR": [/\bvocê\b/gi, /\bônibus\b/gi, /\bcelular\b/gi, /\btrem\b/gi, /\blegal\b/gi],
  "pt-PT": [/\btu\b/gi, /\bautocarro\b/gi, /\btelemóvel\b/gi, /\bcomboio\b/gi, /\bfixe\b/gi]
};

export function normalizeLocale(input: string | undefined | null, fallback = "en-US"): string {
  if (!input) {
    return fallback;
  }

  const cleaned = input.trim().replace("_", "-");
  if (!cleaned) {
    return fallback;
  }

  try {
    return new Intl.Locale(cleaned).toString();
  } catch {
    return fallback;
  }
}

export function languageFromLocale(locale: string): string {
  return normalizeLocale(locale).split("-")[0] ?? "en";
}

export function getDefaultLocale(language: string, uiLocale?: string): string {
  const normalizedLanguage = language.toLowerCase();
  const normalizedUi = normalizeLocale(uiLocale ?? "", "en-US");
  if (languageFromLocale(normalizedUi) === normalizedLanguage) {
    return normalizedUi;
  }
  return DEFAULT_LOCALE_BY_LANGUAGE[normalizedLanguage] ?? "en-US";
}

export function getSupportedManualLocales(): string[] {
  return [
    "en-US",
    "en-GB",
    "en-AU",
    "es-MX",
    "es-ES",
    "es-AR",
    "pt-BR",
    "pt-PT",
    "fr-FR",
    "de-DE",
    "it-IT"
  ];
}

export function getLocaleLabel(locale: string): string {
  const normalized = normalizeLocale(locale);
  return LOCALE_LABELS[normalized] ?? normalized;
}

function hintScore(locale: string, text: string): number {
  const hints = LOCALE_HINTS[locale];
  if (!hints) {
    return 0;
  }
  let score = 0;
  for (const pattern of hints) {
    const matches = text.match(pattern);
    if (matches?.length) {
      score += matches.length * 1.6;
    }
  }
  return score;
}

function scoreLocaleCandidates(
  candidates: string[],
  text: string,
  uiLocale?: string
): LocaleCandidate[] {
  const normalizedText = text.toLowerCase();
  const normalizedUi = normalizeLocale(uiLocale ?? "", "en-US");
  const scoreMap = new Map<string, number>();
  for (const candidate of candidates) {
    scoreMap.set(candidate, 1);
  }

  for (const candidate of candidates) {
    const baseLanguage = languageFromLocale(candidate);
    if (languageFromLocale(normalizedUi) === baseLanguage) {
      if (candidate === normalizedUi) {
        scoreMap.set(candidate, (scoreMap.get(candidate) ?? 1) + 0.9);
      } else {
        scoreMap.set(candidate, (scoreMap.get(candidate) ?? 1) + 0.25);
      }
    }

    const clues = hintScore(candidate, normalizedText);
    scoreMap.set(candidate, (scoreMap.get(candidate) ?? 1) + clues);
  }

  const sorted = [...scoreMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const total = sorted.reduce((sum, [, value]) => sum + value, 0) || 1;
  return sorted.map(([locale, value]) => ({
    locale,
    confidence: Number((value / total).toFixed(2))
  }));
}

export function inferLocaleCandidates(
  language: string,
  text: string,
  uiLocale?: string
): LocaleCandidate[] {
  const normalizedLanguage = language.toLowerCase();
  const variants = LANGUAGE_VARIANTS[normalizedLanguage];

  if (variants && variants.length > 0) {
    return scoreLocaleCandidates(variants, text, uiLocale);
  }

  const fallback = getDefaultLocale(normalizedLanguage, uiLocale);
  return [{ locale: fallback, confidence: 1 }];
}
