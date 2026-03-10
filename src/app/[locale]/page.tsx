import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { webApplicationJsonLd, faqJsonLd } from "@/lib/seo/jsonLd";
import { TtsApp } from "@/components/TtsApp";
import { AdSlot } from "@/components/AdSlot";
import { ApiCta } from "@/components/ApiCta";
import { FeaturedPosts } from "@/components/FeaturedPosts";
import { Features } from "@/components/Features";
import { Faq } from "@/components/Faq";
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
      <section className="editorial-intro">
        <p className="editorial-kicker">{dict.ui.headline}</p>
        <h1>{dict.home.h1}</h1>
        {dict.home.editorialIntro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>

      <TtsApp
        compactIntro
        copy={dict.ui}
        introDescription={dict.home.compactSubtitle}
        introHeadingLevel="h2"
        introTitle={dict.home.compactH1}
        locale={locale}
        pageType="home"
      />

      <Features title={dict.features.title} items={dict.features.items} />
      <FeaturedPosts
        description={dict.home.featuredPostsDescription}
        title={dict.home.featuredPostsTitle}
      />
      <Faq openCount={3} title={dict.faq.title} items={dict.faq.items} />
      <ApiCta copy={dict.apiCta} locale={locale} pageType="home" />

      <AdSlot locale={locale} pageType="home" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT} />

      <footer className="site-footer">
        <nav className="legal-links">
          <Link href={`/${locale}/privacy`}>{dict.nav.privacy}</Link>
          <Link href={`/${locale}/terms`}>{dict.nav.terms}</Link>
          <Link href={`/${locale}/cookies`}>{dict.nav.cookies}</Link>
          <Link href={`/${locale}/about`}>{dict.nav.about}</Link>
          <Link href={`/${locale}/blog`}>{dict.nav.blog}</Link>
          <Link href={`/${locale}/use-cases`}>{dict.hubs.useCases.title}</Link>
          <Link href={`/${locale}/tools`}>{dict.hubs.tools.title}</Link>
          <Link href={`/${locale}/compare`}>{dict.hubs.compare.title}</Link>
        </nav>
      </footer>
    </main>
  );
}
