import { describe, expect, it } from "vitest";
import {
  LANDING_PAGES,
  getLandingPage,
  getLandingContent,
  type LandingPage,
} from "./landing-pages";

describe("landing-pages", () => {
  describe("LANDING_PAGES", () => {
    it("has 19 landing pages defined", () => {
      expect(LANDING_PAGES).toHaveLength(19);
    });

    it("every page has slug, keyword, and category", () => {
      for (const page of LANDING_PAGES) {
        expect(typeof page.slug).toBe("string");
        expect(page.slug.length).toBeGreaterThan(0);
        expect(typeof page.keyword).toBe("string");
        expect(page.keyword.length).toBeGreaterThan(0);
        expect(["use-case", "language"]).toContain(page.category);
      }
    });

    it("has no duplicate slugs", () => {
      const slugs = LANDING_PAGES.map((p) => p.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it("language category pages have presetLocale", () => {
      const languagePages = LANDING_PAGES.filter((p) => p.category === "language");
      for (const page of languagePages) {
        expect(page.presetLocale).toBeDefined();
        expect(typeof page.presetLocale).toBe("string");
      }
    });

    it("has 9 use-case pages and 10 language pages", () => {
      const useCases = LANDING_PAGES.filter((p) => p.category === "use-case");
      const languages = LANDING_PAGES.filter((p) => p.category === "language");
      expect(useCases).toHaveLength(9);
      expect(languages).toHaveLength(10);
    });
  });

  describe("getLandingPage", () => {
    it("finds a page by slug", () => {
      const page = getLandingPage("text-to-speech-for-youtube");
      expect(page).toBeDefined();
      expect(page!.slug).toBe("text-to-speech-for-youtube");
      expect(page!.category).toBe("use-case");
    });

    it("finds a language page by slug", () => {
      const page = getLandingPage("text-to-speech-spanish");
      expect(page).toBeDefined();
      expect(page!.presetLocale).toBe("es-MX");
    });

    it("returns undefined for unknown slug", () => {
      expect(getLandingPage("nonexistent-page")).toBeUndefined();
    });
  });

  describe("getLandingContent", () => {
    it("returns specific content for youtube page in English", () => {
      const content = getLandingContent("text-to-speech-for-youtube", "en");

      expect(content.h1).toContain("YouTube");
      expect(content.intro.length).toBeGreaterThan(0);
      expect(content.benefits.length).toBeGreaterThanOrEqual(3);
      expect(content.steps.length).toBeGreaterThanOrEqual(3);
      expect(content.faq.length).toBeGreaterThanOrEqual(2);
    });

    it("returns specific content for youtube page in Spanish", () => {
      const content = getLandingContent("text-to-speech-for-youtube", "es");

      expect(content.h1).toContain("YouTube");
      expect(content.intro.length).toBeGreaterThan(0);
    });

    it("returns generic content for pages without specific content", () => {
      const content = getLandingContent("tts-for-students", "en");

      expect(content.h1).toBeDefined();
      expect(content.h1.length).toBeGreaterThan(0);
      expect(content.benefits.length).toBeGreaterThan(0);
      expect(content.steps.length).toBeGreaterThan(0);
      expect(content.faq.length).toBeGreaterThan(0);
    });

    it("generic content includes the keyword in h1", () => {
      const content = getLandingContent("tts-for-discord", "en");
      expect(content.h1.toLowerCase()).toContain("discord");
    });

    it("returns content with all required fields for every slug and locale", () => {
      for (const page of LANDING_PAGES) {
        for (const locale of ["en", "es"] as const) {
          const content = getLandingContent(page.slug, locale);
          expect(content.h1.length).toBeGreaterThan(0);
          expect(content.intro.length).toBeGreaterThan(0);
          expect(content.benefits.length).toBeGreaterThan(0);
          expect(content.steps.length).toBeGreaterThan(0);
          expect(content.faq.length).toBeGreaterThan(0);

          for (const b of content.benefits) {
            expect(typeof b.title).toBe("string");
            expect(typeof b.description).toBe("string");
          }
          for (const f of content.faq) {
            expect(typeof f.question).toBe("string");
            expect(typeof f.answer).toBe("string");
          }
        }
      }
    });

    it("returns English fallback for unsupported locales like fr", () => {
      const content = getLandingContent("tts-for-students", "fr");
      expect(content.h1.length).toBeGreaterThan(0);
      expect(content.benefits.length).toBeGreaterThan(0);
    });
  });
});
