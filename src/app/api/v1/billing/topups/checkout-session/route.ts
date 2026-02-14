import { NextRequest, NextResponse } from "next/server";
import { isCredentialUsable, parseBearerApiKey, resolveApiCredential } from "@/lib/apiBilling";
import {
  buildTopupSessionMeta,
  getMinimumTopupEur,
  getStripeCustomerIdByAccount,
  getTopupAmountCents,
  isPrepaidBillingEnabled,
  resolveTopupAmount,
  setStripeCustomerForAccount,
  storeCheckoutSessionMeta,
} from "@/lib/prepaidBilling";
import { getStripeClient } from "@/lib/stripeClient";
import { TopupSessionRequest, TopupSessionResponse } from "@/lib/types";

export const runtime = "nodejs";

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validatePayload(payload: unknown): payload is TopupSessionRequest {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<TopupSessionRequest>;
  if (!candidate.success_url || typeof candidate.success_url !== "string") return false;
  if (!candidate.cancel_url || typeof candidate.cancel_url !== "string") return false;
  if (!isValidHttpUrl(candidate.success_url) || !isValidHttpUrl(candidate.cancel_url)) return false;
  if (
    candidate.pack_id &&
    candidate.pack_id !== "pack_5" &&
    candidate.pack_id !== "pack_10" &&
    candidate.pack_id !== "pack_25" &&
    candidate.pack_id !== "pack_50"
  ) {
    return false;
  }
  if (candidate.amount_eur !== undefined && typeof candidate.amount_eur !== "number") {
    return false;
  }
  if (candidate.save_payment_method !== undefined && typeof candidate.save_payment_method !== "boolean") {
    return false;
  }
  return true;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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

  const topup = resolveTopupAmount({
    amount_eur: payload.amount_eur,
    pack_id: payload.pack_id,
  });
  if (!topup) {
    return NextResponse.json(
      { error: "invalid_topup_amount", minimum_eur: getMinimumTopupEur() },
      { status: 400 }
    );
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "stripe_unavailable" }, { status: 503 });
  }

  const savePaymentMethod = payload.save_payment_method ?? true;
  const accountId = credential.account_id;

  let customerId = await getStripeCustomerIdByAccount(accountId);
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: {
        account_id: accountId,
      },
    });
    customerId = customer.id;
    await setStripeCustomerForAccount(accountId, customerId);
  }

  const amountCents = getTopupAmountCents(topup.amount_eur);
  const session = await stripe.checkout.sessions.create({
    automatic_tax: {
      enabled: true,
    },
    billing_address_collection: "required",
    cancel_url: payload.cancel_url,
    customer: customerId,
    customer_update: {
      address: "auto",
      name: "auto",
    },
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `API Wallet Top-up €${topup.amount_eur.toFixed(2)}`,
          },
          tax_behavior: "inclusive",
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      account_id: accountId,
      topup_kind: "manual",
      topup_micros: String(topup.amount_micros),
    },
    mode: "payment",
    payment_intent_data: {
      metadata: {
        account_id: accountId,
        topup_kind: "manual",
        topup_micros: String(topup.amount_micros),
      },
      setup_future_usage: savePaymentMethod ? "off_session" : undefined,
    },
    payment_method_types: ["card"],
    success_url: payload.success_url,
  });

  await storeCheckoutSessionMeta(
    session.id,
    buildTopupSessionMeta({
      account_id: accountId,
      amount_micros: topup.amount_micros,
      save_payment_method: savePaymentMethod,
      source: "manual",
    })
  );

  const response: TopupSessionResponse = {
    amount_eur: topup.amount_eur,
    checkout_session_id: session.id,
    checkout_url: session.url ?? "",
    currency: "EUR",
    expires_at: session.expires_at ?? null,
  };

  if (!response.checkout_url) {
    return NextResponse.json({ error: "checkout_unavailable" }, { status: 500 });
  }
  return NextResponse.json(response, { status: 200 });
}
