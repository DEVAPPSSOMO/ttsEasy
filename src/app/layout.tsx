import Script from "next/script";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const gaId = process.env.NEXT_PUBLIC_GA_ID;
const isApiVariant = (process.env.APP_VARIANT ?? "").trim().toLowerCase() === "api";
// Defaulted so AdSense ownership verification works even if the env var isn't set yet.
const adSenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-2239304413098384";
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
        {isApiVariant ? null : <link rel="preconnect" href="https://pagead2.googlesyndication.com" />}
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {isApiVariant ? null : <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />}
        <link rel="dns-prefetch" href="https://challenges.cloudflare.com" />
        <link rel="manifest" href="/manifest.json" />

        {isApiVariant ? null : (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClient}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={`${displayFont.variable} ${uiFont.variable}`}>
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

        {isApiVariant ? null : (
          <Script id="sw-register" strategy="afterInteractive">
            {`if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{})}`}
          </Script>
        )}
      </body>
    </html>
  );
}
