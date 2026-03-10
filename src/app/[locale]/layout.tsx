import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isApiVariant } from "@/lib/appVariant";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { organizationJsonLd } from "@/lib/seo/jsonLd";
import { SiteHeader } from "@/components/SiteHeader";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  if (!isValidLocale(locale)) return {};

  const dict = await getDictionary(locale);

  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = `${siteUrl}/${loc}`;
  }
  languages["x-default"] = `${siteUrl}/en`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: dict.metadata.title + " | TTS Easy",
      template: "%s | TTS Easy",
    },
    description: dict.metadata.description,
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages,
    },
    openGraph: {
      title: dict.metadata.ogTitle,
      description: dict.metadata.ogDescription,
      url: `${siteUrl}/${locale}`,
      siteName: "TTS Easy",
      locale: locale,
      type: "website",
      images: [
        {
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "TTS Easy - Text to Speech",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.metadata.ogTitle,
      description: dict.metadata.ogDescription,
      images: [`${siteUrl}/og-image.png`],
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      other: {
        ...(process.env.BING_SITE_VERIFICATION
          ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
          : {}),
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps): Promise<JSX.Element> {
  if (isApiVariant()) {
    notFound();
  }

  const { locale } = params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale as Locale);

  return (
    <div lang={locale}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
      <SiteHeader
        aboutLabel={dict.nav.about}
        blogLabel={dict.nav.blog}
        compareLabel={dict.hubs.compare.title}
        languageLabel={dict.nav.language}
        locale={locale as Locale}
        tagline={dict.home.compactSubtitle}
        toolsLabel={dict.hubs.tools.title}
        useCasesLabel={dict.hubs.useCases.title}
      />
      {children}
    </div>
  );
}
