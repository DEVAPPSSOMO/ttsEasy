import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { AdsterraSocialBar } from "@/components/AdsterraSocialBar";
import { getActiveAdProvider, getPrimaryAdProvider } from "@/lib/monetization";
import "./globals.css";

const gaId = process.env.NEXT_PUBLIC_GA_ID;
const isApiVariant = (process.env.APP_VARIANT ?? "").trim().toLowerCase() === "api";
const activeAdProvider = getActiveAdProvider();
const primaryAdProvider = getPrimaryAdProvider();
const adSenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const ethicalAdsPublisher = process.env.NEXT_PUBLIC_ETHICALADS_PUBLISHER;
const adsterraSocialBarSnippet = process.env.ADSTERRA_SOCIAL_BAR_SNIPPET;
const shouldLoadAdSense = !isApiVariant && activeAdProvider === "adsense" && Boolean(adSenseClient);
const shouldLoadEthicalAds = !isApiVariant && activeAdProvider === "ethicalads" && Boolean(ethicalAdsPublisher);
const displayFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
});
const uiFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        {shouldLoadAdSense ? <link rel="preconnect" href="https://pagead2.googlesyndication.com" /> : null}
        {shouldLoadEthicalAds ? <link rel="preconnect" href="https://media.ethicalads.io" /> : null}
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {shouldLoadAdSense ? <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" /> : null}
        {shouldLoadEthicalAds ? <link rel="dns-prefetch" href="https://media.ethicalads.io" /> : null}
        <link rel="dns-prefetch" href="https://challenges.cloudflare.com" />
        <link rel="manifest" href="/manifest.json" />

        {shouldLoadAdSense ? (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClient}`}
            crossOrigin="anonymous"
          />
        ) : null}

        {shouldLoadEthicalAds ? (
          <script async src="https://media.ethicalads.io/media/client/ethicalads.min.js" />
        ) : null}
      </head>
      <body
        className={`${displayFont.variable} ${uiFont.variable}`}
        data-ad-provider-active={activeAdProvider}
        data-ad-provider-primary={primaryAdProvider}
      >
        {children}

        {gaId ? (
          <>
            <Script
              id="ga-loader"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${gaId}', { anonymize_ip: true });
              `}
            </Script>
          </>
        ) : null}

        {!isApiVariant && activeAdProvider === "adsterra" ? (
          <AdsterraSocialBar snippet={adsterraSocialBarSnippet} />
        ) : null}

        {isApiVariant ? null : (
          <Script id="sw-register" strategy="afterInteractive">
            {`if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{})}`}
          </Script>
        )}

        {isApiVariant ? null : <Analytics />}
      </body>
    </html>
  );
}
