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

export interface UseCaseEntrySummary extends EditorialEntrySummary {}

export interface UseCaseEntry extends EditorialEntry {}

export function getUseCaseEntries(
  locale: Locale,
  options?: { indexableOnly?: boolean }
): UseCaseEntrySummary[] {
  return getEditorialEntries("use-case", locale, options) as UseCaseEntrySummary[];
}

export function getUseCaseBySlug(locale: Locale, slug: string): UseCaseEntry | null {
  return getEditorialEntry("use-case", locale, slug) as UseCaseEntry | null;
}

export function getUseCaseLocales(
  canonicalGroup: string,
  options?: { indexableOnly?: boolean }
): Locale[] {
  return getEditorialLocalizedLocales("use-case", canonicalGroup, options);
}

export function getUseCaseEntryForLocale(
  canonicalGroup: string,
  locale: Locale,
  options?: { indexableOnly?: boolean }
): UseCaseEntrySummary | null {
  return getEditorialGroupEntryForLocale("use-case", canonicalGroup, locale, options) as UseCaseEntrySummary | null;
}

export function getUseCaseGroupEntries(
  canonicalGroup: string,
  options?: { indexableOnly?: boolean }
): UseCaseEntrySummary[] {
  return getEditorialGroupEntries("use-case", canonicalGroup, options) as UseCaseEntrySummary[];
}
