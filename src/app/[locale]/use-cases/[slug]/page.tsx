import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LANDING_PAGES, getLandingPage, getLandingContent } from "@/lib/landing-pages";
import { faqJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { TtsApp } from "@/components/TtsApp";
import { Faq } from "@/components/Faq";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface Props {
  params: { locale: string; slug: string };
}

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of LOCALES) {
    for (const page of LANDING_PAGES) {
      params.push({ locale, slug: page.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = params;
  if (!isValidLocale(locale)) return {};

  const page = getLandingPage(slug);
  if (!page) return {};

  const content = getLandingContent(slug, locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";

  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = `${siteUrl}/${loc}/use-cases/${slug}`;
  }
  languages["x-default"] = `${siteUrl}/en/use-cases/${slug}`;

  return {
    title: content.h1,
    description: content.intro[0],
    alternates: {
      canonical: `${siteUrl}/${locale}/use-cases/${slug}`,
      languages,
    },
    openGraph: {
      title: content.h1,
      description: content.intro[0],
      url: `${siteUrl}/${locale}/use-cases/${slug}`,
    },
  };
}

export default async function UseCasePage({ params }: Props) {
  const { locale, slug } = params;
  if (!isValidLocale(locale)) notFound();

  const page = getLandingPage(slug);
  if (!page) notFound();

  const dict = await getDictionary(locale as Locale);
  const content = getLandingContent(slug, locale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";

  return (
    <main className="landing-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd(content.faq)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "TTS Easy", url: `${siteUrl}/${locale}` },
              { name: content.h1, url: `${siteUrl}/${locale}/use-cases/${slug}` },
            ])
          ),
        }}
      />

      <div className="landing-intro">
        <h1>{content.h1}</h1>
        {content.intro.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <TtsApp locale={locale} copy={dict.ui} />

      <div className="landing-benefits">
        {content.benefits.map((b) => (
          <div className="benefit" key={b.title}>
            <h3>{b.title}</h3>
            <p>{b.description}</p>
          </div>
        ))}
      </div>

      <div className="landing-steps">
        <h2>{locale === "es" ? "Como funciona" : "How it works"}</h2>
        <ol>
          {content.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      <Faq title={locale === "es" ? "Preguntas Frecuentes" : "FAQ"} items={content.faq} />

      <Link href={`/${locale}`} className="landing-cta" style={{ display: "inline-block", textAlign: "center", textDecoration: "none", lineHeight: "48px" }}>
        {dict.home.tryNow}
      </Link>

      <footer className="site-footer">
        <nav className="legal-links">
          <Link href={`/${locale}`}>TTS Easy</Link>
          <Link href={`/${locale}/blog`}>{dict.nav.blog}</Link>
          <Link href={`/${locale}/privacy`}>{dict.nav.privacy}</Link>
          <Link href={`/${locale}/terms`}>{dict.nav.terms}</Link>
        </nav>
        <LanguageSwitcher currentLocale={locale as Locale} currentPath={`/${locale}/use-cases/${slug}`} label={dict.nav.language} />
      </footer>
    </main>
  );
}
