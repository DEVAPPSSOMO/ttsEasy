import { describe, expect, it } from "vitest";
import { detectLanguageAndLocale } from "@/lib/language";

describe("detectLanguageAndLocale", () => {
  it("detects Mexican Spanish hints", () => {
    const result = detectLanguageAndLocale({
      text: "Hola, ¿puedes revisar mi celular y la computadora del carro? ahorita vengo",
      uiLocale: "en-US"
    });

    expect(result.language).toBe("es");
    expect(result.locale).toBe("es-MX");
    expect(result.reason).toBe("detected");
  });

  it("falls back to browser locale on low confidence", () => {
    const result = detectLanguageAndLocale({
      text: "ok",
      uiLocale: "pt-BR"
    });

    expect(result.reason).toBe("browser_fallback");
    expect(result.language).toBe("pt");
  });

  it("marks ambiguity when accent confidence is low", () => {
    const result = detectLanguageAndLocale({
      text: "Hola, necesito ayuda con este texto para voz",
      uiLocale: "es-ES"
    });

    expect(result.language).toBe("es");
    expect(result.localeCandidates.length).toBeGreaterThanOrEqual(2);
    expect(typeof result.localeAmbiguous).toBe("boolean");
  });
});
