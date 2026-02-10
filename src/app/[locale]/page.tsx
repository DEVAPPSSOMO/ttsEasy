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

      <div className="hero">
        <h1>{dict.home.h1}</h1>
        <p>{dict.home.subtitle}</p>
      </div>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP} />

      <TtsApp locale={locale} copy={dict.ui} />

      <AdSlot className="ad-sticky-mobile" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY} />

      <Features title={dict.features.title} items={dict.features.items} />

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT} />

      <Faq title={dict.faq.title} items={dict.faq.items} />

      <div className="trust-signals">
        <span>{dict.trust.poweredBy}</span>
        <span>{dict.trust.noSignUp}</span>
        <span>{dict.trust.neverStored}</span>
      </div>

      <footer className="site-footer">
        <nav className="legal-links">
          <Link href={`/${locale}/privacy`}>{dict.nav.privacy}</Link>
          <Link href={`/${locale}/terms`}>{dict.nav.terms}</Link>
          <Link href={`/${locale}/cookies`}>{dict.nav.cookies}</Link>
          <Link href={`/${locale}/about`}>{dict.nav.about}</Link>
          <Link href={`/${locale}/blog`}>{dict.nav.blog}</Link>
        </nav>
        <LanguageSwitcher currentLocale={locale as Locale} currentPath={`/${locale}`} label={dict.nav.language} />
      </footer>
    </main>
  );
}
