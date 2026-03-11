#!/usr/bin/env node

import { spawnSync } from "node:child_process";

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required deploy env var: ${name}`);
  }

  return value;
}

function getOptionalEnv(name) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function getFirstDefinedEnv(names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  throw new Error(`Missing required deploy env var: one of ${names.join(", ")}`);
}

function buildDeployArgs(project) {
  const args = [
    "--yes",
    "vercel@latest",
    "deploy",
    "--prod",
    "--yes",
    "--token",
    getRequiredEnv("VERCEL_TOKEN"),
    "--project",
    project,
  ];

  const scope = getOptionalEnv("VERCEL_SCOPE");
  if (scope) {
    args.push("--scope", scope);
  }

  return args;
}

function deployProject(label, project) {
  console.log(`\n==> Deploying ${label} (${project})`);

  const result = spawnSync("npx", buildDeployArgs(project), {
    stdio: "inherit",
    env: {
      ...process.env,
      CI: process.env.CI || "1",
      NO_COLOR: process.env.NO_COLOR || "1",
    },
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

try {
  const apiProject = getFirstDefinedEnv(["VERCEL_API_PROJECT", "VERCEL_API_PROJECT_ID"]);
  const publicProject = getFirstDefinedEnv(["VERCEL_PUBLIC_PROJECT", "VERCEL_PUBLIC_PROJECT_ID"]);

  deployProject("api", apiProject);
  deployProject("public", publicProject);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unable to resolve deploy configuration.");
  process.exit(1);
}
