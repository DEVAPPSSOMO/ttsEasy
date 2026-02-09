"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSlotProps {
  className?: string;
  format?: string;
  slot?: string;
}

export function AdSlot({ className, format = "auto", slot }: AdSlotProps): JSX.Element | null {
  const adRef = useRef<HTMLModElement | null>(null);
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (!client || !slot || !adRef.current) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      trackEvent("ad_slot_view", { slot });
    } catch {
      // Ignore ad initialization runtime errors in local/dev environments.
    }
  }, [client, slot]);

  if (!client || !slot) {
    return (
      <div className={`ad-placeholder ${className ?? ""}`}>
        <span>Ad slot placeholder</span>
      </div>
    );
  }

  return (
    <ins
      aria-label="Advertisement"
      className={`adsbygoogle ${className ?? ""}`}
      data-ad-client={client}
      data-ad-format={format}
      data-ad-slot={slot}
      data-full-width-responsive="true"
      ref={adRef}
      style={{ display: "block" }}
    />
  );
}
