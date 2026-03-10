import type { PageType } from "@/lib/analytics";
import { TrackedCtaLink } from "@/components/TrackedCtaLink";
import { getApiPortalHref } from "@/lib/apiPortalUrl";

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
  const pricingHref = getApiPortalHref("/pricing");
  const docsHref = getApiPortalHref("/docs");

  return (
    <section className="api-cta">
      <div>
        <p className="api-cta-kicker">{copy.kicker}</p>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
      </div>

      <div className="api-cta-actions">
        <TrackedCtaLink
          className="landing-cta"
          ctaVariant="api_pricing"
          href={pricingHref}
          locale={locale}
          pageType={pageType}
        >
          {copy.primary}
        </TrackedCtaLink>
        <TrackedCtaLink
          className="api-cta-secondary"
          ctaVariant="api_docs"
          href={docsHref}
          locale={locale}
          pageType={pageType}
        >
          {copy.secondary}
        </TrackedCtaLink>
      </div>

      <p className="api-cta-note">{copy.note}</p>
    </section>
  );
}
