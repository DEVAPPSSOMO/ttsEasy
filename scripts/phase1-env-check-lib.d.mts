export interface Phase1EnvCheckResult {
  issues: string[];
  loadedFiles: Array<{ exists: boolean; path: string }>;
  missingRecommended: string[];
  missingRequired: string[];
  recommended: string[];
  required: string[];
}

export interface BuildPhase1EnvCheckInput {
  env: Record<string, string | undefined>;
  envFileExists?: boolean;
  loadedFiles?: Array<{ exists: boolean; path: string }>;
  ogImageExists?: boolean;
  selectedEnvFile?: string | null;
  variant: "api" | "public";
}

export declare function buildPhase1EnvCheckResult(
  input: BuildPhase1EnvCheckInput
): Phase1EnvCheckResult;
