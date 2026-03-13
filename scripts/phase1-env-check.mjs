#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { loadEnvFiles, resolveEnvFile } from "./envFiles.mjs";
import { buildPhase1EnvCheckResult } from "./phase1-env-check-lib.mjs";

const ROOT = process.cwd();
const OG_IMAGE = path.join(ROOT, "public", "og-image.png");

const variantArg = (process.argv[2] || "").trim().toLowerCase();
const envFileArg = (process.argv[3] || "").trim();
const { env, loadedFiles } = loadEnvFiles({
  cwd: ROOT,
  extraFiles: envFileArg ? [envFileArg] : [],
});
const variant = variantArg || (env.APP_VARIANT || "public").trim().toLowerCase();

if (!["public", "api"].includes(variant)) {
  console.error(`Unsupported variant: ${variant || "(empty)"}. Use \"public\" or \"api\".`);
  process.exit(2);
}

const selectedEnvFile = envFileArg ? resolveEnvFile(ROOT, envFileArg) : null;
const selected = selectedEnvFile
  ? loadedFiles.find((entry) => entry.path === selectedEnvFile)
  : null;
const result = buildPhase1EnvCheckResult({
  env,
  envFileExists: selected ? selected.exists : true,
  loadedFiles,
  ogImageExists: fs.existsSync(OG_IMAGE),
  selectedEnvFile: selectedEnvFile ? path.relative(ROOT, selectedEnvFile) : null,
  variant,
});

console.log(`\nPhase 1 environment check: ${variant.toUpperCase()}\n`);
console.log("Loaded env files:");
for (const source of loadedFiles) {
  console.log(`- ${path.relative(ROOT, source.path)}: ${source.exists ? "loaded" : "missing"}`);
}
console.log("");

if (result.missingRequired.length === 0) {
  console.log("Required vars: OK");
} else {
  console.log("Required vars: MISSING");
  for (const key of result.missingRequired) {
    console.log(`- ${key}`);
  }
}

if (result.missingRecommended.length === 0) {
  console.log("Recommended vars: OK");
} else {
  console.log("Recommended vars: missing (non-blocking)");
  for (const key of result.missingRecommended) {
    console.log(`- ${key}`);
  }
}

if (result.issues.length > 0) {
  console.log("Additional checks:");
  for (const issue of result.issues) {
    console.log(`- ${issue}`);
  }
}

if (result.missingRequired.length > 0 || result.issues.length > 0) {
  process.exit(1);
}

console.log("\nPhase 1 check passed. Ready for deployment.");
