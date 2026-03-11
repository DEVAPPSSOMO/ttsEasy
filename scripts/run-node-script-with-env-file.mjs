#!/usr/bin/env node

import path from "path";
import { spawn } from "child_process";
import { loadEnvFiles, resolveEnvFile } from "./envFiles.mjs";

const ROOT = process.cwd();
const [envFileArg, scriptArg, ...scriptArgs] = process.argv.slice(2);

if (!envFileArg || !scriptArg) {
  console.error(
    "Usage: node scripts/run-node-script-with-env-file.mjs <env-file> <script-path> [...args]"
  );
  process.exit(2);
}

const resolvedEnvFile = resolveEnvFile(ROOT, envFileArg);
const { env, loadedFiles } = loadEnvFiles({
  cwd: ROOT,
  extraFiles: [envFileArg],
});

const selectedFile = loadedFiles.find((entry) => entry.path === resolvedEnvFile);
if (!selectedFile?.exists) {
  console.error(`Env file not found: ${envFileArg}`);
  process.exit(1);
}

const scriptPath = path.isAbsolute(scriptArg) ? scriptArg : path.resolve(ROOT, scriptArg);
const child = spawn(process.execPath, [scriptPath, ...scriptArgs], {
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
