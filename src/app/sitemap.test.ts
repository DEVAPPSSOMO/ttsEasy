import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("publishes only localized use-case URLs", () => {
    const entries = sitemap();
    const urls = new Set(entries.map((entry) => entry.url));

    expect(urls.has("https://ttseasy.com/en/use-cases/text-to-speech-for-youtube")).toBe(true);
    expect(urls.has("https://ttseasy.com/es/use-cases/text-to-speech-for-youtube")).toBe(true);
    expect(urls.has("https://ttseasy.com/fr/use-cases/text-to-speech-for-youtube")).toBe(false);
  });

  it("publishes compare pages only for localized locales", () => {
    const entries = sitemap();
    const urls = new Set(entries.map((entry) => entry.url));

    expect(urls.has("https://ttseasy.com/en/compare/elevenlabs-alternative")).toBe(true);
    expect(urls.has("https://ttseasy.com/es/compare/elevenlabs-alternative")).toBe(false);
  });

  it("excludes non-indexable legal, weak landing, and non-English blog URLs", () => {
    const entries = sitemap();
    const urls = new Set(entries.map((entry) => entry.url));

    expect(urls.has("https://ttseasy.com/en/privacy")).toBe(false);
    expect(urls.has("https://ttseasy.com/en/use-cases/tts-for-discord")).toBe(false);
    expect(urls.has("https://ttseasy.com/es/blog/guia-completa-texto-a-voz")).toBe(false);
    expect(urls.has("https://ttseasy.com/en/blog/complete-guide-text-to-speech")).toBe(true);
  });
});
