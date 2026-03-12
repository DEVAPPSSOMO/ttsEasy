import type { Locale } from "@/lib/i18n/config";
import {
  getEditorialEntries,
  getEditorialEntry,
  getEditorialGroupEntries,
  type EditorialEntry,
  type EditorialEntrySummary,
  type EditorialSource,
} from "@/lib/editorialContent";

export interface BlogPost extends EditorialEntrySummary {
  date?: string;
  author?: string;
  reviewedAt?: string;
  sources: EditorialSource[];
}

export interface BlogPostWithContent extends EditorialEntry {}

export function getAllPosts(locale: Locale, options?: { indexableOnly?: boolean }): BlogPost[] {
  return getEditorialEntries("blog", locale, options) as BlogPost[];
}

export function getPostBySlug(locale: Locale, slug: string): BlogPostWithContent | null {
  return getEditorialEntry("blog", locale, slug) as BlogPostWithContent | null;
}

export function getPostSlugs(locale: Locale, options?: { indexableOnly?: boolean }): string[] {
  return getAllPosts(locale, options).map((post) => post.slug);
}

export function getPostLocales(canonicalGroup: string, options?: { indexableOnly?: boolean }): Locale[] {
  return getEditorialGroupEntries("blog", canonicalGroup, options).map((entry) => entry.locale);
}

export function getPostGroupEntries(
  canonicalGroup: string,
  options?: { indexableOnly?: boolean }
): BlogPost[] {
  return getEditorialGroupEntries("blog", canonicalGroup, options) as BlogPost[];
}
