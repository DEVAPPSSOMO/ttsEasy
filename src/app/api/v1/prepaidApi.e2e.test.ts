import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { __resetApiBillingForTests } from "@/lib/apiBilling";
import { __resetPrepaidBillingForTests } from "@/lib/prepaidBilling";
import { POST as topupCheckoutSessionPost } from "@/app/api/v1/billing/topups/checkout-session/route";
import { GET as walletGet } from "@/app/api/v1/billing/wallet/route";
import { POST as webhookPost } from "@/app/api/v1/payments/stripe/webhook/route";
import { POST as ttsPost } from "@/app/api/v1/tts/route";

const API_KEY = "live_test_key_1";
const AUTH_HEADER = `Bearer ${API_KEY}`;

const stripeState = {
  sessionCounter: 0,
};

const stripeMock = {
  checkout: {
    sessions: {
      create: vi.fn(async () => {
        stripeState.sessionCounter += 1;
        const sessionId = `cs_test_${stripeState.sessionCounter}`;
        return {
          expires_at: 1_950_000_000,
          id: sessionId,
          url: `https://checkout.stripe.com/pay/${sessionId}`,
        };
      }),
    },
  },
  customers: {
    create: vi.fn(async () => ({ id: "cus_test_1" })),
  },
  paymentIntents: {
    create: vi.fn(async (params: { amount: number }) => ({
      amount: params.amount,
      amount_received: params.amount,
      id: "pi_auto_1",
      payment_method: "pm_card_visa",
      status: "succeeded",
    })),
    retrieve: vi.fn(async () => ({
      id: "pi_checkout_1",
      payment_method: "pm_card_visa",
      status: "succeeded",
    })),
  },
  webhooks: {
    constructEvent: vi.fn((payload: string) => JSON.parse(payload)),
  },
};

vi.mock("@/lib/stripeClient", () => ({
  getStripeClient: () => stripeMock,
  getStripeWebhookSecret: () => "whsec_test",
}));

vi.mock("@/lib/googleTts", () => ({
  synthesizeTextToMp3: vi.fn(async () => Buffer.from("fake-mp3")),
}));

function buildAuthedJsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    body: JSON.stringify(body),
    headers: {
      authorization: AUTH_HEADER,
      "content-type": "application/json",
    },
    method: "POST",
  });
}

function buildWalletRequest(): NextRequest {
  return new NextRequest("http://localhost/api/v1/billing/wallet", {
    headers: { authorization: AUTH_HEADER },
    method: "GET",
  });
}

async function createTopupSession(amountEur: number): Promise<{ checkout_session_id: string }> {
  const response = await topupCheckoutSessionPost(
    buildAuthedJsonRequest("http://localhost/api/v1/billing/topups/checkout-session", {
      amount_eur: amountEur,
      cancel_url: "https://example.com/cancel",
      success_url: "https://example.com/success",
    })
  );
  expect(response.status).toBe(200);
  return (await response.json()) as { checkout_session_id: string };
}

async function postWebhookEvent(event: unknown): Promise<number> {
  const request = new NextRequest("http://localhost/api/v1/payments/stripe/webhook", {
    body: JSON.stringify(event),
    headers: {
      "content-type": "application/json",
      "stripe-signature": "t=1,v1=fake",
    },
    method: "POST",
  });
  const response = await webhookPost(request);
  return response.status;
}

describe("prepaid API e2e", () => {
  beforeEach(() => {
    process.env.API_BILLING_PREPAID_ENABLED = "true";
    process.env.API_BILLING_KEYS_JSON = JSON.stringify([
      {
        account_id: "acct_e2e",
        billing_status: "active",
        key: API_KEY,
        key_id: "key_e2e_1",
        monthly_hard_limit_chars: 1_000_000,
        rate_limit_per_minute: 120,
        status: "active",
      },
    ]);
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    stripeState.sessionCounter = 0;
    vi.clearAllMocks();
    __resetApiBillingForTests();
    __resetPrepaidBillingForTests();
  });

  it("rejects top-up below 5 EUR and accepts 5 EUR", async () => {
    const rejectResponse = await topupCheckoutSessionPost(
      buildAuthedJsonRequest("http://localhost/api/v1/billing/topups/checkout-session", {
        amount_eur: 4.99,
        cancel_url: "https://example.com/cancel",
        success_url: "https://example.com/success",
      })
    );
    expect(rejectResponse.status).toBe(400);
    const rejectBody = (await rejectResponse.json()) as { error: string };
    expect(rejectBody.error).toBe("invalid_topup_amount");

    const okResponse = await topupCheckoutSessionPost(
      buildAuthedJsonRequest("http://localhost/api/v1/billing/topups/checkout-session", {
        amount_eur: 5,
        cancel_url: "https://example.com/cancel",
        success_url: "https://example.com/success",
      })
    );
    expect(okResponse.status).toBe(200);
    const okBody = (await okResponse.json()) as { amount_eur: number; currency: string };
    expect(okBody.amount_eur).toBe(5);
    expect(okBody.currency).toBe("EUR");
  });

  it("credits wallet once on checkout webhook replay", async () => {
    const session = await createTopupSession(5);
    const event = {
      data: {
        object: {
          amount_total: 500,
          customer: "cus_test_1",
          id: session.checkout_session_id,
          metadata: { account_id: "acct_e2e", topup_kind: "manual" },
          payment_intent: "pi_checkout_1",
        },
      },
      id: "evt_checkout_1",
      type: "checkout.session.completed",
    };

    expect(await postWebhookEvent(event)).toBe(200);
    expect(await postWebhookEvent(event)).toBe(200);

    const walletResponse = await walletGet(buildWalletRequest());
    expect(walletResponse.status).toBe(200);
    const wallet = (await walletResponse.json()) as {
      auto_recharge: { payment_method_id: string | null };
      balance_eur: number;
      balance_micros: number;
      currency: string;
    };
    expect(wallet.currency).toBe("EUR");
    expect(wallet.balance_micros).toBe(5_000_000);
    expect(wallet.balance_eur).toBe(5);
    expect(wallet.auto_recharge.payment_method_id).toBe("pm_card_visa");
  });

  it("returns 402 when balance is insufficient and keeps wallet unchanged", async () => {
    const session = await createTopupSession(5);
    await postWebhookEvent({
      data: {
        object: {
          amount_total: 500,
          customer: "cus_test_1",
          id: session.checkout_session_id,
          metadata: { account_id: "acct_e2e", topup_kind: "manual" },
          payment_intent: "pi_checkout_1",
        },
      },
      id: "evt_checkout_2",
      type: "checkout.session.completed",
    });

    const response = await ttsPost(
      buildAuthedJsonRequest("http://localhost/api/v1/tts", {
        locale: "es-ES",
        readerId: "claro",
        speed: 1,
        text: "a".repeat(400_000),
      })
    );
    expect(response.status).toBe(402);
    const body = (await response.json()) as { balance_eur: number; error: string };
    expect(body.error).toBe("insufficient_balance");
    expect(body.balance_eur).toBe(5);

    const walletResponse = await walletGet(buildWalletRequest());
    const wallet = (await walletResponse.json()) as { balance_micros: number };
    expect(wallet.balance_micros).toBe(5_000_000);
  });

  it("applies refund only by delta for cumulative refunded amount", async () => {
    const session = await createTopupSession(5);
    await postWebhookEvent({
      data: {
        object: {
          amount_total: 500,
          customer: "cus_test_1",
          id: session.checkout_session_id,
          metadata: { account_id: "acct_e2e", topup_kind: "manual" },
          payment_intent: "pi_checkout_1",
        },
      },
      id: "evt_checkout_3",
      type: "checkout.session.completed",
    });

    await postWebhookEvent({
      data: {
        object: {
          amount_refunded: 100,
          id: "ch_test_1",
          metadata: { account_id: "acct_e2e" },
          payment_intent: "pi_checkout_1",
        },
      },
      id: "evt_refund_1",
      type: "charge.refunded",
    });

    await postWebhookEvent({
      data: {
        object: {
          amount_refunded: 100,
          id: "ch_test_1",
          metadata: { account_id: "acct_e2e" },
          payment_intent: "pi_checkout_1",
        },
      },
      id: "evt_refund_2",
      type: "charge.refunded",
    });

    await postWebhookEvent({
      data: {
        object: {
          amount_refunded: 250,
          id: "ch_test_1",
          metadata: { account_id: "acct_e2e" },
          payment_intent: "pi_checkout_1",
        },
      },
      id: "evt_refund_3",
      type: "charge.refunded",
    });

    const walletResponse = await walletGet(buildWalletRequest());
    const wallet = (await walletResponse.json()) as { balance_micros: number };
    expect(wallet.balance_micros).toBe(2_500_000);
  });
});
