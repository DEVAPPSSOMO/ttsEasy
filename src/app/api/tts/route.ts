import { NextRequest, NextResponse } from "next/server";
import { checkBudget, registerUsage } from "@/lib/costGuard";
import { synthesizeTextToMp3 } from "@/lib/googleTts";
import { getReaderById } from "@/lib/readers";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { TtsRequest } from "@/lib/types";

// This route uses the Google Cloud Node SDK, so it must run on the Node.js runtime (not Edge).
export const runtime = "nodejs";

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-z0-9-]/gi, "_").toLowerCase();
}

function validateTtsPayload(payload: unknown): payload is TtsRequest {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  const candidate = payload as Partial<TtsRequest>;
  if (!candidate.text || typeof candidate.text !== "string") {
    return false;
  }
  if (!candidate.locale || typeof candidate.locale !== "string") {
    return false;
  }
  if (!candidate.readerId || typeof candidate.readerId !== "string") {
    return false;
  }
  if (!candidate.localeSource || typeof candidate.localeSource !== "string") {
    return false;
  }
  if (typeof candidate.speed !== "number") {
    return false;
  }
  if (!candidate.captchaToken || typeof candidate.captchaToken !== "string") {
    return false;
  }
  return true;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!validateTtsPayload(payload)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const text = payload.text.trim();
  if (!text) {
    return NextResponse.json({ error: "empty_text" }, { status: 400 });
  }

  const ip = getClientIp(request.headers);

  // Order matters:
  // 1) Rate limit + CAPTCHA first to reject abuse early (before any paid TTS work).
  // 2) Budget guard next to cap monthly cost.
  // 3) Only then call Google TTS.
  const limit = await checkRateLimit(ip, {
    maxRequests: 15,
    prefix: "tts-generate",
    windowMs: 60_000
  });
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        retryAfterSec: limit.retryAfterSec
      },
      {
        headers: { "retry-after": String(limit.retryAfterSec) },
        status: 429
      }
    );
  }

  const captcha = await verifyTurnstileToken(payload.captchaToken, ip);
  if (!captcha.success) {
    return NextResponse.json(
      {
        error: "captcha_failed",
        details: captcha.errors
      },
      { status: 403 }
    );
  }

  const reader = getReaderById(payload.locale, payload.readerId);
  const budget = await checkBudget(text.length, reader.tier);
  if (!budget.allowed) {
    return NextResponse.json(
      {
        error: "budget_exceeded",
        monthlyLimitUsd: budget.monthlyLimitUsd,
        projectedCostUsd: budget.projectedCostUsd
      },
      { status: 429 }
    );
  }

  try {
    const audioBuffer = await synthesizeTextToMp3({
      locale: payload.locale,
      reader,
      speed: payload.speed,
      text
    });

    await registerUsage(text.length, reader.tier);
    const filename = sanitizeFilename(`tts-${payload.locale}-${Date.now()}.mp3`);

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="${filename}"`,
        "content-length": String(audioBuffer.length),
        "content-type": "audio/mpeg",
        "x-estimated-cost-usd": String(budget.estimatedRequestCostUsd.toFixed(6))
      },
      status: 200
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "tts_failed",
        message: error instanceof Error ? error.message : "unknown_error"
      },
      { status: 500 }
    );
  }
}
