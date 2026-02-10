import type { Locale } from "./config";

export type Dictionary = typeof import("./dictionaries/en.json");

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en.json") as Promise<Dictionary>,
  es: () => import("./dictionaries/es.json") as Promise<Dictionary>,
  pt: () => import("./dictionaries/pt.json") as Promise<Dictionary>,
  fr: () => import("./dictionaries/fr.json") as Promise<Dictionary>,
  de: () => import("./dictionaries/de.json") as Promise<Dictionary>,
  it: () => import("./dictionaries/it.json") as Promise<Dictionary>,
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const load = loaders[locale] ?? loaders.en;
  return load();
}
