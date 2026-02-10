import type { Locale } from "@/lib/i18n/config";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";

export function webApplicationJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TTS Easy",
    url: `${siteUrl}/${locale}`,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Free online text to speech converter with automatic language detection, 11 accents, and MP3 download.",
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function breadcrumbJsonLd(
  crumbs: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

export function articleJsonLd(opts: {
  title: string;
  description: string;
  url: string;
  publishedTime: string;
  modifiedTime?: string;
  author?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    url: opts.url,
    datePublished: opts.publishedTime,
    dateModified: opts.modifiedTime ?? opts.publishedTime,
    author: {
      "@type": "Organization",
      name: opts.author ?? "TTS Easy",
    },
    publisher: {
      "@type": "Organization",
      name: "TTS Easy",
      url: siteUrl,
    },
  };
}
