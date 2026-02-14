import { NextRequest, NextResponse } from "next/server";
import {
  createPortalApiKey,
  listPortalApiKeys,
} from "@/lib/portalStore";
import {
  applyPortalSessionCookies,
  isPortalRuntimeEnabled,
  requirePortalSessionFromRequest,
} from "@/lib/portalAuth";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isPortalRuntimeEnabled()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const auth = await requirePortalSessionFromRequest(request);
  if (auth.errorResponse || !auth.result) {
    return auth.errorResponse ?? NextResponse.json({ error: "unauthorized_session" }, { status: 401 });
  }

  const keys = await listPortalApiKeys(auth.result.session.account.id);
  const response = NextResponse.json({ keys }, { status: 200 });
  if (auth.result.refreshed_tokens) {
    applyPortalSessionCookies(response, auth.result.refreshed_tokens);
  }
  return response;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isPortalRuntimeEnabled()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const auth = await requirePortalSessionFromRequest(request);
  if (auth.errorResponse || !auth.result) {
    return auth.errorResponse ?? NextResponse.json({ error: "unauthorized_session" }, { status: 401 });
  }

  try {
    await request.text();
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    const created = await createPortalApiKey(auth.result.session.account.id);
    const response = NextResponse.json(created, { status: 200 });
    if (auth.result.refreshed_tokens) {
      applyPortalSessionCookies(response, auth.result.refreshed_tokens);
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "internal_error";
    if (message === "api_key_limit_reached") {
      return NextResponse.json({ error: "api_key_limit_reached" }, { status: 409 });
    }
    if (message === "billing_db_disabled") {
      return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
