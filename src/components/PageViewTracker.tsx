"use client";

import { useEffect } from "react";
import { trackLandingView, type PageType } from "@/lib/analytics";

interface PageViewTrackerProps {
  locale: string;
  pageType: PageType;
}

export function PageViewTracker({ locale, pageType }: PageViewTrackerProps): null {
  useEffect(() => {
    trackLandingView({ locale, pageType });
  }, [locale, pageType]);

  return null;
}
