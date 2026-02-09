import { NextRequest, NextResponse } from "next/server";
import { getDefaultLocale, languageFromLocale, normalizeLocale } from "@/lib/localeHeuristics";
import { getReaderOptions } from "@/lib/readers";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const localeParam = request.nextUrl.searchParams.get("locale");
  const normalizedLocale = normalizeLocale(localeParam ?? "en-US");
  const language = languageFromLocale(normalizedLocale);
  const locale = normalizedLocale || getDefaultLocale(language);

  const readers = getReaderOptions(locale);
  return NextResponse.json({ readers }, { status: 200 });
}
