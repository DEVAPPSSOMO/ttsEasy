import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildAdKeywordString,
  getAdProvider,
  getAdProviderChain,
  getBlogAdKeywords,
  getCompareAdKeywords,
  getFallbackAdProvider,
  getPrimaryAdProvider,
  isAdProviderConfigured,
  isPublicMonetizationEnabled,
  resolveAdDecision,
} from "./monetization";

describe("monetization", () => {
  const originalGate = process.env.NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED = "true";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED = originalGate;
  });

  it("normalizes configured providers without preserving unsupported legacy values", () => {
    expect(getAdProvider("ethicalads")).toBe("ethicalads");
    expect(getAdProvider("AdSense")).toBe("adsense");
    expect(getAdProvider("unsupported-provider")).toBe("none");
    expect(getAdProvider("")).toBe("none");
  });

  it("builds a primary/fallback provider chain with legacy primary fallback only", () => {
    expect(getPrimaryAdProvider("adsense", "ethicalads", "none")).toBe("adsense");
    expect(getPrimaryAdProvider("", "AdSense", "none")).toBe("adsense");
    expect(getPrimaryAdProvider("", "legacy-provider", "EthicalAds")).toBe("ethicalads");
    expect(getFallbackAdProvider("ethicalads")).toBe("ethicalads");
    expect(getFallbackAdProvider("legacy-provider")).toBe("none");
    expect(getAdProviderChain("adsense", "ethicalads")).toEqual(["adsense", "ethicalads"]);
    expect(getAdProviderChain("ethicalads", "ethicalads")).toEqual(["ethicalads"]);
  });

  it("validates provider-specific configuration", () => {
    expect(
      isAdProviderConfigured("adsense", {
        adSenseClient: "ca-pub-123",
        adSenseSlot: "slot_1",
      })
    ).toBe(true);
    expect(isAdProviderConfigured("adsense", { adSenseClient: "ca-pub-123" })).toBe(false);
    expect(isAdProviderConfigured("ethicalads", { ethicalAdsPublisher: "ttseasy" })).toBe(true);
    expect(isAdProviderConfigured("ethicalads")).toBe(false);
  });

  it("falls back from AdSense to EthicalAds on eligible EN editorial slots", () => {
    expect(
      resolveAdDecision({
        appVariant: "public",
        fallbackProvider: "ethicalads",
        locale: "en",
        pageType: "blog",
        placementId: "blog-post-top",
        primaryProvider: "adsense",
        providerOptions: {
          adSenseClient: "ca-pub-123",
          ethicalAdsPublisher: "ttseasy",
        },
      })
    ).toEqual({
      attemptedProviders: ["adsense", "ethicalads"],
      eligible: true,
      provider: "ethicalads",
    });
  });

  it("suppresses slots when neither AdSense nor EthicalAds is eligible", () => {
    expect(
      resolveAdDecision({
        appVariant: "public",
        fallbackProvider: "ethicalads",
        locale: "es",
        pageType: "blog",
        placementId: "blog-post-top",
        primaryProvider: "adsense",
        providerOptions: {
          ethicalAdsPublisher: "ttseasy",
        },
      })
    ).toEqual({
      attemptedProviders: ["adsense", "ethicalads"],
      eligible: false,
      provider: "none",
      reason: "locale_ineligible",
    });
  });

  it("allows AdSense on supported public placements across the inventory", () => {
    expect(
      resolveAdDecision({
        appVariant: "public",
        locale: "en",
        pageType: "home",
        placementId: "home-mid",
        primaryProvider: "adsense",
        providerOptions: {
          adSenseClient: "ca-pub-123",
          adSenseSlot: "slot_1",
        },
      })
    ).toEqual({
      attemptedProviders: ["adsense"],
      eligible: true,
      provider: "adsense",
    });

    expect(
      resolveAdDecision({
        appVariant: "public",
        locale: "es",
        pageType: "tool",
        placementId: "tool-character-counter-mid",
        primaryProvider: "adsense",
        providerOptions: {
          adSenseClient: "ca-pub-123",
          adSenseSlot: "slot_1",
        },
      })
    ).toEqual({
      attemptedProviders: ["adsense"],
      eligible: true,
      provider: "adsense",
    });
  });

  it("suppresses ads on API pages or mismatched placements", () => {
    expect(
      resolveAdDecision({
        appVariant: "api",
        locale: "en",
        pageType: "blog",
        placementId: "blog-post-top",
        primaryProvider: "ethicalads",
        providerOptions: {
          ethicalAdsPublisher: "ttseasy",
        },
      })
    ).toEqual({
      attemptedProviders: ["ethicalads"],
      eligible: false,
      provider: "none",
      reason: "api_variant",
    });

    expect(
      resolveAdDecision({
        appVariant: "public",
        locale: "en",
        pageType: "home",
        placementId: "blog-index-top",
        primaryProvider: "adsense",
        providerOptions: {
          adSenseClient: "ca-pub-123",
          adSenseSlot: "slot_1",
        },
      })
    ).toEqual({
      attemptedProviders: ["adsense"],
      eligible: false,
      provider: "none",
      reason: "page_type_ineligible",
    });
  });

  it("disables all public display monetization when the global gate is off", () => {
    process.env.NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED = "false";

    expect(isPublicMonetizationEnabled()).toBe(false);
    expect(
      resolveAdDecision({
        appVariant: "public",
        fallbackProvider: "ethicalads",
        locale: "en",
        pageType: "home",
        placementId: "home-mid",
        primaryProvider: "adsense",
        providerOptions: {
          adSenseClient: "ca-pub-123",
          adSenseSlot: "slot_1",
          ethicalAdsPublisher: "ttseasy",
        },
      })
    ).toEqual({
      attemptedProviders: ["adsense", "ethicalads"],
      eligible: false,
      provider: "none",
      reason: "provider_disabled",
    });
  });

  it("builds pipe-separated keyword strings for page targeting", () => {
    expect(buildAdKeywordString(["devops", " kubernetes ", "devops"])).toBe("devops|kubernetes");

    expect(
      getCompareAdKeywords({
        primaryKeyword: "elevenlabs alternative",
        secondaryKeywords: ["best elevenlabs alternative", "text to speech alternative to elevenlabs"],
      })
    ).toBe(
      "elevenlabs alternative|best elevenlabs alternative|text to speech alternative to elevenlabs"
    );

    expect(
      getBlogAdKeywords({
        title: "The Complete Guide to Text to Speech Technology",
        description: "Learn how text to speech works and how to use it in real workflows.",
      })
    ).toBe(
      "The Complete Guide to Text to Speech Technology|Learn how text to speech works and how to use it in real workflows."
    );
  });
});
