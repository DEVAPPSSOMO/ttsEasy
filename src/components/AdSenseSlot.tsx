"use client";

import { useEffect, useRef, useState } from "react";
import { trackAdSlotView, type PageType } from "@/lib/analytics";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSenseSlotProps {
  behavior?: "default" | "mobileSticky";
  className?: string;
  format?: string;
  locale?: string;
  pageType?: PageType;
  placementId: string;
  slot?: string;
}

type MobileStickyState = "pending" | "filled" | "hidden";

const MOBILE_STICKY_TIMEOUT_MS = 3000;

export function AdSenseSlot({
  behavior = "default",
  className,
  format = "auto",
  locale,
  pageType = "other",
  placementId,
  slot,
}: AdSenseSlotProps): JSX.Element | null {
  const adRef = useRef<HTMLModElement | null>(null);
  const [mobileStickyState, setMobileStickyState] = useState<MobileStickyState>("pending");
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const isProd = process.env.NODE_ENV === "production";
  const isMobileSticky = behavior === "mobileSticky";

  useEffect(() => {
    if (!isMobileSticky || !client || !slot || !adRef.current) {
      return;
    }

    const adElement = adRef.current;
    setMobileStickyState("pending");

    const updateFromAdStatus = () => {
      const adStatus = adElement.getAttribute("data-ad-status");
      if (adStatus === "filled") {
        setMobileStickyState("filled");
      } else if (adStatus === "unfilled") {
        setMobileStickyState("hidden");
      }
    };

    updateFromAdStatus();

    const observer = new MutationObserver(updateFromAdStatus);
    observer.observe(adElement, {
      attributeFilter: ["data-ad-status"],
      attributes: true,
    });

    const timeoutId = window.setTimeout(() => {
      setMobileStickyState((currentState) => (currentState === "pending" ? "hidden" : currentState));
    }, MOBILE_STICKY_TIMEOUT_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeoutId);
    };
  }, [client, isMobileSticky, slot]);

  useEffect(() => {
    if (!client || !slot || !adRef.current) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      trackAdSlotView(placementId, { locale, pageType }, {
        ad_provider: "adsense",
        placement_id: placementId,
      });
    } catch {
      // Ignore ad initialization runtime errors in local/dev environments.
    }
  }, [client, locale, pageType, placementId, slot]);

  if (!client || !slot) {
    if (isMobileSticky) return null;

    if (isProd) return null;

    return (
      <div className={`ad-placeholder ${className ?? ""}`}>
        <span>Ad slot placeholder</span>
      </div>
    );
  }

  return (
    <ins
      aria-label="Advertisement"
      className={`adsbygoogle ${className ?? ""}`}
      data-ad-client={client}
      data-ad-format={format}
      data-ad-slot={slot}
      data-slot-state={isMobileSticky ? mobileStickyState : undefined}
      data-full-width-responsive="true"
      ref={adRef}
      style={{ display: "block" }}
    />
  );
}
