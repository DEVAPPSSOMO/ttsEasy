import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 500;
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface SharePayload {
  text: string;
  locale: string;
  readerId: string;
  speed: number;
}

function validate(body: unknown): body is SharePayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Partial<SharePayload>;
  return (
    typeof b.text === "string" &&
    b.text.trim().length > 0 &&
    b.text.length <= MAX_TEXT_LENGTH &&
    typeof b.locale === "string" &&
    typeof b.readerId === "string" &&
    typeof b.speed === "number"
  );
}

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!validate(body)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "sharing_unavailable" }, { status: 503 });
  }

  const id = generateId();
  const data: SharePayload = {
    text: body.text.trim(),
    locale: body.locale,
    readerId: body.readerId,
    speed: body.speed,
  };

  await redis.set(`share:${id}`, JSON.stringify(data), { ex: TTL_SECONDS });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ttseasy.com";
  return NextResponse.json({ id, url: `${siteUrl}/s/${id}` });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "sharing_unavailable" }, { status: 503 });
  }

  const raw = await redis.get<string>(`share:${id}`);
  if (!raw) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  return NextResponse.json(data);
}
