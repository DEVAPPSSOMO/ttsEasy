import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { SharePlayer } from "@/components/SharePlayer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";

interface SharePageProps {
  params: { locale: string; id: string };
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { locale } = params;
  if (!isValidLocale(locale)) return {};

  const dict = await getDictionary(locale);

  return {
    title: dict.metadata.ogTitle,
    description: dict.metadata.ogDescription,
    openGraph: {
      title: dict.metadata.ogTitle,
      description: dict.metadata.ogDescription,
      url: `${siteUrl}/${locale}/s/${params.id}`,
      siteName: "TTS Easy",
      type: "website",
    },
    robots: { index: false },
  };
}

export default async function SharePage({ params }: SharePageProps): Promise<JSX.Element> {
  const { locale, id } = params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);

  return (
    <main className="simple-page">
      <h1>{dict.metadata.ogTitle}</h1>
      <SharePlayer shareId={id} />
      <p style={{ marginTop: "2rem" }}>
        <Link href={`/${locale}`} className="landing-cta" style={{ display: "inline-block", padding: "0.8rem 2rem", textDecoration: "none", borderRadius: "12px" }}>
          {dict.home.tryNow}
        </Link>
      </p>
    </main>
  );
}
