import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LANDING_PAGES, getLandingLocalizedLocales } from "@/lib/landing-pages";
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
  const ogImage = `${siteUrl}/og-image.png`;
  const languages: Record<string, string> = {};

  for (const loc of LOCALES) {
    languages[loc] = `${siteUrl}/${loc}/use-cases`;
  }
  languages["x-default"] = `${siteUrl}/en/use-cases`;

  return {
    title: `Use Cases | TTS Easy`,
    description: dict.home.subtitle,
    alternates: {
      canonical: `${siteUrl}/${locale}/use-cases`,
      languages,
    },
    openGraph: {
      title: `Use Cases | TTS Easy`,
      description: dict.home.subtitle,
      type: "website",
      url: `${siteUrl}/${locale}/use-cases`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "TTS Easy" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Use Cases | TTS Easy`,
      description: dict.home.subtitle,
      images: [ogImage],
    },
  };
}

export default async function UseCasesHubPage({ params }: Props): Promise<JSX.Element> {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);
  const localized = LANDING_PAGES.filter((page) =>
    getLandingLocalizedLocales(page.slug).includes(locale as Locale)
  );
  const pending = LANDING_PAGES.filter((page) =>
    !getLandingLocalizedLocales(page.slug).includes(locale as Locale)
  );

  return (
    <main className="landing-page">
      <PageViewTracker locale={locale} pageType="use_case" />
      <div className="landing-intro">
        <h1>Use Cases</h1>
        <p>Explore search-focused landing pages by job-to-be-done and language intent.</p>
      </div>

      <section className="landing-benefits">
        {localized.map((page) => (
          <article className="benefit" key={page.slug}>
            <h3>
              <Link href={`/${locale}/use-cases/${page.slug}`}>{page.keyword}</Link>
            </h3>
            <p>{page.category === "language" ? "Language intent" : "Use-case intent"}</p>
          </article>
        ))}
      </section>

      {pending.length > 0 ? (
        <section className="landing-steps" style={{ marginTop: "2rem" }}>
          <h2>Pending localization</h2>
          <ol>
            {pending.slice(0, 6).map((page) => (
              <li key={page.slug}>
                <Link href={`/${locale}/use-cases/${page.slug}`}>{page.keyword}</Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <footer className="site-footer">
        <nav className="legal-links">
          <Link href={`/${locale}`}>{dict.home.tryNow}</Link>
          <Link href={`/${locale}/tools`}>Tools</Link>
          <Link href={`/${locale}/compare`}>Compare</Link>
          <Link href={`/${locale}/blog`}>{dict.nav.blog}</Link>
        </nav>
        <LanguageSwitcher
          currentLocale={locale as Locale}
          currentPath={`/${locale}/use-cases`}
          label={dict.nav.language}
        />
      </footer>
    </main>
  );
}
