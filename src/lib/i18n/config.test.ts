import { describe, expect, it } from "vitest";
import { LOCALES, DEFAULT_LOCALE, isValidLocale } from "./config";

describe("i18n config", () => {
  describe("LOCALES", () => {
    it("contains exactly 6 supported locales", () => {
      expect(LOCALES).toHaveLength(6);
      expect(LOCALES).toEqual(["en", "es", "pt", "fr", "de", "it"]);
    });
  });

  describe("DEFAULT_LOCALE", () => {
    it("is 'en'", () => {
      expect(DEFAULT_LOCALE).toBe("en");
    });

    it("is included in LOCALES", () => {
      expect((LOCALES as readonly string[]).includes(DEFAULT_LOCALE)).toBe(true);
    });
  });

  describe("isValidLocale", () => {
    it("returns true for all supported locales", () => {
      for (const locale of LOCALES) {
        expect(isValidLocale(locale)).toBe(true);
      }
    });

    it("returns false for unsupported locales", () => {
      expect(isValidLocale("ja")).toBe(false);
      expect(isValidLocale("zh")).toBe(false);
      expect(isValidLocale("ko")).toBe(false);
      expect(isValidLocale("ru")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidLocale("")).toBe(false);
    });

    it("returns false for full locale codes (only 2-letter supported)", () => {
      expect(isValidLocale("en-US")).toBe(false);
      expect(isValidLocale("es-MX")).toBe(false);
      expect(isValidLocale("pt-BR")).toBe(false);
    });

    it("is case-sensitive", () => {
      expect(isValidLocale("EN")).toBe(false);
      expect(isValidLocale("Es")).toBe(false);
    });
  });
});
