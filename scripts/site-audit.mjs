import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error(`Site root is not a directory: ${root}`);
  process.exit(1);
}
const siteOrigin = "https://interlockgo.io";
const ignoredDirectories = new Set([
  ".git",
  ".github",
  ".claude",
  "_site",
  "_pginfo",
  "docs",
  "files",
  "images",
  "interlockgo-social",
  "lifesafer-hero-remotion",
  "node_modules",
]);
const ignoredFiles = new Set([
  "index-old.html",
  "25b687b80068dd6d001afc4ae2abeac6.html",
]);

const pages = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;

    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(root, absolutePath);

    if (entry.isDirectory()) {
      walk(absolutePath);
    } else if (entry.name === "index.html" && !ignoredFiles.has(relativePath)) {
      pages.push(relativePath);
    }
  }
}

walk(root);
pages.sort();

const failures = [];
const warnings = [];
const titles = new Map();
const descriptions = new Map();
const canonicals = new Map();

function addFinding(collection, file, message) {
  collection.push(`${file}: ${message}`);
}

function attr(tag, attribute) {
  const match = tag.match(
    new RegExp(`\\b${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  return match ? (match[1] ?? match[2] ?? match[3] ?? "") : null;
}

function firstMatch(html, expression) {
  return html.match(expression)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
}

function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|quot|apos|#\d+|#x[\da-f]+);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function routeFor(file) {
  return file === "index.html" ? "/" : `/${path.dirname(file)}/`;
}

function localTargetFor(file, reference) {
  const cleanReference = reference.split(/[?#]/)[0];
  if (!cleanReference) return null;

  return cleanReference.startsWith("/")
    ? path.join(root, cleanReference)
    : path.resolve(root, path.dirname(file), cleanReference);
}

function targetExists(target) {
  if (!fs.existsSync(target)) return false;
  return !fs.statSync(target).isDirectory() || fs.existsSync(path.join(target, "index.html"));
}

for (const file of pages) {
  const absolutePath = path.join(root, file);
  const html = fs.readFileSync(absolutePath, "utf8");
  const route = routeFor(file);
  const expectedCanonical = `${siteOrigin}${route}`;
  const robots = firstMatch(
    html,
    /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*\bcontent=["']([^"']*)["'][^>]*>/i,
  );
  const indexable = !/\bnoindex\b/i.test(robots);

  const title = firstMatch(html, /<title>([\s\S]*?)<\/title>/i);
  const description = firstMatch(
    html,
    /<meta\b(?=[^>]*\bname=["']description["'])[^>]*\bcontent=["']([^"']*)["'][^>]*>/i,
  );
  const canonical = firstMatch(
    html,
    /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["']([^"']*)["'][^>]*>/i,
  );

  if (!/<html\b[^>]*\blang=["'][a-z]{2}(?:-[A-Z]{2})?["']/i.test(html)) {
    addFinding(failures, file, "missing a valid html lang attribute");
  }
  if (!/<meta\b[^>]*\bname=["']viewport["']/i.test(html)) {
    addFinding(failures, file, "missing viewport metadata");
  }

  if (title.length < 35 || title.length > 70) {
    addFinding(failures, file, `title length is ${title.length}; expected 35-70 characters`);
  }
  if (titles.has(title)) {
    addFinding(failures, file, `duplicates the title in ${titles.get(title)}`);
  } else {
    titles.set(title, file);
  }

  if (description.length < 80 || description.length > 180) {
    addFinding(
      failures,
      file,
      `meta description length is ${description.length}; expected 80-180 characters`,
    );
  }
  if (descriptions.has(description)) {
    addFinding(failures, file, `duplicates the meta description in ${descriptions.get(description)}`);
  } else {
    descriptions.set(description, file);
  }

  if (indexable && canonical !== expectedCanonical) {
    addFinding(failures, file, `canonical should be ${expectedCanonical}`);
  }
  if (indexable && canonicals.has(canonical)) {
    addFinding(failures, file, `duplicates the canonical in ${canonicals.get(canonical)}`);
  } else if (indexable) {
    canonicals.set(canonical, file);
  }

  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1s.length !== 1) {
    addFinding(failures, file, `expected exactly one H1, found ${h1s.length}`);
  } else if (visibleText(h1s[0][1]).length < 10) {
    addFinding(warnings, file, "H1 is unusually short");
  }

  if (indexable) {
    for (const [property, expression] of [
      ["og:title", /<meta\b(?=[^>]*\bproperty=["']og:title["'])[^>]*\bcontent=["']([^"']+)["']/i],
      [
        "og:description",
        /<meta\b(?=[^>]*\bproperty=["']og:description["'])[^>]*\bcontent=["']([^"']+)["']/i,
      ],
      ["og:url", /<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*\bcontent=["']([^"']+)["']/i],
      ["og:image", /<meta\b(?=[^>]*\bproperty=["']og:image["'])[^>]*\bcontent=["']([^"']+)["']/i],
    ]) {
      if (!expression.test(html)) addFinding(warnings, file, `missing ${property} metadata`);
    }
    if (!/<meta\b(?=[^>]*\bname=["']twitter:card["'])/i.test(html)) {
      addFinding(warnings, file, "missing twitter:card metadata");
    }
  }

  const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  for (const id of duplicateIds) addFinding(failures, file, `duplicate id "${id}"`);

  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      addFinding(failures, file, `invalid JSON-LD (${error.message})`);
    }
  }

  for (const match of html.matchAll(/<(?:a|link|script|img|video|source|iframe)\b[^>]*>/gi)) {
    const tag = match[0];
    const reference = attr(tag, /^<a/i.test(tag) || /^<link/i.test(tag) ? "href" : "src");
    if (
      reference === null ||
      /^(?:https?:|mailto:|tel:|sms:|data:|javascript:|#)/i.test(reference)
    ) {
      continue;
    }

    const target = localTargetFor(file, reference);
    if (target && !targetExists(target)) {
      addFinding(failures, file, `broken local reference "${reference}"`);
    }
  }

  for (const match of html.matchAll(/<a\b[^>]*\bhref=["']#([^"']+)["'][^>]*>/gi)) {
    if (!ids.includes(match[1])) {
      addFinding(failures, file, `fragment link points to missing id "#${match[1]}"`);
    }
  }

  for (const match of html.matchAll(/<a\b[^>]*\btarget=["']_blank["'][^>]*>/gi)) {
    const relation = attr(match[0], "rel") ?? "";
    if (!/\bnoopener\b/i.test(relation)) {
      addFinding(failures, file, "target=_blank link is missing rel=noopener");
    }
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const image = match[0];
    if (attr(image, "alt") === null) addFinding(failures, file, "image is missing an alt attribute");
    if (attr(image, "width") === null || attr(image, "height") === null) {
      addFinding(warnings, file, `image lacks intrinsic width/height: ${attr(image, "src") ?? "unknown"}`);
    }
    if (
      attr(image, "loading") !== "lazy" &&
      !/\b(?:hero|logo|brand)\b/i.test(`${attr(image, "class") ?? ""} ${attr(image, "src") ?? ""}`)
    ) {
      addFinding(warnings, file, `non-critical image is not lazy-loaded: ${attr(image, "src") ?? "unknown"}`);
    }
  }

  for (const match of html.matchAll(/<iframe\b[^>]*>/gi)) {
    if (attr(match[0], "title") === null) addFinding(failures, file, "iframe is missing a title");
    if (attr(match[0], "loading") !== "lazy") addFinding(warnings, file, "iframe is not lazy-loaded");
  }

  const text = visibleText(html);
  const wordCount = text ? text.split(/\s+/).length : 0;
  if (wordCount > 1_500) {
    addFinding(warnings, file, `contains ${wordCount} visible words and may be too dense`);
  }
}

const sitemapPath = path.join(root, "sitemap.xml");
const sitemap = fs.readFileSync(sitemapPath, "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedIndexableUrls = pages
  .filter((file) => {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    return !/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*\bcontent=["'][^"']*\bnoindex\b/i.test(html);
  })
  .map((file) => `${siteOrigin}${routeFor(file)}`);

for (const url of sitemapUrls) {
  if (!expectedIndexableUrls.includes(url)) {
    addFinding(failures, "sitemap.xml", `contains a non-indexable or unknown URL: ${url}`);
  }
}
for (const url of expectedIndexableUrls) {
  if (!sitemapUrls.includes(url)) addFinding(failures, "sitemap.xml", `is missing ${url}`);
}

console.log(`Audited ${pages.length} HTML pages.`);
console.log(`Failures: ${failures.length}`);
for (const failure of failures) console.log(`  ERROR ${failure}`);
console.log(`Warnings: ${warnings.length}`);
for (const warning of warnings) console.log(`  WARN  ${warning}`);

if (failures.length > 0) process.exitCode = 1;
