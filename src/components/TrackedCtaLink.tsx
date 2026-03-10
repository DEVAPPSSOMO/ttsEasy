"use client";

import Link from "next/link";
import type { PageType } from "@/lib/analytics";
import { trackArticleCtaClick } from "@/lib/analytics";

interface TrackedCtaLinkProps {
  href: string;
  locale: string;
  pageType: PageType;
  ctaVariant?: string;
  className?: string;
  children: React.ReactNode;
}

export function TrackedCtaLink({
  href,
  locale,
  pageType,
  ctaVariant = "generate_now",
  className,
  children,
}: TrackedCtaLinkProps): JSX.Element {
  const isExternal = /^https?:\/\//.test(href);
  const handleClick = () =>
    trackArticleCtaClick({ locale, pageType }, { cta_variant: ctaVariant, cta_destination: href });

  if (isExternal) {
    return (
      <a className={className} href={href} onClick={handleClick}>
        {children}
      </a>
    );
  }

  return (
    <Link className={className} href={href} onClick={handleClick}>
      {children}
    </Link>
  );
}
