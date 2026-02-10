import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getAllPosts } from "@/lib/blog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface Props {
  params: { locale: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";

  return {
    title: `${dict.nav.blog} | TTS Easy`,
    alternates: {
      canonical: `${siteUrl}/${locale}/blog`,
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
      </nav>
      <LanguageSwitcher currentLocale={locale as Locale} currentPath={`/${locale}/blog`} label={dict.nav.language} />
    </main>
  );
}
