import type { MetadataRoute } from "next";
import { getAppVariant } from "@/lib/appVariant";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";
  const variant = getAppVariant();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: variant === "api" ? ["/api/", "/dashboard/"] : "/api/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
