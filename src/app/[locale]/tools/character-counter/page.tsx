import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidLocale, LOCALES, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { CharacterCounter } from "@/components/CharacterCounter";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";

interface PageProps {
  params: { locale: string };
}

const TITLES: Record<string, { h1: string; desc: string; meta: string }> = {
  en: { h1: "Free Character Counter Online", desc: "Count characters, words, sentences, and paragraphs instantly. No sign-up required.", meta: "Free online character counter tool. Count characters, words, sentences and paragraphs in your text instantly." },
  es: { h1: "Contador de Caracteres Online Gratis", desc: "Cuenta caracteres, palabras, oraciones y parrafos al instante. Sin registro.", meta: "Contador de caracteres online gratis. Cuenta caracteres, palabras, oraciones y parrafos en tu texto al instante." },
  pt: { h1: "Contador de Caracteres Online Gratis", desc: "Conte caracteres, palavras, frases e paragrafos instantaneamente. Sem cadastro.", meta: "Contador de caracteres online gratis. Conte caracteres, palavras, frases e paragrafos no seu texto instantaneamente." },
  fr: { h1: "Compteur de Caracteres en Ligne Gratuit", desc: "Comptez les caracteres, mots, phrases et paragraphes instantanement. Sans inscription.", meta: "Compteur de caracteres en ligne gratuit. Comptez les caracteres, mots, phrases et paragraphes de votre texte instantanement." },
  de: { h1: "Kostenloser Zeichenzahler Online", desc: "Zahlen Sie Zeichen, Worter, Satze und Absatze sofort. Keine Anmeldung erforderlich.", meta: "Kostenloser Online-Zeichenzahler. Zahlen Sie Zeichen, Worter, Satze und Absatze in Ihrem Text sofort." },
  it: { h1: "Contatore di Caratteri Online Gratuito", desc: "Conta caratteri, parole, frasi e paragrafi istantaneamente. Nessuna registrazione.", meta: "Contatore di caratteri online gratuito. Conta caratteri, parole, frasi e paragrafi nel tuo testo istantaneamente." },
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
    languages[loc] = `${siteUrl}/${loc}/tools/character-counter`;
  }
  languages["x-default"] = `${siteUrl}/en/tools/character-counter`;

  return {
    title: t.h1,
    description: t.meta,
    alternates: { canonical: `${siteUrl}/${locale}/tools/character-counter`, languages },
  };
}

export default async function CharacterCounterPage({ params }: PageProps): Promise<JSX.Element> {
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

      <CharacterCounter ctaText={cta} ctaHref={`/${locale}`} />

      <footer className="site-footer">
        <nav className="legal-links">
          <Link href={`/${locale}`}>{dict.home.tryNow}</Link>
          <Link href={`/${locale}/tools/language-detector`}>Language Detector</Link>
          <Link href={`/${locale}/blog`}>{dict.nav.blog}</Link>
        </nav>
        <LanguageSwitcher currentLocale={locale as Locale} currentPath={`/${locale}/tools/character-counter`} label={dict.nav.language} />
      </footer>
    </main>
  );
}
