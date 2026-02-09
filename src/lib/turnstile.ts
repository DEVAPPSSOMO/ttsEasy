export interface TurnstileVerification {
  success: boolean;
  bypassed: boolean;
  errors: string[];
}

export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<TurnstileVerification> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      return { success: true, bypassed: true, errors: [] };
    }
    return { success: false, bypassed: false, errors: ["missing_secret"] };
  }

  if (!token) {
    return { success: false, bypassed: false, errors: ["missing_token"] };
  }

  const body = new URLSearchParams({
    secret,
    response: token
  });
  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    body,
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    method: "POST"
  });

  if (!response.ok) {
    return {
      success: false,
      bypassed: false,
      errors: [`http_${response.status}`]
    };
  }

  const data = (await response.json()) as {
    success: boolean;
    "error-codes"?: string[];
  };

  return {
    success: Boolean(data.success),
    bypassed: false,
    errors: data["error-codes"] ?? []
  };
}
