import { NextRequest, NextResponse } from "next/server";
import { clearPortalSessionCookies, isPortalRuntimeEnabled } from "@/lib/portalAuth";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isPortalRuntimeEnabled()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/auth/login";
  redirectUrl.search = "";
  const response = NextResponse.redirect(redirectUrl);
  clearPortalSessionCookies(response);
  return response;
}
