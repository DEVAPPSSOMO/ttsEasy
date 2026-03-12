import { afterEach, describe, expect, it } from "vitest";
import {
  classifyVideoAdOutcome,
  getVideoAdGateClientConfig,
  isVideoAdGateClientEnabled,
  transitionVideoAdGateState,
} from "@/lib/videoAdGate";

describe("videoAdGate helpers", () => {
  const originalEnabled = process.env.NEXT_PUBLIC_VIDEO_AD_GATE_ENABLED;
  const originalProvider = process.env.NEXT_PUBLIC_VIDEO_AD_PROVIDER;
  const originalPublicMonetization = process.env.NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED;

  afterEach(() => {
    process.env.NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED = originalPublicMonetization;
    process.env.NEXT_PUBLIC_VIDEO_AD_GATE_ENABLED = originalEnabled;
    process.env.NEXT_PUBLIC_VIDEO_AD_PROVIDER = originalProvider;
  });

  it("remains client-enabled even when display monetization is off", () => {
    process.env.NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED = "false";
    process.env.NEXT_PUBLIC_VIDEO_AD_GATE_ENABLED = "true";
    process.env.NEXT_PUBLIC_VIDEO_AD_PROVIDER = "mock";

    expect(getVideoAdGateClientConfig()).toMatchObject({
      enabled: true,
      provider: "mock",
    });
    expect(isVideoAdGateClientEnabled()).toBe(true);
  });

  it("classifies blockers only when bait detection aligns with loader failure", () => {
    const result = classifyVideoAdOutcome({
      baitBlocked: true,
      callbacksReceived: false,
      providerMounted: false,
      providerOutcome: null,
      scriptLoadFailed: true,
      timedOut: false,
    });

    expect(result).toBe("blocked");
  });

  it("keeps no_fill when provider resolves without blocker signals", () => {
    const result = classifyVideoAdOutcome({
      baitBlocked: false,
      callbacksReceived: true,
      providerMounted: true,
      providerOutcome: "no_fill",
      scriptLoadFailed: false,
      timedOut: false,
    });

    expect(result).toBe("no_fill");
  });

  it("falls back to timeout without blocker evidence", () => {
    const result = classifyVideoAdOutcome({
      baitBlocked: false,
      callbacksReceived: false,
      providerMounted: true,
      providerOutcome: null,
      scriptLoadFailed: false,
      timedOut: true,
    });

    expect(result).toBe("timeout");
  });

  it("falls back to error when the adapter fails without blocker evidence", () => {
    const result = classifyVideoAdOutcome({
      baitBlocked: false,
      callbacksReceived: false,
      providerMounted: false,
      providerOutcome: null,
      scriptLoadFailed: true,
      timedOut: false,
    });

    expect(result).toBe("error");
  });

  it("transitions through the expected state machine", () => {
    let state = transitionVideoAdGateState("idle", "start_session");
    state = transitionVideoAdGateState(state, "session_ready");
    state = transitionVideoAdGateState(state, "ad_started");
    state = transitionVideoAdGateState(state, "skip_available");
    state = transitionVideoAdGateState(state, "ad_resolved");

    expect(state).toBe("tts_generating");
  });

  it("can jump into blocked and reset back to idle", () => {
    const blocked = transitionVideoAdGateState("ad_loading", "blocked");
    const reset = transitionVideoAdGateState(blocked, "reset");

    expect(blocked).toBe("blocked_adblock");
    expect(reset).toBe("idle");
  });
});
