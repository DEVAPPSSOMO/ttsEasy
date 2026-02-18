import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PageViewTracker } from "@/components/PageViewTracker";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";

interface Props {
  params: { locale: string };
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  if (!isValidLocale(locale)) return {};

  const ogImage = `${siteUrl}/og-image.png`;
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = `${siteUrl}/${loc}/tools`;
  }
  languages["x-default"] = `${siteUrl}/en/tools`;

  return {
    title: "Tools | TTS Easy",
    description: "SEO-oriented utility tools that feed into text-to-speech conversion workflows.",
    alternates: {
      canonical: `${siteUrl}/${locale}/tools`,
      languages,
    },
    openGraph: {
      title: "Tools | TTS Easy",
      description: "SEO-oriented utility tools that feed into text-to-speech conversion workflows.",
      type: "website",
      url: `${siteUrl}/${locale}/tools`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "TTS Easy" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Tools | TTS Easy",
      description: "SEO-oriented utility tools that feed into text-to-speech conversion workflows.",
      images: [ogImage],
    },
  };
}

export default async function ToolsHubPage({ params }: Props): Promise<JSX.Element> {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);

  return (
    <main className="landing-page">
      <PageViewTracker locale={locale} pageType="tool" />
      <div className="landing-intro">
        <h1>Tools</h1>
        <p>
          Use these utility pages to pre-process scripts and route users into high-intent conversion flows.
        </p>
      </div>

      <section className="landing-benefits">
        <article className="benefit">
          <h3>
            <Link href={`/${locale}/tools/character-counter`}>Character Counter</Link>
          </h3>
          <p>Count characters, words, and structure before generating narration.</p>
        </article>
        <article className="benefit">
          <h3>
            <Link href={`/${locale}/tools/language-detector`}>Language Detector</Link>
          </h3>
          <p>Detect language and likely accent before choosing a voice profile.</p>
        </article>
      </section>

      <footer className="site-footer">
        <nav className="legal-links">
          <Link href={`/${locale}`}>{dict.home.tryNow}</Link>
          <Link href={`/${locale}/use-cases`}>Use Cases</Link>
          <Link href={`/${locale}/compare`}>Compare</Link>
          <Link href={`/${locale}/blog`}>{dict.nav.blog}</Link>
        </nav>
        <LanguageSwitcher
          currentLocale={locale as Locale}
          currentPath={`/${locale}/tools`}
          label={dict.nav.language}
        />
      </footer>
    </main>
  );
}
