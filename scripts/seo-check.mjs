import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignoredHtml = new Set(["index-old.html", "25b687b80068dd6d001afc4ae2abeac6.html"]);
const ignoredDirs = new Set([".git", "node_modules", "_site", "_pginfo", "js", "images", "files"]);

const pages = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".") continue;
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) walk(path.join(dir, entry.name));
      continue;
    }
    const rel = path.relative(root, path.join(dir, entry.name));
    if (entry.name === "index.html" && !ignoredHtml.has(rel)) pages.push(rel);
  }
}
walk(root);
pages.sort();

const failures = [];
const canonicalUrls = new Set();
const titleTexts = new Set();
const descriptions = new Set();

for (const rel of pages) {
  const html = fs.readFileSync(path.join(root, rel), "utf8");
  const page = rel === "index.html" ? "/" : `/${path.dirname(rel)}/`;
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim();
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i)?.[1]?.replace(/\s+/g, " ").trim();
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const noindex = /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*\bcontent=["'][^"']*\bnoindex\b/i.test(html);

  if (!title || title.length < 35 || title.length > 70) failures.push(`${rel}: title should be descriptive and 35-70 characters`);
  if (!description || description.length < 80 || description.length > 180) failures.push(`${rel}: meta description should be unique and 80-180 characters`);
  if (!canonical) failures.push(`${rel}: missing canonical URL`);
  if (!noindex && canonical && canonical !== `https://interlockgo.io${page}`) failures.push(`${rel}: canonical should be https://interlockgo.io${page}`);
  if (!h1) failures.push(`${rel}: missing H1`);
  if (title && titleTexts.has(title)) failures.push(`${rel}: duplicate title`);
  if (description && descriptions.has(description)) failures.push(`${rel}: duplicate meta description`);
  if (!noindex && canonical && canonicalUrls.has(canonical)) failures.push(`${rel}: duplicate canonical URL`);
  if (!/InterlockGo/i.test(html)) failures.push(`${rel}: missing InterlockGo brand term`);
  if (!/ignition interlock|interlock device|breathalyzer/i.test(html)) failures.push(`${rel}: missing core ignition interlock topic`);

  if (title) titleTexts.add(title);
  if (description) descriptions.add(description);
  if (!noindex && canonical) canonicalUrls.add(canonical);
}

const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>(https:\/\/interlockgo\.io\/[^<]*)<\/loc>/g)].map((m) => m[1]).sort();
const expectedUrls = pages
  .filter((rel) => {
    const html = fs.readFileSync(path.join(root, rel), "utf8");
    return !/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*\bcontent=["'][^"']*\bnoindex\b/i.test(html);
  })
  .map((rel) => rel === "index.html" ? "https://interlockgo.io/" : `https://interlockgo.io/${path.dirname(rel)}/`)
  .sort();
for (const url of sitemapUrls) {
  if (!expectedUrls.includes(url)) failures.push(`sitemap: stale URL ${url}`);
}
for (const url of expectedUrls) {
  if (!sitemapUrls.includes(url)) failures.push(`sitemap: missing URL ${url}`);
}
for (const date of sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date[1]) || Number.isNaN(Date.parse(date[1]))) {
    failures.push(`sitemap: invalid lastmod date ${date[1]}`);
  }
}

if (failures.length) {
  console.error(`SEO check failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`SEO check passed for ${pages.length} HTML pages and ${sitemapUrls.length} sitemap URLs.`);
