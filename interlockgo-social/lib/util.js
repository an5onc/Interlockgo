import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Minimal .env loader (no dependency). Reads KEY=VALUE lines from secrets.env.
export function loadSecrets() {
  const file = path.join(ROOT, "secrets.env");
  const env = {};
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      env[key] = val;
    }
  }
  // Real environment variables win over the file.
  return { ...env, ...process.env };
}

export function todayStamp(d = new Date()) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function draftsDir() {
  return path.join(ROOT, "drafts");
}

export function draftPath(stamp) {
  return path.join(draftsDir(), `${stamp}.json`);
}

export function readDraft(stamp) {
  const p = draftPath(stamp);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function writeDraft(stamp, draft) {
  fs.mkdirSync(draftsDir(), { recursive: true });
  fs.writeFileSync(draftPath(stamp), JSON.stringify(draft, null, 2));
}

export function listDrafts() {
  const dir = draftsDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort()
    .reverse();
}

export function log(msg) {
  const dir = path.join(ROOT, "logs");
  fs.mkdirSync(dir, { recursive: true });
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(path.join(dir, "agent.log"), line);
  process.stdout.write(line);
}
