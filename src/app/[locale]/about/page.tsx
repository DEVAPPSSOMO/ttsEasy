import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getAboutContent } from "@/lib/aboutContent";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface Props {
  params: { locale: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  if (!isValidLocale(locale)) return {};
  const content = getAboutContent(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";
  const languages = Object.fromEntries(
    LOCALES.map((candidate) => [candidate, `${siteUrl}/${candidate}/about`])
  );
  languages["x-default"] = `${siteUrl}/en/about`;

  return {
    title: content.title,
    alternates: {
      canonical: `${siteUrl}/${locale}/about`,
      languages,
    },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);
  const content = getAboutContent(locale as Locale);

  return (
    <main className="simple-page">
      <h1>{content.title}</h1>

      {content.sections.map((section) => (
        <section className="landing-steps" key={section.title} style={{ marginTop: "1.5rem" }}>
          <h2>{section.title}</h2>
          <p>{section.body}</p>
        </section>
      ))}

      <section className="landing-steps" style={{ marginTop: "1.25rem" }}>
        <h2>{dict.about.contactSectionTitle}</h2>
        <p>
          <strong>{dict.about.updatedLabel}:</strong> March 11, 2026
        </p>
        <p>
          <strong>{dict.about.contactLabel}:</strong> support@ttseasy.com
        </p>
      </section>

      <nav className="legal-links">
        <Link href={`/${locale}`}>TTS Easy</Link>
        <Link href={`/${locale}/privacy`}>{dict.nav.privacy}</Link>
        <Link href={`/${locale}/terms`}>{dict.nav.terms}</Link>
      </nav>
      <LanguageSwitcher currentLocale={locale as Locale} currentPath={`/${locale}/about`} label={dict.nav.language} />
    </main>
  );
}
