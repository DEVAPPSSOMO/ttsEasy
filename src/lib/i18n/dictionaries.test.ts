import { describe, expect, it } from "vitest";
import { getDictionary } from "./dictionaries";
import { LOCALES, type Locale } from "./config";

describe("getDictionary", () => {
  it("loads the English dictionary", async () => {
    const dict = await getDictionary("en");
    expect(dict.metadata.title).toBe("Free Text to Speech Online");
    expect(dict.ui.play).toBe("Generate & Play");
  });

  it("loads the Spanish dictionary", async () => {
    const dict = await getDictionary("es");
    expect(dict.metadata.title).toBe("Texto a Voz Online Gratis");
    expect(dict.ui.play).toBe("Generar y reproducir");
  });

  for (const locale of LOCALES) {
    it(`loads ${locale} dictionary with all required keys`, async () => {
      const dict = await getDictionary(locale);

      // metadata
      expect(dict.metadata).toBeDefined();
      expect(typeof dict.metadata.title).toBe("string");
      expect(typeof dict.metadata.description).toBe("string");
      expect(typeof dict.metadata.ogTitle).toBe("string");
      expect(typeof dict.metadata.ogDescription).toBe("string");
      expect(dict.metadata.title.length).toBeGreaterThan(0);

      // home
      expect(typeof dict.home.h1).toBe("string");
      expect(dict.home.h1.length).toBeGreaterThan(0);
      expect(typeof dict.home.subtitle).toBe("string");
      expect(typeof dict.home.tryNow).toBe("string");

      // ui - all keys the TtsApp component expects
      expect(typeof dict.ui.accentQuestion).toBe("string");
      expect(typeof dict.ui.autoMode).toBe("string");
      expect(typeof dict.ui.charCount).toBe("string");
      expect(typeof dict.ui.detecting).toBe("string");
      expect(typeof dict.ui.disclaimer).toBe("string");
      expect(typeof dict.ui.download).toBe("string");
      expect(typeof dict.ui.generating).toBe("string");
      expect(typeof dict.ui.headline).toBe("string");
      expect(typeof dict.ui.languageSelect).toBe("string");
      expect(typeof dict.ui.manualMode).toBe("string");
      expect(typeof dict.ui.pause).toBe("string");
      expect(typeof dict.ui.play).toBe("string");
      expect(typeof dict.ui.readerSelect).toBe("string");
      expect(typeof dict.ui.speed).toBe("string");
      expect(typeof dict.ui.subtitle).toBe("string");
      expect(typeof dict.ui.textPlaceholder).toBe("string");
      expect(typeof dict.ui.detectLabel).toBe("string");

      // nav
      expect(typeof dict.nav.privacy).toBe("string");
      expect(typeof dict.nav.terms).toBe("string");
      expect(typeof dict.nav.cookies).toBe("string");
      expect(typeof dict.nav.about).toBe("string");
      expect(typeof dict.nav.blog).toBe("string");
      expect(typeof dict.nav.language).toBe("string");

      // features
      expect(dict.features.items).toHaveLength(6);
      for (const item of dict.features.items) {
        expect(typeof item.title).toBe("string");
        expect(typeof item.description).toBe("string");
        expect(item.title.length).toBeGreaterThan(0);
      }

      // faq
      expect(dict.faq.items.length).toBeGreaterThanOrEqual(7);
      for (const item of dict.faq.items) {
        expect(typeof item.question).toBe("string");
        expect(typeof item.answer).toBe("string");
        expect(item.question.length).toBeGreaterThan(0);
        expect(item.answer.length).toBeGreaterThan(0);
      }

      // trust
      expect(typeof dict.trust.poweredBy).toBe("string");
      expect(typeof dict.trust.noSignUp).toBe("string");
      expect(typeof dict.trust.neverStored).toBe("string");

      // legal pages
      expect(typeof dict.about.title).toBe("string");
      expect(typeof dict.about.p1).toBe("string");
      expect(typeof dict.privacy.title).toBe("string");
      expect(typeof dict.privacy.p1).toBe("string");
      expect(typeof dict.terms.title).toBe("string");
      expect(typeof dict.terms.p1).toBe("string");
      expect(typeof dict.cookies.title).toBe("string");
      expect(typeof dict.cookies.p1).toBe("string");
    });
  }

  it("accentQuestion contains {primary} and {secondary} placeholders in all locales", async () => {
    for (const locale of LOCALES) {
      const dict = await getDictionary(locale);
      expect(dict.ui.accentQuestion).toContain("{primary}");
      expect(dict.ui.accentQuestion).toContain("{secondary}");
    }
  });
});
