import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getComparePage, getCompareSlugs, hasCompareLocalizedContent } from "@/lib/compare-pages";
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
    languages[loc] = `${siteUrl}/${loc}/compare`;
  }
  languages["x-default"] = `${siteUrl}/en/compare`;

  return {
    title: "TTS Comparisons | TTS Easy",
    description: "Commercial-intent comparison pages to choose the right text-to-speech workflow.",
    alternates: {
      canonical: `${siteUrl}/${locale}/compare`,
      languages,
    },
    openGraph: {
      title: "TTS Comparisons | TTS Easy",
      description: "Commercial-intent comparison pages to choose the right text-to-speech workflow.",
      type: "website",
      url: `${siteUrl}/${locale}/compare`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "TTS Easy" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "TTS Comparisons | TTS Easy",
      description: "Commercial-intent comparison pages to choose the right text-to-speech workflow.",
      images: [ogImage],
    },
  };
}

export default async function CompareHubPage({ params }: Props): Promise<JSX.Element> {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);
  const slugs = getCompareSlugs();
  const localizedSlugs = slugs.filter((slug) => hasCompareLocalizedContent(slug, locale as Locale));
  const fallbackSlugs = slugs.filter((slug) => !localizedSlugs.includes(slug));

  return (
    <main className="landing-page">
      <PageViewTracker locale={locale} pageType="compare" />
      <div className="landing-intro">
        <h1>TTS Compare Hub</h1>
        <p>Explore high-intent comparison pages before choosing your text-to-speech workflow.</p>
      </div>

      <section className="landing-benefits">
        {localizedSlugs.map((slug) => {
          const page = getComparePage(slug, locale as Locale);
          if (!page) return null;
          return (
            <article className="benefit" key={slug}>
              <h3>
                <Link href={`/${locale}/compare/${slug}`}>{page.h1}</Link>
              </h3>
              <p>{page.description}</p>
            </article>
          );
        })}
      </section>

      {fallbackSlugs.length > 0 ? (
        <section className="landing-steps" style={{ marginTop: "2rem" }}>
          <h2>English-only comparisons</h2>
          <ol>
            {fallbackSlugs.map((slug) => {
              const page = getComparePage(slug, "en");
              return (
                <li key={slug}>
                  <Link href={`/${locale}/compare/${slug}`}>{page?.h1 ?? slug}</Link>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <footer className="site-footer">
        <nav className="legal-links">
          <Link href={`/${locale}`}>{dict.home.tryNow}</Link>
          <Link href={`/${locale}/use-cases`}>Use Cases</Link>
          <Link href={`/${locale}/tools`}>Tools</Link>
          <Link href={`/${locale}/blog`}>{dict.nav.blog}</Link>
        </nav>
        <LanguageSwitcher
          currentLocale={locale as Locale}
          currentPath={`/${locale}/compare`}
          label={dict.nav.language}
        />
      </footer>
    </main>
  );
}
