import {
  getDefaultLocale,
  inferLocaleCandidates,
  languageFromLocale,
  normalizeLocale
} from "@/lib/localeHeuristics";
import { DetectLanguageRequest, DetectLanguageResponse } from "@/lib/types";

const STOP_WORDS: Record<string, Set<string>> = {
  de: new Set(["der", "die", "und", "das", "ist", "nicht", "ein", "ich", "zu", "den", "von", "mit", "auf", "sie", "im"]),
  en: new Set(["the", "and", "is", "are", "you", "for", "with", "not", "this", "that", "from", "have", "your", "be", "on", "in", "of"]),
  es: new Set(["de", "la", "que", "el", "en", "y", "los", "del", "se", "las", "por", "para", "una", "con", "no", "su", "al", "lo"]),
  fr: new Set(["de", "la", "le", "et", "les", "des", "en", "une", "un", "pour", "pas", "dans", "est", "vous", "avec"]),
  it: new Set(["di", "che", "e", "la", "il", "per", "non", "una", "con", "del", "gli", "le", "un", "in", "sono"]),
  pt: new Set(["de", "que", "o", "e", "do", "da", "em", "para", "um", "uma", "não", "com", "os", "as", "por", "se"])
};

const LANGUAGE_CLUES: Record<string, RegExp[]> = {
  de: [/[äöüß]/gi],
  en: [/\b(you|your|the|from|with|please|thanks)\b/gi],
  es: [/[¿¡ñ]/gi, /\b(usted|ustedes|vosotros|vale|hola)\b/gi],
  fr: [/[àâçéèêëîïôùûüÿœ]/gi],
  it: [/[àèéìíîòóù]/gi],
  pt: [/[ãõç]/gi, /\b(não|você|obrigado|obrigada)\b/gi]
};

const ACCENT_AWARE_LANGUAGES = new Set(["en", "es", "pt"]);

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(/\p{L}+/gu);
  return matches ?? [];
}

function scoreLanguage(text: string, tokens: string[], language: string): number {
  let score = 0;
  const stopWords = STOP_WORDS[language];
  for (const token of tokens) {
    if (stopWords.has(token)) {
      score += 1;
    }
  }

  const cluePatterns = LANGUAGE_CLUES[language] ?? [];
  for (const pattern of cluePatterns) {
    const matches = text.match(pattern);
    if (matches?.length) {
      score += matches.length * 0.6;
    }
  }
  return score;
}

function detectBaseLanguage(text: string, uiLocale?: string): { language: string; confidence: number } {
  const tokens = tokenize(text);
  const normalizedText = text.toLowerCase();
  const languageScores = Object.keys(STOP_WORDS).map((language) => ({
    language,
    score: scoreLanguage(normalizedText, tokens, language)
  }));

  const sorted = languageScores.sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const second = sorted[1];
  if (!best || best.score <= 0) {
    const fallback = languageFromLocale(normalizeLocale(uiLocale ?? "en-US"));
    return { language: fallback, confidence: 0.4 };
  }

  const dominance = best.score / ((best.score + (second?.score ?? 0)) || 1);
  const volume = clamp(best.score / 8, 0, 1);
  const confidence = clamp(0.25 + dominance * 0.45 + volume * 0.3, 0, 0.99);
  return {
    language: best.language,
    confidence: Number(confidence.toFixed(2))
  };
}

function computeLocaleAmbiguity(language: string, localeConfidence: number, delta: number): boolean {
  if (!ACCENT_AWARE_LANGUAGES.has(language)) {
    return false;
  }
  return localeConfidence < 0.75 || delta < 0.12;
}

export function detectLanguageAndLocale(payload: DetectLanguageRequest): DetectLanguageResponse {
  const text = payload.text?.trim() ?? "";
  const uiLocale = normalizeLocale(payload.uiLocale ?? "en-US");
  if (!text) {
    const fallbackLanguage = languageFromLocale(uiLocale);
    return {
      language: fallbackLanguage,
      locale: getDefaultLocale(fallbackLanguage, uiLocale),
      languageConfidence: 0,
      localeConfidence: 0,
      localeAmbiguous: false,
      localeCandidates: [],
      reason: "browser_fallback"
    };
  }

  const base = detectBaseLanguage(text, uiLocale);
  const shouldFallback = base.confidence < 0.65;
  const resolvedLanguage = shouldFallback ? languageFromLocale(uiLocale) : base.language;
  const reason: DetectLanguageResponse["reason"] = shouldFallback ? "browser_fallback" : "detected";
  const localeCandidates = inferLocaleCandidates(resolvedLanguage, text, uiLocale).slice(0, 3);
  const primaryLocale = localeCandidates[0]?.locale ?? getDefaultLocale(resolvedLanguage, uiLocale);
  const localeConfidence = Number((localeCandidates[0]?.confidence ?? 0).toFixed(2));
  const secondConfidence = localeCandidates[1]?.confidence ?? 0;
  const ambiguityDelta = Number((localeConfidence - secondConfidence).toFixed(2));

  return {
    language: resolvedLanguage,
    locale: primaryLocale,
    languageConfidence: base.confidence,
    localeConfidence,
    localeAmbiguous: computeLocaleAmbiguity(resolvedLanguage, localeConfidence, ambiguityDelta),
    localeCandidates,
    reason
  };
}
