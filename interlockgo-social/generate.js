import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  ROOT,
  todayStamp,
  readDraft,
  writeDraft,
  listDrafts,
  log,
} from "./lib/util.js";

const brand = fs.readFileSync(path.join(ROOT, "config", "brand.md"), "utf8");
const { topics } = JSON.parse(
  fs.readFileSync(path.join(ROOT, "config", "topics.json"), "utf8")
);

// Pick a topic, avoiding the ones used in the last few drafts.
function pickTopic() {
  const recent = listDrafts()
    .slice(0, 4)
    .map((s) => readDraft(s)?.topicId)
    .filter(Boolean);
  const fresh = topics.filter((t) => !recent.includes(t.id));
  const pool = fresh.length ? fresh : topics;
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildPrompt(topic) {
  return `You are the social media writer for Interlock Go NOCO. Write ONE Facebook post.

Follow this brand guide EXACTLY. The hard rules are non-negotiable:

${brand}

Today's topic: "${topic.theme}"
Guidance for this topic: ${topic.hint}

Write a single Facebook post. Text and emoji only (no image this time).
Respond with ONLY a JSON object, no markdown fences, no commentary, in this exact shape:
{
  "caption": "the full post text including emoji and a CTA, with line breaks as \\n",
  "hashtags": ["hashtag1", "hashtag2"]
}`;
}

function generateCaption(topic) {
  const prompt = buildPrompt(topic);
  // Shell out to the Claude Code CLI (uses your Max-plan auth, no API key needed).
  const raw = execFileSync(
    "claude",
    ["-p", prompt, "--output-format", "text"],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
  ).trim();

  // Be forgiving: extract the first {...} block if extra text slipped in.
  let jsonText = raw;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) jsonText = raw.slice(start, end + 1);

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`Could not parse Claude output as JSON:\n${raw}`);
  }
  if (!parsed.caption) throw new Error("Claude output had no caption field.");
  return parsed;
}

function main() {
  const stamp = process.argv[2] || todayStamp();
  const existing = readDraft(stamp);
  if (existing && existing.status !== "rejected" && !process.argv.includes("--force")) {
    log(`Draft for ${stamp} already exists (status: ${existing.status}). Use --force to regenerate.`);
    return;
  }

  const topic = pickTopic();
  log(`Generating ${stamp} on topic "${topic.id}"...`);
  const { caption, hashtags } = generateCaption(topic);

  const draft = {
    date: stamp,
    topicId: topic.id,
    topicTheme: topic.theme,
    caption,
    hashtags: hashtags || [],
    status: "pending", // pending -> approved | rejected | posted
    createdAt: new Date().toISOString(),
    imagePath: null, // reserved for later image support
  };
  writeDraft(stamp, draft);
  log(`Saved draft ${stamp} (topic: ${topic.id}). Review it in the dashboard.`);
}

main();
