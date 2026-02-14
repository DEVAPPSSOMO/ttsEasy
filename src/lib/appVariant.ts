export type AppVariant = "public" | "api";

const DEFAULT_VARIANT: AppVariant = "public";

export function getAppVariant(): AppVariant {
  const raw = (process.env.APP_VARIANT ?? "").trim().toLowerCase();
  if (raw === "api") {
    return "api";
  }
  return DEFAULT_VARIANT;
}

export function isApiVariant(): boolean {
  return getAppVariant() === "api";
}

export function isPublicVariant(): boolean {
  return getAppVariant() === "public";
}
