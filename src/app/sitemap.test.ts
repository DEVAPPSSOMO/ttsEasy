import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("publishes curated use-case URLs in all six locales", () => {
    const entries = sitemap();
    const urls = new Set(entries.map((entry) => entry.url));

    expect(urls.has("https://ttseasy.com/en/use-cases/text-to-speech-for-youtube")).toBe(true);
    expect(urls.has("https://ttseasy.com/es/use-cases/text-to-speech-for-youtube")).toBe(true);
    expect(urls.has("https://ttseasy.com/fr/use-cases/text-to-speech-for-youtube")).toBe(true);
  });

  it("excludes compare pages and hubs while the section is noindex", () => {
    const entries = sitemap();
    const urls = new Set(entries.map((entry) => entry.url));

    expect(urls.has("https://ttseasy.com/en/compare")).toBe(false);
    expect(urls.has("https://ttseasy.com/en/compare/free-tts-vs-paid-tools")).toBe(false);
    expect(urls.has("https://ttseasy.com/es/compare/elevenlabs-alternative")).toBe(false);
  });

  it("excludes weak content and includes localized curated blog URLs", () => {
    const entries = sitemap();
    const urls = new Set(entries.map((entry) => entry.url));

    expect(urls.has("https://ttseasy.com/en/privacy")).toBe(false);
    expect(urls.has("https://ttseasy.com/en/use-cases/tts-for-discord")).toBe(false);
    expect(urls.has("https://ttseasy.com/en/blog/best-free-text-to-speech-tools-2025")).toBe(false);
    expect(urls.has("https://ttseasy.com/es/blog/guia-completa-texto-a-voz")).toBe(true);
    expect(urls.has("https://ttseasy.com/en/blog/complete-guide-text-to-speech")).toBe(true);
  });
});
