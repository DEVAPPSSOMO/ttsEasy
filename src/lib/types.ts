export type ReaderId = "claro" | "natural" | "expresivo";
export type ReaderTier = "standard" | "neural2" | "wavenet";
export type LocaleSource = "auto" | "manual";
export type TtsSpeed = 0.75 | 1 | 1.25 | 1.5 | 2;

export interface LocaleCandidate {
  locale: string;
  confidence: number;
}

export interface DetectLanguageRequest {
  text: string;
  uiLocale?: string;
}

export interface DetectLanguageResponse {
  language: string;
  locale: string;
  languageConfidence: number;
  localeConfidence: number;
  localeAmbiguous: boolean;
  localeCandidates: LocaleCandidate[];
  reason: "detected" | "browser_fallback";
}

export interface ReaderOption {
  id: ReaderId;
  label: string;
  provider: "google";
  voiceName: string;
  lang: string;
  tier: ReaderTier;
}

export interface TtsRequest {
  text: string;
  locale: string;
  localeSource: LocaleSource;
  readerId: ReaderId;
  speed: TtsSpeed;
  captchaToken: string;
}
