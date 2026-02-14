import { NextRequest, NextResponse } from "next/server";
import { isCredentialUsable, parseBearerApiKey, resolveApiCredential } from "@/lib/apiBilling";
import { isPrepaidBillingEnabled, listWalletTransactions } from "@/lib/prepaidBilling";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isPrepaidBillingEnabled()) {
    return NextResponse.json({ error: "prepaid_billing_disabled" }, { status: 404 });
  }
  const apiKey = parseBearerApiKey(request.headers.get("authorization"));
  const credential = await resolveApiCredential(apiKey);
  if (!credential || !isCredentialUsable(credential)) {
    return NextResponse.json({ error: "invalid_api_key" }, { status: 401 });
  }

  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "20");
  const cursor = request.nextUrl.searchParams.get("cursor");
  const page = await listWalletTransactions(credential.account_id, {
    cursor,
    limit: Number.isFinite(limitRaw) ? limitRaw : 20,
  });
  return NextResponse.json(page, { status: 200 });
}
