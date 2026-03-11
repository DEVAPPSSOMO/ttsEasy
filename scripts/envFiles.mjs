import fs from "fs";
import path from "path";

function normalizeQuotedValue(rawValue) {
  if (rawValue.length < 2) {
    return rawValue;
  }

  const first = rawValue[0];
  const last = rawValue[rawValue.length - 1];
  if (first !== last || (first !== "\"" && first !== "'")) {
    return rawValue;
  }

  const inner = rawValue.slice(1, -1);
  if (first === "'") {
    return inner;
  }

  return inner
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, "\"")
    .replace(/\\\\/g, "\\");
}

export function parseEnvFile(content) {
  const env = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const normalized = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
    const separatorIndex = normalized.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = normalized.slice(0, separatorIndex).trim();
    const rawValue = normalized.slice(separatorIndex + 1).trim();
    if (!key) {
      continue;
    }

    env[key] = normalizeQuotedValue(rawValue);
  }

  return env;
}

export function resolveEnvFile(cwd, filePath) {
  if (!filePath) {
    return null;
  }
  return path.isAbsolute(filePath) ? filePath : path.resolve(cwd, filePath);
}

export function loadEnvFiles(input = {}) {
  const cwd = input.cwd ?? process.cwd();
  const extraFiles = Array.isArray(input.extraFiles) ? input.extraFiles : [];
  const baseEnv = input.baseEnv ?? process.env;
  const candidates = [".env", ".env.local", ...extraFiles].filter(Boolean);
  const loadedFiles = [];
  const seen = new Set();
  const fileEnv = {};

  for (const candidate of candidates) {
    const resolved = resolveEnvFile(cwd, candidate);
    if (!resolved || seen.has(resolved)) {
      continue;
    }
    seen.add(resolved);

    if (!fs.existsSync(resolved)) {
      loadedFiles.push({ exists: false, path: resolved });
      continue;
    }

    const content = fs.readFileSync(resolved, "utf8");
    Object.assign(fileEnv, parseEnvFile(content));
    loadedFiles.push({ exists: true, path: resolved });
  }

  return {
    env: { ...fileEnv, ...baseEnv },
    fileEnv,
    loadedFiles,
  };
}
