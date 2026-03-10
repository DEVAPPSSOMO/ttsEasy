"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface SiteHeaderProps {
  locale: Locale;
  aboutLabel: string;
  blogLabel: string;
  compareLabel: string;
  languageLabel: string;
  tagline: string;
  toolsLabel: string;
  useCasesLabel: string;
}

export function SiteHeader({
  locale,
  aboutLabel,
  blogLabel,
  compareLabel,
  languageLabel,
  tagline,
  toolsLabel,
  useCasesLabel,
}: SiteHeaderProps): JSX.Element {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="site-brand" href={`/${locale}`}>
          <span className="site-brand-mark">TTS</span>
          <span className="site-brand-copy">
            <strong>TTS Easy</strong>
            <small>{tagline}</small>
          </span>
        </Link>

        <nav aria-label="Primary" className="site-nav">
          <Link href={`/${locale}/blog`}>{blogLabel}</Link>
          <Link href={`/${locale}/use-cases`}>{useCasesLabel}</Link>
          <Link href={`/${locale}/tools`}>{toolsLabel}</Link>
          <Link href={`/${locale}/compare`}>{compareLabel}</Link>
          <Link href={`/${locale}/about`}>{aboutLabel}</Link>
        </nav>

        <LanguageSwitcher currentLocale={locale} currentPath={pathname || `/${locale}`} label={languageLabel} />
      </div>
    </header>
  );
}
