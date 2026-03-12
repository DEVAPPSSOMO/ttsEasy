import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildAdKeywordString,
  getActiveAdProvider,
  getAdProvider,
  getBlogAdKeywords,
  getCompareAdKeywords,
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

  it("normalizes the configured ad provider", () => {
    expect(getAdProvider("ethicalads")).toBe("ethicalads");
    expect(getAdProvider("AdSense")).toBe("adsense");
    expect(getAdProvider("Adsterra")).toBe("adsterra");
    expect(getAdProvider("")).toBe("none");
  });

  it("resolves active and primary provider with legacy fallback", () => {
    expect(getActiveAdProvider("adsterra", "adsense")).toBe("adsterra");
    expect(getActiveAdProvider("", "adsense")).toBe("adsense");
    expect(getActiveAdProvider("none", "adsense")).toBe("none");
    expect(getPrimaryAdProvider("adsense", "adsterra")).toBe("adsense");
    expect(getPrimaryAdProvider("", "adsterra")).toBe("adsterra");
    expect(getPrimaryAdProvider("none", "adsterra")).toBe("none");
  });

  it("validates provider-specific configuration", () => {
    expect(
      isAdProviderConfigured("adsense", {
        adSenseClient: "ca-pub-123",
        adSenseSlot: "slot_1",
      })
    ).toBe(true);
    expect(isAdProviderConfigured("adsense", { adSenseClient: "ca-pub-123" })).toBe(false);
    expect(isAdProviderConfigured("adsterra", { adsterraSmartLinkUrl: "https://smart.link" })).toBe(true);
    expect(isAdProviderConfigured("ethicalads", { ethicalAdsPublisher: "ttseasy" })).toBe(true);
  });

  it("allows EthicalAds only on English editorial pages in the public variant", () => {
    expect(
      resolveAdDecision({
        provider: "ethicalads",
        providerConfigured: true,
        appVariant: "public",
        locale: "en",
        pageType: "blog",
        placementId: "blog-post-top",
      })
    ).toEqual({ provider: "ethicalads", eligible: true });

    expect(
      resolveAdDecision({
        provider: "ethicalads",
        providerConfigured: true,
        appVariant: "public",
        locale: "es",
        pageType: "blog",
        placementId: "blog-post-top",
      })
    ).toEqual({ provider: "ethicalads", eligible: false, reason: "locale_ineligible" });
  });

  it("suppresses ads on ineligible pages or variants", () => {
    expect(
      resolveAdDecision({
        provider: "ethicalads",
        providerConfigured: true,
        appVariant: "api",
        locale: "en",
        pageType: "blog",
        placementId: "blog-post-top",
      })
    ).toEqual({ provider: "ethicalads", eligible: false, reason: "api_variant" });

    expect(
      resolveAdDecision({
        provider: "adsense",
        providerConfigured: true,
        appVariant: "public",
        locale: "en",
        pageType: "home",
        placementId: "blog-index-top",
      })
    ).toEqual({ provider: "adsense", eligible: false, reason: "page_type_ineligible" });
  });

  it("allows AdSense on public placements across the expanded inventory", () => {
    expect(
      resolveAdDecision({
        provider: "adsense",
        providerConfigured: true,
        appVariant: "public",
        locale: "en",
        pageType: "home",
        placementId: "home-mid",
      })
    ).toEqual({ provider: "adsense", eligible: true });

    expect(
      resolveAdDecision({
        provider: "adsense",
        providerConfigured: true,
        appVariant: "public",
        locale: "es",
        pageType: "tool",
        placementId: "tool-character-counter-mid",
      })
    ).toEqual({ provider: "adsense", eligible: true });

    expect(
      resolveAdDecision({
        provider: "adsense",
        providerConfigured: true,
        appVariant: "public",
        locale: "es",
        pageType: "compare",
        placementId: "compare-post-top",
      })
    ).toEqual({ provider: "adsense", eligible: true });
  });

  it("allows Adsterra on page placements and on the post-TTS inline placement", () => {
    expect(
      resolveAdDecision({
        provider: "adsterra",
        providerConfigured: true,
        appVariant: "public",
        locale: "en",
        pageType: "use_case",
        placementId: "use-case-detail-mid",
      })
    ).toEqual({ provider: "adsterra", eligible: true });

    expect(
      resolveAdDecision({
        provider: "adsterra",
        providerConfigured: true,
        appVariant: "public",
        locale: "en",
        pageType: "home",
        placementId: "tts-success-inline",
      })
    ).toEqual({ provider: "adsterra", eligible: true });

    expect(
      resolveAdDecision({
        provider: "adsense",
        providerConfigured: true,
        appVariant: "public",
        locale: "en",
        pageType: "home",
        placementId: "tts-success-inline",
      })
    ).toEqual({ provider: "adsense", eligible: false, reason: "placement_ineligible" });
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

  it("disables all public monetization when the global gate is off", () => {
    process.env.NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED = "false";
    expect(isPublicMonetizationEnabled()).toBe(false);
    expect(
      resolveAdDecision({
        provider: "adsense",
        providerConfigured: true,
        appVariant: "public",
        locale: "en",
        pageType: "home",
        placementId: "home-mid",
      })
    ).toEqual({ provider: "adsense", eligible: false, reason: "provider_disabled" });
  });
});
