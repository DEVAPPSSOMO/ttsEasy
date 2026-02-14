import { beforeEach, describe, expect, it } from "vitest";
import {
  abortStripeEventProcessing,
  __resetPrepaidBillingForTests,
  abortPrepaidIdempotency,
  beginPrepaidIdempotency,
  beginStripeEventProcessing,
  buildWalletDeltaInput,
  calculateUsageChargeMicros,
  completeStripeEventProcessing,
  completePrepaidIdempotency,
  consumeRefundDeltaMicros,
  creditWallet,
  debitWallet,
  getAutoRechargeConfig,
  getPrepaidBillingSummary,
  getWalletBalance,
  listWalletTransactions,
  registerSuccessfulUsageSummary,
  resolveTopupAmount,
  setAutoRechargeConfig,
} from "@/lib/prepaidBilling";

describe("prepaidBilling", () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.API_BILLING_AUTO_RECHARGE_TRIGGER_EUR;
    delete process.env.API_BILLING_AUTO_RECHARGE_AMOUNT_EUR;
    __resetPrepaidBillingForTests();
  });

  it("validates topup amount with minimum 5 EUR", () => {
    expect(resolveTopupAmount({ amount_eur: 4.99 })).toBeNull();
    expect(resolveTopupAmount({ amount_eur: 5 })).toEqual({
      amount_eur: 5,
      amount_micros: 5_000_000,
    });
    expect(resolveTopupAmount({ pack_id: "pack_25" })).toEqual({
      amount_eur: 25,
      amount_micros: 25_000_000,
    });
  });

  it("calculates EUR charge tiers at boundaries", () => {
    const firstTier = calculateUsageChargeMicros(1_000_000, 0);
    expect(firstTier.charge_micros).toBe(15_000_000);
    expect(firstTier.price_tier_eur_per_million).toBe(15);

    const crossing = calculateUsageChargeMicros(1_000_000, 19_500_000);
    expect(crossing.charge_micros).toBe(13_500_000);
    expect(crossing.price_tier_eur_per_million).toBe(15);

    const thirdTier = calculateUsageChargeMicros(1_000_000, 100_000_000);
    expect(thirdTier.charge_micros).toBe(10_000_000);
    expect(thirdTier.price_tier_eur_per_million).toBe(10);
  });

  it("prevents negative wallet balance", async () => {
    await creditWallet(
      buildWalletDeltaInput({
        account_id: "acct_1",
        amount_micros: 5_000_000,
        source: "test",
        type: "topup_credit",
      })
    );

    const denied = await debitWallet(
      buildWalletDeltaInput({
        account_id: "acct_1",
        amount_micros: 6_000_000,
        source: "test",
        type: "usage_debit",
      })
    );
    expect(denied.ok).toBe(false);

    const allowed = await debitWallet(
      buildWalletDeltaInput({
        account_id: "acct_1",
        amount_micros: 3_000_000,
        source: "test",
        type: "usage_debit",
      })
    );
    expect(allowed.ok).toBe(true);

    const wallet = await getWalletBalance("acct_1");
    expect(wallet.balance_micros).toBe(2_000_000);
  });

  it("stores and replays prepaid idempotency", async () => {
    const acquired = await beginPrepaidIdempotency("acct_1", "idem-1", "hash-a");
    expect(acquired.status).toBe("acquired");

    await completePrepaidIdempotency("acct_1", "idem-1", "hash-a", {
      billable_chars: 1000,
      charge_micros: 15_000,
      price_tier_eur_per_million: 15,
      request_id: "req-1",
      wallet_balance_micros_after: 9_985_000,
    });

    const replay = await beginPrepaidIdempotency("acct_1", "idem-1", "hash-a");
    expect(replay.status).toBe("replay");
    if (replay.status === "replay") {
      expect(replay.response.request_id).toBe("req-1");
    }

    const conflict = await beginPrepaidIdempotency("acct_1", "idem-1", "hash-b");
    expect(conflict.status).toBe("conflict");

    await abortPrepaidIdempotency("acct_1", "idem-2");
  });

  it("updates monthly prepaid summary and transaction list", async () => {
    await creditWallet(
      buildWalletDeltaInput({
        account_id: "acct_2",
        amount_micros: 10_000_000,
        source: "stripe_checkout",
        stripe_ref: "cs_test_1",
        type: "topup_credit",
      })
    );

    const debit = await debitWallet(
      buildWalletDeltaInput({
        account_id: "acct_2",
        amount_micros: 2_000_000,
        meta: { chars: 200_000, count_in_summary: false },
        request_id: "req_tts_1",
        source: "tts_api",
        type: "usage_debit",
      })
    );
    expect(debit.ok).toBe(true);

    await registerSuccessfulUsageSummary({
      account_id: "acct_2",
      chars: 200_000,
      charge_micros: 2_000_000,
    });

    const summary = await getPrepaidBillingSummary("acct_2");
    expect(summary.currency).toBe("EUR");
    expect(summary.topups_eur).toBe(10);
    expect(summary.usage_eur).toBe(2);
    expect(summary.chars).toBe(200_000);
    expect(summary.requests).toBe(1);
    expect(summary.wallet_balance_eur).toBe(8);

    const page = await listWalletTransactions("acct_2", { limit: 10 });
    expect(page.transactions.length).toBeGreaterThanOrEqual(2);
  });

  it("validates auto-recharge config constraints", async () => {
    const defaults = await getAutoRechargeConfig("acct_3");
    expect(defaults.enabled).toBe(false);
    expect(defaults.status).toBe("disabled");

    await expect(
      setAutoRechargeConfig("acct_3", {
        amount_eur: 4,
        enabled: true,
        trigger_eur: 1,
      })
    ).rejects.toThrow("invalid_auto_recharge_amount");

    await expect(
      setAutoRechargeConfig("acct_3", {
        amount_eur: 10,
        enabled: true,
        trigger_eur: 10,
      })
    ).rejects.toThrow("invalid_auto_recharge_trigger");

    const updated = await setAutoRechargeConfig("acct_3", {
      amount_eur: 10,
      enabled: true,
      trigger_eur: 2,
    });
    expect(updated.amount_eur).toBe(10);
    expect(updated.trigger_eur).toBe(2);
    expect(updated.enabled).toBe(true);
  });

  it("tracks webhook event processing lifecycle", async () => {
    expect(await beginStripeEventProcessing("evt_1")).toBe("acquired");
    expect(await beginStripeEventProcessing("evt_1")).toBe("processing");

    await completeStripeEventProcessing("evt_1");
    expect(await beginStripeEventProcessing("evt_1")).toBe("processed");

    expect(await beginStripeEventProcessing("evt_2")).toBe("acquired");
    await abortStripeEventProcessing("evt_2");
    expect(await beginStripeEventProcessing("evt_2")).toBe("acquired");
  });

  it("applies only refund deltas for cumulative refunded amounts", async () => {
    expect(await consumeRefundDeltaMicros("ch_1", 1_000_000)).toBe(1_000_000);
    expect(await consumeRefundDeltaMicros("ch_1", 1_000_000)).toBe(0);
    expect(await consumeRefundDeltaMicros("ch_1", 1_500_000)).toBe(500_000);
  });
});
