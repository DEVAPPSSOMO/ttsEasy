import { NextRequest, NextResponse } from "next/server";
import { LOCALES, DEFAULT_LOCALE, isValidLocale } from "@/lib/i18n/config";

const PUBLIC_FILE = /\.(.*)$/;

function getPreferredLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const preferred = acceptLanguage
    .split(",")
    .map((part) => {
      const [lang, q] = part.trim().split(";q=");
      return { lang: lang.trim().toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of preferred) {
    const twoLetter = lang.split("-")[0];
    if (isValidLocale(twoLetter)) return twoLetter;
  }

  return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest): NextResponse | undefined {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json" ||
    pathname === "/og-image.png" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return;
  }

  const segments = pathname.split("/");
  const maybeLocale = segments[1];

  if (isValidLocale(maybeLocale)) {
    return;
  }

  const locale = getPreferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|og-image.png|.*\\..*).*)"],
};
