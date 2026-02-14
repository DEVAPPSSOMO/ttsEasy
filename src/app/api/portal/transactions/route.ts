import { NextRequest, NextResponse } from "next/server";
import {
  applyPortalSessionCookies,
  isPortalRuntimeEnabled,
  requirePortalSessionFromRequest,
} from "@/lib/portalAuth";
import { isPrepaidBillingEnabled, listWalletTransactions } from "@/lib/prepaidBilling";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isPortalRuntimeEnabled()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!isPrepaidBillingEnabled()) {
    return NextResponse.json({ error: "prepaid_billing_disabled" }, { status: 404 });
  }

  const auth = await requirePortalSessionFromRequest(request);
  if (auth.errorResponse || !auth.result) {
    return auth.errorResponse ?? NextResponse.json({ error: "unauthorized_session" }, { status: 401 });
  }

  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "20");
  const cursor = request.nextUrl.searchParams.get("cursor");
  const page = await listWalletTransactions(auth.result.session.account.id, {
    cursor,
    limit: Number.isFinite(limitRaw) ? limitRaw : 20,
  });

  const response = NextResponse.json(page, { status: 200 });
  if (auth.result.refreshed_tokens) {
    applyPortalSessionCookies(response, auth.result.refreshed_tokens);
  }
  return response;
}
