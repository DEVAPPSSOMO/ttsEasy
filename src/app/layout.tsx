import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const gaId = process.env.NEXT_PUBLIC_GA_ID;
const adSenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export const metadata: Metadata = {
  description: "Paste text, detect language instantly, and convert it to speech with selectable readers.",
  title: "TTS Easy"
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body>
        {children}

        {gaId ? (
          <>
            {/* GA4 is loaded only when NEXT_PUBLIC_GA_ID is provided. */}
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
                // Reduce PII risk by anonymizing IPs at collection time.
                gtag('config', '${gaId}', { anonymize_ip: true });
              `}
            </Script>
          </>
        ) : null}

        {adSenseClient ? (
          // AdSense is loaded only when NEXT_PUBLIC_ADSENSE_CLIENT is provided.
          <Script
            async
            crossOrigin="anonymous"
            id="adsense-loader"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClient}`}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
