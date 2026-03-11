"use client";

import { trackAffiliateClick, type PageType } from "@/lib/analytics";

interface TrackedAffiliateLinkProps {
  children: React.ReactNode;
  className?: string;
  href: string;
  locale: string;
  pageType: PageType;
  ctaVariant?: string;
}

export function TrackedAffiliateLink({
  children,
  className,
  href,
  locale,
  pageType,
  ctaVariant = "compare_affiliate",
}: TrackedAffiliateLinkProps): JSX.Element {
  return (
    <a
      className={className}
      href={href}
      onClick={() =>
        trackAffiliateClick({ locale, pageType }, { cta_destination: href, cta_variant: ctaVariant })
      }
      rel="noopener noreferrer sponsored nofollow"
      target="_blank"
    >
      {children}
    </a>
  );
}
