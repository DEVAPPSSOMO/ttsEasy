import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import {
  abortStripeEventProcessing,
  beginStripeEventProcessing,
  buildWalletDeltaInput,
  completeStripeEventProcessing,
  consumeRefundDeltaMicros,
  creditWallet,
  debitWallet,
  getAccountIdByStripeCustomer,
  getCheckoutSessionMeta,
  isPrepaidBillingEnabled,
  markAutoRechargeFailure,
  setAutoRechargePaymentMethod,
  setStripeCustomerForAccount,
} from "@/lib/prepaidBilling";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripeClient";

export const runtime = "nodejs";

function asStringId(value: string | Stripe.Customer | Stripe.PaymentIntent | null): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id;
}

async function resolveAccountIdFromSession(
  session: Stripe.Checkout.Session
): Promise<string | null> {
  const metadataAccount = session.metadata?.account_id;
  if (metadataAccount) return metadataAccount;

  const fromStored = await getCheckoutSessionMeta(session.id);
  if (fromStored?.account_id) return fromStored.account_id;

  const customerId = asStringId(session.customer as string | Stripe.Customer | null);
  if (!customerId) return null;
  return getAccountIdByStripeCustomer(customerId);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isPrepaidBillingEnabled()) {
    return NextResponse.json({ error: "prepaid_billing_disabled" }, { status: 404 });
  }

  const stripe = getStripeClient();
  const webhookSecret = getStripeWebhookSecret();
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "stripe_unavailable" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const processing = await beginStripeEventProcessing(event.id);
  if (processing === "processed" || processing === "processing") {
    return NextResponse.json({ deduped: true, received: true }, { status: 200 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const accountId = await resolveAccountIdFromSession(session);
      const customerId = asStringId(session.customer as string | Stripe.Customer | null);
      const storedSessionMeta = await getCheckoutSessionMeta(session.id);

      if (accountId && customerId) {
        await setStripeCustomerForAccount(accountId, customerId);
      }

      if (accountId) {
        const amountMicrosFromMeta = Number(storedSessionMeta?.amount_micros ?? 0);
        const amountMicrosFromTotals = Math.max(
          0,
          Math.floor(Number(session.amount_total ?? session.amount_subtotal ?? 0) * 10_000)
        );
        const amountMicros =
          Number.isFinite(amountMicrosFromMeta) && amountMicrosFromMeta > 0
            ? Math.floor(amountMicrosFromMeta)
            : amountMicrosFromTotals;
        if (amountMicros > 0) {
          const topupKind = session.metadata?.topup_kind ?? storedSessionMeta?.source;
          const source = topupKind === "auto" ? "stripe_auto_checkout" : "stripe_checkout";
          const type = topupKind === "auto" ? "auto_topup_credit" : "topup_credit";
          await creditWallet(
            buildWalletDeltaInput({
              account_id: accountId,
              amount_micros: amountMicros,
              meta: {
                checkout_session_id: session.id,
                payment_intent_id: asStringId(session.payment_intent as string | Stripe.PaymentIntent | null),
              },
              request_id: null,
              source,
              stripe_ref: session.id,
              type,
            })
          );
        }

        const paymentIntentId = asStringId(session.payment_intent as string | Stripe.PaymentIntent | null);
        if (paymentIntentId) {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          const paymentMethodId =
            typeof paymentIntent.payment_method === "string"
              ? paymentIntent.payment_method
              : paymentIntent.payment_method?.id ?? null;
          if (paymentMethodId) {
            await setAutoRechargePaymentMethod(accountId, paymentMethodId);
          }
        }
      }
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const accountId = charge.metadata?.account_id;
      if (accountId) {
        const cumulativeMicros = Math.max(
          0,
          Math.floor(Number(charge.amount_refunded ?? 0) * 10_000)
        );
        const deltaMicros = await consumeRefundDeltaMicros(charge.id, cumulativeMicros);
        if (deltaMicros > 0) {
          await debitWallet(
            buildWalletDeltaInput({
              account_id: accountId,
              allow_negative: true,
              amount_micros: deltaMicros,
              meta: {
                charge_id: charge.id,
                payment_intent_id: asStringId(charge.payment_intent as string | Stripe.PaymentIntent | null),
              },
              request_id: null,
              source: "stripe_refund",
              stripe_ref: charge.id,
              type: "refund_debit",
            })
          );
        }
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const accountId = paymentIntent.metadata?.account_id;
      if (accountId) {
        const message = paymentIntent.last_payment_error?.message ?? "payment_intent_failed";
        await markAutoRechargeFailure(accountId, message);
      }
    }
    await completeStripeEventProcessing(event.id);
  } catch {
    await abortStripeEventProcessing(event.id);
    return NextResponse.json({ error: "webhook_processing_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
