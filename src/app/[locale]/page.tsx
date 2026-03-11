import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { webApplicationJsonLd, faqJsonLd } from "@/lib/seo/jsonLd";
import { TtsApp } from "@/components/TtsApp";
import { ApiCta } from "@/components/ApiCta";
import { AdSlot } from "@/components/AdSlot";
import { FeaturedPosts } from "@/components/FeaturedPosts";
import { Features } from "@/components/Features";
import { Faq } from "@/components/Faq";
import { ScrollTracker } from "@/components/ScrollTracker";
import { buildAdKeywordString } from "@/lib/monetization";

interface HomePageProps {
  params: { locale: string };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);
  const [leadParagraph, ...contextParagraphs] = dict.home.editorialIntro;
  const trustItems = [dict.features.items[0], dict.features.items[3], dict.features.items[4]]
    .filter(Boolean)
    .map((item) => item.title);
  const adKeywords = buildAdKeywordString([
    dict.home.h1,
    dict.home.featuredPostsTitle,
    dict.home.featuredPostsDescription,
  ]);

  return (
    <main className="page-shell page-shell-home">
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
      <section className="home-hero home-hero-app-first">
        <h1 className="home-hero-title-compact">{dict.home.h1}</h1>

        <TtsApp
          copy={dict.ui}
          locale={locale}
          pageType="home"
          showIntro={false}
          upsell={dict.apiCta}
          variant="home"
        />

        {trustItems.length > 0 ? (
          <ul className="home-trust-chips home-trust-chips-centered" aria-label="Key product highlights">
            {trustItems.map((item) => (
              <li className="trust-chip" key={item}>
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {contextParagraphs[0] ? (
        <section className="home-context">
          <div className="home-context-card">
            <p>{contextParagraphs[0]}</p>
          </div>
        </section>
      ) : null}

      <Features title={dict.features.title} items={dict.features.items} />
      <FeaturedPosts
        description={dict.home.featuredPostsDescription}
        title={dict.home.featuredPostsTitle}
      />
      <AdSlot
        keywords={adKeywords}
        locale={locale}
        pageType="home"
        placementId="home-mid"
      />
      <Faq openCount={3} title={dict.faq.title} items={dict.faq.items} />
      <ApiCta copy={dict.apiCta} locale={locale} pageType="home" />

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
