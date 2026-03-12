import Link from "next/link";
import { LOCALES, type Locale } from "@/lib/i18n/config";

const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
};

interface LanguageSwitcherProps {
  availableLocales?: readonly Locale[];
  currentLocale: Locale;
  currentPath: string;
  label: string;
  pathByLocale?: Partial<Record<Locale, string>>;
}

export function LanguageSwitcher({
  availableLocales = LOCALES,
  currentLocale,
  currentPath,
  label,
  pathByLocale,
}: LanguageSwitcherProps): JSX.Element {
  const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}/, "") || "/";

  return (
    <div className="lang-switcher">
      <span>{label}:</span>
      {availableLocales.map((loc) => (
        <Link
          className={loc === currentLocale ? "lang-link active" : "lang-link"}
          href={pathByLocale?.[loc] ?? `/${loc}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`}
          hrefLang={loc}
          key={loc}
        >
          {LOCALE_NAMES[loc]}
        </Link>
      ))}
    </div>
  );
}
