import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildAdKeywordString } from "@/lib/monetization";
import { AdSlot } from "@/components/AdSlot";
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
  const dict = await getDictionary(locale);
  const hub = dict.hubs.tools;

  const ogImage = `${siteUrl}/og-image.png`;
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = `${siteUrl}/${loc}/tools`;
  }
  languages["x-default"] = `${siteUrl}/en/tools`;

  return {
    title: hub.title,
    description: hub.metaDescription,
    alternates: {
      canonical: `${siteUrl}/${locale}/tools`,
      languages,
    },
    openGraph: {
      title: hub.title,
      description: hub.metaDescription,
      type: "website",
      url: `${siteUrl}/${locale}/tools`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "TTS Easy" }],
    },
    twitter: {
      card: "summary_large_image",
      title: hub.title,
      description: hub.metaDescription,
      images: [ogImage],
    },
  };
}

export default async function ToolsHubPage({ params }: Props): Promise<JSX.Element> {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);
  const hub = dict.hubs.tools;
  const adKeywords = buildAdKeywordString([hub.title, hub.metaDescription]);

  return (
    <main className="landing-page">
      <PageViewTracker locale={locale} pageType="tool" />
      <div className="landing-intro">
        <h1>{hub.title}</h1>
        <p>{hub.description}</p>
      </div>
      <AdSlot
        keywords={adKeywords}
        locale={locale}
        pageType="tool"
        placementId="tools-hub-top"
      />

      <section className="landing-benefits">
        <article className="benefit">
          <h3>
            <Link href={`/${locale}/tools/character-counter`}>{hub.characterCounterTitle}</Link>
          </h3>
          <p>{hub.characterCounterDescription}</p>
        </article>
        <article className="benefit">
          <h3>
            <Link href={`/${locale}/tools/language-detector`}>{hub.languageDetectorTitle}</Link>
          </h3>
          <p>{hub.languageDetectorDescription}</p>
        </article>
      </section>

      <section className="landing-steps">
        <h2>{hub.howToChooseTitle}</h2>
        <ol>
          {hub.howToChooseItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="landing-steps">
        <h2>{hub.whenToUseTitle}</h2>
        <ol>
          {hub.whenToUseItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="landing-steps">
        <h2>{hub.navigationTitle}</h2>
        <p>{hub.navigationDescription}</p>
        <ol>
          <li>
            <Link href={`/${locale}`}>{dict.home.tryNow}</Link>
          </li>
          <li>
            <Link href={`/${locale}/use-cases`}>{dict.hubs.useCases.title}</Link>
          </li>
          <li>
            <Link href={`/${locale}/compare`}>{dict.hubs.compare.title}</Link>
          </li>
          <li>
            <Link href={`/${locale}/blog`}>{dict.nav.blog}</Link>
          </li>
        </ol>
      </section>

      <footer className="site-footer">
        <nav className="legal-links">
          <Link href={`/${locale}`}>{dict.home.tryNow}</Link>
          <Link href={`/${locale}/use-cases`}>{dict.hubs.useCases.title}</Link>
          <Link href={`/${locale}/compare`}>{dict.hubs.compare.title}</Link>
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
