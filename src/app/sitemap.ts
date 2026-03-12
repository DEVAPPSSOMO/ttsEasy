import type { MetadataRoute } from "next";
import { getAppVariant } from "@/lib/appVariant";
import { LOCALES } from "@/lib/i18n/config";
import { getAllPosts, getPostGroupEntries } from "@/lib/blog";
import { getUseCaseEntries, getUseCaseGroupEntries } from "@/lib/useCaseContent";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";

const localizedStaticPages = [
  "",
  "/about",
  "/blog",
  "/use-cases",
  "/tools",
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

  for (const page of localizedStaticPages) {
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

  const useCaseSlugs = new Set<string>();
  for (const locale of LOCALES) {
    for (const entry of getUseCaseEntries(locale, { indexableOnly: true })) {
      if (useCaseSlugs.has(entry.slug)) continue;
      useCaseSlugs.add(entry.slug);

      const groupEntries = getUseCaseGroupEntries(entry.canonicalGroup, { indexableOnly: true });
      const languages: Record<string, string> = {};
      for (const localizedEntry of groupEntries) {
        languages[localizedEntry.locale] = `${siteUrl}/${localizedEntry.locale}/use-cases/${localizedEntry.slug}`;
      }
      if (languages.en) {
        languages["x-default"] = languages.en;
      }

      for (const localizedEntry of groupEntries) {
        entries.push({
          url: `${siteUrl}/${localizedEntry.locale}/use-cases/${localizedEntry.slug}`,
          lastModified: new Date(localizedEntry.reviewedAt ?? Date.now()),
          alternates: { languages },
        });
      }
    }
  }

  const canonicalGroups = new Set<string>();
  for (const locale of LOCALES) {
    for (const post of getAllPosts(locale, { indexableOnly: true })) {
      if (canonicalGroups.has(post.canonicalGroup)) continue;
      canonicalGroups.add(post.canonicalGroup);

      const groupEntries = getPostGroupEntries(post.canonicalGroup, { indexableOnly: true });
      const languages: Record<string, string> = {};
      for (const entry of groupEntries) {
        languages[entry.locale] = `${siteUrl}/${entry.locale}/blog/${entry.slug}`;
      }
      if (languages.en) {
        languages["x-default"] = languages.en;
      }

      for (const entry of groupEntries) {
        entries.push({
          url: `${siteUrl}/${entry.locale}/blog/${entry.slug}`,
          lastModified: new Date(entry.reviewedAt ?? entry.date ?? Date.now()),
          alternates: { languages },
        });
      }
    }
  }

  return entries;
}
