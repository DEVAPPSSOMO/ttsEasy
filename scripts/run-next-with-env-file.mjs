#!/usr/bin/env node

import path from "path";
import { spawn } from "child_process";
import { loadEnvFiles, resolveEnvFile } from "./envFiles.mjs";

const ROOT = process.cwd();
const [command, envFileArg, ...restArgs] = process.argv.slice(2);
const supportedCommands = new Set(["build", "dev", "start"]);

if (!command || !supportedCommands.has(command)) {
  console.error("Usage: node scripts/run-next-with-env-file.mjs <dev|build|start> <env-file> [...args]");
  process.exit(2);
}

const envFile = envFileArg?.trim();
if (!envFile) {
  console.error("Missing env file argument.");
  process.exit(2);
}

const resolvedEnvFile = resolveEnvFile(ROOT, envFile);
const { env, loadedFiles } = loadEnvFiles({
  cwd: ROOT,
  extraFiles: [envFile],
});

const selectedFile = loadedFiles.find((entry) => entry.path === resolvedEnvFile);
if (!selectedFile?.exists) {
  console.error(`Env file not found: ${envFile}`);
  process.exit(1);
}

const nextBin = path.resolve(ROOT, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, command, ...restArgs], {
  cwd: ROOT,
  env,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
