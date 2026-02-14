interface SupabaseAuthUser {
  id: string;
  email?: string | null;
}

interface SupabaseAuthSession {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
  user: SupabaseAuthUser;
}

interface SupabaseErrorResponse {
  code?: string;
  error?: string;
  msg?: string;
  message?: string;
}

interface SupabaseOtpRequestBody {
  email: string;
  create_user: boolean;
  email_redirect_to?: string;
}

interface SupabaseVerifyOtpRequestBody {
  token_hash: string;
  type: string;
}

interface SupabaseRefreshRequestBody {
  refresh_token: string;
}

function trimTrailingSlash(input: string): string {
  return input.endsWith("/") ? input.slice(0, -1) : input;
}

export function getSupabaseUrl(): string | null {
  const value =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    "";
  if (!value) return null;
  return trimTrailingSlash(value);
}

export function getSupabaseAnonKey(): string | null {
  const value =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";
  return value || null;
}

export function getSupabaseServiceRoleKey(): string | null {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
  return value || null;
}

function getRequiredSupabaseUrl(): string {
  const url = getSupabaseUrl();
  if (!url) {
    throw new Error("supabase_url_missing");
  }
  return url;
}

function getRequiredAnonKey(): string {
  const key = getSupabaseAnonKey();
  if (!key) {
    throw new Error("supabase_anon_key_missing");
  }
  return key;
}

function getRequiredServiceRoleKey(): string {
  const key = getSupabaseServiceRoleKey();
  if (!key) {
    throw new Error("supabase_service_role_key_missing");
  }
  return key;
}

function jsonHeaders(apiKey: string, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("apikey", apiKey);
  headers.set("content-type", "application/json");
  return headers;
}

async function parseSupabaseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const asJson = contentType.includes("application/json");
  if (!response.ok) {
    const payload = asJson
      ? ((await response.json().catch(() => ({}))) as SupabaseErrorResponse)
      : { message: await response.text().catch(() => "") };
    const message = payload.message || payload.msg || payload.error || payload.code || "supabase_request_failed";
    throw new Error(message);
  }

  if (!asJson) {
    return null as T;
  }
  return (await response.json()) as T;
}

async function fetchSupabase<T>(input: {
  path: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  accessToken?: string | null;
  useServiceRole?: boolean;
  extraHeaders?: HeadersInit;
}): Promise<T> {
  const baseUrl = getRequiredSupabaseUrl();
  const apiKey = input.useServiceRole ? getRequiredServiceRoleKey() : getRequiredAnonKey();
  const headers = jsonHeaders(apiKey, input.extraHeaders);
  if (input.accessToken) {
    headers.set("authorization", `Bearer ${input.accessToken}`);
  } else if (input.useServiceRole) {
    headers.set("authorization", `Bearer ${apiKey}`);
  }

  const response = await fetch(`${baseUrl}${input.path}`, {
    body: input.body ? JSON.stringify(input.body) : undefined,
    headers,
    method: input.method ?? "GET",
  });

  return parseSupabaseResponse<T>(response);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function isSupabaseServiceConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}

export async function sendMagicLinkEmail(input: {
  email: string;
  emailRedirectTo: string;
}): Promise<void> {
  const payload: SupabaseOtpRequestBody = {
    create_user: true,
    email: input.email,
    email_redirect_to: input.emailRedirectTo,
  };

  await fetchSupabase<null>({
    body: payload,
    method: "POST",
    path: "/auth/v1/otp",
  });
}

export async function verifyMagicLinkToken(input: {
  tokenHash: string;
  type: string;
}): Promise<SupabaseAuthSession> {
  const payload: SupabaseVerifyOtpRequestBody = {
    token_hash: input.tokenHash,
    type: input.type,
  };

  return fetchSupabase<SupabaseAuthSession>({
    body: payload,
    method: "POST",
    path: "/auth/v1/verify",
  });
}

export async function refreshAuthSession(refreshToken: string): Promise<SupabaseAuthSession> {
  const payload: SupabaseRefreshRequestBody = {
    refresh_token: refreshToken,
  };

  return fetchSupabase<SupabaseAuthSession>({
    body: payload,
    method: "POST",
    path: "/auth/v1/token?grant_type=refresh_token",
  });
}

export async function getAuthUser(accessToken: string): Promise<SupabaseAuthUser | null> {
  try {
    return await fetchSupabase<SupabaseAuthUser>({
      accessToken,
      method: "GET",
      path: "/auth/v1/user",
    });
  } catch {
    return null;
  }
}

export async function supabaseServiceRequest<T>(input: {
  path: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
}): Promise<T> {
  return fetchSupabase<T>({
    body: input.body,
    extraHeaders: input.headers,
    method: input.method,
    path: input.path,
    useServiceRole: true,
  });
}

export type { SupabaseAuthSession, SupabaseAuthUser };
