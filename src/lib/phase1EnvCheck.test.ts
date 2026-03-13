import { describe, expect, it } from "vitest";
import { buildPhase1EnvCheckResult } from "../../scripts/phase1-env-check-lib.mjs";

function buildPublicEnv(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    APP_VARIANT: "public",
    GOOGLE_CLOUD_CLIENT_EMAIL: "svc@example.com",
    GOOGLE_CLOUD_PRIVATE_KEY: "private-key",
    GOOGLE_CLOUD_PROJECT_ID: "tts-easy",
    NEXT_PUBLIC_API_BASE_URL: "https://api.ttseasy.com",
    NEXT_PUBLIC_SITE_URL: "https://ttseasy.com",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "turnstile-site",
    TURNSTILE_SECRET_KEY: "turnstile-secret",
    UPSTASH_REDIS_REST_TOKEN: "upstash-token",
    UPSTASH_REDIS_REST_URL: "https://upstash.example.com",
    ...overrides,
  };
}

describe("phase1 public env check", () => {
  it("accepts display plus mock video gate when all required keys are present", () => {
    const result = buildPhase1EnvCheckResult({
      env: buildPublicEnv({
        NEXT_PUBLIC_ADSENSE_CLIENT: "ca-pub-123",
        NEXT_PUBLIC_ADSENSE_SLOT_CONTENT: "slot-content",
        NEXT_PUBLIC_AD_PROVIDER_FALLBACK: "ethicalads",
        NEXT_PUBLIC_AD_PROVIDER_PRIMARY: "adsense",
        NEXT_PUBLIC_ETHICALADS_PUBLISHER: "ttseasy",
        NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED: "true",
        NEXT_PUBLIC_VIDEO_AD_GATE_ENABLED: "true",
        NEXT_PUBLIC_VIDEO_AD_PROVIDER: "mock",
        NEXT_PUBLIC_VIDEO_AD_TAG_URL: "https://video.example.com/tag",
        WEB_AD_GATE_SECRET: "gate-secret",
      }),
      ogImageExists: true,
      variant: "public",
    });

    expect(result.missingRequired).toEqual([]);
    expect(result.issues).toEqual([]);
  });

  it("fails when display monetization is on but AdSense is not fully configured", () => {
    const result = buildPhase1EnvCheckResult({
      env: buildPublicEnv({
        NEXT_PUBLIC_AD_PROVIDER_PRIMARY: "adsense",
        NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED: "true",
      }),
      ogImageExists: true,
      variant: "public",
    });

    expect(result.missingRequired).toEqual([
      "NEXT_PUBLIC_ADSENSE_CLIENT",
      "NEXT_PUBLIC_ADSENSE_SLOT_CONTENT",
    ]);
  });

  it("fails when the video gate is enabled without its required contract", () => {
    const result = buildPhase1EnvCheckResult({
      env: buildPublicEnv({
        NEXT_PUBLIC_VIDEO_AD_GATE_ENABLED: "true",
      }),
      ogImageExists: true,
      variant: "public",
    });

    expect(result.missingRequired).toEqual([
      "NEXT_PUBLIC_VIDEO_AD_PROVIDER",
      "NEXT_PUBLIC_VIDEO_AD_TAG_URL",
      "WEB_AD_GATE_SECRET",
    ]);
  });

  it("does not require NEXT_PUBLIC_VIDEO_AD_SCRIPT_URL for the mock provider", () => {
    const result = buildPhase1EnvCheckResult({
      env: buildPublicEnv({
        NEXT_PUBLIC_VIDEO_AD_GATE_ENABLED: "true",
        NEXT_PUBLIC_VIDEO_AD_PROVIDER: "mock",
        NEXT_PUBLIC_VIDEO_AD_TAG_URL: "https://video.example.com/tag",
        WEB_AD_GATE_SECRET: "gate-secret",
      }),
      ogImageExists: true,
      variant: "public",
    });

    expect(result.missingRequired).toEqual([]);
    expect(result.issues).toEqual([]);
  });
});
