import { NextRequest, NextResponse } from "next/server";
import {
  applyPortalSessionCookies,
  isPortalRuntimeEnabled,
  requirePortalSessionFromRequest,
} from "@/lib/portalAuth";
import { revokePortalApiKey } from "@/lib/portalStore";

export const runtime = "nodejs";

interface RouteContext {
  params: { keyId: string };
}

export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  if (!isPortalRuntimeEnabled()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const auth = await requirePortalSessionFromRequest(request);
  if (auth.errorResponse || !auth.result) {
    return auth.errorResponse ?? NextResponse.json({ error: "unauthorized_session" }, { status: 401 });
  }

  const keyId = context.params.keyId?.trim();
  if (!keyId) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const revoked = await revokePortalApiKey(auth.result.session.account.id, keyId);
  if (!revoked) {
    return NextResponse.json({ error: "forbidden_account_access" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  if (auth.result.refreshed_tokens) {
    applyPortalSessionCookies(response, auth.result.refreshed_tokens);
  }
  return response;
}
