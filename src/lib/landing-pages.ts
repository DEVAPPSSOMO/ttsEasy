import type { Locale } from "@/lib/i18n/config";

export interface LandingPage {
  slug: string;
  keyword: string;
  presetLocale?: string;
  category: "use-case" | "language";
}

export const LANDING_PAGES: LandingPage[] = [
  { slug: "text-to-speech-for-youtube", keyword: "text to speech for YouTube", category: "use-case" },
  { slug: "tts-for-podcasts", keyword: "TTS for podcasts", category: "use-case" },
  { slug: "tts-for-accessibility", keyword: "text to speech accessibility", category: "use-case" },
  { slug: "tts-for-students", keyword: "text to speech for students", category: "use-case" },
  { slug: "tts-for-discord", keyword: "text to speech Discord", category: "use-case" },
  { slug: "tts-for-presentations", keyword: "text to speech presentations", category: "use-case" },
  { slug: "text-to-speech-for-ebooks", keyword: "text to speech ebooks", category: "use-case" },
  { slug: "tts-for-language-learning", keyword: "TTS language learning", category: "use-case" },
  { slug: "free-text-to-speech-online", keyword: "free text to speech online", category: "use-case" },
  { slug: "text-to-speech-spanish", keyword: "text to speech Spanish", presetLocale: "es-MX", category: "language" },
  { slug: "text-to-speech-portuguese", keyword: "text to speech Portuguese", presetLocale: "pt-BR", category: "language" },
  { slug: "text-to-speech-french", keyword: "text to speech French", presetLocale: "fr-FR", category: "language" },
  { slug: "text-to-speech-german", keyword: "text to speech German", presetLocale: "de-DE", category: "language" },
  { slug: "text-to-speech-italian", keyword: "text to speech Italian", presetLocale: "it-IT", category: "language" },
  { slug: "text-to-speech-british", keyword: "British English text to speech", presetLocale: "en-GB", category: "language" },
  { slug: "text-to-speech-australian", keyword: "Australian English TTS", presetLocale: "en-AU", category: "language" },
  { slug: "texto-a-voz-mexicano", keyword: "texto a voz mexicano", presetLocale: "es-MX", category: "language" },
  { slug: "texto-a-voz-argentino", keyword: "texto a voz argentino", presetLocale: "es-AR", category: "language" },
  { slug: "texto-a-voz-espanol", keyword: "texto a voz España", presetLocale: "es-ES", category: "language" },
];

export function getLandingPage(slug: string): LandingPage | undefined {
  return LANDING_PAGES.find((p) => p.slug === slug);
}

export interface LandingContent {
  h1: string;
  intro: string[];
  benefits: { title: string; description: string }[];
  steps: string[];
  faq: { question: string; answer: string }[];
}

type LandingContentMap = Record<string, Record<string, LandingContent>>;

const CONTENT: LandingContentMap = {
  "text-to-speech-for-youtube": {
    en: {
      h1: "Free Text to Speech for YouTube Videos",
      intro: [
        "Create professional YouTube voiceovers instantly with AI-powered text to speech. No microphone, no recording studio, no voice talent needed.",
        "TTS Easy converts your script into natural-sounding audio that you can download as MP3 and import directly into your video editor.",
      ],
      benefits: [
        { title: "Save Time", description: "Generate voiceovers in seconds instead of recording, editing, and re-recording." },
        { title: "Consistent Quality", description: "Every voiceover sounds professional with neural AI voices." },
        { title: "Multiple Languages", description: "Create the same video in 6 languages with 11 accent options." },
        { title: "Free & No Signup", description: "No subscription fees, no account required." },
      ],
      steps: [
        "Write your video script with short, clear sentences.",
        "Paste the script into TTS Easy and select your preferred voice style.",
        "Click Generate & Play to preview, then Download MP3.",
        "Import the MP3 into your video editor and sync with visuals.",
      ],
      faq: [
        { question: "Can I monetize YouTube videos with TTS voiceovers?", answer: "Yes. YouTube allows TTS voiceovers as long as the content provides original value. Many successful channels use TTS exclusively." },
        { question: "Which voice style is best for YouTube?", answer: "Natural is best for most content. Use Expressive for storytelling and Clear for tutorials." },
        { question: "What format is the download?", answer: "All audio is downloaded as MP3, compatible with every major video editor." },
      ],
    },
    es: {
      h1: "Texto a Voz Gratis para Videos de YouTube",
      intro: [
        "Crea voces en off profesionales para YouTube al instante con texto a voz impulsado por IA. Sin microfono, sin estudio de grabacion, sin talento vocal.",
        "TTS Easy convierte tu guion en audio de sonido natural que puedes descargar como MP3 e importar directamente en tu editor de video.",
      ],
      benefits: [
        { title: "Ahorra Tiempo", description: "Genera voces en off en segundos en lugar de grabar, editar y regrabar." },
        { title: "Calidad Consistente", description: "Cada voz en off suena profesional con voces neuronales de IA." },
        { title: "Multiples Idiomas", description: "Crea el mismo video en 6 idiomas con 11 opciones de acento." },
        { title: "Gratis y Sin Registro", description: "Sin cuotas de suscripcion, sin cuenta requerida." },
      ],
      steps: [
        "Escribe tu guion de video con oraciones cortas y claras.",
        "Pega el guion en TTS Easy y selecciona tu estilo de voz preferido.",
        "Haz clic en Generar y Reproducir para previsualizar, luego Descargar MP3.",
        "Importa el MP3 en tu editor de video y sincroniza con los visuales.",
      ],
      faq: [
        { question: "¿Puedo monetizar videos de YouTube con voces en off TTS?", answer: "Si. YouTube permite voces en off TTS siempre que el contenido proporcione valor original. Muchos canales exitosos usan TTS exclusivamente." },
        { question: "¿Cual estilo de voz es mejor para YouTube?", answer: "Natural es mejor para la mayoria del contenido. Usa Expresivo para storytelling y Claro para tutoriales." },
        { question: "¿En que formato es la descarga?", answer: "Todo el audio se descarga como MP3, compatible con cada editor de video principal." },
      ],
    },
  },
  "tts-for-podcasts": {
    en: {
      h1: "AI Text to Speech for Podcast Creation",
      intro: [
        "Launch a podcast without recording equipment. AI text to speech lets you create natural-sounding audio episodes from written scripts.",
        "Perfect for news podcasts, educational series, and content repurposing.",
      ],
      benefits: [
        { title: "No Equipment Needed", description: "All you need is a script. TTS Easy handles the voice generation." },
        { title: "Consistent Delivery", description: "AI voices maintain consistent quality across every episode." },
        { title: "Fast Production", description: "Produce episodes in minutes, not hours." },
        { title: "Multilingual Episodes", description: "Create episodes in multiple languages from the same script." },
      ],
      steps: [
        "Write your podcast script with natural conversational phrasing.",
        "Paste it into TTS Easy and choose the Natural voice style for best results.",
        "Download the MP3 and add intro/outro music in your audio editor.",
        "Publish to your podcast platform of choice.",
      ],
      faq: [
        { question: "Can podcast directories detect TTS audio?", answer: "Podcast directories like Spotify and Apple Podcasts accept TTS content. They focus on content quality, not voice production method." },
        { question: "How long can the text be?", answer: "TTS Easy handles texts of various lengths. For longer episodes, break the script into segments." },
        { question: "What voice style works best for podcasts?", answer: "The Natural voice style provides the most conversational tone ideal for podcasts." },
      ],
    },
    es: {
      h1: "IA Texto a Voz para Creacion de Podcasts",
      intro: [
        "Lanza un podcast sin equipo de grabacion. La IA texto a voz te permite crear episodios de audio con sonido natural a partir de guiones escritos.",
        "Perfecto para podcasts de noticias, series educativas y reutilizacion de contenido.",
      ],
      benefits: [
        { title: "Sin Equipo Necesario", description: "Solo necesitas un guion. TTS Easy se encarga de la generacion de voz." },
        { title: "Entrega Consistente", description: "Las voces de IA mantienen calidad consistente en cada episodio." },
        { title: "Produccion Rapida", description: "Produce episodios en minutos, no en horas." },
        { title: "Episodios Multilingues", description: "Crea episodios en multiples idiomas desde el mismo guion." },
      ],
      steps: [
        "Escribe tu guion de podcast con frases conversacionales naturales.",
        "Pegalo en TTS Easy y elige el estilo de voz Natural para mejores resultados.",
        "Descarga el MP3 y agrega musica de intro/outro en tu editor de audio.",
        "Publica en la plataforma de podcast de tu eleccion.",
      ],
      faq: [
        { question: "¿Los directorios de podcast detectan audio TTS?", answer: "Los directorios de podcast como Spotify y Apple Podcasts aceptan contenido TTS. Se enfocan en la calidad del contenido, no en el metodo de produccion de voz." },
        { question: "¿Que tan largo puede ser el texto?", answer: "TTS Easy maneja textos de diversas longitudes. Para episodios mas largos, divide el guion en segmentos." },
        { question: "¿Que estilo de voz funciona mejor para podcasts?", answer: "El estilo de voz Natural proporciona el tono conversacional mas ideal para podcasts." },
      ],
    },
  },
};

const GENERIC_USE_CASE: Record<string, LandingContent> = {
  en: {
    h1: "Free Text to Speech Online",
    intro: [
      "Convert any text to natural-sounding speech with TTS Easy. Automatic language detection, 11 accents, and free MP3 download.",
      "No registration required. Your text is never stored.",
    ],
    benefits: [
      { title: "Instant Conversion", description: "Paste text and get audio in seconds with AI-powered voices." },
      { title: "11 Accents", description: "Choose from US, UK, Australian English, and 8 more accent options." },
      { title: "Free MP3 Download", description: "Download your audio files without any cost or registration." },
      { title: "Privacy First", description: "Your text is processed in-memory and never stored." },
    ],
    steps: [
      "Paste your text into TTS Easy.",
      "The language and accent are detected automatically.",
      "Choose your preferred voice style and click Generate.",
      "Download the MP3 file for free.",
    ],
    faq: [
      { question: "Is it really free?", answer: "Yes, TTS Easy is completely free. No hidden fees, no premium tiers, no registration required." },
      { question: "What languages are supported?", answer: "English, Spanish, Portuguese, French, German, and Italian with 11 regional accent variants." },
      { question: "Is my text stored?", answer: "No. Your text is processed in-memory only and immediately discarded after generating the audio." },
    ],
  },
  es: {
    h1: "Texto a Voz Online Gratis",
    intro: [
      "Convierte cualquier texto a voz natural con TTS Easy. Deteccion automatica de idioma, 11 acentos y descarga MP3 gratis.",
      "Sin registro requerido. Tu texto nunca se almacena.",
    ],
    benefits: [
      { title: "Conversion Instantanea", description: "Pega texto y obtén audio en segundos con voces impulsadas por IA." },
      { title: "11 Acentos", description: "Elige entre ingles de EE.UU., Reino Unido, Australia y 8 opciones mas de acento." },
      { title: "Descarga MP3 Gratis", description: "Descarga tus archivos de audio sin costo ni registro." },
      { title: "Privacidad Primero", description: "Tu texto se procesa en memoria y nunca se almacena." },
    ],
    steps: [
      "Pega tu texto en TTS Easy.",
      "El idioma y acento se detectan automaticamente.",
      "Elige tu estilo de voz preferido y haz clic en Generar.",
      "Descarga el archivo MP3 gratis.",
    ],
    faq: [
      { question: "¿Es realmente gratis?", answer: "Si, TTS Easy es completamente gratis. Sin costos ocultos, sin niveles premium, sin registro requerido." },
      { question: "¿Que idiomas son compatibles?", answer: "Ingles, español, portugues, frances, aleman e italiano con 11 variantes de acento regional." },
      { question: "¿Se almacena mi texto?", answer: "No. Tu texto se procesa solo en memoria e inmediatamente se descarta despues de generar el audio." },
    ],
  },
};

const LANGUAGE_CONTENT: Record<string, Record<string, LandingContent>> = {
  "text-to-speech-spanish": {
    en: {
      h1: "Spanish Text to Speech - Natural Voice Converter",
      intro: [
        "Convert Spanish text to natural-sounding speech with TTS Easy. Supports Mexican, Castilian, and Argentine Spanish accents.",
        "Automatic accent detection or manual selection. Download as MP3 for free.",
      ],
      benefits: [
        { title: "3 Spanish Accents", description: "Mexican, Castilian (Spain), and Argentine Spanish voices available." },
        { title: "Accent Detection", description: "TTS Easy detects whether your text is Mexican, Spanish, or Argentine and selects the matching accent." },
        { title: "Neural AI Voices", description: "Google Cloud-powered voices with natural intonation and rhythm." },
        { title: "Free MP3 Download", description: "Download the generated audio without any registration." },
      ],
      steps: [
        "Paste your Spanish text into TTS Easy.",
        "The system detects the Spanish variant (Mexico, Spain, or Argentina).",
        "Choose your voice style and click Generate & Play.",
        "Download the MP3 file.",
      ],
      faq: [
        { question: "What Spanish accents are available?", answer: "TTS Easy offers Mexican Spanish (es-MX), Castilian Spanish (es-ES), and Argentine Spanish (es-AR)." },
        { question: "How does accent detection work?", answer: "TTS Easy analyzes keywords and patterns in your text to determine the most likely regional variant." },
        { question: "Can I override the detected accent?", answer: "Yes, switch to Manual mode and select any accent from the dropdown." },
      ],
    },
    es: {
      h1: "Texto a Voz en Español - Convertidor de Voz Natural",
      intro: [
        "Convierte texto en español a voz natural con TTS Easy. Soporta acentos mexicano, castellano y argentino.",
        "Deteccion automatica de acento o seleccion manual. Descarga como MP3 gratis.",
      ],
      benefits: [
        { title: "3 Acentos en Español", description: "Voces en español mexicano, castellano (España) y argentino disponibles." },
        { title: "Deteccion de Acento", description: "TTS Easy detecta si tu texto es mexicano, español o argentino y selecciona el acento correspondiente." },
        { title: "Voces de IA Neural", description: "Voces impulsadas por Google Cloud con entonacion y ritmo natural." },
        { title: "Descarga MP3 Gratis", description: "Descarga el audio generado sin ningun registro." },
      ],
      steps: [
        "Pega tu texto en español en TTS Easy.",
        "El sistema detecta la variante de español (Mexico, España o Argentina).",
        "Elige tu estilo de voz y haz clic en Generar y Reproducir.",
        "Descarga el archivo MP3.",
      ],
      faq: [
        { question: "¿Que acentos en español estan disponibles?", answer: "TTS Easy ofrece español mexicano (es-MX), español castellano (es-ES) y español argentino (es-AR)." },
        { question: "¿Como funciona la deteccion de acento?", answer: "TTS Easy analiza palabras clave y patrones en tu texto para determinar la variante regional mas probable." },
        { question: "¿Puedo cambiar el acento detectado?", answer: "Si, cambia al modo Manual y selecciona cualquier acento del menu desplegable." },
      ],
    },
  },
};

export function getLandingContent(slug: string, locale: Locale): LandingContent {
  const specific = CONTENT[slug]?.[locale] ?? LANGUAGE_CONTENT[slug]?.[locale];
  if (specific) return specific;

  const page = getLandingPage(slug);
  if (page) {
    const generic = locale === "es" ? GENERIC_USE_CASE.es : GENERIC_USE_CASE.en;
    return {
      ...generic,
      h1: page.keyword.charAt(0).toUpperCase() + page.keyword.slice(1) + (locale === "es" ? " - Gratis Online" : " - Free Online"),
    };
  }

  return locale === "es" ? GENERIC_USE_CASE.es : GENERIC_USE_CASE.en;
}
