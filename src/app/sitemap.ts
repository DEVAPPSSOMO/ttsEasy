import type { MetadataRoute } from "next";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { getPostSlugs } from "@/lib/blog";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";

const staticPages = ["", "/about", "/privacy", "/terms", "/cookies", "/blog"];

const useCaseSlugs = [
  "text-to-speech-for-youtube",
  "tts-for-podcasts",
  "tts-for-accessibility",
  "tts-for-students",
  "tts-for-discord",
  "tts-for-presentations",
  "text-to-speech-for-ebooks",
  "tts-for-language-learning",
  "free-text-to-speech-online",
  "text-to-speech-spanish",
  "text-to-speech-portuguese",
  "text-to-speech-french",
  "text-to-speech-german",
  "text-to-speech-italian",
  "text-to-speech-british",
  "text-to-speech-australian",
  "texto-a-voz-mexicano",
  "texto-a-voz-argentino",
  "texto-a-voz-espanol",
];

export default function sitemap(): MetadataRoute.Sitemap {
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

  for (const slug of useCaseSlugs) {
    for (const locale of LOCALES) {
      const languages: Record<string, string> = {};
      for (const alt of LOCALES) {
        languages[alt] = `${siteUrl}/${alt}/use-cases/${slug}`;
      }
      languages["x-default"] = `${siteUrl}/en/use-cases/${slug}`;

      entries.push({
        url: `${siteUrl}/${locale}/use-cases/${slug}`,
        lastModified: new Date(),
        alternates: { languages },
      });
    }
  }

  const blogSlugs = new Set<string>();
  for (const locale of LOCALES) {
    for (const slug of getPostSlugs(locale as Locale)) {
      blogSlugs.add(slug);
    }
  }

  for (const slug of blogSlugs) {
    for (const locale of LOCALES) {
      const languages: Record<string, string> = {};
      for (const alt of LOCALES) {
        languages[alt] = `${siteUrl}/${alt}/blog/${slug}`;
      }
      languages["x-default"] = `${siteUrl}/en/blog/${slug}`;

      entries.push({
        url: `${siteUrl}/${locale}/blog/${slug}`,
        lastModified: new Date(),
        alternates: { languages },
      });
    }
  }

  return entries;
}
