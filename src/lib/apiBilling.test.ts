import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetApiBillingForTests,
  applyTrialToRequest,
  beginIdempotentRequest,
  buildUsageEvent,
  calculateInvoiceTotalUsd,
  calculateTieredChargeUsd,
  completeIdempotentRequest,
  countBillableCharsLegacy,
  getBillingSummary,
  getCollectionAttemptScheduleUtc,
  recordUsageEvent,
} from "@/lib/apiBilling";

describe("apiBilling", () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.API_BILLING_KEYS_JSON;
    delete process.env.API_BILLING_DEV_KEY;
    delete process.env.API_BILLING_TRIAL_CHARS;
    delete process.env.API_BILLING_INVOICE_MIN_USD;
    __resetApiBillingForTests();
  });

  it("counts billable chars including spaces and excluding <mark> tags", () => {
    const source = "<speak>Hello <mark name=\"m1\"/>world</speak>";
    const expected = "<speak>Hello world</speak>".length;
    expect(countBillableCharsLegacy(source)).toBe(expected);
  });

  it("applies trial chars before pricing", () => {
    process.env.API_BILLING_TRIAL_CHARS = "500000";
    __resetApiBillingForTests();
    const result = applyTrialToRequest(600_000, 100_000);
    expect(result.trial_remaining_before).toBe(400_000);
    expect(result.trial_applied).toBe(400_000);
    expect(result.billable_after_trial).toBe(200_000);
  });

  it("calculates tiered charges at boundaries", () => {
    const firstTier = calculateTieredChargeUsd(1_000_000, 0);
    expect(firstTier.chargeUsd).toBe(15);
    expect(firstTier.primaryTierUsdPerMillion).toBe(15);

    const crossing = calculateTieredChargeUsd(1_000_000, 19_500_000);
    expect(crossing.chargeUsd).toBe(13.5);
    expect(crossing.primaryTierUsdPerMillion).toBe(15);

    const thirdTier = calculateTieredChargeUsd(1_000_000, 100_000_000);
    expect(thirdTier.chargeUsd).toBe(10);
    expect(thirdTier.primaryTierUsdPerMillion).toBe(10);
  });

  it("applies invoice minimum only when there is usage", () => {
    expect(calculateInvoiceTotalUsd(0, 0, 5)).toBe(0);
    expect(calculateInvoiceTotalUsd(2.25, 1, 5)).toBe(5);
    expect(calculateInvoiceTotalUsd(12.8, 2, 5)).toBe(12.8);
  });

  it("handles idempotency acquire and replay", async () => {
    const acquired = await beginIdempotentRequest("acct_test", "idem-1", "hash-a");
    expect(acquired.status).toBe("acquired");

    await completeIdempotentRequest("acct_test", "idem-1", "hash-a", "req-1");

    const replay = await beginIdempotentRequest("acct_test", "idem-1", "hash-a");
    expect(replay.status).toBe("replay");
    expect(replay.request_id).toBe("req-1");

    const conflict = await beginIdempotentRequest("acct_test", "idem-1", "hash-b");
    expect(conflict.status).toBe("conflict");
  });

  it("builds monthly summary with daily aggregation", async () => {
    const e1 = buildUsageEvent({
      account_id: "acct_A",
      billable_chars: 1000,
      charge_usd: 0.015,
      chars: 1000,
      idempotency_key: "idem-1",
      key_id: "key_A",
      locale: "en-US",
      price_tier_usd_per_million: 15,
      request_id: "req-1",
      timestamp_utc: "2026-02-10T12:00:00.000Z",
      trial_chars_applied: 0,
      voice_tier: "standard",
    });
    const e2 = buildUsageEvent({
      account_id: "acct_A",
      billable_chars: 2000,
      charge_usd: 0.03,
      chars: 2500,
      idempotency_key: "idem-2",
      key_id: "key_A",
      locale: "en-US",
      price_tier_usd_per_million: 15,
      request_id: "req-2",
      timestamp_utc: "2026-02-11T12:00:00.000Z",
      trial_chars_applied: 500,
      voice_tier: "wavenet",
    });

    await recordUsageEvent(e1);
    await recordUsageEvent(e2);

    const summary = await getBillingSummary("acct_A", "2026-02");
    expect(summary.chars).toBe(3500);
    expect(summary.billable_chars).toBe(3000);
    expect(summary.trial_chars_applied).toBe(500);
    expect(summary.charge_usd).toBe(0.045);
    expect(summary.invoice_total_usd).toBe(5);
    expect(summary.daily).toHaveLength(2);
    expect(summary.collection_attempts_utc).toEqual([
      "2026-03-01T00:00:00.000Z",
      "2026-03-03T00:00:00.000Z",
      "2026-03-06T00:00:00.000Z",
    ]);
  });

  it("returns retry schedule for monthly collection", () => {
    expect(getCollectionAttemptScheduleUtc("2026-11")).toEqual([
      "2026-12-01T00:00:00.000Z",
      "2026-12-03T00:00:00.000Z",
      "2026-12-06T00:00:00.000Z",
    ]);
  });
});
