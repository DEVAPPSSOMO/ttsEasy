export type UiLanguage = "en" | "es";

export interface UiCopy {
  accentQuestion: string;
  autoMode: string;
  charCount: string;
  cookies: string;
  detectLabel: string;
  detecting: string;
  disclaimer: string;
  download: string;
  generating: string;
  headline: string;
  languageSelect: string;
  manualMode: string;
  pause: string;
  play: string;
  privacy: string;
  readerSelect: string;
  speed: string;
  subtitle: string;
  terms: string;
  textPlaceholder: string;
}

const COPY: Record<UiLanguage, UiCopy> = {
  en: {
    accentQuestion: "Accent is unclear. Do you want to keep {primary} or switch to {secondary}?",
    autoMode: "Auto",
    charCount: "Characters",
    cookies: "Cookies",
    detectLabel: "Detected",
    detecting: "Detecting language...",
    disclaimer: "Text is processed in-memory only and is never stored.",
    download: "Download MP3",
    generating: "Generating...",
    headline: "Text to Speech, instantly",
    languageSelect: "Language/Accent",
    manualMode: "Manual",
    pause: "Pause / Resume",
    play: "Generate & Play",
    privacy: "Privacy",
    readerSelect: "Reader",
    speed: "Speed",
    subtitle: "Paste any text. We detect language + accent and read it aloud.",
    terms: "Terms",
    textPlaceholder: "Paste text here..."
  },
  es: {
    accentQuestion: "Hay duda sobre el acento. ¿Mantener {primary} o cambiar a {secondary}?",
    autoMode: "Auto",
    charCount: "Caracteres",
    cookies: "Cookies",
    detectLabel: "Detectado",
    detecting: "Detectando idioma...",
    disclaimer: "El texto se procesa en memoria y no se guarda.",
    download: "Descargar MP3",
    generating: "Generando...",
    headline: "Texto a Voz al instante",
    languageSelect: "Idioma/Acento",
    manualMode: "Manual",
    pause: "Pausar / Reanudar",
    play: "Generar y reproducir",
    privacy: "Privacidad",
    readerSelect: "Lector",
    speed: "Velocidad",
    subtitle: "Pega cualquier texto. Detectamos idioma + acento y lo leemos.",
    terms: "Términos",
    textPlaceholder: "Pega tu texto aquí..."
  }
};

export function resolveUiLanguage(locale: string | undefined): UiLanguage {
  if (!locale) {
    return "en";
  }
  return locale.toLowerCase().startsWith("es") ? "es" : "en";
}

export function getUiCopy(language: UiLanguage): UiCopy {
  return COPY[language];
}
