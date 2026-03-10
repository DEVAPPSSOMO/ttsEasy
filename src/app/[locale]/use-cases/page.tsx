import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LANDING_PAGES, getLandingContent } from "@/lib/landing-pages";
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
  const hub = dict.hubs.useCases;
  const ogImage = `${siteUrl}/og-image.png`;
  const languages: Record<string, string> = {};

  for (const loc of LOCALES) {
    languages[loc] = `${siteUrl}/${loc}/use-cases`;
  }
  languages["x-default"] = `${siteUrl}/en/use-cases`;

  return {
    title: `${hub.title} | TTS Easy`,
    description: hub.metaDescription,
    robots: locale === "en" ? undefined : { index: false, follow: true },
    alternates: {
      canonical: `${siteUrl}/${locale}/use-cases`,
      languages: locale === "en" ? languages : undefined,
    },
    openGraph: {
      title: `${hub.title} | TTS Easy`,
      description: hub.metaDescription,
      type: "website",
      url: `${siteUrl}/${locale}/use-cases`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "TTS Easy" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${hub.title} | TTS Easy`,
      description: hub.metaDescription,
      images: [ogImage],
    },
  };
}

export default async function UseCasesHubPage({ params }: Props): Promise<JSX.Element> {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);
  const hub = dict.hubs.useCases;
  const pages = LANDING_PAGES.map((page) => ({
    ...page,
    summary: getLandingContent(page.slug, locale as Locale).intro[0],
  }));

  return (
    <main className="landing-page">
      <PageViewTracker locale={locale} pageType="use_case" />
      <div className="landing-intro">
        <h1>{hub.title}</h1>
        <p>{hub.description}</p>
      </div>

      <section className="landing-benefits">
        {pages.map((page) => (
          <article className="benefit" key={page.slug}>
            <h3>
              <Link href={`/${locale}/use-cases/${page.slug}`}>{page.keyword}</Link>
            </h3>
            <p>{page.summary}</p>
            <p className="hub-card-label">
              {page.category === "language" ? hub.cardLanguage : hub.cardUseCase}
            </p>
          </article>
        ))}
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
            <Link href={`/${locale}/tools`}>{dict.hubs.tools.title}</Link>
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
          <Link href={`/${locale}/tools`}>{dict.hubs.tools.title}</Link>
          <Link href={`/${locale}/compare`}>{dict.hubs.compare.title}</Link>
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
