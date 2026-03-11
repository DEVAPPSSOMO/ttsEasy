import type { AppVariant } from "@/lib/appVariant";
import type { PageType } from "@/lib/analytics";

export type AdProvider = "none" | "adsense" | "adsterra" | "ethicalads";
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
  | "compare-post-top"
  | "tts-success-inline";
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
  provider: AdProvider;
  eligible: boolean;
  reason?: AdSuppressionReason;
}

interface AdDecisionInput {
  provider?: string;
  providerConfigured?: boolean;
  appVariant?: AppVariant;
  locale?: string;
  pageType?: PageType;
  placementId: AdPlacementId;
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

const ADSTERRA_PLACEMENTS = new Set<AdPlacementId>([
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
  "tts-success-inline",
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
  "tts-success-inline": ["home", "use_case"],
};

function normalizeAdProvider(raw?: string): AdProvider {
  const normalized = (raw ?? "").trim().toLowerCase();
  if (
    normalized === "adsense" ||
    normalized === "adsterra" ||
    normalized === "ethicalads"
  ) {
    return normalized;
  }
  return "none";
}

export function getAdProvider(raw = process.env.NEXT_PUBLIC_AD_PROVIDER): AdProvider {
  return normalizeAdProvider(raw);
}

export function getActiveAdProvider(
  rawActive = process.env.NEXT_PUBLIC_AD_PROVIDER_ACTIVE,
  rawLegacy = process.env.NEXT_PUBLIC_AD_PROVIDER
): AdProvider {
  if (typeof rawActive === "string" && rawActive.trim().length > 0) {
    return normalizeAdProvider(rawActive);
  }
  return normalizeAdProvider(rawLegacy);
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

export function isAdProviderConfigured(
  provider: AdProvider,
  options?: {
    adsterraSmartLinkUrl?: string;
    adSenseClient?: string;
    adSenseSlot?: string;
    ethicalAdsPublisher?: string;
  }
): boolean {
  if (provider === "none") return false;
  if (provider === "adsense") {
    return Boolean(options?.adSenseClient && options.adSenseSlot);
  }
  if (provider === "adsterra") {
    return Boolean(options?.adsterraSmartLinkUrl);
  }
  return Boolean(options?.ethicalAdsPublisher);
}

export function resolveAdDecision(input: AdDecisionInput): AdDecision {
  const provider = normalizeAdProvider(input.provider);
  const providerConfigured = input.providerConfigured ?? true;
  const pageType = input.pageType ?? "other";
  const placementPageTypes = PAGE_TYPES_BY_PLACEMENT[input.placementId] ?? [];

  if (provider === "none") {
    return { provider, eligible: false, reason: "provider_disabled" };
  }

  if (!providerConfigured) {
    return { provider, eligible: false, reason: "provider_unconfigured" };
  }

  if (input.appVariant === "api") {
    return { provider, eligible: false, reason: "api_variant" };
  }

  if (!placementPageTypes.includes(pageType)) {
    return { provider, eligible: false, reason: "page_type_ineligible" };
  }

  if (provider === "adsense" && !ADSENSE_PLACEMENTS.has(input.placementId)) {
    return { provider, eligible: false, reason: "placement_ineligible" };
  }

  if (provider === "adsterra" && !ADSTERRA_PLACEMENTS.has(input.placementId)) {
    return { provider, eligible: false, reason: "placement_ineligible" };
  }

  if (provider === "ethicalads" && !ETHICALADS_PLACEMENTS.has(input.placementId)) {
    return { provider, eligible: false, reason: "placement_ineligible" };
  }

  if (provider === "ethicalads" && input.locale !== "en") {
    return { provider, eligible: false, reason: "locale_ineligible" };
  }

  if (provider === "ethicalads" && pageType !== "blog" && pageType !== "compare") {
    return { provider, eligible: false, reason: "placement_ineligible" };
  }

  return { provider, eligible: true };
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
