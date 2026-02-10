import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
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
    title: dict.cookies.title,
    alternates: {
      canonical: `${siteUrl}/${locale}/cookies`,
    },
  };
}

export default async function CookiesPage({ params }: Props) {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);

  return (
    <main className="simple-page">
      <h1>{dict.cookies.title}</h1>
      <p>{dict.cookies.p1}</p>
      <p>{dict.cookies.p2}</p>
      <nav className="legal-links">
        <Link href={`/${locale}`}>TTS Easy</Link>
        <Link href={`/${locale}/privacy`}>{dict.nav.privacy}</Link>
        <Link href={`/${locale}/terms`}>{dict.nav.terms}</Link>
      </nav>
      <LanguageSwitcher currentLocale={locale as Locale} currentPath={`/${locale}/cookies`} label={dict.nav.language} />
    </main>
  );
}
