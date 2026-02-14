import { randomUUID } from "crypto";
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import {
  abortIdempotentRequest,
  applyTrialToRequest,
  beginIdempotentRequest,
  buildUsageEvent,
  calculateTieredChargeUsd,
  completeIdempotentRequest,
  countBillableCharsLegacy,
  getAccountMonthUsage,
  getQuotaError,
  recordUsageEvent,
  getUsageEvent,
  isCredentialUsable,
  normalizeRequestHashPayload,
  parseBearerApiKey,
  requiresBillingPayment,
  resolveApiCredential,
  type ApiCredential,
} from "@/lib/apiBilling";
import {
  abortPrepaidIdempotency,
  beginPrepaidIdempotency,
  buildWalletDeltaInput,
  calculateUsageChargeMicros,
  completePrepaidIdempotency,
  creditWallet,
  ensureRequestId,
  getAutoRechargeConfig,
  getMonthUsageSummary,
  getStripeCustomerIdByAccount,
  getWalletBalance,
  isPrepaidBillingEnabled,
  markAutoRechargeActive,
  markAutoRechargeFailure,
  microsToEuros,
  registerSuccessfulUsageSummary,
  setAutoRechargePaymentMethod,
  debitWallet,
} from "@/lib/prepaidBilling";
import { getStripeClient } from "@/lib/stripeClient";
import { getCachedAudio, setCachedAudio } from "@/lib/audioCache";
import { synthesizeTextToMp3 } from "@/lib/googleTts";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getReaderById } from "@/lib/readers";
import { touchApiKeyLastUsed } from "@/lib/portalStore";
import { ApiTtsRequest, ReaderId, TtsSpeed, UsageEvent } from "@/lib/types";

export const runtime = "nodejs";

const VALID_READER_IDS: ReaderId[] = ["claro", "natural", "expresivo"];
const VALID_SPEEDS: TtsSpeed[] = [0.75, 1, 1.25, 1.5, 2];

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-z0-9-]/gi, "_").toLowerCase();
}

function isValidReaderId(value: unknown): value is ReaderId {
  return typeof value === "string" && VALID_READER_IDS.includes(value as ReaderId);
}

function isValidSpeed(value: unknown): value is TtsSpeed {
  return typeof value === "number" && VALID_SPEEDS.includes(value as TtsSpeed);
}

function validateApiPayload(payload: unknown): payload is ApiTtsRequest {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  const candidate = payload as Partial<ApiTtsRequest>;
  if (!candidate.text || typeof candidate.text !== "string") {
    return false;
  }
  if (!candidate.locale || typeof candidate.locale !== "string") {
    return false;
  }
  if (!isValidReaderId(candidate.readerId)) {
    return false;
  }
  if (!isValidSpeed(candidate.speed)) {
    return false;
  }
  if (candidate.format && candidate.format !== "mp3") {
    return false;
  }
  return true;
}

function invalidApiKey(): NextResponse {
  return NextResponse.json({ error: "invalid_api_key" }, { status: 401 });
}

function billingRequired(credential: ApiCredential): NextResponse {
  return NextResponse.json(
    { billingStatus: credential.billing_status, error: "billing_required" },
    { status: 402 }
  );
}

function responseHeadersFromUsage(usage: UsageEvent, rateRemaining: number): Record<string, string> {
  return {
    "x-billable-chars": String(usage.chars),
    "x-estimated-charge-usd": usage.charge_usd.toFixed(6),
    "x-price-tier-usd-per-million": usage.price_tier_usd_per_million.toFixed(6),
    "x-rate-limit-remaining": String(Math.max(0, rateRemaining)),
    "x-request-id": usage.request_id,
    "x-trial-chars-applied": String(usage.trial_chars_applied),
  };
}

function responseHeadersFromPrepaidUsage(input: {
  billableChars: number;
  chargeMicros: number;
  priceTierEurPerMillion: number;
  rateRemaining: number;
  requestId: string;
  walletBalanceMicros: number;
}): Record<string, string> {
  return {
    "x-billable-chars": String(input.billableChars),
    "x-estimated-charge-eur": microsToEuros(input.chargeMicros).toFixed(6),
    "x-price-tier-eur-per-million": String(input.priceTierEurPerMillion),
    "x-rate-limit-remaining": String(Math.max(0, input.rateRemaining)),
    "x-request-id": input.requestId,
    "x-wallet-balance-eur": microsToEuros(input.walletBalanceMicros).toFixed(6),
  };
}

async function getAudioForRequest(payload: ApiTtsRequest & { text: string }): Promise<{
  audioBuffer: Buffer;
  fromCache: boolean;
}> {
  const cached = await getCachedAudio(payload.text, payload.locale, payload.readerId, payload.speed);
  if (cached) {
    return { audioBuffer: cached, fromCache: true };
  }

  const reader = getReaderById(payload.locale, payload.readerId);
  const audioBuffer = await synthesizeTextToMp3({
    locale: payload.locale,
    reader,
    speed: payload.speed,
    text: payload.text,
  });
  void setCachedAudio(payload.text, payload.locale, payload.readerId, payload.speed, audioBuffer);
  return { audioBuffer, fromCache: false };
}

function buildAudioResponse(params: {
  audioBuffer: Buffer;
  filename: string;
  fromCache: boolean;
  headers: Record<string, string>;
  idempotentReplay: boolean;
}): NextResponse {
  return new NextResponse(new Uint8Array(params.audioBuffer), {
    headers: {
      ...params.headers,
      "cache-control": "no-store",
      "content-disposition": `attachment; filename="${params.filename}"`,
      "content-length": String(params.audioBuffer.length),
      "content-type": "audio/mpeg",
      "x-audio-cache": params.fromCache ? "hit" : "miss",
      "x-idempotent-replay": params.idempotentReplay ? "true" : "false",
    },
    status: 200,
  });
}

async function tryAutoRecharge(input: {
  accountId: string;
  chargeMicros: number;
  requestHash: string;
}): Promise<{ attempted: boolean; succeeded: boolean }> {
  const config = await getAutoRechargeConfig(input.accountId);
  if (!config.enabled) {
    return { attempted: false, succeeded: false };
  }

  const wallet = await getWalletBalance(input.accountId);
  const triggerMicros = Math.round(config.trigger_eur * 1_000_000);
  if (wallet.balance_micros > triggerMicros) {
    return { attempted: false, succeeded: false };
  }

  const paymentMethodId = config.payment_method_id;
  const stripe = getStripeClient();
  const customerId = await getStripeCustomerIdByAccount(input.accountId);
  if (!stripe || !customerId || !paymentMethodId) {
    await markAutoRechargeFailure(input.accountId, "auto_recharge_not_configured");
    return { attempted: true, succeeded: false };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(config.amount_eur * 100),
        confirm: true,
        currency: "eur",
        customer: customerId,
        metadata: {
          account_id: input.accountId,
          topup_kind: "auto",
        },
        off_session: true,
        payment_method: paymentMethodId,
      },
      {
        idempotencyKey: `auto_topup:${input.accountId}:${input.requestHash.slice(0, 64)}`,
      }
    );

    if (paymentIntent.status !== "succeeded") {
      await markAutoRechargeFailure(input.accountId, `payment_intent_${paymentIntent.status}`);
      return { attempted: true, succeeded: false };
    }

    const amountMicros = Math.max(
      0,
      Math.floor(Number(paymentIntent.amount_received ?? paymentIntent.amount ?? 0) * 10_000)
    );
    if (amountMicros <= 0) {
      await markAutoRechargeFailure(input.accountId, "invalid_auto_topup_amount");
      return { attempted: true, succeeded: false };
    }

    const paymentMethodFromIntent =
      typeof paymentIntent.payment_method === "string"
        ? paymentIntent.payment_method
        : paymentIntent.payment_method?.id ?? null;
    if (paymentMethodFromIntent) {
      await setAutoRechargePaymentMethod(input.accountId, paymentMethodFromIntent);
    }

    await creditWallet(
      buildWalletDeltaInput({
        account_id: input.accountId,
        amount_micros: amountMicros,
        meta: {
          payment_intent_id: paymentIntent.id,
          topup_kind: "auto",
        },
        request_id: null,
        source: "stripe_auto_payment_intent",
        stripe_ref: paymentIntent.id,
        type: "auto_topup_credit",
      })
    );
    await markAutoRechargeActive(input.accountId);
    return { attempted: true, succeeded: true };
  } catch (error) {
    const message =
      error instanceof Stripe.errors.StripeError
        ? error.message
        : error instanceof Error
          ? error.message
          : "auto_recharge_failed";
    await markAutoRechargeFailure(input.accountId, message);
    return { attempted: true, succeeded: false };
  }
}

async function handlePrepaidPost(request: NextRequest): Promise<NextResponse> {
  const apiKey = parseBearerApiKey(request.headers.get("authorization"));
  const credential = await resolveApiCredential(apiKey);
  if (!credential || !isCredentialUsable(credential)) {
    return invalidApiKey();
  }
  void touchApiKeyLastUsed(credential.key_id);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!validateApiPayload(payload)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const text = payload.text.trim();
  if (!text) {
    return NextResponse.json({ error: "empty_text" }, { status: 400 });
  }

  const ip = getClientIp(request.headers);
  const rateLimit = await checkRateLimit(`${credential.key_id}:${ip}`, {
    maxRequests: credential.rate_limit_per_minute,
    prefix: "api-v1-tts",
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: rateLimit.retryAfterSec },
      {
        headers: {
          "retry-after": String(rateLimit.retryAfterSec),
          "x-rate-limit-remaining": String(Math.max(0, rateLimit.remaining)),
        },
        status: 429,
      }
    );
  }

  const cleanPayload: ApiTtsRequest & { text: string } = {
    ...payload,
    text,
  };

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
  const requestHash = normalizeRequestHashPayload(cleanPayload);
  let idempotencyAcquired = false;

  if (idempotencyKey) {
    const idem = await beginPrepaidIdempotency(credential.account_id, idempotencyKey, requestHash);
    if (idem.status === "conflict") {
      return NextResponse.json({ error: "idempotency_conflict" }, { status: 409 });
    }
    if (idem.status === "processing") {
      return NextResponse.json({ error: "idempotency_in_progress" }, { status: 409 });
    }
    if (idem.status === "replay") {
      try {
        const { audioBuffer, fromCache } = await getAudioForRequest(cleanPayload);
        return buildAudioResponse({
          audioBuffer,
          filename: sanitizeFilename(`tts-${cleanPayload.locale}-${Date.now()}.mp3`),
          fromCache,
          headers: responseHeadersFromPrepaidUsage({
            billableChars: idem.response.billable_chars,
            chargeMicros: idem.response.charge_micros,
            priceTierEurPerMillion: idem.response.price_tier_eur_per_million,
            rateRemaining: rateLimit.remaining,
            requestId: idem.response.request_id,
            walletBalanceMicros: idem.response.wallet_balance_micros_after,
          }),
          idempotentReplay: true,
        });
      } catch (error) {
        return NextResponse.json(
          {
            error: "tts_failed",
            message: error instanceof Error ? error.message : "unknown_error",
          },
          { status: 500 }
        );
      }
    }
    idempotencyAcquired = idem.status === "acquired";
  }

  const chars = countBillableCharsLegacy(cleanPayload.text);
  if (chars <= 0) {
    if (idempotencyAcquired && idempotencyKey) {
      await abortPrepaidIdempotency(credential.account_id, idempotencyKey);
    }
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const monthUsage = await getMonthUsageSummary(credential.account_id);
  if (getQuotaError(monthUsage.chars, chars, credential.monthly_hard_limit_chars)) {
    if (idempotencyAcquired && idempotencyKey) {
      await abortPrepaidIdempotency(credential.account_id, idempotencyKey);
    }
    return NextResponse.json(
      {
        currentChars: monthUsage.chars,
        error: "quota_exceeded",
        monthlyHardLimitChars: credential.monthly_hard_limit_chars,
      },
      { status: 429 }
    );
  }
  const pricing = calculateUsageChargeMicros(chars, monthUsage.chars);
  const requestId = ensureRequestId();

  let debitResult = await debitWallet(
    buildWalletDeltaInput({
      account_id: credential.account_id,
      amount_micros: pricing.charge_micros,
      meta: {
        chars,
        count_in_summary: false,
        locale: cleanPayload.locale,
        reader_id: cleanPayload.readerId,
      },
      request_id: requestId,
      source: "tts_api",
      stripe_ref: null,
      type: "usage_debit",
    })
  );

  if (!debitResult.ok) {
    const autoRecharge = await tryAutoRecharge({
      accountId: credential.account_id,
      chargeMicros: pricing.charge_micros,
      requestHash,
    });
    if (autoRecharge.succeeded) {
      debitResult = await debitWallet(
        buildWalletDeltaInput({
          account_id: credential.account_id,
          amount_micros: pricing.charge_micros,
          meta: {
            chars,
            count_in_summary: false,
            locale: cleanPayload.locale,
            reader_id: cleanPayload.readerId,
          },
          request_id: requestId,
          source: "tts_api",
          stripe_ref: null,
          type: "usage_debit",
        })
      );
    }
  }

  if (!debitResult.ok) {
    if (idempotencyAcquired && idempotencyKey) {
      await abortPrepaidIdempotency(credential.account_id, idempotencyKey);
    }
    const wallet = await getWalletBalance(credential.account_id);
    return NextResponse.json(
      {
        balance_eur: wallet.balance_eur,
        error: "insufficient_balance",
      },
      { status: 402 }
    );
  }

  try {
    const { audioBuffer, fromCache } = await getAudioForRequest(cleanPayload);

    await registerSuccessfulUsageSummary({
      account_id: credential.account_id,
      chars,
      charge_micros: pricing.charge_micros,
    });

    if (idempotencyAcquired && idempotencyKey) {
      await completePrepaidIdempotency(
        credential.account_id,
        idempotencyKey,
        requestHash,
        {
          billable_chars: chars,
          charge_micros: pricing.charge_micros,
          price_tier_eur_per_million: pricing.price_tier_eur_per_million,
          request_id: requestId,
          wallet_balance_micros_after: debitResult.balance_micros,
        }
      );
    }

    return buildAudioResponse({
      audioBuffer,
      filename: sanitizeFilename(`tts-${cleanPayload.locale}-${Date.now()}.mp3`),
      fromCache,
      headers: responseHeadersFromPrepaidUsage({
        billableChars: chars,
        chargeMicros: pricing.charge_micros,
        priceTierEurPerMillion: pricing.price_tier_eur_per_million,
        rateRemaining: rateLimit.remaining,
        requestId,
        walletBalanceMicros: debitResult.balance_micros,
      }),
      idempotentReplay: false,
    });
  } catch (error) {
    await creditWallet(
      buildWalletDeltaInput({
        account_id: credential.account_id,
        amount_micros: pricing.charge_micros,
        meta: {
          reason: "tts_generation_failed_rollback",
          request_id: requestId,
        },
        request_id: requestId,
        source: "tts_rollback",
        stripe_ref: null,
        type: "adjustment",
      })
    );

    if (idempotencyAcquired && idempotencyKey) {
      await abortPrepaidIdempotency(credential.account_id, idempotencyKey);
    }
    return NextResponse.json(
      {
        error: "tts_failed",
        message: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}

async function handleLegacyPost(request: NextRequest): Promise<NextResponse> {
  const apiKey = parseBearerApiKey(request.headers.get("authorization"));
  const credential = await resolveApiCredential(apiKey);
  if (!credential || !isCredentialUsable(credential)) {
    return invalidApiKey();
  }
  void touchApiKeyLastUsed(credential.key_id);
  if (requiresBillingPayment(credential)) {
    return billingRequired(credential);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!validateApiPayload(payload)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const text = payload.text.trim();
  if (!text) {
    return NextResponse.json({ error: "empty_text" }, { status: 400 });
  }

  const ip = getClientIp(request.headers);
  const rateLimit = await checkRateLimit(`${credential.key_id}:${ip}`, {
    maxRequests: credential.rate_limit_per_minute,
    prefix: "api-v1-tts",
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: rateLimit.retryAfterSec },
      {
        headers: {
          "retry-after": String(rateLimit.retryAfterSec),
          "x-rate-limit-remaining": String(Math.max(0, rateLimit.remaining)),
        },
        status: 429,
      }
    );
  }

  const cleanPayload: ApiTtsRequest & { text: string } = {
    ...payload,
    text,
  };

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
  const requestHash = normalizeRequestHashPayload(cleanPayload);
  let idempotencyAcquired = false;

  if (idempotencyKey) {
    const idem = await beginIdempotentRequest(credential.account_id, idempotencyKey, requestHash);
    if (idem.status === "conflict") {
      return NextResponse.json(
        { error: "idempotency_conflict" },
        { status: 409 }
      );
    }
    if (idem.status === "processing") {
      return NextResponse.json(
        { error: "idempotency_in_progress" },
        { status: 409 }
      );
    }
    if (idem.status === "replay" && idem.request_id) {
      const usage = await getUsageEvent(idem.request_id);
      if (!usage) {
        return NextResponse.json(
          { error: "idempotency_in_progress" },
          { status: 409 }
        );
      }
      try {
        const { audioBuffer, fromCache } = await getAudioForRequest(cleanPayload);
        return buildAudioResponse({
          audioBuffer,
          filename: sanitizeFilename(`tts-${cleanPayload.locale}-${Date.now()}.mp3`),
          fromCache,
          headers: responseHeadersFromUsage(usage, rateLimit.remaining),
          idempotentReplay: true,
        });
      } catch (error) {
        return NextResponse.json(
          {
            error: "tts_failed",
            message: error instanceof Error ? error.message : "unknown_error",
          },
          { status: 500 }
        );
      }
    }
    idempotencyAcquired = idem.status === "acquired";
  }

  const chars = countBillableCharsLegacy(cleanPayload.text);
  if (chars <= 0) {
    if (idempotencyAcquired && idempotencyKey) {
      await abortIdempotentRequest(credential.account_id, idempotencyKey);
    }
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const monthUsage = await getAccountMonthUsage(credential.account_id);
  if (getQuotaError(monthUsage.chars, chars, credential.monthly_hard_limit_chars)) {
    if (idempotencyAcquired && idempotencyKey) {
      await abortIdempotentRequest(credential.account_id, idempotencyKey);
    }
    return NextResponse.json(
      {
        currentChars: monthUsage.chars,
        error: "quota_exceeded",
        monthlyHardLimitChars: credential.monthly_hard_limit_chars,
      },
      { status: 429 }
    );
  }

  const trial = applyTrialToRequest(chars, monthUsage.trial_used_chars);
  const pricing = calculateTieredChargeUsd(
    trial.billable_after_trial,
    monthUsage.billable_chars
  );

  try {
    const { audioBuffer, fromCache } = await getAudioForRequest(cleanPayload);
    const reader = getReaderById(cleanPayload.locale, cleanPayload.readerId);
    const usage = buildUsageEvent({
      account_id: credential.account_id,
      billable_chars: trial.billable_after_trial,
      charge_usd: pricing.chargeUsd,
      chars,
      idempotency_key: idempotencyKey || null,
      key_id: credential.key_id,
      locale: cleanPayload.locale,
      price_tier_usd_per_million: pricing.primaryTierUsdPerMillion,
      request_id: randomUUID(),
      timestamp_utc: new Date().toISOString(),
      trial_chars_applied: trial.trial_applied,
      voice_tier: reader.tier,
    });

    await recordUsageEvent(usage);
    if (idempotencyAcquired && idempotencyKey) {
      await completeIdempotentRequest(
        credential.account_id,
        idempotencyKey,
        requestHash,
        usage.request_id
      );
    }

    return buildAudioResponse({
      audioBuffer,
      filename: sanitizeFilename(`tts-${cleanPayload.locale}-${Date.now()}.mp3`),
      fromCache,
      headers: responseHeadersFromUsage(usage, rateLimit.remaining),
      idempotentReplay: false,
    });
  } catch (error) {
    if (idempotencyAcquired && idempotencyKey) {
      await abortIdempotentRequest(credential.account_id, idempotencyKey);
    }
    return NextResponse.json(
      {
        error: "tts_failed",
        message: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (isPrepaidBillingEnabled()) {
    return handlePrepaidPost(request);
  }
  return handleLegacyPost(request);
}
