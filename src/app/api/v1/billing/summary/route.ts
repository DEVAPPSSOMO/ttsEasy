import { NextRequest, NextResponse } from "next/server";
import {
  getBillingSummary,
  getCurrentMonthKeyUtc,
  isCredentialUsable,
  isValidMonthKey,
  parseBearerApiKey,
  resolveApiCredential,
} from "@/lib/apiBilling";
import { getPrepaidBillingSummary, isPrepaidBillingEnabled } from "@/lib/prepaidBilling";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const apiKey = parseBearerApiKey(request.headers.get("authorization"));
  const credential = await resolveApiCredential(apiKey);
  if (!credential || !isCredentialUsable(credential)) {
    return NextResponse.json({ error: "invalid_api_key" }, { status: 401 });
  }

  const month = request.nextUrl.searchParams.get("month") ?? getCurrentMonthKeyUtc();
  if (!isValidMonthKey(month)) {
    return NextResponse.json({ error: "invalid_month" }, { status: 400 });
  }

  if (isPrepaidBillingEnabled()) {
    const summary = await getPrepaidBillingSummary(credential.account_id, month);
    return NextResponse.json(summary, { status: 200 });
  }

  const summary = await getBillingSummary(credential.account_id, month);
  return NextResponse.json(summary, { status: 200 });
}
