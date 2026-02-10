import { describe, expect, it } from "vitest";
import { LOCALES, DEFAULT_LOCALE, isValidLocale } from "@/lib/i18n/config";

// We can't directly test the Next.js middleware function because it depends on
// NextRequest/NextResponse which require the Next.js runtime. Instead, we test
// the underlying logic: locale detection and path classification.

/** Replicates getPreferredLocale logic from middleware.ts */
function getPreferredLocale(acceptLanguage: string | null): string {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const preferred = acceptLanguage
    .split(",")
    .map((part) => {
      const [lang, q] = part.trim().split(";q=");
      return { lang: lang.trim().toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of preferred) {
    const twoLetter = lang.split("-")[0];
    if (isValidLocale(twoLetter)) return twoLetter;
  }

  return DEFAULT_LOCALE;
}

/** Replicates the path skip logic from middleware.ts */
function shouldSkipMiddleware(pathname: string): boolean {
  const PUBLIC_FILE = /\.(.*)$/;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json" ||
    pathname === "/og-image.png" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return true;
  }
  return false;
}

/** Replicates the locale-in-path check from middleware.ts */
function pathHasLocale(pathname: string): boolean {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  return isValidLocale(maybeLocale);
}

describe("middleware logic", () => {
  describe("getPreferredLocale", () => {
    it("returns default locale when no Accept-Language header", () => {
      expect(getPreferredLocale(null)).toBe("en");
    });

    it("detects Spanish from Accept-Language", () => {
      expect(getPreferredLocale("es-MX,es;q=0.9,en;q=0.8")).toBe("es");
    });

    it("detects Portuguese from Accept-Language", () => {
      expect(getPreferredLocale("pt-BR,pt;q=0.9,en;q=0.7")).toBe("pt");
    });

    it("detects French from Accept-Language", () => {
      expect(getPreferredLocale("fr-FR,fr;q=0.9,en;q=0.5")).toBe("fr");
    });

    it("detects German from Accept-Language", () => {
      expect(getPreferredLocale("de-DE,de;q=0.9")).toBe("de");
    });

    it("detects Italian from Accept-Language", () => {
      expect(getPreferredLocale("it-IT,it;q=0.9,en;q=0.5")).toBe("it");
    });

    it("picks highest priority supported locale", () => {
      expect(getPreferredLocale("ja;q=1,fr;q=0.9,en;q=0.8")).toBe("fr");
    });

    it("falls back to default for unsupported languages only", () => {
      expect(getPreferredLocale("ja,zh;q=0.9,ko;q=0.8")).toBe("en");
    });

    it("handles complex Accept-Language with quality values", () => {
      expect(getPreferredLocale("en-US,en;q=0.9,de;q=0.8,fr;q=0.7")).toBe("en");
    });

    it("handles single language without quality", () => {
      expect(getPreferredLocale("pt")).toBe("pt");
    });
  });

  describe("shouldSkipMiddleware", () => {
    it("skips API routes", () => {
      expect(shouldSkipMiddleware("/api/tts")).toBe(true);
      expect(shouldSkipMiddleware("/api/language/detect")).toBe(true);
      expect(shouldSkipMiddleware("/api/health")).toBe(true);
    });

    it("skips Next.js internal routes", () => {
      expect(shouldSkipMiddleware("/_next/static/chunk.js")).toBe(true);
      expect(shouldSkipMiddleware("/_next/image")).toBe(true);
    });

    it("skips static files", () => {
      expect(shouldSkipMiddleware("/sitemap.xml")).toBe(true);
      expect(shouldSkipMiddleware("/robots.txt")).toBe(true);
      expect(shouldSkipMiddleware("/favicon.ico")).toBe(true);
      expect(shouldSkipMiddleware("/manifest.json")).toBe(true);
      expect(shouldSkipMiddleware("/og-image.png")).toBe(true);
    });

    it("skips files with extensions", () => {
      expect(shouldSkipMiddleware("/image.jpg")).toBe(true);
      expect(shouldSkipMiddleware("/style.css")).toBe(true);
      expect(shouldSkipMiddleware("/script.js")).toBe(true);
    });

    it("does not skip page routes", () => {
      expect(shouldSkipMiddleware("/")).toBe(false);
      expect(shouldSkipMiddleware("/about")).toBe(false);
      expect(shouldSkipMiddleware("/en/privacy")).toBe(false);
    });
  });

  describe("pathHasLocale", () => {
    it("detects locale prefix in path", () => {
      expect(pathHasLocale("/en")).toBe(true);
      expect(pathHasLocale("/es/about")).toBe(true);
      expect(pathHasLocale("/pt/blog")).toBe(true);
      expect(pathHasLocale("/fr/privacy")).toBe(true);
      expect(pathHasLocale("/de/terms")).toBe(true);
      expect(pathHasLocale("/it/cookies")).toBe(true);
    });

    it("returns false for paths without locale prefix", () => {
      expect(pathHasLocale("/")).toBe(false);
      expect(pathHasLocale("/about")).toBe(false);
      expect(pathHasLocale("/privacy")).toBe(false);
    });

    it("returns false for invalid locale prefix", () => {
      expect(pathHasLocale("/ja/about")).toBe(false);
      expect(pathHasLocale("/zh")).toBe(false);
    });
  });
});
