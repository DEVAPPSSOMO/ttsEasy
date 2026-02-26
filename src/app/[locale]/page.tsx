import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { webApplicationJsonLd, faqJsonLd } from "@/lib/seo/jsonLd";
import { TtsApp } from "@/components/TtsApp";
import { AdSlot } from "@/components/AdSlot";
import { Features } from "@/components/Features";
import { Faq } from "@/components/Faq";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ScrollTracker } from "@/components/ScrollTracker";

interface HomePageProps {
  params: { locale: string };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);

  return (
    <main className="page-shell">
      <ScrollTracker />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webApplicationJsonLd(locale as Locale)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd(dict.faq.items)),
        }}
      />
      <TtsApp
        copy={dict.ui}
        introDescription={dict.home.subtitle}
        introHeadingLevel="h1"
        introTitle={dict.home.h1}
        locale={locale}
        pageType="home"
      />

      <AdSlot
        behavior="mobileSticky"
        className="ad-sticky-mobile"
        locale={locale}
        pageType="home"
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY}
      />

      <Features title={dict.features.title} items={dict.features.items} />

      <AdSlot locale={locale} pageType="home" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT} />

      <Faq title={dict.faq.title} items={dict.faq.items} />

      <footer className="site-footer">
        <nav className="legal-links">
          <Link href={`/${locale}/privacy`}>{dict.nav.privacy}</Link>
          <Link href={`/${locale}/terms`}>{dict.nav.terms}</Link>
          <Link href={`/${locale}/cookies`}>{dict.nav.cookies}</Link>
          <Link href={`/${locale}/about`}>{dict.nav.about}</Link>
          <Link href={`/${locale}/blog`}>{dict.nav.blog}</Link>
          <Link href={`/${locale}/use-cases`}>Use Cases</Link>
          <Link href={`/${locale}/tools`}>Tools</Link>
          <Link href={`/${locale}/compare`}>Compare</Link>
        </nav>
        <LanguageSwitcher currentLocale={locale as Locale} currentPath={`/${locale}`} label={dict.nav.language} />
      </footer>
    </main>
  );
}
