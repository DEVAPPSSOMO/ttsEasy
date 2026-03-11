import {
  VIDEO_AD_GATE_SKIP_DELAY_SEC,
  type VideoAdController,
  type VideoAdGateProvider,
  type VideoAdMountOptions,
  type VideoAdOutcome,
} from "@/lib/videoAdGate";

declare global {
  interface Window {
    __ttsVideoAdGateProviders?: Record<string, VideoAdGateProvider>;
  }
}

const scriptLoaders = new Map<string, Promise<void>>();

function readMockConfig(tagUrl?: string): { durationMs: number; outcome: VideoAdOutcome; skipDelayMs: number } {
  if (!tagUrl) {
    return {
      durationMs: 8_000,
      outcome: "completed",
      skipDelayMs: VIDEO_AD_GATE_SKIP_DELAY_SEC * 1_000,
    };
  }

  const url = new URL(tagUrl, window.location.origin);
  const outcome = (url.searchParams.get("mockOutcome") ?? "completed") as VideoAdOutcome;
  const durationMs = Number(url.searchParams.get("mockDurationMs") ?? "8000");
  const skipDelayMs = Number(url.searchParams.get("mockSkipDelayMs") ?? `${VIDEO_AD_GATE_SKIP_DELAY_SEC * 1000}`);

  return {
    durationMs: Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 8_000,
    outcome,
    skipDelayMs: Number.isFinite(skipDelayMs) && skipDelayMs > 0 ? skipDelayMs : VIDEO_AD_GATE_SKIP_DELAY_SEC * 1_000,
  };
}

function createMockProvider(): VideoAdGateProvider {
  return {
    mount(options: VideoAdMountOptions): VideoAdController {
      const { durationMs, outcome, skipDelayMs } = readMockConfig(options.tagUrl);
      const root = document.createElement("div");
      root.className = "video-ad-gate-mock-player";
      root.innerHTML =
        `<div class="video-ad-gate-mock-frame">` +
        `<span>Mock video ad</span>` +
        `<strong>${outcome === "completed" ? "Autoplaying sample spot" : `Outcome: ${outcome}`}</strong>` +
        `</div>`;
      options.container.replaceChildren(root);

      let destroyed = false;
      let settled = false;
      let completionTimer: number | null = null;
      let skipTimer: number | null = null;

      const cleanup = (): void => {
        if (completionTimer) {
          window.clearTimeout(completionTimer);
        }
        if (skipTimer) {
          window.clearTimeout(skipTimer);
        }
      };

      const resolve = (nextOutcome: Exclude<VideoAdOutcome, "blocked" | "timeout">): void => {
        if (destroyed || settled) {
          return;
        }
        settled = true;
        cleanup();
        options.onOutcome(nextOutcome);
      };

      window.setTimeout(() => {
        if (destroyed || settled) {
          return;
        }
        options.onStart();
      }, 250);

      skipTimer = window.setTimeout(() => {
        if (destroyed || settled) {
          return;
        }
        options.onSkipAvailable();
      }, skipDelayMs);

      completionTimer = window.setTimeout(() => {
        const resolvedOutcome =
          outcome === "blocked" || outcome === "timeout" ? "error" : (outcome as Exclude<VideoAdOutcome, "blocked" | "timeout">);
        resolve(resolvedOutcome);
      }, durationMs);

      return {
        destroy: () => {
          destroyed = true;
          cleanup();
          options.container.replaceChildren();
        },
        skip: () => resolve("skipped"),
      };
    },
  };
}

async function loadScript(scriptUrl: string): Promise<void> {
  if (!scriptUrl) {
    return;
  }

  const existing = scriptLoaders.get(scriptUrl);
  if (existing) {
    return existing;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[data-video-ad-gate="${scriptUrl}"]`);
    if (existingScript?.dataset.loaded === "true") {
      resolve();
      return;
    }

    const script = existingScript ?? document.createElement("script");
    script.async = true;
    script.dataset.videoAdGate = scriptUrl;
    script.src = scriptUrl;

    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    });
    script.addEventListener("error", () => reject(new Error("video_ad_script_failed")));

    if (!existingScript) {
      document.head.appendChild(script);
    }
  });

  scriptLoaders.set(scriptUrl, promise);
  return promise;
}

export async function getVideoAdGateProvider(
  providerName: string,
  scriptUrl: string
): Promise<VideoAdGateProvider> {
  if (providerName === "mock") {
    return createMockProvider();
  }

  await loadScript(scriptUrl);

  const provider = window.__ttsVideoAdGateProviders?.[providerName];
  if (!provider) {
    throw new Error(`video_ad_provider_missing:${providerName}`);
  }

  return provider;
}
