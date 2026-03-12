import type { Locale } from "@/lib/i18n/config";
import {
  getEditorialEntries,
  getEditorialEntry,
  getEditorialGroupEntries,
  getEditorialGroupEntryForLocale,
  getEditorialLocalizedLocales,
  type EditorialEntry,
  type EditorialEntrySummary,
} from "@/lib/editorialContent";

export interface CompareEntrySummary extends EditorialEntrySummary {}

export interface CompareEntry extends EditorialEntry {}

export function getCompareEntries(
  locale: Locale,
  options?: { indexableOnly?: boolean }
): CompareEntrySummary[] {
  return getEditorialEntries("compare", locale, options) as CompareEntrySummary[];
}

export function getCompareEntryBySlug(locale: Locale, slug: string): CompareEntry | null {
  return getEditorialEntry("compare", locale, slug) as CompareEntry | null;
}

export function getCompareLocales(
  canonicalGroup: string,
  options?: { indexableOnly?: boolean }
): Locale[] {
  return getEditorialLocalizedLocales("compare", canonicalGroup, options);
}

export function getCompareEntryForLocale(
  canonicalGroup: string,
  locale: Locale,
  options?: { indexableOnly?: boolean }
): CompareEntrySummary | null {
  return getEditorialGroupEntryForLocale("compare", canonicalGroup, locale, options) as CompareEntrySummary | null;
}

export function getCompareGroupEntries(
  canonicalGroup: string,
  options?: { indexableOnly?: boolean }
): CompareEntrySummary[] {
  return getEditorialGroupEntries("compare", canonicalGroup, options) as CompareEntrySummary[];
}
