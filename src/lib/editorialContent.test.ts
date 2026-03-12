import { describe, expect, it } from "vitest";
import { getEditorialEntries, getEditorialEntry } from "./editorialContent";

describe("editorialContent", () => {
  it("validates curated use-cases with required frontmatter", () => {
    const entries = getEditorialEntries("use-case", "en", { indexableOnly: true });
    expect(entries).toHaveLength(3);
    for (const entry of entries) {
      expect(entry.reviewedAt).toBe("2026-03-11");
      expect(entry.sources.length).toBeGreaterThan(0);
      expect(entry.wordCount).toBeGreaterThanOrEqual(800);
      expect(entry.translationStatus).toBeDefined();
    }
  });

  it("keeps compare entries available but non-indexable", () => {
    const entry = getEditorialEntry("compare", "en", "free-tts-vs-paid-tools");
    expect(entry).not.toBeNull();
    expect(entry?.indexable).toBe(false);
    expect(entry?.sources.length).toBeGreaterThan(0);
  });
});
