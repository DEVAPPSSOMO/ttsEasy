import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  getCompareEntries,
  getCompareEntryBySlug,
  getCompareEntryForLocale,
  getCompareGroupEntries,
  getCompareLocales,
} from "@/lib/compareContent";
import {
  getComparePage,
  getCompareSlugs,
} from "@/lib/compare-pages";
import { getCompareAdKeywords } from "@/lib/monetization";
import { breadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { AdSlot } from "@/components/AdSlot";
import { EditorialMeta } from "@/components/EditorialMeta";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocalizationNotice } from "@/components/LocalizationNotice";
import { PageViewTracker } from "@/components/PageViewTracker";
import { TrackedCtaLink } from "@/components/TrackedCtaLink";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";

interface Props {
  params: { locale: string; slug: string };
}

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of LOCALES) {
    for (const slug of getCompareSlugs()) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = params;
  if (!isValidLocale(locale)) return {};

  const curated = getCompareEntryBySlug(locale as Locale, slug);
  const legacy = getComparePage(slug, "en");
  if (!curated && !legacy) return {};

  const availableLocales = curated
    ? getCompareLocales(curated.canonicalGroup)
    : legacy
      ? ["en"]
      : [];
  const languages =
    availableLocales.length > 0
      ? Object.fromEntries(availableLocales.map((loc) => [loc, `${siteUrl}/${loc}/compare/${slug}`]))
      : undefined;
  const canonicalEntry =
    getCompareEntryForLocale(slug, locale as Locale) ??
    getCompareEntryForLocale(slug, "en") ??
    getCompareEntries("en").find((entry) => entry.slug === slug) ??
    null;
  if (languages && canonicalEntry) {
    languages["x-default"] = `${siteUrl}/${canonicalEntry.locale}/compare/${canonicalEntry.slug}`;
  } else if (languages && legacy) {
    languages["x-default"] = `${siteUrl}/en/compare/${slug}`;
  }

  const ogImage = `${siteUrl}/og-image.png`;
  const title = curated?.title ?? legacy?.title ?? slug;
  const description =
    curated?.description ??
    legacy?.description ??
    "Editorial support page while this comparison is being rebuilt.";
  const canonicalUrl = canonicalEntry
    ? `${siteUrl}/${canonicalEntry.locale}/compare/${canonicalEntry.slug}`
    : `${siteUrl}/en/compare/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: "TTS Easy" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function CompareDetailPage({ params }: Props): Promise<JSX.Element> {
  const { locale, slug } = params;
  if (!isValidLocale(locale)) notFound();

  const entry = getCompareEntryBySlug(locale as Locale, slug);
  const legacy = getComparePage(slug, "en");
  if (!entry && !legacy) notFound();

  const dict = await getDictionary(locale as Locale);
  const alternateEntries = entry ? getCompareGroupEntries(entry.canonicalGroup) : [];
  const canonicalHref =
    entry
      ? `/${entry.locale}/compare/${entry.slug}`
      : legacy
        ? `/en/compare/${slug}`
        : `/${locale}`;
  const adKeywords = entry
    ? getCompareAdKeywords({
        primaryKeyword: entry.title,
        secondaryKeywords: [entry.description],
      })
    : undefined;
  const supportTitle =
    locale === "es"
      ? `Comparativa en revision: ${legacy?.alternativeName ?? slug}`
      : locale === "pt"
        ? `Comparacao em revisao: ${legacy?.alternativeName ?? slug}`
        : locale === "fr"
          ? `Comparatif en revision : ${legacy?.alternativeName ?? slug}`
          : locale === "de"
            ? `Vergleich in Uberarbeitung: ${legacy?.alternativeName ?? slug}`
            : locale === "it"
              ? `Confronto in revisione: ${legacy?.alternativeName ?? slug}`
              : `Comparison under review: ${legacy?.alternativeName ?? slug}`;

  return (
    <article className="blog-post">
      <PageViewTracker locale={locale} pageType="compare" />
      <AdSlot
        keywords={adKeywords}
        locale={locale}
        pageType="compare"
        placementId="compare-post-top"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "TTS Easy", url: `${siteUrl}/${locale}` },
              { name: "Compare", url: `${siteUrl}/${locale}/compare` },
              { name: entry?.title ?? supportTitle, url: `${siteUrl}/${locale}/compare/${slug}` },
            ])
          ),
        }}
      />

      {entry ? (
        <>
          <h1>{entry.title}</h1>
          <div className="post-meta">
            {entry.date ? <span>{entry.date}</span> : null}
            <span>{entry.readingTime}</span>
            {entry.author ? <span>By {entry.author}</span> : null}
            {entry.reviewedAt ? <span>Reviewed {entry.reviewedAt}</span> : null}
          </div>
          <div className="post-content" dangerouslySetInnerHTML={{ __html: entry.contentHtml }} />
          <EditorialMeta
            author={entry.author}
            locale={locale}
            reviewedAt={entry.reviewedAt}
            sources={entry.sources}
          />
        </>
      ) : (
        <>
          <h1>{supportTitle}</h1>
          <LocalizationNotice canonicalHref={canonicalHref} locale={locale} />
        </>
      )}

      <p style={{ marginTop: "2rem" }}>
        <TrackedCtaLink
          className="landing-cta"
          href={`/${locale}`}
          locale={locale}
          pageType="compare"
        >
          {dict.home.tryNow}
        </TrackedCtaLink>
      </p>

      <nav className="legal-links" style={{ marginTop: "2rem" }}>
        <Link href={`/${locale}/compare`}>Compare</Link>
        <Link href={`/${locale}/use-cases`}>Use Cases</Link>
        <Link href={`/${locale}/blog`}>{dict.nav.blog}</Link>
      </nav>
      {entry ? (
        <LanguageSwitcher
          availableLocales={alternateEntries.map((candidate) => candidate.locale)}
          currentLocale={locale as Locale}
          currentPath={`/${locale}/compare/${slug}`}
          label={dict.nav.language}
        />
      ) : null}
    </article>
  );
}
