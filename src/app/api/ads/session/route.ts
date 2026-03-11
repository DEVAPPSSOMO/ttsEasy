import { NextRequest, NextResponse } from "next/server";
import { createAdGateSession, isVideoAdGateEnabledServer } from "@/lib/adGate";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isVideoAdGateEnabledServer()) {
    return NextResponse.json({ error: "ad_gate_disabled" }, { status: 404 });
  }

  try {
    const session = await createAdGateSession(request.headers);
    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "ad_gate_session_failed",
        message: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
