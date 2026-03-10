import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getAllPosts } from "@/lib/blog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PageViewTracker } from "@/components/PageViewTracker";

interface Props {
  params: { locale: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";
  const ogImage = `${siteUrl}/og-image.png`;
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = `${siteUrl}/${loc}/blog`;
  }
  languages["x-default"] = `${siteUrl}/en/blog`;

  return {
    title: `${dict.nav.blog} | TTS Easy`,
    description: dict.metadata.description,
    robots: locale === "en" ? undefined : { index: false, follow: true },
    alternates: {
      canonical: `${siteUrl}/${locale}/blog`,
      languages: locale === "en" ? languages : undefined,
    },
    openGraph: {
      title: `${dict.nav.blog} | TTS Easy`,
      description: dict.metadata.description,
      type: "website",
      url: `${siteUrl}/${locale}/blog`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "TTS Easy" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${dict.nav.blog} | TTS Easy`,
      description: dict.metadata.description,
      images: [ogImage],
    },
  };
}

export default async function BlogIndex({ params }: Props) {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);
  const posts = getAllPosts(locale as Locale);

  return (
    <main className="blog-index">
      <PageViewTracker locale={locale} pageType="blog" />
      <h1>{dict.nav.blog}</h1>
      <div className="blog-list">
        {posts.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          posts.map((post) => (
            <article className="blog-card" key={post.slug}>
              <h2>
                <Link href={`/${locale}/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p>{post.description}</p>
              <div className="blog-meta">
                {post.date} &middot; {post.readingTime}
              </div>
            </article>
          ))
        )}
      </div>
      <nav className="legal-links" style={{ marginTop: "2rem" }}>
        <Link href={`/${locale}`}>TTS Easy</Link>
        <Link href={`/${locale}/use-cases`}>Use Cases</Link>
        <Link href={`/${locale}/tools`}>Tools</Link>
        <Link href={`/${locale}/compare`}>Compare</Link>
      </nav>
      <LanguageSwitcher currentLocale={locale as Locale} currentPath={`/${locale}/blog`} label={dict.nav.language} />
    </main>
  );
}
