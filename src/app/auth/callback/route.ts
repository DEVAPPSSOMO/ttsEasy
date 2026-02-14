import { NextRequest, NextResponse } from "next/server";
import {
  applyPortalSessionCookies,
  completePortalLoginFromToken,
  isPortalRuntimeEnabled,
} from "@/lib/portalAuth";

export const runtime = "nodejs";

function redirectToLogin(request: NextRequest, code: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/auth/login";
  url.search = "";
  url.searchParams.set("error", code);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isPortalRuntimeEnabled()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const tokenHash = request.nextUrl.searchParams.get("token_hash")?.trim() || "";
  const type = request.nextUrl.searchParams.get("type")?.trim() || "magiclink";
  if (!tokenHash) {
    return redirectToLogin(request, "missing_token");
  }

  try {
    const login = await completePortalLoginFromToken({
      token_hash: tokenHash,
      type,
    });

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    if (login.initial_api_key) {
      redirectUrl.searchParams.set("initial_key", login.initial_api_key);
    }

    const response = NextResponse.redirect(redirectUrl);
    applyPortalSessionCookies(response, login.tokens);
    return response;
  } catch {
    return redirectToLogin(request, "invalid_or_expired_link");
  }
}
