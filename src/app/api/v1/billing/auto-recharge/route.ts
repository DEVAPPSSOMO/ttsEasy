import { NextRequest, NextResponse } from "next/server";
import { isCredentialUsable, parseBearerApiKey, resolveApiCredential } from "@/lib/apiBilling";
import {
  getAutoRechargeConfig,
  isPrepaidBillingEnabled,
  setAutoRechargeConfig,
} from "@/lib/prepaidBilling";

export const runtime = "nodejs";

interface AutoRechargePatchPayload {
  amount_eur: number;
  enabled: boolean;
  trigger_eur: number;
}

function validatePayload(payload: unknown): payload is AutoRechargePatchPayload {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<AutoRechargePatchPayload>;
  return (
    typeof candidate.enabled === "boolean" &&
    typeof candidate.amount_eur === "number" &&
    typeof candidate.trigger_eur === "number"
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isPrepaidBillingEnabled()) {
    return NextResponse.json({ error: "prepaid_billing_disabled" }, { status: 404 });
  }
  const apiKey = parseBearerApiKey(request.headers.get("authorization"));
  const credential = await resolveApiCredential(apiKey);
  if (!credential || !isCredentialUsable(credential)) {
    return NextResponse.json({ error: "invalid_api_key" }, { status: 401 });
  }
  const config = await getAutoRechargeConfig(credential.account_id);
  return NextResponse.json(config, { status: 200 });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  if (!isPrepaidBillingEnabled()) {
    return NextResponse.json({ error: "prepaid_billing_disabled" }, { status: 404 });
  }
  const apiKey = parseBearerApiKey(request.headers.get("authorization"));
  const credential = await resolveApiCredential(apiKey);
  if (!credential || !isCredentialUsable(credential)) {
    return NextResponse.json({ error: "invalid_api_key" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!validatePayload(payload)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    const updated = await setAutoRechargeConfig(credential.account_id, payload);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_payload";
    if (message === "invalid_auto_recharge_amount") {
      return NextResponse.json({ error: "invalid_auto_recharge_amount" }, { status: 400 });
    }
    if (message === "invalid_auto_recharge_trigger") {
      return NextResponse.json({ error: "invalid_auto_recharge_trigger" }, { status: 400 });
    }
    return NextResponse.json({ error: "unable_to_update_auto_recharge" }, { status: 500 });
  }
}
