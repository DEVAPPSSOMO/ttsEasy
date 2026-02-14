import { NextRequest, NextResponse } from "next/server";
import {
  applyPortalSessionCookies,
  isPortalRuntimeEnabled,
  requirePortalSessionFromRequest,
} from "@/lib/portalAuth";
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

  const config = await getAutoRechargeConfig(auth.result.session.account.id);
  const response = NextResponse.json(config, { status: 200 });
  if (auth.result.refreshed_tokens) {
    applyPortalSessionCookies(response, auth.result.refreshed_tokens);
  }
  return response;
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
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

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (!validatePayload(payload)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    const updated = await setAutoRechargeConfig(auth.result.session.account.id, payload);
    const response = NextResponse.json(updated, { status: 200 });
    if (auth.result.refreshed_tokens) {
      applyPortalSessionCookies(response, auth.result.refreshed_tokens);
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_payload";
    if (message === "invalid_auto_recharge_amount") {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }
    if (message === "invalid_auto_recharge_trigger") {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
