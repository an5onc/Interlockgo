import { loadSecrets, readDraft, writeDraft, todayStamp, log } from "./lib/util.js";

const GRAPH = "https://graph.facebook.com/v21.0";

// Posts a text message to the Facebook Page feed. Returns the new post id.
export async function publishText(message) {
  const env = loadSecrets();
  const token = env.FB_PAGE_ACCESS_TOKEN;
  const pageId = env.FB_PAGE_ID;
  if (!token || !pageId) {
    throw new Error("Missing FB_PAGE_ACCESS_TOKEN or FB_PAGE_ID in secrets.env (see setup-meta.md).");
  }

  const res = await fetch(`${GRAPH}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: token }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`Facebook API error: ${JSON.stringify(data.error || data)}`);
  }
  return data.id;
}

function fullText(draft) {
  const tags = (draft.hashtags || []).map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ");
  return tags ? `${draft.caption}\n\n${tags}` : draft.caption;
}

// Publish a saved draft by date stamp and mark it posted.
export async function publishDraft(stamp) {
  const draft = readDraft(stamp);
  if (!draft) throw new Error(`No draft found for ${stamp}.`);
  const postId = await publishText(fullText(draft));
  draft.status = "posted";
  draft.postId = postId;
  draft.postedAt = new Date().toISOString();
  writeDraft(stamp, draft);
  log(`Posted draft ${stamp} to Facebook (post id: ${postId}).`);
  return postId;
}

// CLI: node publish.js [YYYY-MM-DD]
if (import.meta.url === `file://${process.argv[1]}`) {
  const stamp = process.argv[2] || todayStamp();
  publishDraft(stamp).catch((err) => {
    log(`Publish failed: ${err.message}`);
    process.exit(1);
  });
}
