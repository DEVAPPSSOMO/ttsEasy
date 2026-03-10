import Link from "next/link";
import type { PageType } from "@/lib/analytics";
import { TrackedCtaLink } from "@/components/TrackedCtaLink";

interface ApiCtaProps {
  locale: string;
  pageType: PageType;
  copy: {
    kicker: string;
    title: string;
    description: string;
    primary: string;
    secondary: string;
    note: string;
  };
}

export function ApiCta({ locale, pageType, copy }: ApiCtaProps): JSX.Element {
  return (
    <section className="api-cta">
      <div>
        <p className="api-cta-kicker">{copy.kicker}</p>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
      </div>

      <div className="api-cta-actions">
        <TrackedCtaLink className="landing-cta" href="/pricing" locale={locale} pageType={pageType}>
          {copy.primary}
        </TrackedCtaLink>
        <Link className="api-cta-secondary" href="/docs">
          {copy.secondary}
        </Link>
      </div>

      <p className="api-cta-note">{copy.note}</p>
    </section>
  );
}
