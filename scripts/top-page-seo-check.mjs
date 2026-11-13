import fs from "node:fs";
import path from "node:path";
import { decodeEntities, metaContent } from "./seo-html.mjs";

const root = path.resolve(process.argv[2] ?? process.cwd());

// These lengths are editorial targets, not Google ranking requirements.
// Google has no preferred word count; concise contact/booking pages are valid.
// https://developers.google.com/search/docs/fundamentals/creating-helpful-content

const pages = [
  {
    file: "index.html",
    maxTitle: 60,
    maxDescription: 160,
    requireFavicon: true,
    requireOpenGraph: true,
    requireTitleH1Overlap: true,
  },
  {
    file: "appointments/index.html",
    maxTitle: 60,
    maxDescription: 160,
    requireFavicon: true,
    requireOpenGraph: true,
    requireTitleH1Overlap: true,
  },
  {
    file: "ault/index.html",
    maxTitle: 60,
    maxDescription: 160,
    requireFavicon: true,
    requireOpenGraph: true,
    requireTitleH1Overlap: true,
  },
  {
    file: "contactus/index.html",
    maxTitle: 60,
    maxDescription: 160,
    requireFavicon: true,
    requireOpenGraph: true,
    requireTitleH1Overlap: true,
  },
  {
    file: "evans/index.html",
    maxTitle: 60,
    maxDescription: 160,
    requireFavicon: true,
    requireOpenGraph: true,
    requireTitleH1Overlap: true,
  },
];

const failures = [];

const tokens = (value) =>
  new Set(
    value
      .toLowerCase()
      .replace(/&amp;/g, "&")
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 4)
  );

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page.file), "utf8");
  const title = decodeEntities(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const description = metaContent(html, "description");
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? "";

  if (!title) failures.push(`${page.file}: missing title tag.`);
  if (title.length > page.maxTitle) failures.push(`${page.file}: title is ${title.length} chars, expected <= ${page.maxTitle}.`);
  if (!description) failures.push(`${page.file}: missing meta description.`);
  if (description.length > page.maxDescription) {
    failures.push(`${page.file}: meta description is ${description.length} chars, expected <= ${page.maxDescription}.`);
  }
  if (page.requireTitleH1Overlap) {
    const titleWords = tokens(title);
    const h1Words = tokens(h1);
    const overlap = [...titleWords].filter((word) => h1Words.has(word));
    if (!h1) failures.push(`${page.file}: missing H1.`);
    if (h1 && overlap.length === 0) failures.push(`${page.file}: title and H1 share no meaningful terms.`);
  }
  if (page.requireFavicon && !/<link\s+rel="icon"/i.test(html)) failures.push(`${page.file}: missing favicon link.`);
  if (page.requireOpenGraph) {
    for (const property of ["og:title", "og:description", "og:type", "og:url", "og:image"]) {
      if (!html.includes(`property="${property}"`)) failures.push(`${page.file}: missing ${property}.`);
    }
    if (!html.includes('name="twitter:card"')) failures.push(`${page.file}: missing twitter:card.`);
  }
}

if (failures.length) {
  console.error(`Top page SEO check failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Top page SEO checks passed.");
