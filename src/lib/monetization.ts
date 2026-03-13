import type { AppVariant } from "@/lib/appVariant";
import type { PageType } from "@/lib/analytics";

export type AdProvider = "none" | "adsense" | "ethicalads";
export type AdPlacementId =
  | "home-mid"
  | "use-case-hub-top"
  | "use-case-detail-mid"
  | "tools-hub-top"
  | "tool-character-counter-mid"
  | "tool-language-detector-mid"
  | "blog-index-top"
  | "blog-post-top"
  | "compare-index-top"
  | "compare-post-top";
export type AdSuppressionReason =
  | "provider_disabled"
  | "provider_unconfigured"
  | "api_variant"
  | "page_type_ineligible"
  | "locale_ineligible"
  | "placement_ineligible"
  | "no_paid_campaign"
  | "client_unavailable";

export interface AdDecision {
  attemptedProviders: AdProvider[];
  provider: AdProvider;
  eligible: boolean;
  reason?: AdSuppressionReason;
}

interface AdDecisionInput {
  appVariant?: AppVariant;
  fallbackProvider?: string;
  locale?: string;
  pageType?: PageType;
  placementId: AdPlacementId;
  primaryProvider?: string;
  providerOptions?: {
    adSenseClient?: string;
    adSenseSlot?: string;
    ethicalAdsPublisher?: string;
  };
}

export function isPublicMonetizationEnabled(
  raw = process.env.NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED
): boolean {
  return (raw ?? "").trim().toLowerCase() === "true";
}

const ADSENSE_PLACEMENTS = new Set<AdPlacementId>([
  "home-mid",
  "use-case-hub-top",
  "use-case-detail-mid",
  "tools-hub-top",
  "tool-character-counter-mid",
  "tool-language-detector-mid",
  "blog-index-top",
  "blog-post-top",
  "compare-index-top",
  "compare-post-top",
]);

const ETHICALADS_PLACEMENTS = new Set<AdPlacementId>([
  "blog-index-top",
  "blog-post-top",
  "compare-index-top",
  "compare-post-top",
]);

const PAGE_TYPES_BY_PLACEMENT: Record<AdPlacementId, PageType[]> = {
  "home-mid": ["home"],
  "use-case-hub-top": ["use_case"],
  "use-case-detail-mid": ["use_case"],
  "tools-hub-top": ["tool"],
  "tool-character-counter-mid": ["tool"],
  "tool-language-detector-mid": ["tool"],
  "blog-index-top": ["blog"],
  "blog-post-top": ["blog"],
  "compare-index-top": ["compare"],
  "compare-post-top": ["compare"],
};

function normalizeAdProvider(raw?: string): AdProvider {
  const normalized = (raw ?? "").trim().toLowerCase();
  if (normalized === "adsense" || normalized === "ethicalads") {
    return normalized;
  }
  return "none";
}

export function getAdProvider(raw = process.env.NEXT_PUBLIC_AD_PROVIDER): AdProvider {
  return normalizeAdProvider(raw);
}

export function getPrimaryAdProvider(
  rawPrimary = process.env.NEXT_PUBLIC_AD_PROVIDER_PRIMARY,
  rawLegacy = process.env.NEXT_PUBLIC_AD_PROVIDER
): AdProvider {
  if (typeof rawPrimary === "string" && rawPrimary.trim().length > 0) {
    return normalizeAdProvider(rawPrimary);
  }
  return normalizeAdProvider(rawLegacy);
}

export function getFallbackAdProvider(
  rawFallback = process.env.NEXT_PUBLIC_AD_PROVIDER_FALLBACK
): AdProvider {
  if (typeof rawFallback === "string" && rawFallback.trim().length > 0) {
    return normalizeAdProvider(rawFallback);
  }
  return "none";
}

export function getAdProviderChain(
  rawPrimary = process.env.NEXT_PUBLIC_AD_PROVIDER_PRIMARY,
  rawFallback = process.env.NEXT_PUBLIC_AD_PROVIDER_FALLBACK,
  rawLegacy = process.env.NEXT_PUBLIC_AD_PROVIDER
): Array<Exclude<AdProvider, "none">> {
  const primary = getPrimaryAdProvider(rawPrimary, rawLegacy);
  const fallback = getFallbackAdProvider(rawFallback);
  return [...new Set([primary, fallback])].filter((provider): provider is Exclude<AdProvider, "none"> => provider !== "none");
}

export function isAdProviderConfigured(
  provider: AdProvider,
  options?: {
    adSenseClient?: string;
    adSenseSlot?: string;
    ethicalAdsPublisher?: string;
  }
): boolean {
  if (provider === "none") {
    return false;
  }
  if (provider === "adsense") {
    return Boolean(options?.adSenseClient && options.adSenseSlot);
  }
  return Boolean(options?.ethicalAdsPublisher);
}

function evaluateProviderDecision(
  provider: Exclude<AdProvider, "none">,
  input: Pick<AdDecisionInput, "appVariant" | "locale" | "pageType" | "placementId">
): AdDecision {
  const pageType = input.pageType ?? "other";
  const placementPageTypes = PAGE_TYPES_BY_PLACEMENT[input.placementId] ?? [];

  if (input.appVariant === "api") {
    return { attemptedProviders: [provider], provider, eligible: false, reason: "api_variant" };
  }

  if (!placementPageTypes.includes(pageType)) {
    return { attemptedProviders: [provider], provider, eligible: false, reason: "page_type_ineligible" };
  }

  if (provider === "adsense" && !ADSENSE_PLACEMENTS.has(input.placementId)) {
    return { attemptedProviders: [provider], provider, eligible: false, reason: "placement_ineligible" };
  }

  if (provider === "ethicalads" && !ETHICALADS_PLACEMENTS.has(input.placementId)) {
    return { attemptedProviders: [provider], provider, eligible: false, reason: "placement_ineligible" };
  }

  if (provider === "ethicalads" && input.locale !== "en") {
    return { attemptedProviders: [provider], provider, eligible: false, reason: "locale_ineligible" };
  }

  return { attemptedProviders: [provider], provider, eligible: true };
}

export function resolveAdDecision(input: AdDecisionInput): AdDecision {
  const attemptedProviders: AdProvider[] = [];
  const providers = getAdProviderChain(input.primaryProvider, input.fallbackProvider);

  if (!isPublicMonetizationEnabled()) {
    return { attemptedProviders: providers, provider: "none", eligible: false, reason: "provider_disabled" };
  }

  if (providers.length === 0) {
    return { attemptedProviders, provider: "none", eligible: false, reason: "provider_disabled" };
  }

  let lastReason: AdSuppressionReason = "provider_disabled";

  for (const provider of providers) {
    attemptedProviders.push(provider);

    if (!isAdProviderConfigured(provider, input.providerOptions)) {
      lastReason = "provider_unconfigured";
      continue;
    }

    const decision = evaluateProviderDecision(provider, input);
    if (decision.eligible) {
      return {
        attemptedProviders: [...attemptedProviders],
        provider,
        eligible: true,
      };
    }

    lastReason = decision.reason ?? lastReason;
  }

  return {
    attemptedProviders,
    provider: "none",
    eligible: false,
    reason: lastReason,
  };
}

export function buildAdKeywordString(values: Array<string | undefined | null>): string | undefined {
  const cleaned = values
    .flatMap((value) => (value ?? "").split("|"))
    .map((value) => value.trim().replace(/\s+/g, " "))
    .filter(Boolean);

  const deduped = [...new Set(cleaned)];
  return deduped.length > 0 ? deduped.join("|") : undefined;
}

export function getCompareAdKeywords(input: {
  primaryKeyword: string;
  secondaryKeywords: string[];
}): string | undefined {
  return buildAdKeywordString([input.primaryKeyword, ...input.secondaryKeywords]);
}

export function getBlogAdKeywords(input: {
  title: string;
  description: string;
}): string | undefined {
  return buildAdKeywordString([input.title, input.description]);
}
