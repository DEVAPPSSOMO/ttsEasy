import type { AppVariant } from "@/lib/appVariant";
import type { PageType } from "@/lib/analytics";

export type AdProvider = "none" | "adsense" | "ethicalads";
export type AdPlacementId =
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

const EDITORIAL_PLACEMENTS = new Set<AdPlacementId>([
  "blog-index-top",
  "blog-post-top",
  "compare-index-top",
  "compare-post-top",
]);

const EDITORIAL_PAGE_TYPES = new Set<PageType>(["blog", "compare"]);

export function getAdProvider(raw = process.env.NEXT_PUBLIC_AD_PROVIDER): AdProvider {
  const normalized = (raw ?? "").trim().toLowerCase();
  if (normalized === "adsense" || normalized === "ethicalads") {
    return normalized;
  }
  return "none";
}

export function isAdProviderConfigured(
  provider: AdProvider,
  options?: {
    adSenseClient?: string;
    adSenseSlot?: string;
    ethicalAdsPublisher?: string;
  }
): boolean {
  if (provider === "none") return false;
  if (provider === "adsense") {
    return Boolean(options?.adSenseClient && options.adSenseSlot);
  }
  return Boolean(options?.ethicalAdsPublisher);
}

export function resolveAdDecision(input: AdDecisionInput): AdDecision {
  const provider = getAdProvider(input.provider);
  const providerConfigured = input.providerConfigured ?? true;

  if (provider === "none") {
    return { provider, eligible: false, reason: "provider_disabled" };
  }

  if (!providerConfigured) {
    return { provider, eligible: false, reason: "provider_unconfigured" };
  }

  if (input.appVariant === "api") {
    return { provider, eligible: false, reason: "api_variant" };
  }

  if (!EDITORIAL_PAGE_TYPES.has(input.pageType ?? "other")) {
    return { provider, eligible: false, reason: "page_type_ineligible" };
  }

  if (!EDITORIAL_PLACEMENTS.has(input.placementId)) {
    return { provider, eligible: false, reason: "placement_ineligible" };
  }

  if (provider === "ethicalads" && input.locale !== "en") {
    return { provider, eligible: false, reason: "locale_ineligible" };
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
