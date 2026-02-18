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
  return (
    <Link
      className={className}
      href={href}
      onClick={() =>
        trackArticleCtaClick({ locale, pageType }, { cta_variant: ctaVariant, cta_destination: href })
      }
    >
      {children}
    </Link>
  );
}
