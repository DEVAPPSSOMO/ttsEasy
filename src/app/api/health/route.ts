import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      service: "tts-easy",
      status: "ok",
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}
