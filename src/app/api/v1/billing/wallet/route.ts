import { NextRequest, NextResponse } from "next/server";
import { isCredentialUsable, parseBearerApiKey, resolveApiCredential } from "@/lib/apiBilling";
import { getWalletBalance, isPrepaidBillingEnabled } from "@/lib/prepaidBilling";

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
  const wallet = await getWalletBalance(credential.account_id);
  return NextResponse.json(wallet, { status: 200 });
}
