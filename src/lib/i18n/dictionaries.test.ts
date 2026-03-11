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
      expect(typeof dict.home.compactH1).toBe("string");
      expect(dict.home.compactH1.length).toBeGreaterThan(0);
      expect(typeof dict.home.subtitle).toBe("string");
      expect(typeof dict.home.compactSubtitle).toBe("string");
      expect(dict.home.compactSubtitle.length).toBeGreaterThan(0);
      expect(typeof dict.home.tryNow).toBe("string");
      expect(dict.home.editorialIntro.length).toBeGreaterThanOrEqual(2);
      expect(typeof dict.home.featuredPostsTitle).toBe("string");
      expect(typeof dict.home.featuredPostsDescription).toBe("string");

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
      expect(typeof dict.ui.historyTitle).toBe("string");
      expect(typeof dict.ui.historyClear).toBe("string");
      expect(typeof dict.ui.historyEmpty).toBe("string");
      expect(typeof dict.ui.mp3CalloutTitle).toBe("string");
      expect(typeof dict.ui.mp3CalloutSubtitle).toBe("string");
      expect(typeof dict.ui.mp3Ready).toBe("string");
      expect(typeof dict.ui.mp3Waiting).toBe("string");
      expect(typeof dict.ui.share).toBe("string");
      expect(typeof dict.ui.videoAd.sponsorLabel).toBe("string");
      expect(typeof dict.ui.videoAd.preparing).toBe("string");
      expect(typeof dict.ui.videoAd.loading).toBe("string");
      expect(typeof dict.ui.videoAd.playing).toBe("string");
      expect(typeof dict.ui.videoAd.skipCountdown).toBe("string");
      expect(typeof dict.ui.videoAd.skipNow).toBe("string");
      expect(typeof dict.ui.videoAd.generating).toBe("string");
      expect(typeof dict.ui.videoAd.noFillContinue).toBe("string");
      expect(typeof dict.ui.videoAd.timeoutContinue).toBe("string");
      expect(typeof dict.ui.videoAd.errorContinue).toBe("string");
      expect(typeof dict.ui.videoAd.blockedTitle).toBe("string");
      expect(typeof dict.ui.videoAd.blockedBody).toBe("string");
      expect(typeof dict.ui.videoAd.blockedPrimary).toBe("string");
      expect(typeof dict.ui.videoAd.blockedSecondary).toBe("string");

      // nav
      expect(typeof dict.nav.privacy).toBe("string");
      expect(typeof dict.nav.terms).toBe("string");
      expect(typeof dict.nav.cookies).toBe("string");
      expect(typeof dict.nav.about).toBe("string");
      expect(typeof dict.nav.blog).toBe("string");
      expect(typeof dict.nav.language).toBe("string");

      // api CTA
      expect(typeof dict.apiCta.kicker).toBe("string");
      expect(typeof dict.apiCta.title).toBe("string");
      expect(typeof dict.apiCta.description).toBe("string");
      expect(typeof dict.apiCta.primary).toBe("string");
      expect(typeof dict.apiCta.secondary).toBe("string");
      expect(typeof dict.apiCta.note).toBe("string");

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
      expect(typeof dict.about.p2).toBe("string");
      expect(typeof dict.about.p3).toBe("string");
      expect(typeof dict.about.missionTitle).toBe("string");
      expect(typeof dict.about.productTitle).toBe("string");
      expect(typeof dict.about.editorialPolicyTitle).toBe("string");
      expect(typeof dict.about.editorialPolicyBody).toBe("string");
      expect(typeof dict.about.disclosureTitle).toBe("string");
      expect(typeof dict.about.contactSectionTitle).toBe("string");
      expect(typeof dict.about.updatedLabel).toBe("string");
      expect(typeof dict.about.updatedDate).toBe("string");
      expect(typeof dict.about.contactLabel).toBe("string");
      expect(typeof dict.about.contactValue).toBe("string");
      expect(typeof dict.privacy.title).toBe("string");
      expect(typeof dict.privacy.p1).toBe("string");
      expect(typeof dict.terms.title).toBe("string");
      expect(typeof dict.terms.p1).toBe("string");
      expect(typeof dict.cookies.title).toBe("string");
      expect(typeof dict.cookies.p1).toBe("string");

      // hubs
      expect(typeof dict.hubs.useCases.title).toBe("string");
      expect(typeof dict.hubs.useCases.description).toBe("string");
      expect(typeof dict.hubs.useCases.metaDescription).toBe("string");
      expect(dict.hubs.useCases.howToChooseItems.length).toBeGreaterThanOrEqual(3);
      expect(dict.hubs.useCases.whenToUseItems.length).toBeGreaterThanOrEqual(3);
      expect(typeof dict.hubs.compare.title).toBe("string");
      expect(typeof dict.hubs.compare.description).toBe("string");
      expect(typeof dict.hubs.compare.metaDescription).toBe("string");
      expect(dict.hubs.compare.howToChooseItems.length).toBeGreaterThanOrEqual(3);
      expect(dict.hubs.compare.whenToUseItems.length).toBeGreaterThanOrEqual(3);
      expect(typeof dict.hubs.tools.title).toBe("string");
      expect(typeof dict.hubs.tools.description).toBe("string");
      expect(typeof dict.hubs.tools.metaDescription).toBe("string");
      expect(typeof dict.hubs.tools.characterCounterTitle).toBe("string");
      expect(typeof dict.hubs.tools.languageDetectorTitle).toBe("string");
      expect(dict.hubs.tools.howToChooseItems.length).toBeGreaterThanOrEqual(3);
      expect(dict.hubs.tools.whenToUseItems.length).toBeGreaterThanOrEqual(3);
    });
  }

  it("accentQuestion contains {primary} and {secondary} placeholders in all locales", async () => {
    for (const locale of LOCALES) {
      const dict = await getDictionary(locale);
      expect(dict.ui.accentQuestion).toContain("{primary}");
      expect(dict.ui.accentQuestion).toContain("{secondary}");
    }
  });

  it("videoAd.skipCountdown contains {seconds} placeholder in all locales", async () => {
    for (const locale of LOCALES) {
      const dict = await getDictionary(locale);
      expect(dict.ui.videoAd.skipCountdown).toContain("{seconds}");
    }
  });
});
