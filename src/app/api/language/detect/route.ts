import { NextRequest, NextResponse } from "next/server";
import { detectLanguageAndLocale } from "@/lib/language";
import { DetectLanguageRequest } from "@/lib/types";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: DetectLanguageRequest;
  try {
    payload = (await request.json()) as DetectLanguageRequest;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!payload?.text || typeof payload.text !== "string") {
    return NextResponse.json({ error: "text_required" }, { status: 400 });
  }

  const result = detectLanguageAndLocale(payload);
  return NextResponse.json(result, { status: 200 });
}
