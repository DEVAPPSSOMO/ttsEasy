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
  "free-text-to-speech-online": {
    en: {
      h1: "Free Text to Speech Online - No Sign Up Required",
      intro: [
        "Convert text to speech instantly with TTS Easy. Powered by Google Cloud AI voices, our free tool delivers studio-quality audio from any text.",
        "Supports 6 languages, 11 accents, and 3 voice styles. Download as MP3 with zero cost and zero registration.",
      ],
      benefits: [
        { title: "100% Free", description: "No hidden costs, no premium tiers, no credit card required. Every feature is free." },
        { title: "No Account Needed", description: "Start converting text immediately. No email, no signup, no verification." },
        { title: "Studio-Quality Voices", description: "Google Cloud neural voices produce natural speech with proper intonation." },
        { title: "Instant MP3 Download", description: "Generate and download your audio file in seconds." },
      ],
      steps: [
        "Type or paste your text into the editor.",
        "TTS Easy automatically detects the language and accent.",
        "Select a voice style: Natural, Clear, or Expressive.",
        "Click Generate & Play, then download your free MP3.",
      ],
      faq: [
        { question: "Is there a character limit?", answer: "TTS Easy supports texts of various lengths. The tool automatically splits longer texts into chunks for processing." },
        { question: "What makes this different from other free TTS tools?", answer: "TTS Easy uses Google Cloud neural voices (not robotic voices), detects language automatically, and requires no account or installation." },
        { question: "Can I use the audio commercially?", answer: "The generated audio can be used for personal projects. For commercial use, check Google Cloud TTS terms of service." },
      ],
    },
    es: {
      h1: "Texto a Voz Online Gratis - Sin Registro",
      intro: [
        "Convierte texto a voz al instante con TTS Easy. Impulsado por voces de IA de Google Cloud, nuestra herramienta gratuita entrega audio de calidad profesional desde cualquier texto.",
        "Soporta 6 idiomas, 11 acentos y 3 estilos de voz. Descarga como MP3 sin costo y sin registro.",
      ],
      benefits: [
        { title: "100% Gratis", description: "Sin costos ocultos, sin niveles premium, sin tarjeta de credito requerida." },
        { title: "Sin Cuenta", description: "Empieza a convertir texto inmediatamente. Sin email, sin registro, sin verificacion." },
        { title: "Voces de Calidad Profesional", description: "Las voces neuronales de Google Cloud producen habla natural con entonacion correcta." },
        { title: "Descarga MP3 Instantanea", description: "Genera y descarga tu archivo de audio en segundos." },
      ],
      steps: [
        "Escribe o pega tu texto en el editor.",
        "TTS Easy detecta automaticamente el idioma y acento.",
        "Selecciona un estilo de voz: Natural, Claro o Expresivo.",
        "Haz clic en Generar y Reproducir, luego descarga tu MP3 gratis.",
      ],
      faq: [
        { question: "¿Hay un limite de caracteres?", answer: "TTS Easy soporta textos de diversas longitudes. La herramienta divide automaticamente textos largos en segmentos para procesarlos." },
        { question: "¿Que diferencia a esta herramienta de otras TTS gratuitas?", answer: "TTS Easy usa voces neuronales de Google Cloud (no voces roboticas), detecta el idioma automaticamente y no requiere cuenta ni instalacion." },
        { question: "¿Puedo usar el audio comercialmente?", answer: "El audio generado puede usarse para proyectos personales. Para uso comercial, consulta los terminos de servicio de Google Cloud TTS." },
      ],
    },
  },
  "tts-for-accessibility": {
    en: {
      h1: "Text to Speech for Accessibility - Make Content Inclusive",
      intro: [
        "Make your written content accessible to people with visual impairments, reading difficulties, or learning disabilities using AI text to speech.",
        "TTS Easy converts articles, documents, and web content into clear, natural-sounding audio that anyone can listen to.",
      ],
      benefits: [
        { title: "Screen Reader Alternative", description: "Provide a human-sounding audio version of your content alongside screen readers." },
        { title: "Dyslexia Support", description: "Audio versions help users with dyslexia consume content without reading strain." },
        { title: "Multiple Speed Options", description: "Listeners can adjust playback speed from 0.75x to 2x to match their preference." },
        { title: "Clear Voice Option", description: "The Clear voice style maximizes intelligibility for accessibility use cases." },
      ],
      steps: [
        "Copy the text content you want to make accessible.",
        "Paste it into TTS Easy and select the Clear voice style.",
        "Adjust speed to 0.75x or 1x for maximum clarity.",
        "Download the MP3 and embed it alongside your written content.",
      ],
      faq: [
        { question: "Is TTS Easy WCAG compliant?", answer: "TTS Easy generates standard MP3 files that you can embed with proper alt text and controls, helping your site meet WCAG audio alternative guidelines." },
        { question: "Which voice style is best for accessibility?", answer: "The Clear voice style is designed for maximum intelligibility. Use it at 1x speed for accessibility content." },
        { question: "Can I generate audio for long documents?", answer: "Yes. For best results with long documents, break them into sections and generate audio for each section." },
      ],
    },
    es: {
      h1: "Texto a Voz para Accesibilidad - Contenido Inclusivo",
      intro: [
        "Haz tu contenido escrito accesible para personas con discapacidad visual, dificultades de lectura o problemas de aprendizaje usando IA de texto a voz.",
        "TTS Easy convierte articulos, documentos y contenido web en audio claro y natural que cualquiera puede escuchar.",
      ],
      benefits: [
        { title: "Alternativa a Lectores de Pantalla", description: "Proporciona una version de audio con sonido humano junto a lectores de pantalla." },
        { title: "Soporte para Dislexia", description: "Las versiones de audio ayudan a usuarios con dislexia a consumir contenido sin esfuerzo de lectura." },
        { title: "Multiples Velocidades", description: "Los oyentes pueden ajustar la velocidad de 0.75x a 2x segun su preferencia." },
        { title: "Voz Clara", description: "El estilo de voz Claro maximiza la inteligibilidad para casos de accesibilidad." },
      ],
      steps: [
        "Copia el contenido de texto que quieres hacer accesible.",
        "Pegalo en TTS Easy y selecciona el estilo de voz Claro.",
        "Ajusta la velocidad a 0.75x o 1x para maxima claridad.",
        "Descarga el MP3 e insertalo junto a tu contenido escrito.",
      ],
      faq: [
        { question: "¿TTS Easy cumple con WCAG?", answer: "TTS Easy genera archivos MP3 estandar que puedes insertar con texto alternativo y controles apropiados, ayudando a tu sitio a cumplir las guias de alternativas de audio WCAG." },
        { question: "¿Cual estilo de voz es mejor para accesibilidad?", answer: "El estilo de voz Claro esta diseñado para maxima inteligibilidad. Usalo a velocidad 1x para contenido de accesibilidad." },
        { question: "¿Puedo generar audio para documentos largos?", answer: "Si. Para mejores resultados con documentos largos, dividelos en secciones y genera audio para cada una." },
      ],
    },
  },
  "tts-for-students": {
    en: {
      h1: "Text to Speech for Students - Study Smarter with Audio",
      intro: [
        "Turn study materials into audio with TTS Easy. Listen to notes, textbook passages, and essays while commuting, exercising, or relaxing.",
        "Research shows that combining reading with listening improves retention by up to 30%. Free for all students, no signup needed.",
      ],
      benefits: [
        { title: "Learn on the Go", description: "Convert notes to MP3 and listen anywhere — on the bus, at the gym, or before bed." },
        { title: "Improve Retention", description: "Dual coding (reading + listening) strengthens memory and comprehension." },
        { title: "Pronunciation Help", description: "Hear correct pronunciation for foreign language vocabulary and phrases." },
        { title: "Proofreading Aid", description: "Listening to your essays read aloud helps catch errors you miss when reading." },
      ],
      steps: [
        "Copy your study notes, textbook passages, or essay draft.",
        "Paste the text into TTS Easy.",
        "Choose Natural voice for study material or Clear for technical content.",
        "Download the MP3 and add it to your study playlist.",
      ],
      faq: [
        { question: "Is TTS Easy free for students?", answer: "Yes, TTS Easy is completely free for everyone. No student email or verification required." },
        { question: "Can I convert entire textbook chapters?", answer: "You can convert text of various lengths. For very long chapters, split into sections for best results." },
        { question: "Does listening to notes actually help?", answer: "Studies in educational psychology show that multimodal learning (combining visual and auditory input) improves information retention significantly." },
      ],
    },
    es: {
      h1: "Texto a Voz para Estudiantes - Estudia con Audio",
      intro: [
        "Convierte tus materiales de estudio en audio con TTS Easy. Escucha apuntes, pasajes de libros y ensayos mientras te transportas, ejercitas o descansas.",
        "Investigaciones muestran que combinar lectura con escucha mejora la retencion hasta un 30%. Gratis para todos, sin registro.",
      ],
      benefits: [
        { title: "Aprende en Movimiento", description: "Convierte apuntes a MP3 y escucha donde sea — en el bus, gimnasio o antes de dormir." },
        { title: "Mejora la Retencion", description: "La doble codificacion (leer + escuchar) fortalece la memoria y comprension." },
        { title: "Ayuda con Pronunciacion", description: "Escucha la pronunciacion correcta de vocabulario y frases en idiomas extranjeros." },
        { title: "Revision de Textos", description: "Escuchar tus ensayos en voz alta ayuda a detectar errores que no ves al leer." },
      ],
      steps: [
        "Copia tus apuntes de estudio, pasajes de libros o borrador de ensayo.",
        "Pega el texto en TTS Easy.",
        "Elige voz Natural para material de estudio o Claro para contenido tecnico.",
        "Descarga el MP3 y agregalo a tu playlist de estudio.",
      ],
      faq: [
        { question: "¿TTS Easy es gratis para estudiantes?", answer: "Si, TTS Easy es completamente gratis para todos. No se requiere email estudiantil ni verificacion." },
        { question: "¿Puedo convertir capitulos enteros de libros?", answer: "Puedes convertir textos de diversas longitudes. Para capitulos muy largos, divide en secciones para mejores resultados." },
        { question: "¿Escuchar apuntes realmente ayuda?", answer: "Estudios en psicologia educativa muestran que el aprendizaje multimodal (combinando input visual y auditivo) mejora la retencion de informacion significativamente." },
      ],
    },
  },
  "tts-for-discord": {
    en: {
      h1: "Text to Speech for Discord - Custom TTS Messages",
      intro: [
        "Generate custom TTS audio for your Discord server. Create announcements, memes, and voice messages with natural-sounding AI voices.",
        "TTS Easy offers more voice variety and better quality than Discord's built-in /tts command.",
      ],
      benefits: [
        { title: "Better Than /tts", description: "Discord's built-in TTS uses a basic robotic voice. TTS Easy provides 3 natural AI voice styles." },
        { title: "Multiple Accents", description: "Generate messages in 11 different accents for fun or multilingual servers." },
        { title: "Downloadable MP3", description: "Download the audio and share it directly in Discord voice channels or text channels." },
        { title: "Speed Control", description: "Adjust speed from 0.75x to 2x for dramatic or comedic effects." },
      ],
      steps: [
        "Type or paste your message text.",
        "Select the accent and voice style you want.",
        "Adjust speed for dramatic effect (slow) or comedy (fast).",
        "Download the MP3 and drag it into your Discord chat.",
      ],
      faq: [
        { question: "How is this different from Discord /tts?", answer: "Discord's /tts uses a basic system voice and only works in real-time. TTS Easy generates high-quality AI audio you can download and reuse." },
        { question: "Can I use TTS Easy for Discord bots?", answer: "You can manually generate audio and upload it. For automated bot integration, you would need to use the audio files programmatically." },
        { question: "What accents work best for Discord?", answer: "It depends on your server's audience. British and Australian accents are popular for entertainment, while US English works best for clarity." },
      ],
    },
    es: {
      h1: "Texto a Voz para Discord - Mensajes TTS Personalizados",
      intro: [
        "Genera audio TTS personalizado para tu servidor de Discord. Crea anuncios, memes y mensajes de voz con voces naturales de IA.",
        "TTS Easy ofrece mas variedad de voces y mejor calidad que el comando /tts integrado de Discord.",
      ],
      benefits: [
        { title: "Mejor que /tts", description: "El TTS integrado de Discord usa una voz robotica basica. TTS Easy ofrece 3 estilos de voz natural con IA." },
        { title: "Multiples Acentos", description: "Genera mensajes en 11 acentos diferentes para servidores multilingues o por diversion." },
        { title: "MP3 Descargable", description: "Descarga el audio y compartelo directamente en canales de voz o texto de Discord." },
        { title: "Control de Velocidad", description: "Ajusta la velocidad de 0.75x a 2x para efectos dramaticos o comicos." },
      ],
      steps: [
        "Escribe o pega el texto de tu mensaje.",
        "Selecciona el acento y estilo de voz deseado.",
        "Ajusta la velocidad para efecto dramatico (lento) o comedia (rapido).",
        "Descarga el MP3 y arrastralo a tu chat de Discord.",
      ],
      faq: [
        { question: "¿En que se diferencia del /tts de Discord?", answer: "El /tts de Discord usa una voz basica del sistema y solo funciona en tiempo real. TTS Easy genera audio de IA de alta calidad que puedes descargar y reutilizar." },
        { question: "¿Puedo usar TTS Easy para bots de Discord?", answer: "Puedes generar audio manualmente y subirlo. Para integracion automatizada con bots, necesitarias usar los archivos de audio programaticamente." },
        { question: "¿Que acentos funcionan mejor para Discord?", answer: "Depende de la audiencia de tu servidor. Los acentos britanico y australiano son populares para entretenimiento, mientras que el ingles americano funciona mejor para claridad." },
      ],
    },
  },
  "tts-for-presentations": {
    en: {
      h1: "Text to Speech for Presentations - Add Professional Narration",
      intro: [
        "Add professional voiceover narration to your presentations without recording yourself. TTS Easy generates natural-sounding audio from your speaker notes.",
        "Perfect for automated kiosk presentations, video exports, and speakers who prefer AI narration.",
      ],
      benefits: [
        { title: "Professional Narration", description: "AI voices sound polished and consistent throughout your entire presentation." },
        { title: "No Microphone Needed", description: "Generate narration from text alone. No recording equipment or quiet room required." },
        { title: "Easy Updates", description: "Changed a slide? Regenerate just that segment's audio instead of re-recording everything." },
        { title: "Multilingual Presentations", description: "Create the same presentation with narration in multiple languages." },
      ],
      steps: [
        "Write speaker notes for each slide in your presentation.",
        "Paste each slide's notes into TTS Easy and generate audio.",
        "Download the MP3 files for each slide.",
        "Insert the audio files into your PowerPoint, Keynote, or Google Slides presentation.",
      ],
      faq: [
        { question: "Can I add TTS audio to PowerPoint?", answer: "Yes. Download the MP3 from TTS Easy, then insert it into any slide via Insert > Audio in PowerPoint." },
        { question: "Which voice style works best for presentations?", answer: "Natural for most presentations. Use Clear for technical or data-heavy slides where intelligibility matters most." },
        { question: "How do I sync audio with slide transitions?", answer: "Generate a separate MP3 for each slide's notes. This gives you precise control over timing in your presentation software." },
      ],
    },
    es: {
      h1: "Texto a Voz para Presentaciones - Narracion Profesional",
      intro: [
        "Agrega narracion profesional a tus presentaciones sin grabarte. TTS Easy genera audio natural a partir de tus notas de orador.",
        "Perfecto para presentaciones automatizadas en kioscos, exportaciones de video y oradores que prefieren narracion por IA.",
      ],
      benefits: [
        { title: "Narracion Profesional", description: "Las voces de IA suenan pulidas y consistentes durante toda la presentacion." },
        { title: "Sin Microfono", description: "Genera narracion solo desde texto. Sin equipo de grabacion ni sala silenciosa." },
        { title: "Actualizaciones Faciles", description: "¿Cambiaste una diapositiva? Regenera solo el audio de ese segmento en vez de regrabar todo." },
        { title: "Presentaciones Multilingues", description: "Crea la misma presentacion con narracion en multiples idiomas." },
      ],
      steps: [
        "Escribe notas de orador para cada diapositiva de tu presentacion.",
        "Pega las notas de cada diapositiva en TTS Easy y genera el audio.",
        "Descarga los archivos MP3 para cada diapositiva.",
        "Inserta los archivos de audio en tu presentacion de PowerPoint, Keynote o Google Slides.",
      ],
      faq: [
        { question: "¿Puedo agregar audio TTS a PowerPoint?", answer: "Si. Descarga el MP3 de TTS Easy, luego insertalo en cualquier diapositiva via Insertar > Audio en PowerPoint." },
        { question: "¿Que estilo de voz funciona mejor para presentaciones?", answer: "Natural para la mayoria de presentaciones. Usa Claro para diapositivas tecnicas o con muchos datos donde la inteligibilidad es lo mas importante." },
        { question: "¿Como sincronizo el audio con las transiciones?", answer: "Genera un MP3 separado para las notas de cada diapositiva. Esto te da control preciso sobre el tiempo en tu software de presentacion." },
      ],
    },
  },
  "text-to-speech-for-ebooks": {
    en: {
      h1: "Text to Speech for Ebooks - Listen to Any Book",
      intro: [
        "Turn any ebook or digital text into an audiobook with TTS Easy. Copy passages from your ebook reader and convert them to natural-sounding audio.",
        "Ideal for readers who want to switch between reading and listening, or who prefer audio format for certain content.",
      ],
      benefits: [
        { title: "Any Book, Any Format", description: "Copy text from Kindle, EPUB readers, PDFs, or any digital source and convert it to audio." },
        { title: "Natural Reading Voice", description: "AI voices read with proper pacing, pauses, and intonation — not like a robot." },
        { title: "Adjustable Speed", description: "Speed up to 1.5x or 2x for faster consumption, or slow down to 0.75x for dense material." },
        { title: "Free Audiobook Creation", description: "Create audio versions of public domain books or your own writing at no cost." },
      ],
      steps: [
        "Copy a chapter or passage from your ebook.",
        "Paste it into TTS Easy and select the Natural voice style.",
        "Preview the audio, then download the MP3.",
        "Transfer to your phone or music player for on-the-go listening.",
      ],
      faq: [
        { question: "Can I convert an entire book?", answer: "You can convert text chapter by chapter. For long books, process one chapter at a time and create a playlist of MP3 files." },
        { question: "Is this legal?", answer: "Converting ebooks you own for personal listening is generally considered fair use. Do not distribute the generated audio of copyrighted works." },
        { question: "How does TTS compare to professional audiobooks?", answer: "Professional audiobooks feature human narrators with dramatic interpretation. TTS audio is consistent and clear but less dramatic. It's an excellent free alternative." },
      ],
    },
    es: {
      h1: "Texto a Voz para Ebooks - Escucha Cualquier Libro",
      intro: [
        "Convierte cualquier ebook o texto digital en un audiolibro con TTS Easy. Copia pasajes de tu lector de ebooks y convierte a audio natural.",
        "Ideal para lectores que quieren alternar entre leer y escuchar, o que prefieren formato de audio para cierto contenido.",
      ],
      benefits: [
        { title: "Cualquier Libro, Cualquier Formato", description: "Copia texto de Kindle, lectores EPUB, PDFs o cualquier fuente digital y conviertelo a audio." },
        { title: "Voz de Lectura Natural", description: "Las voces de IA leen con ritmo, pausas y entonacion apropiados — no como un robot." },
        { title: "Velocidad Ajustable", description: "Acelera a 1.5x o 2x para consumo rapido, o reduce a 0.75x para material denso." },
        { title: "Audiolibros Gratis", description: "Crea versiones de audio de libros de dominio publico o tu propia escritura sin costo." },
      ],
      steps: [
        "Copia un capitulo o pasaje de tu ebook.",
        "Pegalo en TTS Easy y selecciona el estilo de voz Natural.",
        "Previsualiza el audio, luego descarga el MP3.",
        "Transfiere a tu telefono o reproductor de musica para escuchar en movimiento.",
      ],
      faq: [
        { question: "¿Puedo convertir un libro entero?", answer: "Puedes convertir texto capitulo por capitulo. Para libros largos, procesa un capitulo a la vez y crea una playlist de archivos MP3." },
        { question: "¿Es legal?", answer: "Convertir ebooks que posees para escucha personal se considera generalmente uso justo. No distribuyas el audio generado de obras con derechos de autor." },
        { question: "¿Como se compara TTS con audiolibros profesionales?", answer: "Los audiolibros profesionales cuentan con narradores humanos con interpretacion dramatica. El audio TTS es consistente y claro pero menos dramatico. Es una excelente alternativa gratuita." },
      ],
    },
  },
  "tts-for-language-learning": {
    en: {
      h1: "Text to Speech for Language Learning - Perfect Your Pronunciation",
      intro: [
        "Use TTS Easy as your pronunciation coach. Hear any word or phrase spoken with the correct accent and intonation in 6 languages.",
        "Practice Spanish, Portuguese, French, German, Italian, and English with native-sounding AI voices. Repeat as many times as you need.",
      ],
      benefits: [
        { title: "Native Pronunciation", description: "AI voices trained on native speakers provide accurate pronunciation models for each language." },
        { title: "11 Regional Accents", description: "Learn the difference between Mexican and Argentine Spanish, American and British English, and more." },
        { title: "Adjustable Speed", description: "Slow down to 0.75x to hear individual sounds clearly, then practice at normal speed." },
        { title: "Unlimited Repetition", description: "Generate the same phrase as many times as you need. No limits on practice." },
      ],
      steps: [
        "Type the word or phrase you want to practice.",
        "Select the target language and regional accent.",
        "Use 0.75x speed to hear sounds clearly, then increase to 1x.",
        "Download the MP3 to build a personal pronunciation library.",
      ],
      faq: [
        { question: "Which languages can I practice?", answer: "English (US, UK, Australian), Spanish (Mexican, Castilian, Argentine), Portuguese (Brazilian), French, German, and Italian." },
        { question: "How accurate is the pronunciation?", answer: "TTS Easy uses Google Cloud neural voices trained on native speakers. Pronunciation accuracy is very high for standard dialects." },
        { question: "Can I practice individual words?", answer: "Yes. You can enter single words, phrases, or full sentences. Short inputs work perfectly for vocabulary practice." },
      ],
    },
    es: {
      h1: "Texto a Voz para Aprender Idiomas - Perfecciona tu Pronunciacion",
      intro: [
        "Usa TTS Easy como tu coach de pronunciacion. Escucha cualquier palabra o frase con el acento y entonacion correctos en 6 idiomas.",
        "Practica español, portugues, frances, aleman, italiano e ingles con voces de IA nativas. Repite tantas veces como necesites.",
      ],
      benefits: [
        { title: "Pronunciacion Nativa", description: "Voces de IA entrenadas con hablantes nativos proporcionan modelos de pronunciacion precisos para cada idioma." },
        { title: "11 Acentos Regionales", description: "Aprende la diferencia entre español mexicano y argentino, ingles americano y britanico, y mas." },
        { title: "Velocidad Ajustable", description: "Reduce a 0.75x para escuchar sonidos individuales claramente, luego practica a velocidad normal." },
        { title: "Repeticion Ilimitada", description: "Genera la misma frase tantas veces como necesites. Sin limites para practicar." },
      ],
      steps: [
        "Escribe la palabra o frase que quieres practicar.",
        "Selecciona el idioma objetivo y acento regional.",
        "Usa velocidad 0.75x para escuchar sonidos claramente, luego aumenta a 1x.",
        "Descarga el MP3 para construir tu biblioteca personal de pronunciacion.",
      ],
      faq: [
        { question: "¿Que idiomas puedo practicar?", answer: "Ingles (EE.UU., Reino Unido, Australia), español (mexicano, castellano, argentino), portugues (brasileño), frances, aleman e italiano." },
        { question: "¿Que tan precisa es la pronunciacion?", answer: "TTS Easy usa voces neuronales de Google Cloud entrenadas con hablantes nativos. La precision de pronunciacion es muy alta para dialectos estandar." },
        { question: "¿Puedo practicar palabras individuales?", answer: "Si. Puedes ingresar palabras sueltas, frases u oraciones completas. Los textos cortos funcionan perfectamente para practicar vocabulario." },
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
  "text-to-speech-portuguese": {
    en: {
      h1: "Portuguese Text to Speech - Brazilian Voice Converter",
      intro: [
        "Convert Portuguese text to natural-sounding speech with TTS Easy. Optimized for Brazilian Portuguese with authentic accent and intonation.",
        "Automatic language detection recognizes Portuguese instantly. Download as MP3 for free.",
      ],
      benefits: [
        { title: "Brazilian Portuguese", description: "AI voice trained specifically on Brazilian Portuguese for authentic pronunciation." },
        { title: "Auto Detection", description: "TTS Easy instantly recognizes Portuguese text and selects the correct voice." },
        { title: "Natural Intonation", description: "Google Cloud neural voices capture the melodic rhythm of Brazilian Portuguese." },
        { title: "Free MP3 Download", description: "Generate and download audio without registration or payment." },
      ],
      steps: [
        "Paste your Portuguese text into TTS Easy.",
        "The system automatically detects Portuguese and selects the Brazilian voice.",
        "Choose your preferred voice style and speed.",
        "Download the MP3 file.",
      ],
      faq: [
        { question: "Which Portuguese accent is used?", answer: "TTS Easy uses Brazilian Portuguese (pt-BR) voices powered by Google Cloud." },
        { question: "Is European Portuguese supported?", answer: "Currently TTS Easy offers Brazilian Portuguese voices. European Portuguese text will be read with a Brazilian accent." },
        { question: "Can I use this for Portuguese learning?", answer: "Yes. Use the 0.75x speed option to hear pronunciation clearly and practice speaking along." },
      ],
    },
    es: {
      h1: "Texto a Voz en Portugues - Convertidor de Voz Brasileña",
      intro: [
        "Convierte texto en portugues a voz natural con TTS Easy. Optimizado para portugues brasileño con acento y entonacion autenticos.",
        "La deteccion automatica reconoce portugues al instante. Descarga como MP3 gratis.",
      ],
      benefits: [
        { title: "Portugues Brasileño", description: "Voz de IA entrenada especificamente en portugues brasileño para pronunciacion autentica." },
        { title: "Deteccion Automatica", description: "TTS Easy reconoce texto en portugues al instante y selecciona la voz correcta." },
        { title: "Entonacion Natural", description: "Las voces neuronales de Google Cloud capturan el ritmo melodico del portugues brasileño." },
        { title: "Descarga MP3 Gratis", description: "Genera y descarga audio sin registro ni pago." },
      ],
      steps: [
        "Pega tu texto en portugues en TTS Easy.",
        "El sistema detecta portugues automaticamente y selecciona la voz brasileña.",
        "Elige tu estilo de voz y velocidad preferidos.",
        "Descarga el archivo MP3.",
      ],
      faq: [
        { question: "¿Que acento de portugues se usa?", answer: "TTS Easy usa voces de portugues brasileño (pt-BR) impulsadas por Google Cloud." },
        { question: "¿Se soporta portugues europeo?", answer: "Actualmente TTS Easy ofrece voces de portugues brasileño. El texto en portugues europeo se leera con acento brasileño." },
        { question: "¿Puedo usar esto para aprender portugues?", answer: "Si. Usa la opcion de velocidad 0.75x para escuchar la pronunciacion claramente y practicar." },
      ],
    },
  },
  "text-to-speech-french": {
    en: {
      h1: "French Text to Speech - Natural Voice Generator",
      intro: [
        "Convert French text to natural-sounding speech with TTS Easy. AI-powered voices capture authentic French pronunciation, liaisons, and nasal vowels.",
        "Perfect for French learners, content creators, and anyone needing French audio. Free MP3 download.",
      ],
      benefits: [
        { title: "Authentic French Accent", description: "Neural AI voice trained on native French speakers with proper liaisons and elisions." },
        { title: "Instant Detection", description: "TTS Easy recognizes French text automatically — no manual language selection needed." },
        { title: "Pronunciation Practice", description: "Hear French words pronounced correctly to improve your speaking skills." },
        { title: "Free & Unlimited", description: "No account, no payment, no limits on how many times you generate audio." },
      ],
      steps: [
        "Type or paste your French text.",
        "TTS Easy detects French automatically and applies the correct voice.",
        "Select your voice style and speed preference.",
        "Download the MP3 for free.",
      ],
      faq: [
        { question: "Does TTS Easy handle French liaisons correctly?", answer: "Yes. Google Cloud neural voices are trained on native French speech patterns, including liaisons, elisions, and nasal vowels." },
        { question: "Can I practice French pronunciation?", answer: "Yes. Use TTS Easy at 0.75x speed to hear individual sounds, then practice repeating at normal speed." },
        { question: "Which French accent is used?", answer: "TTS Easy uses standard Metropolitan French (fr-FR) voices." },
      ],
    },
    es: {
      h1: "Texto a Voz en Frances - Generador de Voz Natural",
      intro: [
        "Convierte texto en frances a voz natural con TTS Easy. Voces de IA capturan la pronunciacion autentica francesa, enlaces y vocales nasales.",
        "Perfecto para estudiantes de frances, creadores de contenido y cualquiera que necesite audio en frances. Descarga MP3 gratis.",
      ],
      benefits: [
        { title: "Acento Frances Autentico", description: "Voz de IA neural entrenada con hablantes nativos franceses con enlaces y elisiones correctos." },
        { title: "Deteccion Instantanea", description: "TTS Easy reconoce texto en frances automaticamente — sin seleccion manual de idioma." },
        { title: "Practica de Pronunciacion", description: "Escucha palabras en frances pronunciadas correctamente para mejorar tus habilidades de habla." },
        { title: "Gratis e Ilimitado", description: "Sin cuenta, sin pago, sin limites en cuantas veces generas audio." },
      ],
      steps: [
        "Escribe o pega tu texto en frances.",
        "TTS Easy detecta frances automaticamente y aplica la voz correcta.",
        "Selecciona tu estilo de voz y velocidad preferida.",
        "Descarga el MP3 gratis.",
      ],
      faq: [
        { question: "¿TTS Easy maneja correctamente los enlaces franceses?", answer: "Si. Las voces neuronales de Google Cloud estan entrenadas en patrones de habla nativa francesa, incluyendo enlaces, elisiones y vocales nasales." },
        { question: "¿Puedo practicar pronunciacion en frances?", answer: "Si. Usa TTS Easy a velocidad 0.75x para escuchar sonidos individuales, luego practica repitiendo a velocidad normal." },
        { question: "¿Que acento frances se usa?", answer: "TTS Easy usa voces de frances metropolitano estandar (fr-FR)." },
      ],
    },
  },
  "text-to-speech-german": {
    en: {
      h1: "German Text to Speech - Natural Voice Converter",
      intro: [
        "Convert German text to natural-sounding speech with TTS Easy. AI voices handle compound words, umlauts, and German sentence structure accurately.",
        "Free online tool with instant MP3 download. No registration required.",
      ],
      benefits: [
        { title: "German Pronunciation", description: "Neural AI voices correctly pronounce umlauts, compound words, and German phonetics." },
        { title: "Auto Detection", description: "TTS Easy identifies German text instantly and applies the correct voice." },
        { title: "Language Learning", description: "Hear correct German pronunciation for vocabulary study and conversation practice." },
        { title: "Free Download", description: "Download audio as MP3 at no cost. No account or signup needed." },
      ],
      steps: [
        "Paste your German text into TTS Easy.",
        "The system detects German and selects the appropriate voice.",
        "Choose voice style and playback speed.",
        "Download your free MP3.",
      ],
      faq: [
        { question: "Does TTS Easy handle German compound words?", answer: "Yes. Google Cloud neural voices are trained on German speech and correctly pronounce compound words, umlauts, and special characters." },
        { question: "Which German accent is used?", answer: "TTS Easy uses standard High German (Hochdeutsch) voices (de-DE)." },
        { question: "Can I use this for German homework?", answer: "Yes. TTS Easy is a helpful pronunciation reference for German language students." },
      ],
    },
    es: {
      h1: "Texto a Voz en Aleman - Convertidor de Voz Natural",
      intro: [
        "Convierte texto en aleman a voz natural con TTS Easy. Las voces de IA manejan palabras compuestas, diéresis y estructura oracional alemana con precision.",
        "Herramienta en linea gratuita con descarga MP3 instantanea. Sin registro requerido.",
      ],
      benefits: [
        { title: "Pronunciacion Alemana", description: "Voces de IA neuronales pronuncian correctamente diéresis, palabras compuestas y fonetica alemana." },
        { title: "Deteccion Automatica", description: "TTS Easy identifica texto en aleman al instante y aplica la voz correcta." },
        { title: "Aprendizaje de Idiomas", description: "Escucha la pronunciacion correcta del aleman para estudio de vocabulario y practica conversacional." },
        { title: "Descarga Gratis", description: "Descarga audio como MP3 sin costo. Sin cuenta ni registro." },
      ],
      steps: [
        "Pega tu texto en aleman en TTS Easy.",
        "El sistema detecta aleman y selecciona la voz apropiada.",
        "Elige el estilo de voz y velocidad de reproduccion.",
        "Descarga tu MP3 gratis.",
      ],
      faq: [
        { question: "¿TTS Easy maneja palabras compuestas en aleman?", answer: "Si. Las voces neuronales de Google Cloud estan entrenadas en habla alemana y pronuncian correctamente palabras compuestas, diéresis y caracteres especiales." },
        { question: "¿Que acento aleman se usa?", answer: "TTS Easy usa voces de aleman estandar (Hochdeutsch) (de-DE)." },
        { question: "¿Puedo usar esto para tareas de aleman?", answer: "Si. TTS Easy es una referencia util de pronunciacion para estudiantes de idioma aleman." },
      ],
    },
  },
  "text-to-speech-italian": {
    en: {
      h1: "Italian Text to Speech - Natural Voice Generator",
      intro: [
        "Convert Italian text to natural-sounding speech with TTS Easy. AI voices capture the musicality and rhythm of spoken Italian.",
        "Automatic language detection, free MP3 download, no registration needed.",
      ],
      benefits: [
        { title: "Authentic Italian Voice", description: "Neural AI voice trained on native Italian speakers with proper stress patterns and double consonants." },
        { title: "Musical Intonation", description: "Google Cloud voices capture the characteristic melodic rhythm of Italian speech." },
        { title: "Pronunciation Guide", description: "Hear correct Italian pronunciation for words, phrases, and full sentences." },
        { title: "Free & Instant", description: "No signup, no cost. Generate Italian audio in seconds." },
      ],
      steps: [
        "Type or paste your Italian text.",
        "TTS Easy detects Italian automatically.",
        "Select voice style and speed.",
        "Download the MP3 for free.",
      ],
      faq: [
        { question: "Does TTS Easy handle Italian double consonants?", answer: "Yes. Google Cloud neural voices are trained on native Italian speech and correctly produce double consonant pronunciation." },
        { question: "Which Italian accent is used?", answer: "TTS Easy uses standard Italian (it-IT) voices." },
        { question: "Can I use this to practice Italian?", answer: "Yes. TTS Easy is excellent for Italian pronunciation practice. Use the slow speed option to hear sounds clearly." },
      ],
    },
    es: {
      h1: "Texto a Voz en Italiano - Generador de Voz Natural",
      intro: [
        "Convierte texto en italiano a voz natural con TTS Easy. Las voces de IA capturan la musicalidad y ritmo del italiano hablado.",
        "Deteccion automatica de idioma, descarga MP3 gratis, sin registro necesario.",
      ],
      benefits: [
        { title: "Voz Italiana Autentica", description: "Voz de IA neural entrenada con hablantes nativos italianos con patrones de acento y consonantes dobles correctos." },
        { title: "Entonacion Musical", description: "Las voces de Google Cloud capturan el ritmo melodico caracteristico del habla italiana." },
        { title: "Guia de Pronunciacion", description: "Escucha la pronunciacion correcta en italiano de palabras, frases y oraciones completas." },
        { title: "Gratis e Instantaneo", description: "Sin registro, sin costo. Genera audio en italiano en segundos." },
      ],
      steps: [
        "Escribe o pega tu texto en italiano.",
        "TTS Easy detecta italiano automaticamente.",
        "Selecciona estilo de voz y velocidad.",
        "Descarga el MP3 gratis.",
      ],
      faq: [
        { question: "¿TTS Easy maneja las consonantes dobles italianas?", answer: "Si. Las voces neuronales de Google Cloud estan entrenadas en habla nativa italiana y producen correctamente la pronunciacion de consonantes dobles." },
        { question: "¿Que acento italiano se usa?", answer: "TTS Easy usa voces de italiano estandar (it-IT)." },
        { question: "¿Puedo usar esto para practicar italiano?", answer: "Si. TTS Easy es excelente para practicar pronunciacion en italiano. Usa la opcion de velocidad lenta para escuchar los sonidos claramente." },
      ],
    },
  },
  "text-to-speech-british": {
    en: {
      h1: "British English Text to Speech - UK Voice Generator",
      intro: [
        "Generate natural British English speech with TTS Easy. AI voices deliver authentic RP (Received Pronunciation) accent for your text.",
        "Perfect for creating British-accented content, voiceovers, or practicing British pronunciation. Free MP3 download.",
      ],
      benefits: [
        { title: "Authentic British Accent", description: "Google Cloud AI voice trained on British English speakers with proper RP pronunciation." },
        { title: "British vs American", description: "Choose specifically between British (en-GB) and American (en-US) pronunciation for the same text." },
        { title: "Content Creation", description: "Create British-accented voiceovers for videos, presentations, and audio content." },
        { title: "Free & Instant", description: "No account needed. Generate and download British English audio for free." },
      ],
      steps: [
        "Paste your English text into TTS Easy.",
        "Switch to Manual mode and select English (UK) from the accent dropdown.",
        "Choose your voice style and speed.",
        "Download the MP3 with British pronunciation.",
      ],
      faq: [
        { question: "What type of British accent is used?", answer: "TTS Easy uses an RP (Received Pronunciation) accent, commonly known as standard British English." },
        { question: "Will British spellings affect pronunciation?", answer: "The AI voice handles both British and American spellings correctly, but selects British pronunciation patterns when using the en-GB voice." },
        { question: "Can I compare British and American pronunciation?", answer: "Yes. Generate the same text with en-GB and en-US voices to hear the difference." },
      ],
    },
    es: {
      h1: "Texto a Voz en Ingles Britanico - Generador de Voz UK",
      intro: [
        "Genera habla natural en ingles britanico con TTS Easy. Las voces de IA entregan un acento RP (Pronunciacion Recibida) autentico para tu texto.",
        "Perfecto para crear contenido con acento britanico, voces en off o practicar pronunciacion britanica. Descarga MP3 gratis.",
      ],
      benefits: [
        { title: "Acento Britanico Autentico", description: "Voz de IA de Google Cloud entrenada con hablantes de ingles britanico con pronunciacion RP correcta." },
        { title: "Britanico vs Americano", description: "Elige especificamente entre pronunciacion britanica (en-GB) y americana (en-US) para el mismo texto." },
        { title: "Creacion de Contenido", description: "Crea voces en off con acento britanico para videos, presentaciones y contenido de audio." },
        { title: "Gratis e Instantaneo", description: "Sin cuenta necesaria. Genera y descarga audio en ingles britanico gratis." },
      ],
      steps: [
        "Pega tu texto en ingles en TTS Easy.",
        "Cambia a modo Manual y selecciona Ingles (UK) del menu de acentos.",
        "Elige tu estilo de voz y velocidad.",
        "Descarga el MP3 con pronunciacion britanica.",
      ],
      faq: [
        { question: "¿Que tipo de acento britanico se usa?", answer: "TTS Easy usa un acento RP (Pronunciacion Recibida), comúnmente conocido como ingles britanico estandar." },
        { question: "¿Las escrituras britanicas afectan la pronunciacion?", answer: "La voz de IA maneja correctamente tanto escrituras britanicas como americanas, pero selecciona patrones de pronunciacion britanica al usar la voz en-GB." },
        { question: "¿Puedo comparar pronunciacion britanica y americana?", answer: "Si. Genera el mismo texto con voces en-GB y en-US para escuchar la diferencia." },
      ],
    },
  },
  "text-to-speech-australian": {
    en: {
      h1: "Australian English Text to Speech - Aussie Voice Generator",
      intro: [
        "Generate natural Australian English speech with TTS Easy. AI voices deliver an authentic Australian accent for your text.",
        "Great for creating Aussie-accented content or experiencing how your text sounds with an Australian pronunciation. Free MP3 download.",
      ],
      benefits: [
        { title: "Australian Accent", description: "Google Cloud AI voice trained on Australian English speakers with authentic Aussie pronunciation." },
        { title: "Accent Variety", description: "Compare Australian, American, and British pronunciation of the same text." },
        { title: "Content Localization", description: "Create audio content targeted at Australian audiences with a familiar accent." },
        { title: "Free Download", description: "Generate and download Australian English audio for free, no signup needed." },
      ],
      steps: [
        "Paste your English text into TTS Easy.",
        "Switch to Manual mode and select English (AU) from the accent dropdown.",
        "Choose voice style and speed.",
        "Download the MP3 with Australian pronunciation.",
      ],
      faq: [
        { question: "What type of Australian accent is used?", answer: "TTS Easy uses a General Australian English accent (en-AU), the most widely spoken variety in Australia." },
        { question: "Can I use this for Australian content?", answer: "Yes. If you're creating content for Australian audiences, using the en-AU voice adds authenticity." },
        { question: "How different is Australian from American English TTS?", answer: "Australian English has distinct vowel sounds, intonation patterns, and some unique vocabulary pronunciation. Generate both to hear the differences." },
      ],
    },
    es: {
      h1: "Texto a Voz en Ingles Australiano - Generador de Voz Aussie",
      intro: [
        "Genera habla natural en ingles australiano con TTS Easy. Las voces de IA entregan un acento australiano autentico para tu texto.",
        "Ideal para crear contenido con acento australiano o experimentar como suena tu texto con pronunciacion australiana. Descarga MP3 gratis.",
      ],
      benefits: [
        { title: "Acento Australiano", description: "Voz de IA de Google Cloud entrenada con hablantes de ingles australiano con pronunciacion Aussie autentica." },
        { title: "Variedad de Acentos", description: "Compara pronunciacion australiana, americana y britanica del mismo texto." },
        { title: "Localizacion de Contenido", description: "Crea contenido de audio dirigido a audiencias australianas con un acento familiar." },
        { title: "Descarga Gratis", description: "Genera y descarga audio en ingles australiano gratis, sin registro." },
      ],
      steps: [
        "Pega tu texto en ingles en TTS Easy.",
        "Cambia a modo Manual y selecciona Ingles (AU) del menu de acentos.",
        "Elige estilo de voz y velocidad.",
        "Descarga el MP3 con pronunciacion australiana.",
      ],
      faq: [
        { question: "¿Que tipo de acento australiano se usa?", answer: "TTS Easy usa un acento de ingles australiano general (en-AU), la variedad mas hablada en Australia." },
        { question: "¿Puedo usar esto para contenido australiano?", answer: "Si. Si creas contenido para audiencias australianas, usar la voz en-AU agrega autenticidad." },
        { question: "¿Que tan diferente es el ingles australiano del americano en TTS?", answer: "El ingles australiano tiene sonidos de vocales, patrones de entonacion y pronunciacion de vocabulario distintos. Genera ambos para escuchar las diferencias." },
      ],
    },
  },
  "texto-a-voz-mexicano": {
    en: {
      h1: "Mexican Spanish Text to Speech - Texto a Voz Mexicano",
      intro: [
        "Convert text to speech with an authentic Mexican Spanish accent. TTS Easy's AI voice captures the pronunciation and rhythm of Mexican Spanish.",
        "Ideal for content targeting Mexican audiences or for language learners studying Latin American Spanish.",
      ],
      benefits: [
        { title: "Mexican Accent", description: "AI voice trained specifically on Mexican Spanish pronunciation patterns." },
        { title: "Auto Detection", description: "TTS Easy can detect Mexican-specific vocabulary and automatically select the es-MX voice." },
        { title: "Latin American Spanish", description: "The Mexican voice serves as an excellent reference for general Latin American Spanish pronunciation." },
        { title: "Free MP3", description: "Download Mexican Spanish audio at no cost." },
      ],
      steps: [
        "Write or paste your Spanish text.",
        "TTS Easy detects Mexican Spanish or select es-MX manually.",
        "Choose voice style and speed.",
        "Download the MP3 with Mexican pronunciation.",
      ],
      faq: [
        { question: "How does TTS Easy detect Mexican Spanish?", answer: "TTS Easy analyzes vocabulary patterns like 'ahorita', 'mande', 'chido' and other Mexican-specific terms to identify the dialect." },
        { question: "What's the difference from Castilian Spanish?", answer: "Mexican Spanish differs in pronunciation (no 'th' sound for c/z), vocabulary, and intonation patterns. TTS Easy uses distinct voices for each." },
        { question: "Can I switch between Mexican and other Spanish accents?", answer: "Yes. Use Manual mode to select between Mexican (es-MX), Castilian (es-ES), and Argentine (es-AR) accents." },
      ],
    },
    es: {
      h1: "Texto a Voz Mexicano - Voz Natural con Acento de Mexico",
      intro: [
        "Convierte texto a voz con acento mexicano autentico. La voz de IA de TTS Easy captura la pronunciacion y ritmo del español mexicano.",
        "Ideal para contenido dirigido a audiencias mexicanas o para estudiantes de español latinoamericano.",
      ],
      benefits: [
        { title: "Acento Mexicano", description: "Voz de IA entrenada especificamente en patrones de pronunciacion del español mexicano." },
        { title: "Deteccion Automatica", description: "TTS Easy detecta vocabulario mexicano y selecciona automaticamente la voz es-MX." },
        { title: "Español Latinoamericano", description: "La voz mexicana sirve como excelente referencia para pronunciacion general del español latinoamericano." },
        { title: "MP3 Gratis", description: "Descarga audio en español mexicano sin costo." },
      ],
      steps: [
        "Escribe o pega tu texto en español.",
        "TTS Easy detecta español mexicano o selecciona es-MX manualmente.",
        "Elige estilo de voz y velocidad.",
        "Descarga el MP3 con pronunciacion mexicana.",
      ],
      faq: [
        { question: "¿Como detecta TTS Easy el español mexicano?", answer: "TTS Easy analiza patrones de vocabulario como 'ahorita', 'mande', 'chido' y otros terminos especificos mexicanos para identificar el dialecto." },
        { question: "¿Cual es la diferencia con el español castellano?", answer: "El español mexicano difiere en pronunciacion (sin sonido 'z' para c/z), vocabulario y patrones de entonacion. TTS Easy usa voces distintas para cada uno." },
        { question: "¿Puedo cambiar entre acento mexicano y otros?", answer: "Si. Usa el modo Manual para seleccionar entre mexicano (es-MX), castellano (es-ES) y argentino (es-AR)." },
      ],
    },
  },
  "texto-a-voz-argentino": {
    en: {
      h1: "Argentine Spanish Text to Speech - Texto a Voz Argentino",
      intro: [
        "Convert text to speech with an authentic Argentine Spanish accent. TTS Easy's AI captures the distinctive Rioplatense pronunciation.",
        "Perfect for content targeting Argentine audiences or anyone interested in the unique sound of Argentine Spanish.",
      ],
      benefits: [
        { title: "Argentine Accent", description: "AI voice that captures the distinctive Rioplatense Spanish pronunciation style." },
        { title: "Dialect Detection", description: "TTS Easy recognizes Argentine vocabulary like 'vos', 'che', 'bondi' and auto-selects the es-AR voice." },
        { title: "Unique Pronunciation", description: "Features the characteristic 'sh' sound for ll/y that distinguishes Argentine Spanish." },
        { title: "Free Download", description: "Generate and download Argentine Spanish audio for free." },
      ],
      steps: [
        "Write or paste your Spanish text.",
        "TTS Easy detects Argentine Spanish or select es-AR manually.",
        "Choose voice style and speed.",
        "Download the MP3 with Argentine pronunciation.",
      ],
      faq: [
        { question: "How does TTS Easy detect Argentine Spanish?", answer: "TTS Easy looks for markers like 'vos' instead of 'tu', 'che', and other Rioplatense vocabulary to identify Argentine Spanish." },
        { question: "Does the voice use 'voseo'?", answer: "The Argentine voice uses Rioplatense pronunciation patterns. For best results, write your text using Argentine vocabulary and grammar." },
        { question: "What makes Argentine Spanish sound different?", answer: "Argentine Spanish features the 'sheismo' (ll/y pronounced as 'sh'), Italian-influenced intonation, and unique vocabulary. The es-AR voice captures these traits." },
      ],
    },
    es: {
      h1: "Texto a Voz Argentino - Voz Natural con Acento Rioplatense",
      intro: [
        "Convierte texto a voz con acento argentino autentico. La IA de TTS Easy captura la pronunciacion rioplatense distintiva.",
        "Perfecto para contenido dirigido a audiencias argentinas o cualquiera interesado en el sonido unico del español argentino.",
      ],
      benefits: [
        { title: "Acento Argentino", description: "Voz de IA que captura el estilo de pronunciacion rioplatense del español." },
        { title: "Deteccion de Dialecto", description: "TTS Easy reconoce vocabulario argentino como 'vos', 'che', 'bondi' y selecciona automaticamente la voz es-AR." },
        { title: "Pronunciacion Unica", description: "Presenta el caracteristico sonido 'sh' para ll/y que distingue al español argentino." },
        { title: "Descarga Gratis", description: "Genera y descarga audio en español argentino gratis." },
      ],
      steps: [
        "Escribe o pega tu texto en español.",
        "TTS Easy detecta español argentino o selecciona es-AR manualmente.",
        "Elige estilo de voz y velocidad.",
        "Descarga el MP3 con pronunciacion argentina.",
      ],
      faq: [
        { question: "¿Como detecta TTS Easy el español argentino?", answer: "TTS Easy busca marcadores como 'vos' en lugar de 'tu', 'che' y otro vocabulario rioplatense para identificar el español argentino." },
        { question: "¿La voz usa voseo?", answer: "La voz argentina usa patrones de pronunciacion rioplatense. Para mejores resultados, escribe tu texto usando vocabulario y gramatica argentina." },
        { question: "¿Que hace diferente al español argentino?", answer: "El español argentino presenta el 'sheismo' (ll/y pronunciadas como 'sh'), entonacion influenciada por el italiano y vocabulario unico. La voz es-AR captura estos rasgos." },
      ],
    },
  },
  "texto-a-voz-espanol": {
    en: {
      h1: "Castilian Spanish Text to Speech - Spain Voice Generator",
      intro: [
        "Convert text to speech with an authentic Castilian Spanish accent from Spain. TTS Easy delivers the pronunciation and intonation of peninsular Spanish.",
        "Features the distinctive 'theta' sound for c/z and Castilian-specific vocabulary handling.",
      ],
      benefits: [
        { title: "Castilian Accent", description: "AI voice trained on Castilian Spanish with the characteristic pronunciation of Spain." },
        { title: "Theta Distinction", description: "Correctly pronounces the 'th' sound for c/z that distinguishes Castilian from Latin American Spanish." },
        { title: "Spain Vocabulary", description: "Optimized for peninsular Spanish vocabulary and expressions." },
        { title: "Free MP3", description: "Download Castilian Spanish audio at no cost." },
      ],
      steps: [
        "Write or paste your Spanish text.",
        "Select es-ES manually or let TTS Easy detect Castilian markers.",
        "Choose voice style and speed.",
        "Download the MP3 with Castilian pronunciation.",
      ],
      faq: [
        { question: "What makes Castilian Spanish different?", answer: "Castilian Spanish features the 'theta' distinction (c/z pronounced as 'th'), unique vocabulary like 'vale', 'tio', and different intonation patterns from Latin American variants." },
        { question: "Can TTS Easy auto-detect Castilian Spanish?", answer: "TTS Easy looks for Castilian markers like 'vale', 'vosotros', 'mola' and other Spain-specific terms." },
        { question: "Is es-ES the same as Latin American Spanish?", answer: "No. es-ES (Spain) has distinct pronunciation, vocabulary, and grammar (vosotros) compared to es-MX (Mexico) or es-AR (Argentina)." },
      ],
    },
    es: {
      h1: "Texto a Voz Español de España - Voz Castellana Natural",
      intro: [
        "Convierte texto a voz con acento castellano autentico de España. TTS Easy entrega la pronunciacion y entonacion del español peninsular.",
        "Incluye el sonido 'theta' distintivo para c/z y manejo de vocabulario castellano especifico.",
      ],
      benefits: [
        { title: "Acento Castellano", description: "Voz de IA entrenada en español castellano con la pronunciacion caracteristica de España." },
        { title: "Distincion Theta", description: "Pronuncia correctamente el sonido 'z' para c/z que distingue al castellano del español latinoamericano." },
        { title: "Vocabulario de España", description: "Optimizado para vocabulario y expresiones del español peninsular." },
        { title: "MP3 Gratis", description: "Descarga audio en español castellano sin costo." },
      ],
      steps: [
        "Escribe o pega tu texto en español.",
        "Selecciona es-ES manualmente o deja que TTS Easy detecte marcadores castellanos.",
        "Elige estilo de voz y velocidad.",
        "Descarga el MP3 con pronunciacion castellana.",
      ],
      faq: [
        { question: "¿Que hace diferente al español castellano?", answer: "El español castellano presenta la distincion 'theta' (c/z pronunciadas como 'z'), vocabulario unico como 'vale', 'tio', y patrones de entonacion diferentes a las variantes latinoamericanas." },
        { question: "¿TTS Easy puede detectar automaticamente el castellano?", answer: "TTS Easy busca marcadores castellanos como 'vale', 'vosotros', 'mola' y otros terminos especificos de España." },
        { question: "¿Es lo mismo es-ES que español latinoamericano?", answer: "No. es-ES (España) tiene pronunciacion, vocabulario y gramatica (vosotros) distintos comparado con es-MX (Mexico) o es-AR (Argentina)." },
      ],
    },
  },
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
