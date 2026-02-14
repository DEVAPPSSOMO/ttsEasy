import { NextRequest, NextResponse } from "next/server";
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

  const response = NextResponse.json(
    {
      account: auth.result.session.account,
      user: auth.result.session.user,
    },
    { status: 200 }
  );

  if (auth.result.refreshed_tokens) {
    applyPortalSessionCookies(response, auth.result.refreshed_tokens);
  }

  return response;
}
