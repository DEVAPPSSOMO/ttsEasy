"use client";

import { useEffect } from "react";
import { trackAdSlotSuppressed, type PageType } from "@/lib/analytics";
import {
  getAdProviderChain,
  isAdProviderConfigured,
  resolveAdDecision,
  type AdPlacementId,
} from "@/lib/monetization";
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
  const providerChain = getAdProviderChain();
  const decision = resolveAdDecision({
    fallbackProvider: process.env.NEXT_PUBLIC_AD_PROVIDER_FALLBACK,
    primaryProvider: process.env.NEXT_PUBLIC_AD_PROVIDER_PRIMARY,
    providerOptions: {
      adSenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT,
      adSenseSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT,
      ethicalAdsPublisher: process.env.NEXT_PUBLIC_ETHICALADS_PUBLISHER,
    },
    appVariant: "public",
    locale,
    pageType,
    placementId,
  });
  const configuredProviders = providerChain.filter((provider) =>
    isAdProviderConfigured(provider, {
      adSenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT,
      adSenseSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT,
      ethicalAdsPublisher: process.env.NEXT_PUBLIC_ETHICALADS_PUBLISHER,
    })
  );
  const attemptedProvidersKey = decision.attemptedProviders.join("|");
  const configuredProvidersKey = configuredProviders.join("|");

  useEffect(() => {
    if (decision.eligible) {
      return;
    }

    trackAdSlotSuppressed(placementId, { locale, pageType }, {
      ad_provider: decision.provider,
      ad_providers_attempted: attemptedProvidersKey,
      ad_providers_configured: configuredProvidersKey,
      placement_id: placementId,
      reason: decision.reason,
    });
  }, [
    attemptedProvidersKey,
    configuredProvidersKey,
    decision.eligible,
    decision.provider,
    decision.reason,
    locale,
    pageType,
    placementId,
  ]);

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
