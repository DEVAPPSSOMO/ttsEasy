import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as completePost } from "@/app/api/ads/complete/route";
import { POST as sessionPost } from "@/app/api/ads/session/route";
import { POST as webTtsPost } from "@/app/api/tts/route";
import { POST as apiV1TtsPost } from "@/app/api/v1/tts/route";
import { __resetAdGateForTests } from "@/lib/adGate";
import { __resetApiBillingForTests } from "@/lib/apiBilling";

vi.mock("@/lib/googleTts", () => ({
  synthesizeTextToMp3: vi.fn(async () => Buffer.from("fake-mp3")),
}));

function buildRequest(url: string, options?: {
  body?: unknown;
  cookie?: string;
  headers?: Record<string, string>;
  ip?: string;
  method?: string;
  userAgent?: string;
}): NextRequest {
  return new NextRequest(url, {
    body: options?.body ? JSON.stringify(options.body) : undefined,
    headers: {
      "content-type": "application/json",
      "user-agent": options?.userAgent ?? "vitest-browser",
      "x-forwarded-for": options?.ip ?? "203.0.113.10",
      ...(options?.cookie ? { cookie: options.cookie } : {}),
      ...(options?.headers ?? {}),
    },
    method: options?.method ?? "POST",
  });
}

async function createToken(ip = "203.0.113.10"): Promise<string> {
  const sessionResponse = await sessionPost(buildRequest("http://localhost/api/ads/session", { ip }));
  expect(sessionResponse.status).toBe(200);
  const sessionPayload = (await sessionResponse.json()) as { sessionId: string };

  const completeResponse = await completePost(
    buildRequest("http://localhost/api/ads/complete", {
      body: { outcome: "completed", sessionId: sessionPayload.sessionId },
      ip,
    })
  );
  expect(completeResponse.status).toBe(200);
  const completePayload = (await completeResponse.json()) as { adGateToken: string };
  return completePayload.adGateToken;
}

describe("video ad gate routes", () => {
  beforeEach(() => {
    process.env.APP_VARIANT = "public";
    process.env.NEXT_PUBLIC_VIDEO_AD_GATE_ENABLED = "true";
    process.env.NEXT_PUBLIC_VIDEO_AD_PROVIDER = "mock";
    process.env.WEB_AD_GATE_SECRET = "test_secret";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.TURNSTILE_SECRET_KEY;

    process.env.API_BILLING_PREPAID_ENABLED = "false";
    process.env.API_BILLING_KEYS_JSON = JSON.stringify([
      {
        account_id: "acct_gate",
        billing_status: "active",
        key: "gate_test_key",
        key_id: "key_gate_1",
        monthly_hard_limit_chars: 1000000,
        rate_limit_per_minute: 120,
        status: "active",
      },
    ]);

    vi.clearAllMocks();
    __resetAdGateForTests();
    __resetApiBillingForTests();
  });

  it("creates a session and exchanges it for a token", async () => {
    const sessionResponse = await sessionPost(buildRequest("http://localhost/api/ads/session"));
    expect(sessionResponse.status).toBe(200);

    const sessionPayload = (await sessionResponse.json()) as { provider: string; sessionId: string };
    expect(sessionPayload.provider).toBe("mock");
    expect(sessionPayload.sessionId).toContain(".");

    const completeResponse = await completePost(
      buildRequest("http://localhost/api/ads/complete", {
        body: { outcome: "completed", sessionId: sessionPayload.sessionId },
      })
    );
    expect(completeResponse.status).toBe(200);

    const completePayload = (await completeResponse.json()) as { adGateToken: string };
    expect(completePayload.adGateToken).toContain(".");
  });

  it("rejects /api/tts without an ad gate token when the gate is enabled", async () => {
    const response = await webTtsPost(
      buildRequest("http://localhost/api/tts", {
        body: {
          captchaToken: "dev-token",
          locale: "en-US",
          localeSource: "auto",
          readerId: "natural",
          speed: 1,
          text: "Hello world",
        },
      })
    );

    expect(response.status).toBe(403);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toBe("ad_gate_required");
  });

  it("rejects invalid ad gate tokens and surfaces the blocker cookie path", async () => {
    const invalidResponse = await webTtsPost(
      buildRequest("http://localhost/api/tts", {
        body: {
          adGateToken: "bad-token",
          captchaToken: "dev-token",
          locale: "en-US",
          localeSource: "auto",
          readerId: "natural",
          speed: 1,
          text: "Hello world",
        },
        ip: "203.0.113.11",
      })
    );
    expect(invalidResponse.status).toBe(403);
    expect((await invalidResponse.json()) as { error: string }).toMatchObject({ error: "ad_gate_invalid" });

    const blockedResponse = await webTtsPost(
      buildRequest("http://localhost/api/tts", {
        body: {
          captchaToken: "dev-token",
          locale: "en-US",
          localeSource: "auto",
          readerId: "natural",
          speed: 1,
          text: "Hello world",
        },
        cookie: "tts_web_adblock=1",
        ip: "203.0.113.12",
      })
    );
    expect(blockedResponse.status).toBe(403);
    expect((await blockedResponse.json()) as { error: string }).toMatchObject({ error: "adblock_detected" });
  });

  it("accepts a valid token once and rejects token reuse", async () => {
    const token = await createToken("203.0.113.13");

    const okResponse = await webTtsPost(
      buildRequest("http://localhost/api/tts", {
        body: {
          adGateToken: token,
          captchaToken: "dev-token",
          locale: "en-US",
          localeSource: "auto",
          readerId: "natural",
          speed: 1,
          text: "Hello world",
        },
        ip: "203.0.113.13",
      })
    );

    expect(okResponse.status).toBe(200);
    expect(okResponse.headers.get("content-type")).toBe("audio/mpeg");

    const reusedResponse = await webTtsPost(
      buildRequest("http://localhost/api/tts", {
        body: {
          adGateToken: token,
          captchaToken: "dev-token",
          locale: "en-US",
          localeSource: "auto",
          readerId: "natural",
          speed: 1,
          text: "Hello again",
        },
        ip: "203.0.113.13",
      })
    );
    expect(reusedResponse.status).toBe(403);
    expect((await reusedResponse.json()) as { error: string }).toMatchObject({ error: "ad_gate_invalid" });
  });

  it("leaves /api/v1/tts outside the web ad gate enforcement", async () => {
    const response = await apiV1TtsPost(
      buildRequest("http://localhost/api/v1/tts", {
        body: {
          locale: "en-US",
          readerId: "natural",
          speed: 1,
          text: "API route unaffected",
        },
        headers: {
          authorization: "Bearer gate_test_key",
        },
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("audio/mpeg");
  });
});
