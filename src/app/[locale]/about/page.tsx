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
    title: dict.about.title,
    alternates: {
      canonical: `${siteUrl}/${locale}/about`,
    },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);

  return (
    <main className="simple-page">
      <h1>{dict.about.title}</h1>
      <p>{dict.about.p1}</p>
      <p>{dict.about.p2}</p>
      <p>{dict.about.p3}</p>

      <section className="landing-steps" style={{ marginTop: "1.5rem" }}>
        <h2>{dict.about.editorialPolicyTitle}</h2>
        <p>{dict.about.editorialPolicyBody}</p>
      </section>

      <section className="landing-steps" style={{ marginTop: "1.25rem" }}>
        <h2>{dict.about.updatedLabel}</h2>
        <p>{dict.about.updatedDate}</p>
        <p>
          <strong>{dict.about.contactLabel}:</strong> {dict.about.contactValue}
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
