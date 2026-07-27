import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteOrigin = "https://interlockgo.io";
const maxArtifactBytes = 35 * 1024 * 1024;
const maxPublicFileBytes = 8 * 1024 * 1024;
const maxHeroVideoBytes = 2 * 1024 * 1024;
const maxSocialImageBytes = 250 * 1024;

const productionPages = [
  "index.html",
  "appointments/index.html",
  "ault/index.html",
  "contactus/index.html",
  "es/getstarted/index.html",
  "evans/index.html",
  "faq/index.html",
  "financing/index.html",
  "forms/index.html",
  "fort-collins/index.html",
  "getstarted/index.html",
  "greeley/index.html",
  "guardian/index.html",
  "hours/index.html",
  "johnstown/index.html",
  "lifesafer/index.html",
  "longmont/index.html",
  "loveland/index.html",
  "pricing-calculator/index.html",
  "privacy-policy/index.html",
  "review/index.html",
  "reviews/index.html",
  "service-areas/index.html",
  "sms-opt-in/index.html",
  "sms-terms/index.html",
  "timnath/index.html",
  "windsor/index.html",
];

const requiredSeeds = [
  ...productionPages,
  "index-old.html",
  "25b687b80068dd6d001afc4ae2abeac6.html",
  ".nojekyll",
  ".well-known/security.txt",
  "CNAME",
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
];

const requiredArtifactFiles = [
  ...requiredSeeds,
  "images/interlockgo-social.jpg",
  "images/guardian-hero-variants/guardian-local-trust.mp4",
];

const forbiddenArtifactPaths = [
  /^chromedriver$/i,
  /^files\/usermanual\.pdf$/i,
  /^images\/Interlockgo\.jpeg$/,
  /^images\/hero-frames\//i,
  /^images\/lifesafer-hero-variants\//i,
  /^interlockgo-social(?:\/|\.zip$)/i,
  /^lifesafer\/hero-variants\.html$/i,
  /^lifesafer-hero-remotion\//i,
  /^js\/vendor\/model-viewer/i,
  /(?:^|\/)(?:tesla_cybertruck|Tesla_Cybertruck)\.(?:glb|usdz)$/i,
  /\.(?:glb|usdz|hdr)$/i,
];

function usage(message) {
  if (message) console.error(message);
  console.error("Usage: node scripts/build-deploy.mjs --out <directory>");
  process.exit(1);
}

function parseOutputArgument() {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf("--out");
  if (outIndex === -1 || !args[outIndex + 1] || args.length !== 2) {
    usage("A single --out directory is required.");
  }

  const outputRoot = path.resolve(repositoryRoot, args[outIndex + 1]);
  const relativeOutput = path.relative(repositoryRoot, outputRoot);
  if (
    relativeOutput === "" ||
    relativeOutput.startsWith("..") ||
    path.isAbsolute(relativeOutput) ||
    relativeOutput === ".git" ||
    relativeOutput.startsWith(`.git${path.sep}`)
  ) {
    usage("The output directory must be a safe subdirectory of the repository.");
  }
  return outputRoot;
}

const outputRoot = parseOutputArgument();
const gitFilesResult = spawnSync("git", ["ls-files", "-z"], {
  cwd: repositoryRoot,
  encoding: "utf8",
});
const trackedPaths = gitFilesResult.status === 0
  ? new Set(gitFilesResult.stdout.split("\0").filter(Boolean))
  : new Set();
const trackedPathsByLowerCase = new Map(
  [...trackedPaths].map((trackedPath) => [trackedPath.toLowerCase(), trackedPath]),
);
const queue = [];
const queued = new Set();
const copied = new Map();
const caseInsensitiveDestinations = new Map();

function normalizeRelative(absolutePath) {
  return path.relative(repositoryRoot, absolutePath).split(path.sep).join("/");
}

function isInsideRepository(absolutePath) {
  const relative = path.relative(repositoryRoot, absolutePath);
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}

function isForbidden(relativePath) {
  return forbiddenArtifactPaths.some((expression) => expression.test(relativePath));
}

function assertExactCase(absolutePath, referencedBy) {
  const relative = path.relative(repositoryRoot, absolutePath);
  const gitRelative = relative.split(path.sep).join("/");
  if (trackedPaths.has(gitRelative)) return;
  const trackedCaseMatch = trackedPathsByLowerCase.get(gitRelative.toLowerCase());
  if (trackedCaseMatch) {
    throw new Error(
      `${referencedBy}: case mismatch references "${gitRelative}" but Git tracks "${trackedCaseMatch}"`,
    );
  }

  let current = repositoryRoot;
  for (const part of relative.split(path.sep)) {
    if (!fs.existsSync(current) || !fs.statSync(current).isDirectory()) break;
    const names = fs.readdirSync(current);
    if (!names.includes(part)) {
      const caseMatch = names.find((name) => name.toLowerCase() === part.toLowerCase());
      if (caseMatch) {
        throw new Error(
          `${referencedBy}: case mismatch references "${relative}" but repository contains "${path.join(path.dirname(relative), caseMatch)}"`,
        );
      }
      break;
    }
    current = path.join(current, part);
  }
}

function resolveReference(fromRelative, rawReference) {
  const trimmed = rawReference.trim();
  if (
    trimmed === "" ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("//") ||
    /^(?:data|mailto|tel|sms|javascript|blob):/i.test(trimmed)
  ) {
    return null;
  }

  let reference = trimmed.replace(/&amp;/g, "&");
  if (/^https?:/i.test(reference)) {
    const url = new URL(reference);
    if (url.origin !== siteOrigin) return null;
    reference = `${url.pathname}${url.search}${url.hash}`;
  }

  const cleanReference = decodeURIComponent(reference.split(/[?#]/)[0]);
  if (!cleanReference) return null;

  const candidate = cleanReference.startsWith("/")
    ? path.resolve(repositoryRoot, `.${cleanReference}`)
    : path.resolve(repositoryRoot, path.dirname(fromRelative), cleanReference);

  if (!isInsideRepository(candidate)) {
    throw new Error(`${fromRelative}: reference escapes the repository: "${rawReference}"`);
  }

  assertExactCase(candidate, fromRelative);
  if (!fs.existsSync(candidate)) {
    throw new Error(`${fromRelative}: broken local reference: "${rawReference}"`);
  }

  const target = fs.statSync(candidate).isDirectory() ? path.join(candidate, "index.html") : candidate;
  assertExactCase(target, fromRelative);
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    throw new Error(`${fromRelative}: local route has no index.html: "${rawReference}"`);
  }
  return target;
}

function enqueueAbsolute(absolutePath, referencedBy = "build seed") {
  const relativePath = normalizeRelative(absolutePath);
  if (!isInsideRepository(absolutePath)) {
    throw new Error(`${referencedBy}: path escapes the repository: "${absolutePath}"`);
  }
  assertExactCase(absolutePath, referencedBy);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    throw new Error(`${referencedBy}: missing required file: "${relativePath}"`);
  }
  if (isForbidden(relativePath)) {
    throw new Error(`${referencedBy}: prohibited source path is referenced: "${relativePath}"`);
  }

  const destinationKey = relativePath.toLowerCase();
  const conflictingPath = caseInsensitiveDestinations.get(destinationKey);
  if (conflictingPath && conflictingPath !== relativePath) {
    throw new Error(`Case-conflicting artifact paths: "${conflictingPath}" and "${relativePath}"`);
  }
  caseInsensitiveDestinations.set(destinationKey, relativePath);

  if (!queued.has(relativePath)) {
    queued.add(relativePath);
    queue.push(relativePath);
  }
}

function referencesFromHtml(contents) {
  const references = [];
  for (const match of contents.matchAll(/\b(?:href|src|poster)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    references.push(match[1] ?? match[2]);
  }
  for (const match of contents.matchAll(/\bsrcset\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const srcset = match[1] ?? match[2];
    for (const candidate of srcset.split(",")) references.push(candidate.trim().split(/\s+/)[0]);
  }
  for (const match of contents.matchAll(/https:\/\/interlockgo\.io(?:\/[^"'<>\\\s]*)?/gi)) {
    references.push(match[0]);
  }
  return references;
}

function referencesFromCss(contents) {
  const references = [];
  for (const match of contents.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]+))\s*\)/gi)) {
    references.push(match[1] ?? match[2] ?? match[3]);
  }
  for (const match of contents.matchAll(/@import\s+(?:"([^"]*)"|'([^']*)')/gi)) {
    references.push(match[1] ?? match[2]);
  }
  return references;
}

function copyAndDiscover(relativePath) {
  const source = path.join(repositoryRoot, relativePath);
  const destination = path.join(outputRoot, relativePath);
  const size = fs.statSync(source).size;
  if (size > maxPublicFileBytes) {
    throw new Error(`${relativePath}: ${size} bytes exceeds the 8 MB public-file limit`);
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  copied.set(relativePath, size);

  const extension = path.extname(relativePath).toLowerCase();
  if (extension !== ".html" && extension !== ".css") return;

  const contents = fs.readFileSync(source, "utf8");
  const references = extension === ".html"
    ? [...referencesFromHtml(contents), ...referencesFromCss(contents)]
    : referencesFromCss(contents);

  for (const reference of references) {
    const target = resolveReference(relativePath, reference);
    if (target) enqueueAbsolute(target, relativePath);
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function assertSpecialSize(relativePath, maximum, label) {
  const size = copied.get(relativePath);
  if (size === undefined) throw new Error(`${label} is missing from the artifact: ${relativePath}`);
  if (size > maximum) {
    throw new Error(`${label} is ${formatBytes(size)}; limit is ${formatBytes(maximum)}`);
  }
}

try {
  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(outputRoot, { recursive: true });

  for (const relativePath of requiredSeeds) {
    enqueueAbsolute(path.join(repositoryRoot, relativePath));
  }
  while (queue.length > 0) copyAndDiscover(queue.shift());

  for (const requiredPath of requiredArtifactFiles) {
    if (!copied.has(requiredPath)) throw new Error(`Required artifact file is missing: ${requiredPath}`);
  }
  for (const relativePath of copied.keys()) {
    if (isForbidden(relativePath)) throw new Error(`Prohibited path entered artifact: ${relativePath}`);
  }

  assertSpecialSize(
    "images/guardian-hero-variants/guardian-local-trust.mp4",
    maxHeroVideoBytes,
    "Guardian hero video",
  );
  assertSpecialSize("images/interlockgo-social.jpg", maxSocialImageBytes, "Social image");

  const manifest = [...copied.entries()].sort(([left], [right]) => left.localeCompare(right));
  const totalBytes = manifest.reduce((sum, [, size]) => sum + size, 0);
  if (totalBytes > maxArtifactBytes) {
    throw new Error(
      `Artifact is ${formatBytes(totalBytes)}; limit is ${formatBytes(maxArtifactBytes)}`,
    );
  }

  console.log(`Deploy manifest (${manifest.length} files):`);
  for (const [relativePath, size] of manifest) {
    console.log(`  ${formatBytes(size).padStart(9)}  ${relativePath}`);
  }
  console.log("");
  console.log("Size report:");
  console.log(`  Guardian hero video: ${formatBytes(copied.get("images/guardian-hero-variants/guardian-local-trust.mp4"))}`);
  console.log(`  Social image:         ${formatBytes(copied.get("images/interlockgo-social.jpg"))}`);
  console.log(`  Artifact total:       ${formatBytes(totalBytes)} / ${formatBytes(maxArtifactBytes)}`);
} catch (error) {
  console.error(`Deploy build failed: ${error.message}`);
  process.exit(1);
}
