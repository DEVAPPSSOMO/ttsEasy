import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getPostBySlug, getPostGroupEntries, getPostSlugs } from "@/lib/blog";
import { getBlogAdKeywords } from "@/lib/monetization";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { AdSlot } from "@/components/AdSlot";
import { EditorialMeta } from "@/components/EditorialMeta";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PageViewTracker } from "@/components/PageViewTracker";
import { TrackedCtaLink } from "@/components/TrackedCtaLink";

interface Props {
  params: { locale: string; slug: string };
}

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of LOCALES) {
    const slugs = getPostSlugs(locale);
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = params;
  if (!isValidLocale(locale)) return {};

  const post = getPostBySlug(locale as Locale, slug);
  if (!post) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";
  const ogImage = `${siteUrl}/og-image.png`;
  const alternatesByGroup = post.indexable ? getPostGroupEntries(post.canonicalGroup, { indexableOnly: true }) : [];
  const languageAlternates =
    post.indexable && alternatesByGroup.length > 0
      ? Object.fromEntries(
          alternatesByGroup.map((entry) => [entry.locale, `${siteUrl}/${entry.locale}/blog/${entry.slug}`])
        )
      : undefined;
  if (languageAlternates) {
    languageAlternates["x-default"] = `${siteUrl}/en/blog/${
      alternatesByGroup.find((entry) => entry.locale === "en")?.slug ?? post.slug
    }`;
  }

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `${siteUrl}/${locale}/blog/${slug}`,
      languages: languageAlternates,
    },
    robots: post.indexable ? undefined : { index: false, follow: true },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      url: `${siteUrl}/${locale}/blog/${slug}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = params;
  if (!isValidLocale(locale)) notFound();

  const post = getPostBySlug(locale as Locale, slug);
  if (!post) notFound();

  const dict = await getDictionary(locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";
  const alternateEntries = post.indexable ? getPostGroupEntries(post.canonicalGroup, { indexableOnly: true }) : [];
  const publishedTime = post.date ?? post.reviewedAt ?? "2026-03-11";
  const modifiedTime = post.reviewedAt ?? post.date;
  const pathByLocale = Object.fromEntries(
    alternateEntries.map((entry) => [entry.locale, `/${entry.locale}/blog/${entry.slug}`])
  ) as Partial<Record<Locale, string>>;
  const adKeywords = getBlogAdKeywords({
    title: post.title,
    description: post.description,
  });

  return (
    <article className="blog-post">
      <PageViewTracker locale={locale} pageType="blog" />
      <AdSlot
        keywords={adKeywords}
        locale={locale}
        pageType="blog"
        placementId="blog-post-top"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleJsonLd({
              title: post.title,
              description: post.description,
              url: `${siteUrl}/${locale}/blog/${slug}`,
              author: post.author,
              modifiedTime,
              publishedTime,
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "TTS Easy", url: `${siteUrl}/${locale}` },
              { name: dict.nav.blog, url: `${siteUrl}/${locale}/blog` },
              { name: post.title, url: `${siteUrl}/${locale}/blog/${slug}` },
            ])
          ),
        }}
      />

      <h1>{post.title}</h1>
      <div className="post-meta">
        {post.date ? <span>{post.date}</span> : null}
        <span>{post.readingTime}</span>
        {post.author ? <span>By {post.author}</span> : null}
        {post.reviewedAt ? <span>Reviewed {post.reviewedAt}</span> : null}
      </div>
      <div className="post-content" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
      <EditorialMeta
        author={post.author}
        locale={locale}
        reviewedAt={post.reviewedAt}
        sources={post.sources}
      />

      <p style={{ marginTop: "2rem" }}>
        <TrackedCtaLink className="landing-cta" href={`/${locale}`} locale={locale} pageType="blog">
          {dict.home.tryNow}
        </TrackedCtaLink>
      </p>

      <nav className="legal-links" style={{ marginTop: "2rem" }}>
        <Link href={`/${locale}/blog`}>{dict.nav.blog}</Link>
        <Link href={`/${locale}/compare`}>Compare</Link>
        <Link href={`/${locale}/use-cases`}>Use Cases</Link>
        <Link href={`/${locale}`}>TTS Easy</Link>
      </nav>
      <LanguageSwitcher
        availableLocales={alternateEntries.length > 0 ? alternateEntries.map((entry) => entry.locale) : [locale as Locale]}
        currentLocale={locale as Locale}
        currentPath={`/${locale}/blog/${slug}`}
        label={dict.nav.language}
        pathByLocale={pathByLocale}
      />
    </article>
  );
}
