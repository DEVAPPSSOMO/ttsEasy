import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  getComparePage,
  getCompareLocalizedLocales,
  getCompareSlugs,
  hasCompareLocalizedContent,
} from "@/lib/compare-pages";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/jsonLd";
import { ApiCta } from "@/components/ApiCta";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PageViewTracker } from "@/components/PageViewTracker";
import { TrackedCtaLink } from "@/components/TrackedCtaLink";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";

interface Props {
  params: { locale: string; slug: string };
}

function toLocalePath(path: string, locale: string): string {
  if (path === "/en") return `/${locale}`;
  if (path.startsWith("/en/")) return `/${locale}/${path.slice(4)}`;
  return path;
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

  const localizedLocales = getCompareLocalizedLocales(slug);
  if (localizedLocales.length === 0) return {};

  const isLocalized = hasCompareLocalizedContent(slug, locale as Locale);
  const canonicalLocale = isLocalized ? locale : localizedLocales[0];
  const page = getComparePage(slug, canonicalLocale);
  if (!page) return {};

  const languages: Record<string, string> = {};
  for (const loc of localizedLocales) {
    languages[loc] = `${siteUrl}/${loc}/compare/${slug}`;
  }
  languages["x-default"] = `${siteUrl}/${canonicalLocale}/compare/${slug}`;

  const ogImage = `${siteUrl}/og-image.png`;

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: `${siteUrl}/${canonicalLocale}/compare/${slug}`,
      languages,
    },
    robots: isLocalized ? undefined : { index: false, follow: true },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `${siteUrl}/${canonicalLocale}/compare/${slug}`,
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: "TTS Easy" }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [ogImage],
    },
  };
}

export default async function CompareDetailPage({ params }: Props): Promise<JSX.Element> {
  const { locale, slug } = params;
  if (!isValidLocale(locale)) notFound();

  const localizedLocales = getCompareLocalizedLocales(slug);
  if (localizedLocales.length === 0) notFound();

  const contentLocale = hasCompareLocalizedContent(slug, locale as Locale)
    ? (locale as Locale)
    : localizedLocales[0];
  const page = getComparePage(slug, contentLocale);
  if (!page) notFound();

  const dict = await getDictionary(locale as Locale);

  return (
    <article className="blog-post">
      <PageViewTracker locale={locale} pageType="compare" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd(page.contract.faq)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "TTS Easy", url: `${siteUrl}/${locale}` },
              { name: "Compare", url: `${siteUrl}/${locale}/compare` },
              { name: page.h1, url: `${siteUrl}/${locale}/compare/${slug}` },
            ])
          ),
        }}
      />

      <h1>{page.h1}</h1>
      <div className="post-content">
        {page.intro.map((line) => (
          <p key={line}>{line}</p>
        ))}

        <h2>Where TTS Easy wins for this workflow</h2>
        <ul>
          {page.strengths.map((item) => (
            <li key={item.title}>
              <strong>{item.title}:</strong> {item.detail}
            </li>
          ))}
        </ul>

        <h2>When this option makes sense</h2>
        <ul>
          {page.whenToUse.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2>Methodology</h2>
        <ul>
          {page.methodology.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2>Benchmark snapshot</h2>
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>TTS Easy</th>
                <th>{page.alternativeName}</th>
                <th>Why it matters</th>
              </tr>
            </thead>
            <tbody>
              {page.benchmarks.map((row) => (
                <tr key={row.metric}>
                  <td>{row.metric}</td>
                  <td>{row.ttsEasy}</td>
                  <td>{row.alternative}</td>
                  <td>{row.whyItMatters}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>FAQ</h2>
        {page.contract.faq.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}

        {page.affiliateUrl ? (
          <section className="compare-disclosure">
            <h2>Optional vendor link</h2>
            <p>External vendor references may be monetized. Review the product directly before you commit your workflow.</p>
            <p>
              <a href={page.affiliateUrl} rel="noopener noreferrer sponsored nofollow" target="_blank">
                Visit {page.alternativeName}
              </a>
            </p>
          </section>
        ) : null}

        <h2>Related pages</h2>
        <ul>
          {page.contract.internalLinksRequired.map((href) => {
            const nextHref = toLocalePath(href, locale);
            return (
              <li key={href}>
                <Link href={nextHref}>{nextHref}</Link>
              </li>
            );
          })}
        </ul>
      </div>
      <ApiCta copy={dict.apiCta} locale={locale} pageType="compare" />

      <p style={{ marginTop: "2rem" }}>
        <TrackedCtaLink
          className="landing-cta"
          ctaVariant={page.contract.ctaVariant}
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
      <LanguageSwitcher
        currentLocale={locale as Locale}
        currentPath={`/${locale}/compare/${slug}`}
        label={dict.nav.language}
      />
    </article>
  );
}
