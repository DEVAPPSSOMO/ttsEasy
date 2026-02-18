#!/usr/bin/env node

import fs from "fs";
import { spawnSync } from "child_process";

function usage() {
  console.error("Usage: node scripts/vercel-upsert-env.mjs <envFile> <environment> <key1,key2,...>");
  process.exit(2);
}

const envFile = process.argv[2];
const environment = process.argv[3] || "production";
const keysArg = process.argv[4];
if (!envFile || !keysArg) usage();

const wantedKeys = keysArg
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

const raw = fs.readFileSync(envFile, "utf8");
const vars = new Map();
for (const line of raw.split(/\r?\n/)) {
  if (!/^[A-Z0-9_]+=/.test(line)) continue;
  const idx = line.indexOf("=");
  const key = line.slice(0, idx);
  let value = line.slice(idx + 1);

  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      value = JSON.parse(value);
    } catch {
      value = value.slice(1, -1);
    }
  }

  vars.set(key, value);
}

for (const key of wantedKeys) {
  if (!vars.has(key)) {
    console.error(`Missing key in env file: ${key}`);
    process.exit(1);
  }

  const value = String(vars.get(key) ?? "");

  // Remove existing value if present (ignore errors when missing), then add.
  spawnSync("npx", ["vercel", "env", "rm", key, environment, "--yes"], {
    stdio: "ignore",
  });

  const add = spawnSync("npx", ["vercel", "env", "add", key, environment, "--yes"], {
    input: value,
    stdio: ["pipe", "pipe", "pipe"],
    encoding: "utf8",
  });

  if (add.status !== 0) {
    console.error(`Failed to set ${key}`);
    if (add.stdout) process.stderr.write(add.stdout);
    if (add.stderr) process.stderr.write(add.stderr);
    process.exit(add.status ?? 1);
  }

  process.stdout.write(`set ${key}\n`);
}
