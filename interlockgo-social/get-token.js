// Interactive helper: converts a short-lived user token into a long-lived,
// non-expiring Page token and writes it into secrets.env.
//
// Run:  node get-token.js
// You'll be prompted for your App ID, App Secret, and the short-lived user
// token from the Graph API Explorer. Nothing is sent anywhere except Meta.

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { ROOT } from "./lib/util.js";

const GRAPH = "https://graph.facebook.com/v21.0";
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, (a) => res(a.trim())));

async function getJSON(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(`${data.error.message} (code ${data.error.code})`);
  return data;
}

async function main() {
  const systemMode = process.argv.includes("--system");
  console.log("\n=== Interlock Go — Facebook token setup ===\n");

  let userToken;
  if (systemMode) {
    // System User tokens are already long-lived; no exchange needed.
    userToken = await ask("System User token (paste from Business settings): ");
  } else {
    const appId = await ask("App ID: ");
    const appSecret = await ask("App Secret: ");
    const shortToken = await ask("Short-lived user token (paste from Graph API Explorer): ");

    console.log("\n1/3 Exchanging for a long-lived user token...");
    const longLived = await getJSON(
      `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token` +
        `&client_id=${encodeURIComponent(appId)}` +
        `&client_secret=${encodeURIComponent(appSecret)}` +
        `&fb_exchange_token=${encodeURIComponent(shortToken)}`
    );
    userToken = longLived.access_token;
    console.log("    done.");
  }

  console.log(`${systemMode ? "1/2" : "2/3"} Fetching the Pages you manage...`);
  const accounts = await getJSON(
    `${GRAPH}/me/accounts?fields=name,id,access_token&access_token=${encodeURIComponent(userToken)}`
  );
  const pages = accounts.data || [];
  if (!pages.length) throw new Error("No Pages found for this account. Make sure you granted access to your Page.");

  let page;
  if (pages.length === 1) {
    page = pages[0];
    console.log(`    found: ${page.name} (${page.id})`);
  } else {
    console.log("\n    Pages found:");
    pages.forEach((p, i) => console.log(`      [${i + 1}] ${p.name} (${p.id})`));
    const choice = await ask("    Choose your Interlock Go Page number: ");
    page = pages[Number(choice) - 1];
    if (!page) throw new Error("Invalid choice.");
  }

  // System-user Pages may not include a per-Page token; the system-user token
  // itself can post to the Page, so fall back to it.
  const pageToken = page.access_token || userToken;

  console.log(`${systemMode ? "2/2" : "3/3"} Writing secrets.env...`);
  const envPath = path.join(ROOT, "secrets.env");
  let env = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf8")
    : fs.readFileSync(path.join(ROOT, "secrets.env.example"), "utf8");

  const setKey = (text, key, val) =>
    new RegExp(`^${key}=.*$`, "m").test(text)
      ? text.replace(new RegExp(`^${key}=.*$`, "m"), `${key}=${val}`)
      : text + `\n${key}=${val}\n`;

  env = setKey(env, "FB_PAGE_ACCESS_TOKEN", pageToken);
  env = setKey(env, "FB_PAGE_ID", page.id);
  fs.writeFileSync(envPath, env);

  console.log(`\n✅ Done. Saved Page token + ID for "${page.name}" to secrets.env.`);
  console.log("   The Page token from /me/accounts is long-lived (effectively non-expiring).");
  console.log("\nNext: test it with");
  console.log('   node -e "import(\'./publish.js\').then(m=>m.publishText(\'Interlock Go test post ✅\').then(id=>console.log(\'Posted:\',id)))"');
  rl.close();
}

main().catch((err) => {
  console.error("\n❌ " + err.message);
  rl.close();
  process.exit(1);
});
