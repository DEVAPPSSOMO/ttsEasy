"use client";

import { useEffect } from "react";
import { trackAdSlotSuppressed, type PageType } from "@/lib/analytics";
import {
  getActiveAdProvider,
  isAdProviderConfigured,
  resolveAdDecision,
  type AdPlacementId,
} from "@/lib/monetization";
import { AdsterraSmartLinkCard } from "@/components/AdsterraSmartLinkCard";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { EthicalAdsSlot } from "@/components/EthicalAdsSlot";

interface AdSlotProps {
  className?: string;
  keywords?: string;
  locale?: string;
  pageType: PageType;
  placementId: AdPlacementId;
}

export function AdSlot({
  className,
  keywords,
  locale,
  pageType,
  placementId,
}: AdSlotProps): JSX.Element | null {
  const provider = getActiveAdProvider();
  const providerConfigured = isAdProviderConfigured(provider, {
    adsterraSmartLinkUrl: process.env.NEXT_PUBLIC_ADSTERRA_SMARTLINK_URL,
    adSenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT,
    adSenseSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT,
    ethicalAdsPublisher: process.env.NEXT_PUBLIC_ETHICALADS_PUBLISHER,
  });
  const decision = resolveAdDecision({
    provider,
    providerConfigured,
    appVariant: "public",
    locale,
    pageType,
    placementId,
  });

  useEffect(() => {
    if (decision.eligible) {
      return;
    }

    trackAdSlotSuppressed(placementId, { locale, pageType }, {
      ad_provider: provider,
      placement_id: placementId,
      reason: decision.reason,
    });
  }, [decision.eligible, decision.reason, locale, pageType, placementId, provider]);

  if (!decision.eligible) {
    return null;
  }

  if (decision.provider === "adsense") {
    return (
      <section className={`editorial-ad-slot ${className ?? ""}`}>
        <AdSenseSlot
          className="editorial-ad-frame"
          locale={locale}
          pageType={pageType}
          placementId={placementId}
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT}
        />
      </section>
    );
  }

  if (decision.provider === "adsterra") {
    return (
      <AdsterraSmartLinkCard
        className={className}
        locale={locale ?? "en"}
        pageType={pageType}
        placementId={placementId}
      />
    );
  }

  return (
    <EthicalAdsSlot
      className={className}
      keywords={keywords}
      locale={locale ?? "en"}
      pageType={pageType}
      placementId={placementId}
    />
  );
}
