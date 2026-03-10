import { describe, expect, it } from "vitest";
import {
  buildAdKeywordString,
  getAdProvider,
  getBlogAdKeywords,
  getCompareAdKeywords,
  isAdProviderConfigured,
  resolveAdDecision,
} from "./monetization";

describe("monetization", () => {
  it("normalizes the configured ad provider", () => {
    expect(getAdProvider("ethicalads")).toBe("ethicalads");
    expect(getAdProvider("AdSense")).toBe("adsense");
    expect(getAdProvider("")).toBe("none");
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

  it("allows AdSense on editorial pages with the new placement policy", () => {
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
