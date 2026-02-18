import { describe, expect, it } from "vitest";
import {
  getCompareLocalizedLocales,
  getComparePage,
  getCompareSlugs,
  hasCompareLocalizedContent,
} from "./compare-pages";

describe("compare-pages", () => {
  it("exposes compare slugs", () => {
    const slugs = getCompareSlugs();
    expect(slugs.length).toBeGreaterThanOrEqual(3);
    expect(slugs).toContain("elevenlabs-alternative");
  });

  it("returns compare page data for English", () => {
    const page = getComparePage("elevenlabs-alternative", "en");
    expect(page).not.toBeNull();
    expect(page?.contract.primaryKeyword).toBe("elevenlabs alternative");
    expect(page?.contract.internalLinksRequired.length).toBeGreaterThanOrEqual(5);
  });

  it("tracks localized locales correctly", () => {
    expect(getCompareLocalizedLocales("elevenlabs-alternative")).toEqual(["en"]);
    expect(hasCompareLocalizedContent("elevenlabs-alternative", "en")).toBe(true);
    expect(hasCompareLocalizedContent("elevenlabs-alternative", "es")).toBe(false);
  });

  it("returns null when locale content does not exist", () => {
    expect(getComparePage("elevenlabs-alternative", "es")).toBeNull();
  });
});
