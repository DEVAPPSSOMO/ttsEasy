import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isApiVariant } from "@/lib/appVariant";
import {
  ensurePortalAccountForOwner,
  getPortalAccountByOwnerUserId,
} from "@/lib/portalStore";
import {
  getAuthUser,
  isSupabaseConfigured,
  refreshAuthSession,
  sendMagicLinkEmail,
  type SupabaseAuthSession,
  verifyMagicLinkToken,
} from "@/lib/supabase/server";
import { PortalAccount, PortalUser } from "@/lib/types";

const ACCESS_COOKIE_NAME = "tts_portal_access_token";
const REFRESH_COOKIE_NAME = "tts_portal_refresh_token";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

interface SessionTokens {
  access_token: string;
  refresh_token: string;
}

export interface PortalSession {
  account: PortalAccount;
  user: PortalUser;
}

export interface PortalSessionLookup {
  refreshed_tokens: SessionTokens | null;
  session: PortalSession | null;
}

export interface PortalAuthSuccess {
  refreshed_tokens: SessionTokens | null;
  session: PortalSession;
}

function secureCookieEnabled(): boolean {
  return process.env.NODE_ENV === "production";
}

function parseCookieTokens(input: {
  accessToken?: string | null;
  refreshToken?: string | null;
}): SessionTokens | null {
  const access = input.accessToken?.trim() || "";
  const refresh = input.refreshToken?.trim() || "";
  if (!access || !refresh) {
    return null;
  }
  return {
    access_token: access,
    refresh_token: refresh,
  };
}

function fromAuthSession(session: SupabaseAuthSession): SessionTokens {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  };
}

function setSessionCookies(response: NextResponse, tokens: SessionTokens): void {
  response.cookies.set({
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE_SECONDS,
    name: ACCESS_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure: secureCookieEnabled(),
    value: tokens.access_token,
  });
  response.cookies.set({
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE_SECONDS,
    name: REFRESH_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure: secureCookieEnabled(),
    value: tokens.refresh_token,
  });
}

export function clearPortalSessionCookies(response: NextResponse): void {
  response.cookies.set({
    expires: new Date(0),
    httpOnly: true,
    name: ACCESS_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure: secureCookieEnabled(),
    value: "",
  });
  response.cookies.set({
    expires: new Date(0),
    httpOnly: true,
    name: REFRESH_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure: secureCookieEnabled(),
    value: "",
  });
}

export function applyPortalSessionCookies(response: NextResponse, tokens: SessionTokens): void {
  setSessionCookies(response, tokens);
}

export function getPortalSessionTokensFromRequest(request: NextRequest): SessionTokens | null {
  return parseCookieTokens({
    accessToken: request.cookies.get(ACCESS_COOKIE_NAME)?.value,
    refreshToken: request.cookies.get(REFRESH_COOKIE_NAME)?.value,
  });
}

async function loadSessionFromTokens(tokens: SessionTokens): Promise<PortalSessionLookup> {
  const directUser = await getAuthUser(tokens.access_token);
  let activeTokens = tokens;
  let refreshed: SessionTokens | null = null;
  let user = directUser;

  if (!user) {
    try {
      const refreshedSession = await refreshAuthSession(tokens.refresh_token);
      activeTokens = fromAuthSession(refreshedSession);
      refreshed = activeTokens;
      user = await getAuthUser(activeTokens.access_token);
    } catch {
      return {
        refreshed_tokens: null,
        session: null,
      };
    }
  }

  if (!user) {
    return {
      refreshed_tokens: refreshed,
      session: null,
    };
  }

  const account = await getPortalAccountByOwnerUserId(user.id);
  if (!account) {
    return {
      refreshed_tokens: refreshed,
      session: null,
    };
  }

  return {
    refreshed_tokens: refreshed,
    session: {
      account,
      user: {
        email: user.email ?? null,
        id: user.id,
      },
    },
  };
}

export async function getPortalSessionFromRequest(request: NextRequest): Promise<PortalSessionLookup> {
  if (!isSupabaseConfigured()) {
    return {
      refreshed_tokens: null,
      session: null,
    };
  }

  const tokens = getPortalSessionTokensFromRequest(request);
  if (!tokens) {
    return {
      refreshed_tokens: null,
      session: null,
    };
  }

  return loadSessionFromTokens(tokens);
}

export async function requirePortalSessionFromRequest(
  request: NextRequest
): Promise<{ errorResponse: NextResponse | null; result: PortalAuthSuccess | null }> {
  const result = await getPortalSessionFromRequest(request);
  if (!result.session) {
    return {
      errorResponse: NextResponse.json({ error: "unauthorized_session" }, { status: 401 }),
      result: null,
    };
  }

  return {
    errorResponse: null,
    result: {
      refreshed_tokens: result.refreshed_tokens,
      session: result.session,
    },
  };
}

export async function getPortalSessionFromCookieStore(): Promise<PortalSession | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const store = cookies();
  const tokens = parseCookieTokens({
    accessToken: store.get(ACCESS_COOKIE_NAME)?.value,
    refreshToken: store.get(REFRESH_COOKIE_NAME)?.value,
  });

  if (!tokens) {
    return null;
  }

  const result = await loadSessionFromTokens(tokens);
  return result.session;
}

export async function sendPortalMagicLink(input: {
  email: string;
  email_redirect_to: string;
}): Promise<void> {
  if (!isApiVariant()) {
    throw new Error("portal_variant_disabled");
  }
  await sendMagicLinkEmail({
    email: input.email,
    emailRedirectTo: input.email_redirect_to,
  });
}

export async function completePortalLoginFromToken(input: {
  token_hash: string;
  type: string;
}): Promise<{ initial_api_key: string | null; tokens: SessionTokens }> {
  const session = await verifyMagicLinkToken({
    tokenHash: input.token_hash,
    type: input.type,
  });

  const user = session.user;
  if (!user?.id) {
    throw new Error("invalid_user");
  }

  const bootstrap = await ensurePortalAccountForOwner({
    email: user.email ?? null,
    user_id: user.id,
  });

  if (!bootstrap) {
    throw new Error("billing_db_disabled");
  }

  return {
    initial_api_key: bootstrap.initial_api_key,
    tokens: fromAuthSession(session),
  };
}

export function isPortalRuntimeEnabled(): boolean {
  return isApiVariant();
}
