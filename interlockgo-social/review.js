import http from "node:http";
import os from "node:os";
import { loadSecrets, listDrafts, readDraft, writeDraft, log } from "./lib/util.js";
import { publishDraft } from "./publish.js";

const env = loadSecrets();
const PORT = Number(env.REVIEW_PORT) || 4500;

function lanIp() {
  for (const iface of Object.values(os.networkInterfaces()).flat()) {
    if (iface && iface.family === "IPv4" && !iface.internal) return iface.address;
  }
  return "localhost";
}

function esc(s = "") {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function statusColor(s) {
  return { pending: "#b45309", approved: "#1d4ed8", posted: "#15803d", rejected: "#9ca3af" }[s] || "#333";
}

function page() {
  const stamps = listDrafts();
  const drafts = stamps.map(readDraft).filter(Boolean);
  const pending = drafts.filter((d) => d.status === "pending");

  const card = (d) => {
    const tags = (d.hashtags || []).join(" ");
    const editable = d.status === "pending";
    return `
    <div class="card">
      <div class="row">
        <span class="badge" style="background:${statusColor(d.status)}">${d.status}</span>
        <span class="date">${esc(d.date)} · ${esc(d.topicTheme || d.topicId || "")}</span>
      </div>
      <form method="POST" action="/save">
        <input type="hidden" name="date" value="${esc(d.date)}">
        <textarea name="caption" rows="8" ${editable ? "" : "readonly"}>${esc(d.caption)}</textarea>
        <input class="tags" name="hashtags" value="${esc(tags)}" ${editable ? "" : "readonly"} placeholder="space-separated hashtags">
        ${editable ? `<div class="actions">
          <button class="save" formaction="/save">Save edits</button>
          <button class="approve" formaction="/approve" onclick="return confirm('Post this to Facebook now?')">Approve &amp; Post</button>
          <button class="reject" formaction="/reject" onclick="return confirm('Reject and discard this draft?')">Reject</button>
        </div>` : (d.postId ? `<div class="meta">Posted · id ${esc(d.postId)}</div>` : "")}
      </form>
    </div>`;
  };

  return `<!doctype html><html><head><meta charset="utf8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Interlock Go — Post Review</title>
  <style>
    body{font-family:-apple-system,system-ui,sans-serif;max-width:680px;margin:0 auto;padding:16px;background:#f5f5f4;color:#1c1917}
    h1{font-size:20px} .sub{color:#78716c;font-size:13px;margin-bottom:16px}
    .card{background:#fff;border:1px solid #e7e5e4;border-radius:12px;padding:14px;margin-bottom:16px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
    .row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
    .badge{color:#fff;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;text-transform:uppercase;letter-spacing:.04em}
    .date{color:#57534e;font-size:13px}
    textarea,.tags{width:100%;box-sizing:border-box;font:inherit;border:1px solid #d6d3d1;border-radius:8px;padding:10px;margin-bottom:8px}
    textarea{resize:vertical;line-height:1.5}
    .actions{display:flex;gap:8px;flex-wrap:wrap}
    button{font:inherit;font-weight:600;border:0;border-radius:8px;padding:9px 14px;cursor:pointer}
    .save{background:#e7e5e4} .approve{background:#15803d;color:#fff} .reject{background:#fee2e2;color:#991b1b}
    .meta{color:#78716c;font-size:12px} .empty{color:#78716c}
  </style></head><body>
  <h1>Interlock Go — Post Review</h1>
  <div class="sub">${pending.length} pending · reachable on your network at http://${lanIp()}:${PORT}</div>
  ${drafts.length ? drafts.map(card).join("") : '<p class="empty">No drafts yet. Run <code>node generate.js</code>.</p>'}
  </body></html>`;
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const params = new URLSearchParams(body);
      resolve(Object.fromEntries(params));
    });
  });
}

function redirect(res) {
  res.writeHead(303, { Location: "/" });
  res.end();
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(page());
  }

  if (req.method === "POST") {
    const body = await parseBody(req);
    const draft = readDraft(body.date);
    if (!draft) {
      res.writeHead(404);
      return res.end("draft not found");
    }

    if (req.url === "/save") {
      draft.caption = body.caption ?? draft.caption;
      draft.hashtags = (body.hashtags || "").split(/\s+/).filter(Boolean);
      writeDraft(body.date, draft);
      log(`Edited draft ${body.date}.`);
      return redirect(res);
    }

    if (req.url === "/reject") {
      draft.status = "rejected";
      writeDraft(body.date, draft);
      log(`Rejected draft ${body.date}.`);
      return redirect(res);
    }

    if (req.url === "/approve") {
      // Persist any edits made in the same submit, then post.
      if (body.caption != null) draft.caption = body.caption;
      if (body.hashtags != null) draft.hashtags = body.hashtags.split(/\s+/).filter(Boolean);
      writeDraft(body.date, draft);
      try {
        await publishDraft(body.date);
      } catch (err) {
        log(`Approve/post failed for ${body.date}: ${err.message}`);
        res.writeHead(500, { "Content-Type": "text/plain" });
        return res.end(`Post failed: ${err.message}\n\nGo back and try again once fixed.`);
      }
      return redirect(res);
    }
  }

  res.writeHead(404);
  res.end("not found");
});

server.listen(PORT, () => {
  log(`Review dashboard at http://localhost:${PORT}  (LAN: http://${lanIp()}:${PORT})`);
});
