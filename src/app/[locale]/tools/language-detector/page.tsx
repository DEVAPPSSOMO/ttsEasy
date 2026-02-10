import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidLocale, LOCALES, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LanguageDetector } from "@/components/LanguageDetector";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";

interface PageProps {
  params: { locale: string };
}

const TITLES: Record<string, { h1: string; desc: string; meta: string }> = {
  en: { h1: "Free Language Detector Online", desc: "Detect the language of any text instantly. Supports 6 languages with accent detection.", meta: "Free online language detection tool. Identify the language and accent of any text instantly with AI-powered detection." },
  es: { h1: "Detector de Idioma Online Gratis", desc: "Detecta el idioma de cualquier texto al instante. Soporta 6 idiomas con deteccion de acento.", meta: "Herramienta gratuita de deteccion de idioma online. Identifica el idioma y acento de cualquier texto al instante." },
  pt: { h1: "Detector de Idioma Online Gratis", desc: "Detecte o idioma de qualquer texto instantaneamente. Suporta 6 idiomas com deteccao de sotaque.", meta: "Ferramenta gratuita de deteccao de idioma online. Identifique o idioma e sotaque de qualquer texto instantaneamente." },
  fr: { h1: "Detecteur de Langue en Ligne Gratuit", desc: "Detectez la langue de n'importe quel texte instantanement. Prend en charge 6 langues avec detection d'accent.", meta: "Outil gratuit de detection de langue en ligne. Identifiez la langue et l'accent de n'importe quel texte instantanement." },
  de: { h1: "Kostenloser Sprachdetektor Online", desc: "Erkennen Sie die Sprache eines beliebigen Textes sofort. Unterstutzt 6 Sprachen mit Akzenterkennung.", meta: "Kostenloses Online-Spracherkennungstool. Identifizieren Sie Sprache und Akzent eines beliebigen Textes sofort." },
  it: { h1: "Rilevatore di Lingua Online Gratuito", desc: "Rileva la lingua di qualsiasi testo istantaneamente. Supporta 6 lingue con rilevamento dell'accento.", meta: "Strumento gratuito di rilevamento lingua online. Identifica la lingua e l'accento di qualsiasi testo istantaneamente." },
};

const CTA: Record<string, string> = {
  en: "Now convert this text to speech",
  es: "Ahora convierte este texto a voz",
  pt: "Agora converta este texto em fala",
  fr: "Convertissez maintenant ce texte en parole",
  de: "Jetzt diesen Text in Sprache umwandeln",
  it: "Ora converti questo testo in voce",
};

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = params;
  if (!isValidLocale(locale)) return {};
  const t = TITLES[locale] || TITLES.en;

  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = `${siteUrl}/${loc}/tools/language-detector`;
  }
  languages["x-default"] = `${siteUrl}/en/tools/language-detector`;

  return {
    title: t.h1,
    description: t.meta,
    alternates: { canonical: `${siteUrl}/${locale}/tools/language-detector`, languages },
  };
}

export default async function LanguageDetectorPage({ params }: PageProps): Promise<JSX.Element> {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);
  const t = TITLES[locale] || TITLES.en;
  const cta = CTA[locale] || CTA.en;

  return (
    <main className="landing-page">
      <div className="landing-intro">
        <h1>{t.h1}</h1>
        <p>{t.desc}</p>
      </div>

      <LanguageDetector ctaText={cta} ctaHref={`/${locale}`} />

      <footer className="site-footer">
        <nav className="legal-links">
          <Link href={`/${locale}`}>{dict.home.tryNow}</Link>
          <Link href={`/${locale}/tools/character-counter`}>Character Counter</Link>
          <Link href={`/${locale}/blog`}>{dict.nav.blog}</Link>
        </nav>
        <LanguageSwitcher currentLocale={locale as Locale} currentPath={`/${locale}/tools/language-detector`} label={dict.nav.language} />
      </footer>
    </main>
  );
}
