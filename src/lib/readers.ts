import { getDefaultLocale, languageFromLocale, normalizeLocale } from "@/lib/localeHeuristics";
import { ReaderId, ReaderOption, ReaderTier } from "@/lib/types";

const READER_LABELS: Record<ReaderId, string> = {
  claro: "Claro",
  expresivo: "Expresivo",
  natural: "Natural"
};

const READER_TIERS: Record<ReaderId, ReaderTier> = {
  claro: "standard",
  expresivo: "wavenet",
  natural: "neural2"
};

const VOICE_MATRIX: Record<string, Record<ReaderId, string>> = {
  "de-DE": {
    claro: "de-DE-Standard-A",
    expresivo: "de-DE-Wavenet-B",
    natural: "de-DE-Neural2-B"
  },
  "en-AU": {
    claro: "en-AU-Standard-A",
    expresivo: "en-AU-Wavenet-D",
    natural: "en-AU-Neural2-A"
  },
  "en-GB": {
    claro: "en-GB-Standard-A",
    expresivo: "en-GB-Wavenet-B",
    natural: "en-GB-Neural2-A"
  },
  "en-US": {
    claro: "en-US-Standard-C",
    expresivo: "en-US-Wavenet-D",
    natural: "en-US-Neural2-F"
  },
  "es-AR": {
    claro: "es-US-Standard-C",
    expresivo: "es-US-Wavenet-C",
    natural: "es-US-Neural2-B"
  },
  "es-ES": {
    claro: "es-ES-Standard-A",
    expresivo: "es-ES-Wavenet-C",
    natural: "es-ES-Neural2-B"
  },
  "es-MX": {
    claro: "es-US-Standard-B",
    expresivo: "es-US-Wavenet-B",
    natural: "es-US-Neural2-A"
  },
  "fr-FR": {
    claro: "fr-FR-Standard-A",
    expresivo: "fr-FR-Wavenet-C",
    natural: "fr-FR-Neural2-C"
  },
  "it-IT": {
    claro: "it-IT-Standard-A",
    expresivo: "it-IT-Wavenet-D",
    natural: "it-IT-Neural2-A"
  },
  "pt-BR": {
    claro: "pt-BR-Standard-A",
    expresivo: "pt-BR-Wavenet-B",
    natural: "pt-BR-Neural2-A"
  },
  "pt-PT": {
    claro: "pt-PT-Standard-A",
    expresivo: "pt-PT-Wavenet-C",
    natural: "pt-PT-Standard-B"
  }
};

function fallbackLocaleForLanguage(language: string): string {
  switch (language) {
    case "es":
      return "es-MX";
    case "en":
      return "en-US";
    case "pt":
      return "pt-BR";
    default:
      return getDefaultLocale(language);
  }
}

function resolveVoiceLocale(locale: string): string {
  const normalized = normalizeLocale(locale);
  if (VOICE_MATRIX[normalized]) {
    return normalized;
  }

  const language = languageFromLocale(normalized);
  const languageMatch = Object.keys(VOICE_MATRIX).find((item) => item.startsWith(`${language}-`));
  if (languageMatch) {
    return languageMatch;
  }

  return fallbackLocaleForLanguage(language);
}

export function getReaderOptions(locale: string): ReaderOption[] {
  const normalizedRequestedLocale = normalizeLocale(locale);
  const voiceLocale = resolveVoiceLocale(normalizedRequestedLocale);
  const voices = VOICE_MATRIX[voiceLocale] ?? VOICE_MATRIX["en-US"];
  const ids: ReaderId[] = ["claro", "natural", "expresivo"];

  return ids.map((id) => ({
    id,
    label: READER_LABELS[id],
    provider: "google",
    voiceName: voices[id],
    lang: normalizedRequestedLocale,
    tier: READER_TIERS[id]
  }));
}

export function getReaderById(locale: string, readerId: ReaderId): ReaderOption {
  const options = getReaderOptions(locale);
  const selected = options.find((option) => option.id === readerId);
  return selected ?? options.find((option) => option.id === "natural") ?? options[0];
}
