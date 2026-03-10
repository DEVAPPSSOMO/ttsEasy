import { describe, expect, it } from "vitest";
import { getApiPortalHref } from "./apiPortalUrl";

describe("apiPortalUrl", () => {
  it("falls back to the production portal domain when env is missing", () => {
    expect(getApiPortalHref("/pricing", undefined)).toBe("https://api.ttseasy.com/pricing");
  });

  it("normalizes the configured base URL", () => {
    expect(getApiPortalHref("/docs", "https://portal.example.com/")).toBe("https://portal.example.com/docs");
  });

  it("falls back when the configured base URL is invalid", () => {
    expect(getApiPortalHref("/auth/login", "not-a-url")).toBe("https://api.ttseasy.com/auth/login");
  });

  it("always returns absolute URLs for public API CTAs", () => {
    expect(getApiPortalHref("pricing", "https://portal.example.com/base/")).toBe(
      "https://portal.example.com/pricing"
    );
  });
});
