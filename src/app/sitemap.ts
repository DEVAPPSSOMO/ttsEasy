import type { MetadataRoute } from "next";
import { getAppVariant } from "@/lib/appVariant";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { getPostSlugs } from "@/lib/blog";
import { LANDING_PAGES, getLandingLocalizedLocales } from "@/lib/landing-pages";
import { getCompareLocalizedLocales, getCompareSlugs } from "@/lib/compare-pages";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";

const staticPages = [
  "",
  "/about",
  "/privacy",
  "/terms",
  "/cookies",
  "/blog",
  "/use-cases",
  "/tools",
  "/compare",
  "/tools/character-counter",
  "/tools/language-detector",
];

export default function sitemap(): MetadataRoute.Sitemap {
  if (getAppVariant() === "api") {
    const now = new Date();
    return ["", "/pricing", "/docs", "/faq", "/status", "/auth/login"].map((path) => ({
      lastModified: now,
      url: `${siteUrl}${path}`,
    }));
  }

  const entries: MetadataRoute.Sitemap = [];

  for (const page of staticPages) {
    for (const locale of LOCALES) {
      const languages: Record<string, string> = {};
      for (const alt of LOCALES) {
        languages[alt] = `${siteUrl}/${alt}${page}`;
      }
      languages["x-default"] = `${siteUrl}/en${page}`;

      entries.push({
        url: `${siteUrl}/${locale}${page}`,
        lastModified: new Date(),
        alternates: { languages },
      });
    }
  }

  for (const page of LANDING_PAGES) {
    const localizedLocales = getLandingLocalizedLocales(page.slug);
    if (localizedLocales.length === 0) continue;

    for (const locale of localizedLocales) {
      const languages: Record<string, string> = {};
      for (const alt of localizedLocales) {
        languages[alt] = `${siteUrl}/${alt}/use-cases/${page.slug}`;
      }
      languages["x-default"] = `${siteUrl}/${localizedLocales[0]}/use-cases/${page.slug}`;

      entries.push({
        url: `${siteUrl}/${locale}/use-cases/${page.slug}`,
        lastModified: new Date(),
        alternates: { languages },
      });
    }
  }

  const blogSlugLocales = new Map<string, Locale[]>();
  for (const locale of LOCALES) {
    for (const slug of getPostSlugs(locale as Locale)) {
      const localesForSlug = blogSlugLocales.get(slug) ?? [];
      localesForSlug.push(locale as Locale);
      blogSlugLocales.set(slug, localesForSlug);
    }
  }

  for (const [slug, localizedLocales] of blogSlugLocales.entries()) {
    for (const locale of localizedLocales) {
      const languages: Record<string, string> = {};
      for (const alt of localizedLocales) {
        languages[alt] = `${siteUrl}/${alt}/blog/${slug}`;
      }
      languages["x-default"] = `${siteUrl}/${localizedLocales[0]}/blog/${slug}`;

      entries.push({
        url: `${siteUrl}/${locale}/blog/${slug}`,
        lastModified: new Date(),
        alternates: { languages },
      });
    }
  }

  for (const slug of getCompareSlugs()) {
    const localizedLocales = getCompareLocalizedLocales(slug);
    if (localizedLocales.length === 0) continue;

    for (const locale of localizedLocales) {
      const languages: Record<string, string> = {};
      for (const alt of localizedLocales) {
        languages[alt] = `${siteUrl}/${alt}/compare/${slug}`;
      }
      languages["x-default"] = `${siteUrl}/${localizedLocales[0]}/compare/${slug}`;

      entries.push({
        url: `${siteUrl}/${locale}/compare/${slug}`,
        lastModified: new Date(),
        alternates: { languages },
      });
    }
  }

  return entries;
}
