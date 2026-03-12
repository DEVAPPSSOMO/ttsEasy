import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LANDING_PAGES, getLandingPage } from "@/lib/landing-pages";
import {
  getUseCaseBySlug,
  getUseCaseEntries,
  getUseCaseEntryForLocale,
  getUseCaseGroupEntries,
  getUseCaseLocales,
} from "@/lib/useCaseContent";
import { buildAdKeywordString } from "@/lib/monetization";
import { breadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { AdSlot } from "@/components/AdSlot";
import { EditorialMeta } from "@/components/EditorialMeta";
import { LocalizationNotice } from "@/components/LocalizationNotice";
import { TtsApp } from "@/components/TtsApp";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface Props {
  params: { locale: string; slug: string };
}

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of LOCALES) {
    for (const page of LANDING_PAGES) {
      params.push({ locale, slug: page.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = params;
  if (!isValidLocale(locale)) return {};

  const legacyPage = getLandingPage(slug);
  const content = getUseCaseBySlug(locale as Locale, slug);
  if (!legacyPage && !content) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";
  const ogImage = `${siteUrl}/og-image.png`;
  const indexableLocales = getUseCaseLocales(slug, { indexableOnly: true });
  const canonicalEntry =
    getUseCaseEntryForLocale(slug, locale as Locale, { indexableOnly: true }) ??
    getUseCaseEntryForLocale(slug, "en", { indexableOnly: true }) ??
    getUseCaseEntries("en", { indexableOnly: true }).find((entry) => entry.slug === slug) ??
    null;

  const languages =
    indexableLocales.length > 0
      ? Object.fromEntries(indexableLocales.map((loc) => [loc, `${siteUrl}/${loc}/use-cases/${slug}`]))
      : undefined;
  if (languages && canonicalEntry) {
    languages["x-default"] = `${siteUrl}/${canonicalEntry.locale}/use-cases/${canonicalEntry.slug}`;
  }
  const canonicalUrl = canonicalEntry
    ? `${siteUrl}/${canonicalEntry.locale}/use-cases/${canonicalEntry.slug}`
    : `${siteUrl}/${locale}/use-cases`;

  return {
    title: content?.title ?? legacyPage?.keyword ?? slug,
    description: content?.description ?? `Workflow support page for ${legacyPage?.keyword ?? slug}.`,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    robots: content?.indexable ? undefined : { index: false, follow: true },
    openGraph: {
      title: content?.title ?? legacyPage?.keyword ?? slug,
      description: content?.description ?? `Workflow support page for ${legacyPage?.keyword ?? slug}.`,
      url: canonicalUrl,
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "TTS Easy",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: content?.title ?? legacyPage?.keyword ?? slug,
      description: content?.description ?? `Workflow support page for ${legacyPage?.keyword ?? slug}.`,
      images: [ogImage],
    },
  };
}

export default async function UseCasePage({ params }: Props) {
  const { locale, slug } = params;
  if (!isValidLocale(locale)) notFound();

  const legacyPage = getLandingPage(slug);
  const entry = getUseCaseBySlug(locale as Locale, slug);
  if (!legacyPage && !entry) notFound();

  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";
  const alternateEntries = entry ? getUseCaseGroupEntries(entry.canonicalGroup, { indexableOnly: true }) : [];
  const canonicalEntry =
    alternateEntries.find((candidate) => candidate.locale === locale) ??
    getUseCaseEntryForLocale(slug, "en", { indexableOnly: true }) ??
    alternateEntries[0] ??
    null;
  const adKeywords = entry ? buildAdKeywordString([entry.title, entry.description]) : undefined;
  const supportTitle = legacyPage?.keyword ?? slug.replace(/-/g, " ");

  return (
    <main className="landing-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "TTS Easy", url: `${siteUrl}/${locale}` },
              {
                name: entry?.title ?? supportTitle,
                url: `${siteUrl}/${locale}/use-cases/${slug}`,
              },
            ])
          ),
        }}
      />

      {entry ? (
        <>
          <div className="landing-intro">
            <h1>{entry.title}</h1>
            <p>{entry.description}</p>
          </div>

          <TtsApp locale={locale} pageType="use_case" copy={dict.ui} />

          <AdSlot
            keywords={adKeywords}
            locale={locale}
            pageType="use_case"
            placementId="use-case-detail-mid"
          />

          <article className="blog-post" style={{ marginTop: "2rem" }}>
            <div className="post-content" dangerouslySetInnerHTML={{ __html: entry.contentHtml }} />
          </article>

          <EditorialMeta
            author={entry.author}
            locale={locale}
            reviewedAt={entry.reviewedAt}
            sources={entry.sources}
          />

          <Link
            href={`/${locale}`}
            className="landing-cta"
            style={{ display: "inline-block", textAlign: "center", textDecoration: "none", lineHeight: "48px" }}
          >
            {dict.home.tryNow}
          </Link>
        </>
      ) : (
        <>
          <div className="landing-intro">
            <h1>{supportTitle}</h1>
            <p>{legacyPage?.keyword}</p>
          </div>
          <LocalizationNotice
            canonicalHref={
              canonicalEntry ? `/${canonicalEntry.locale}/use-cases/${canonicalEntry.slug}` : `/${locale}/use-cases`
            }
            locale={locale}
          />
          <p style={{ marginTop: "2rem" }}>
            <Link className="landing-cta" href={`/${locale}`}>
              {dict.home.tryNow}
            </Link>
          </p>
        </>
      )}

      <footer className="site-footer">
        <nav className="legal-links">
          <Link href={`/${locale}`}>TTS Easy</Link>
          <Link href={`/${locale}/use-cases`}>Use Cases</Link>
          <Link href={`/${locale}/tools`}>Tools</Link>
          <Link href={`/${locale}/blog`}>{dict.nav.blog}</Link>
          <Link href={`/${locale}/privacy`}>{dict.nav.privacy}</Link>
          <Link href={`/${locale}/terms`}>{dict.nav.terms}</Link>
        </nav>
        {entry ? (
          <LanguageSwitcher
            availableLocales={alternateEntries.map((candidate) => candidate.locale)}
            currentLocale={locale as Locale}
            currentPath={`/${locale}/use-cases/${slug}`}
            label={dict.nav.language}
          />
        ) : null}
      </footer>
    </main>
  );
}
