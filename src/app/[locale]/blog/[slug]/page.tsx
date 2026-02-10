import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getPostBySlug, getPostSlugs } from "@/lib/blog";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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

  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    const exists = getPostBySlug(loc, slug);
    if (exists) {
      languages[loc] = `${siteUrl}/${loc}/blog/${slug}`;
    }
  }
  languages["x-default"] = `${siteUrl}/en/blog/${slug}`;

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `${siteUrl}/${locale}/blog/${slug}`,
      languages,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      url: `${siteUrl}/${locale}/blog/${slug}`,
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

  return (
    <article className="blog-post">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleJsonLd({
              title: post.title,
              description: post.description,
              url: `${siteUrl}/${locale}/blog/${slug}`,
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
        {post.date} &middot; {post.readingTime}
      </div>
      <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />

      <nav className="legal-links" style={{ marginTop: "2rem" }}>
        <Link href={`/${locale}/blog`}>{dict.nav.blog}</Link>
        <Link href={`/${locale}`}>TTS Easy</Link>
      </nav>
      <LanguageSwitcher currentLocale={locale as Locale} currentPath={`/${locale}/blog/${slug}`} label={dict.nav.language} />
    </article>
  );
}
