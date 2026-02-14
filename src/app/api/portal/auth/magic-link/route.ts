import { NextRequest, NextResponse } from "next/server";
import { isPortalRuntimeEnabled, sendPortalMagicLink } from "@/lib/portalAuth";

export const runtime = "nodejs";

interface MagicLinkRequest {
  email: string;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getRedirectBaseUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const protocol = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  return `${protocol}://${host}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isPortalRuntimeEnabled()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const email = (payload as Partial<MagicLinkRequest>)?.email?.trim().toLowerCase() || "";
  if (!isEmail(email)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const redirectBase = getRedirectBaseUrl(request);
  const callbackUrl = `${redirectBase}/auth/callback`;

  try {
    await sendPortalMagicLink({
      email,
      email_redirect_to: callbackUrl,
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "internal_error";
    if (message === "portal_variant_disabled") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
