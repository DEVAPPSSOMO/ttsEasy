import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getPostBySlug, getPostSlugs } from "@/lib/blog";
import { getBlogAdKeywords } from "@/lib/monetization";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { AdSlot } from "@/components/AdSlot";
import { ApiCta } from "@/components/ApiCta";
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
  const isEnglish = locale === "en";

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `${siteUrl}/${locale}/blog/${slug}`,
      languages: isEnglish
        ? {
            en: `${siteUrl}/en/blog/${slug}`,
            "x-default": `${siteUrl}/en/blog/${slug}`,
          }
        : undefined,
    },
    robots: isEnglish ? undefined : { index: false, follow: true },
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
              modifiedTime: post.lastUpdated,
              publishedTime: post.date,
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
        <span>{post.date}</span>
        <span>{post.readingTime}</span>
        {post.author ? <span>By {post.author}</span> : null}
        {post.lastUpdated ? <span>Updated {post.lastUpdated}</span> : null}
      </div>
      <div className="post-content" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
      <ApiCta copy={dict.apiCta} locale={locale} pageType="blog" />

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
      <LanguageSwitcher currentLocale={locale as Locale} currentPath={`/${locale}/blog/${slug}`} label={dict.nav.language} />
    </article>
  );
}
