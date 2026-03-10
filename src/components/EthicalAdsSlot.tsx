"use client";

import { useEffect, useRef, useState } from "react";
import {
  trackAdSlotSuppressed,
  trackAdSlotView,
  type PageType,
} from "@/lib/analytics";
import { getApiPortalHref } from "@/lib/apiPortalUrl";
import type { AdSuppressionReason } from "@/lib/monetization";
import { TrackedCtaLink } from "@/components/TrackedCtaLink";

declare global {
  interface Window {
    ethicalads?: {
      load: () => void;
      wait: Promise<Array<{ response?: { campaign_type?: string } }>>;
    };
  }
}

interface EthicalAdsSlotProps {
  className?: string;
  keywords?: string;
  locale: string;
  pageType: PageType;
  placementId: string;
}

type EthicalAdsState = "pending" | "paid" | "fallback";

const ETHICALADS_POLL_INTERVAL_MS = 100;
const ETHICALADS_POLL_LIMIT = 40;

async function waitForEthicalAdsClient(): Promise<Window["ethicalads"] | null> {
  for (let attempt = 0; attempt < ETHICALADS_POLL_LIMIT; attempt += 1) {
    if (typeof window.ethicalads?.load === "function") {
      return window.ethicalads;
    }
    await new Promise((resolve) => window.setTimeout(resolve, ETHICALADS_POLL_INTERVAL_MS));
  }
  return null;
}

export function EthicalAdsSlot({
  className,
  keywords,
  locale,
  pageType,
  placementId,
}: EthicalAdsSlotProps): JSX.Element | null {
  const publisher = process.env.NEXT_PUBLIC_ETHICALADS_PUBLISHER;
  const adContainerRef = useRef<HTMLDivElement | null>(null);
  const [slotState, setSlotState] = useState<EthicalAdsState>("pending");

  useEffect(() => {
    if (!publisher || !adContainerRef.current) {
      return;
    }

    let cancelled = false;

    const showFallback = (reason: AdSuppressionReason) => {
      if (cancelled) return;
      setSlotState("fallback");
      trackAdSlotSuppressed(placementId, { locale, pageType }, {
        ad_provider: "ethicalads",
        placement_id: placementId,
        reason,
      });
    };

    const loadAd = async () => {
      const client = await waitForEthicalAdsClient();
      if (!client) {
        showFallback("client_unavailable");
        return;
      }

      try {
        client.load();
        const placements = await client.wait;
        if (cancelled) return;

        if (!placements.length || placements[0]?.response?.campaign_type !== "paid") {
          showFallback("no_paid_campaign");
          return;
        }

        setSlotState("paid");
        trackAdSlotView(placementId, { locale, pageType }, {
          ad_provider: "ethicalads",
          placement_id: placementId,
          keywords,
        });
      } catch {
        showFallback("client_unavailable");
      }
    };

    void loadAd();

    return () => {
      cancelled = true;
    };
  }, [keywords, locale, pageType, placementId, publisher]);

  if (!publisher) {
    return null;
  }

  const pricingHref = getApiPortalHref("/pricing");
  const docsHref = getApiPortalHref("/docs");

  return (
    <section className={`editorial-ad-slot ethicalads-shell ${className ?? ""}`}>
      <div
        className={slotState === "fallback" ? "ethicalads-frame hidden" : "ethicalads-frame"}
        data-ea-campaign-types="paid"
        data-ea-keywords={keywords}
        data-ea-manual="true"
        data-ea-publisher={publisher}
        data-ea-type="text"
        data-ea-verbosity="quiet"
        id={placementId}
        ref={adContainerRef}
      />

      {slotState === "fallback" ? (
        <div className="editorial-house-ad">
          <p className="editorial-house-ad-kicker">Product</p>
          <h2>Need TTS at scale? Try the API</h2>
          <p>Move from one-off MP3 exports to prepaid API credits, wallet billing, and reusable keys.</p>
          <div className="editorial-house-ad-actions">
            <TrackedCtaLink
              className="landing-cta"
              ctaVariant="editorial_house_pricing"
              href={pricingHref}
              locale={locale}
              pageType={pageType}
            >
              View API pricing
            </TrackedCtaLink>
            <TrackedCtaLink
              className="api-cta-secondary"
              ctaVariant="editorial_house_docs"
              href={docsHref}
              locale={locale}
              pageType={pageType}
            >
              Read API docs
            </TrackedCtaLink>
          </div>
        </div>
      ) : null}
    </section>
  );
}
