import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getUseCaseEntries } from "@/lib/useCaseContent";
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
  const hub = dict.hubs.useCases;
  const ogImage = `${siteUrl}/og-image.png`;
  const languages: Record<string, string> = {};

  for (const loc of LOCALES) {
    languages[loc] = `${siteUrl}/${loc}/use-cases`;
  }
  languages["x-default"] = `${siteUrl}/en/use-cases`;

  return {
    title: hub.title,
    description: hub.metaDescription,
    alternates: {
      canonical: `${siteUrl}/${locale}/use-cases`,
      languages,
    },
    openGraph: {
      title: hub.title,
      description: hub.metaDescription,
      type: "website",
      url: `${siteUrl}/${locale}/use-cases`,
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

export default async function UseCasesHubPage({ params }: Props): Promise<JSX.Element> {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);
  const hub = dict.hubs.useCases;
  const adKeywords = buildAdKeywordString([hub.title, hub.metaDescription]);
  const pages = getUseCaseEntries(locale as Locale, { indexableOnly: true });

  return (
    <main className="landing-page">
      <PageViewTracker locale={locale} pageType="use_case" />
      <div className="landing-intro">
        <h1>{hub.title}</h1>
        <p>{hub.description}</p>
      </div>
      <AdSlot
        keywords={adKeywords}
        locale={locale}
        pageType="use_case"
        placementId="use-case-hub-top"
      />

      <section className="landing-benefits">
        {pages.map((page) => (
          <article className="benefit" key={page.slug}>
            <h3>
              <Link href={`/${locale}/use-cases/${page.slug}`}>{page.title}</Link>
            </h3>
            <p>{page.description}</p>
            <p className="hub-card-label">{hub.cardUseCase}</p>
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
