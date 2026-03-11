import { NextRequest, NextResponse } from "next/server";
import { completeAdGateSession, isVideoAdGateEnabledServer } from "@/lib/adGate";
import { type VideoAdOutcome } from "@/lib/videoAdGate";

export const runtime = "nodejs";

function isSupportedOutcome(value: unknown): value is Exclude<VideoAdOutcome, "blocked"> {
  return value === "completed" || value === "skipped" || value === "no_fill" || value === "timeout" || value === "error";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isVideoAdGateEnabledServer()) {
    return NextResponse.json({ error: "ad_gate_disabled" }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const candidate = payload as { outcome?: unknown; sessionId?: unknown };
  if (typeof candidate.sessionId !== "string" || !isSupportedOutcome(candidate.outcome)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    const token = await completeAdGateSession({
      headers: request.headers,
      outcome: candidate.outcome,
      sessionId: candidate.sessionId,
    });
    return NextResponse.json(token, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return NextResponse.json(
      {
        error: message === "invalid_session" ? "ad_gate_invalid" : "ad_gate_complete_failed",
        message,
      },
      { status: message === "invalid_session" ? 403 : 500 }
    );
  }
}
