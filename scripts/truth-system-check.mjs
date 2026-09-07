import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { serializePublicPayloads } from "./build-truth-public.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const warnings = [];

const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot, encoding: "utf8" });
const remoteMain = spawnSync("git", ["rev-parse", "origin/main"], { cwd: repositoryRoot, encoding: "utf8" });
const ancestor = spawnSync("git", ["merge-base", "--is-ancestor", "HEAD", "origin/main"], { cwd: repositoryRoot });
const changed = spawnSync("git", ["diff", "--name-only", "HEAD", "--"], { cwd: repositoryRoot, encoding: "utf8" });
const checkoutIsBehind = head.status === 0
  && remoteMain.status === 0
  && ancestor.status === 0
  && head.stdout.trim() !== remoteMain.stdout.trim();
const locallyChangedFiles = new Set(changed.status === 0 ? changed.stdout.trim().split("\n").filter(Boolean) : []);

const allowedClassifications = new Set(["public", "staff-only", "restricted"]);
const allowedAnswerStatuses = new Set(["draft", "approved", "outdated", "retired"]);
const allowedFactStatuses = new Set(["confirmed", "published-unverified", "needs-owner-confirmation", "external-conflict", "retired"]);
const allowedAuthority = new Set(["1-colorado-dmv", "2-provider", "3-interlockgo-policy", "4-verified-technician", "5-topic-signal"]);
const regulatoryCategories = new Set([
  "dmv-paperwork",
  "sr22",
  "installation-reporting",
  "eligibility",
  "removal",
  "early-removal",
  "vehicle-access",
  "license-restoration",
  "individualized-notice",
  "financial-assistance",
]);

function rel(file) {
  return path.relative(repositoryRoot, file).split(path.sep).join("/");
}

function readJson(relativePath) {
  const file = path.join(repositoryRoot, relativePath);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    failures.push(`${relativePath}: invalid or unreadable JSON (${error.message})`);
    return null;
  }
}

function requireFields(record, fields, label) {
  for (const field of fields) {
    if (!(field in record)) failures.push(`${label}: missing required field ${field}`);
  }
}

function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function checkReviewDates(record, label) {
  for (const field of ["effectiveDate", "lastReviewedDate", "nextReviewDate"]) {
    if (!validDate(record[field])) failures.push(`${label}: ${field} must be an ISO date`);
  }
  if (validDate(record.lastReviewedDate) && validDate(record.nextReviewDate) && record.nextReviewDate <= record.lastReviewedDate) {
    failures.push(`${label}: nextReviewDate must be after lastReviewedDate`);
  }
  const today = new Date().toISOString().slice(0, 10);
  if (record.status === "approved" && validDate(record.nextReviewDate) && record.nextReviewDate < today) {
    failures.push(`${label}: approved record review expired on ${record.nextReviewDate}`);
  }
}

function checkSources(sources, label) {
  if (!Array.isArray(sources) || sources.length === 0) {
    failures.push(`${label}: at least one source is required`);
    return;
  }
  for (const [index, source] of sources.entries()) {
    const sourceLabel = `${label} source ${index + 1}`;
    requireFields(source, ["title", "url", "authorityLevel", "verifiedOn"], sourceLabel);
    if (!/^https:\/\//.test(source.url ?? "")) failures.push(`${sourceLabel}: URL must use HTTPS`);
    if (!allowedAuthority.has(source.authorityLevel)) failures.push(`${sourceLabel}: unsupported authorityLevel ${source.authorityLevel}`);
    if (!validDate(source.verifiedOn)) failures.push(`${sourceLabel}: verifiedOn must be an ISO date`);
  }
  if (sources.every((source) => source.authorityLevel === "5-topic-signal")) {
    failures.push(`${label}: topic signals cannot be the only factual authority`);
  }
}

function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

function walkJson(value, visitor) {
  if (Array.isArray(value)) {
    for (const item of value) walkJson(item, visitor);
    return;
  }
  if (value && typeof value === "object") {
    visitor(value);
    for (const item of Object.values(value)) walkJson(item, visitor);
  }
}

function jsonLdObjects(html, file) {
  const objects = [];
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]);
      walkJson(parsed, (object) => objects.push(object));
    } catch (error) {
      failures.push(`${rel(file)}: invalid JSON-LD (${error.message})`);
    }
  }
  return objects;
}

function typeIncludes(object, expected) {
  const types = Array.isArray(object["@type"]) ? object["@type"] : [object["@type"]];
  return types.includes(expected);
}

function reportSiteIssue(relativeFile, message) {
  if (checkoutIsBehind && !locallyChangedFiles.has(relativeFile)) {
    warnings.push(`${relativeFile}: stale local source differs from deployed main (${message})`);
  } else {
    failures.push(`${relativeFile}: ${message}`);
  }
}

function expectedOpeningHours(hours) {
  return Object.entries(hours.regular)
    .filter(([, value]) => value)
    .map(([dayOfWeek, value]) => `${dayOfWeek}:${value.open}-${value.close}`)
    .sort();
}

function actualOpeningHours(specifications) {
  return specifications
    .flatMap((item) => {
      const days = Array.isArray(item.dayOfWeek) ? item.dayOfWeek : [item.dayOfWeek];
      return days.map((day) => `${String(day).split("/").at(-1)}:${item.opens}-${item.closes}`);
    })
    .sort();
}

function checkSchemas() {
  for (const schema of ["knowledge/schemas/business-facts.schema.json", "knowledge/schemas/answer-register.schema.json"]) {
    const parsed = readJson(schema);
    if (parsed && parsed["$schema"] !== "https://json-schema.org/draft/2020-12/schema") {
      failures.push(`${schema}: expected JSON Schema 2020-12`);
    }
  }
}

function checkBusinessFacts(facts) {
  if (!facts) return;
  requireFields(facts, [
    "schemaVersion", "recordId", "publicBusinessName", "ownershipContext", "address", "phones", "hours",
    "holidayExceptions", "supportedProviders", "supportedDeviceModels", "services", "serviceAreas",
    "appointmentMethods", "pricing", "legalAndRegulatoryLimitations", "lastReviewedDate", "nextReviewDate",
    "responsibleOwner",
  ], "business facts");
  if (facts.schemaVersion !== "1.0.0") failures.push("business facts: unsupported schemaVersion");
  if (!validDate(facts.lastReviewedDate) || !validDate(facts.nextReviewDate) || facts.nextReviewDate <= facts.lastReviewedDate) {
    failures.push("business facts: invalid catalog review dates");
  }

  const phoneIds = new Set();
  const phoneNumbers = new Set();
  for (const phone of facts.phones ?? []) {
    const label = `business phone ${phone.id ?? "unknown"}`;
    requireFields(phone, ["id", "numberE164", "display", "channels", "purpose", "provider", "status", "classification", "sources"], label);
    if (phoneIds.has(phone.id)) failures.push(`${label}: duplicate ID`);
    phoneIds.add(phone.id);
    const normalized = normalizePhone(phone.numberE164);
    if (normalized.length !== 10) failures.push(`${label}: invalid North American phone number`);
    if (phoneNumbers.has(normalized)) failures.push(`${label}: duplicate number`);
    phoneNumbers.add(normalized);
    if (!allowedFactStatuses.has(phone.status)) failures.push(`${label}: unsupported status ${phone.status}`);
    if (!allowedClassifications.has(phone.classification)) failures.push(`${label}: unsupported classification ${phone.classification}`);
    checkSources(phone.sources, label);
  }
  const primary = facts.phones?.find((phone) => phone.id === "shop-primary");
  if (!primary || primary.status !== "confirmed") failures.push("business facts: shop-primary must exist and be confirmed");
  if (facts.hours.status === "external-conflict" && !facts.hours.conflict) failures.push("business facts: conflicting hours require a conflict explanation");
  if (facts.pricing.status === "confirmed" && !validDate(facts.pricing.effectiveDate)) {
    failures.push("business facts: confirmed pricing requires an effectiveDate");
  }
  if (facts.pricing.status !== "confirmed" && facts.pricing.effectiveDate !== null) {
    warnings.push("business facts: unconfirmed pricing has a non-null effectiveDate");
  }
}

function checkAnswerRegister(register) {
  if (!register) return;
  requireFields(register, ["schemaVersion", "catalogId", "lastReviewedDate", "answers"], "answer register");
  if (!Array.isArray(register.answers) || register.answers.length < 30 || register.answers.length > 50) {
    failures.push(`answer register: expected 30-50 answers, found ${register.answers?.length ?? 0}`);
    return;
  }
  const ids = new Set();
  for (const answer of register.answers) {
    const label = `answer ${answer.id ?? "unknown"}`;
    requireFields(answer, [
      "id", "category", "customerWording", "alternateWording", "publicAnswer", "internalStaffAnswer", "sources",
      "applicability", "classification", "effectiveDate", "lastReviewedDate", "nextReviewDate", "owner", "approver",
      "approvedOn", "escalationDestination", "warning", "status", "publicationDestinations",
    ], label);
    if (!/^IG-[A-Z]+-\d{3}$/.test(answer.id ?? "")) failures.push(`${label}: invalid stable ID format`);
    if (ids.has(answer.id)) failures.push(`${label}: duplicate ID`);
    ids.add(answer.id);
    if (!allowedClassifications.has(answer.classification)) failures.push(`${label}: unsupported classification ${answer.classification}`);
    if (!allowedAnswerStatuses.has(answer.status)) failures.push(`${label}: unsupported status ${answer.status}`);
    if (answer.status === "approved" && (!answer.approver || !validDate(answer.approvedOn))) {
      failures.push(`${label}: approved records require approver and approvedOn`);
    }
    if (answer.status !== "approved" && (answer.approver !== null || answer.approvedOn !== null)) {
      failures.push(`${label}: non-approved records must not carry approval metadata`);
    }
    if (!Array.isArray(answer.alternateWording) || !Array.isArray(answer.applicability) || !Array.isArray(answer.publicationDestinations)) {
      failures.push(`${label}: alternateWording, applicability, and publicationDestinations must be arrays`);
    }
    checkReviewDates(answer, label);
    checkSources(answer.sources, label);
    if (regulatoryCategories.has(answer.category) && !answer.sources?.some((source) => source.authorityLevel === "1-colorado-dmv")) {
      failures.push(`${label}: regulated category requires a level-1 Colorado DMV source`);
    }
    if (answer.category === "pricing" && !/price|quote|estimate|cost/i.test(`${answer.warning} ${answer.publicAnswer}`)) {
      failures.push(`${label}: pricing answer must explicitly identify price/quote/estimate limitations`);
    }
    if (/\b(guaranteed eligible|definitely eligible|you (?:are|are now) authorized to drive|we (?:give|provide) legal advice)\b/i.test(answer.publicAnswer)) {
      failures.push(`${label}: public answer contains an unsafe eligibility/legal guarantee`);
    }
  }
}

function checkEvaluation(evaluation, answerIds) {
  if (!evaluation) return;
  if (evaluation.status !== "prepared-not-run") warnings.push(`assistant evaluation: unexpected status ${evaluation.status}`);
  if (!Array.isArray(evaluation.questions) || evaluation.questions.length < 50) {
    failures.push(`assistant evaluation: expected at least 50 questions, found ${evaluation.questions?.length ?? 0}`);
    return;
  }
  const ids = new Set();
  for (const question of evaluation.questions) {
    if (ids.has(question.id)) failures.push(`assistant evaluation: duplicate ${question.id}`);
    ids.add(question.id);
    if (!answerIds.has(question.answerId)) failures.push(`assistant evaluation ${question.id}: unknown answerId ${question.answerId}`);
    if (!question.question || !question.expectedBehavior) failures.push(`assistant evaluation ${question.id}: incomplete test`);
  }
}

function checkGeneratedPublicOutput(register) {
  const expected = serializePublicPayloads();
  const files = [
    ["knowledge/public/business-facts.json", expected.publicFacts],
    ["knowledge/public/answers.json", expected.publicAnswers],
  ];
  for (const [relativePath, contents] of files) {
    const file = path.join(repositoryRoot, relativePath);
    if (!fs.existsSync(file)) {
      failures.push(`${relativePath}: generated output is missing`);
    } else if (fs.readFileSync(file, "utf8") !== contents) {
      failures.push(`${relativePath}: generated output is stale`);
    }
  }

  const publicAnswers = readJson("knowledge/public/answers.json");
  if (!publicAnswers) return;
  const eligible = new Set(register.answers.filter((answer) => answer.status === "approved" && answer.classification === "public").map((answer) => answer.id));
  for (const answer of publicAnswers.answers ?? []) {
    if (!eligible.has(answer.id)) failures.push(`public answers: ${answer.id} is not approved public content`);
    if ("internalStaffAnswer" in answer || "approver" in answer || "approvedOn" in answer) {
      failures.push(`public answers: ${answer.id} leaked an internal field`);
    }
  }
  if ((publicAnswers.answers?.length ?? 0) !== eligible.size || publicAnswers.answerCount !== eligible.size) {
    failures.push("public answers: approved-public answer count does not match generated output");
  }
  const publicText = JSON.stringify(publicAnswers);
  const prohibitedPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/,
    /card security code/i,
    /\b(?:password|api[_ -]?key|secret key)\b/i,
    /customer driver.?s license/i,
  ];
  for (const pattern of prohibitedPatterns) {
    if (pattern.test(publicText)) failures.push(`public answers: possible restricted content matched ${pattern}`);
  }
}

function checkSitemapAndSiteFacts(facts) {
  if (!facts) return;
  const sitemapPath = path.join(repositoryRoot, "sitemap.xml");
  const robotsPath = path.join(repositoryRoot, "robots.txt");
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  const robots = fs.readFileSync(robotsPath, "utf8");
  if (!/User-agent:\s*\*/i.test(robots) || !/Allow:\s*\//i.test(robots)) failures.push("robots.txt: public crawl access is missing");
  if (!/Sitemap:\s*https:\/\/interlockgo\.io\/sitemap\.xml/i.test(robots)) failures.push("robots.txt: canonical sitemap declaration is missing");
  if (/Disallow:\s*\/(?:faq|hours|contactus|lifesafer|guardian)\/?/i.test(robots)) failures.push("robots.txt: a core knowledge page is blocked");

  const urls = [...sitemap.matchAll(/<loc>(https:\/\/interlockgo\.io\/[^<]*)<\/loc>/g)].map((match) => match[1]);
  if (new Set(urls).size !== urls.length) failures.push("sitemap.xml: duplicate URLs");
  const primaryPhone = normalizePhone(facts.phones.find((phone) => phone.id === "shop-primary")?.numberE164);
  const allowedPhones = new Set(facts.phones.filter((phone) => phone.classification === "public").map((phone) => normalizePhone(phone.numberE164)));
  const expectedHours = expectedOpeningHours(facts.hours);

  for (const url of urls) {
    const parsed = new URL(url);
    const route = decodeURIComponent(parsed.pathname).replace(/^\//, "");
    const relativeFile = route === "" ? "index.html" : `${route.replace(/\/$/, "")}/index.html`;
    const file = path.join(repositoryRoot, relativeFile);
    if (!fs.existsSync(file)) {
      failures.push(`sitemap.xml: ${url} has no ${relativeFile}`);
      continue;
    }
    const html = fs.readFileSync(file, "utf8");
    if (!/<link\s+rel=["']canonical["']/i.test(html)) reportSiteIssue(relativeFile, "missing canonical link");
    if (!/<h1\b/i.test(html)) reportSiteIssue(relativeFile, "missing H1");
    for (const match of html.matchAll(/\b(?:tel|sms):([^"'\s>]+)/gi)) {
      const number = normalizePhone(match[1]);
      if (number.length === 10 && !allowedPhones.has(number)) failures.push(`${relativeFile}: contact number ${number} is absent from canonical phone roles`);
    }

    for (const object of jsonLdObjects(html, file)) {
      if (!typeIncludes(object, "LocalBusiness") && !typeIncludes(object, "Organization")) continue;
      if (object.telephone && normalizePhone(object.telephone) !== primaryPhone) {
        reportSiteIssue(relativeFile, `JSON-LD telephone ${object.telephone} differs from shop-primary`);
      }
      if (object.address?.addressLocality && object.address.addressLocality !== facts.address.locality) {
        reportSiteIssue(relativeFile, "JSON-LD locality differs from canonical address");
      }
      if (object.address?.postalCode && String(object.address.postalCode) !== facts.address.postalCode) {
        reportSiteIssue(relativeFile, "JSON-LD postal code differs from canonical address");
      }
      if (object.openingHoursSpecification) {
        const actual = actualOpeningHours(object.openingHoursSpecification);
        if (JSON.stringify(actual) !== JSON.stringify(expectedHours)) {
          reportSiteIssue(relativeFile, "JSON-LD hours differ from the owned-site canonical schedule");
        }
      }
    }
  }

  if (/knowledge\/(?:internal|restricted)/i.test(sitemap)) failures.push("sitemap.xml: internal or restricted knowledge path is public");
  const deployBuilder = path.join(repositoryRoot, "scripts/build-deploy.mjs");
  if (fs.existsSync(deployBuilder)) {
    const builder = fs.readFileSync(deployBuilder, "utf8");
    if (/knowledge\/internal/.test(builder)) failures.push("build-deploy.mjs: internal knowledge path appears in public artifact logic");
  } else {
    warnings.push("scripts/build-deploy.mjs is absent in this stale checkout; deployed main has the curated builder and must be synchronized before release work");
  }
}

async function checkSourceLinks(facts, register) {
  const sources = [];
  walkJson(facts, (object) => {
    if (object.url && object.title && object.authorityLevel) sources.push(object);
  });
  for (const answer of register.answers) sources.push(...answer.sources);
  const urls = [...new Set(sources.map((source) => source.url))].sort();
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
        headers: { "user-agent": "InterlockGo-Truth-System-Link-Check/1.0" },
      });
      if (response.status === 404 || response.status === 410) failures.push(`source link: ${url} returned ${response.status}`);
      else if (response.status >= 400) warnings.push(`source link: ${url} returned ${response.status}; verify manually`);
      await response.body?.cancel();
    } catch (error) {
      warnings.push(`source link: ${url} could not be checked (${error.message})`);
    }
  }
  console.log(`Checked ${urls.length} unique source links.`);
}

async function run() {
  const checkLinks = process.argv.includes("--check-links");
  const unexpected = process.argv.slice(2).filter((argument) => argument !== "--check-links");
  if (unexpected.length) {
    console.error("Usage: node scripts/truth-system-check.mjs [--check-links]");
    process.exit(1);
  }

  checkSchemas();
  const facts = readJson("knowledge/internal/business-facts.json");
  const register = readJson("knowledge/internal/answer-register.json");
  const evaluation = readJson("knowledge/internal/assistant-evaluation.json");
  checkBusinessFacts(facts);
  checkAnswerRegister(register);
  checkEvaluation(evaluation, new Set(register?.answers?.map((answer) => answer.id) ?? []));
  checkGeneratedPublicOutput(register);
  checkSitemapAndSiteFacts(facts);
  if (checkLinks && facts && register) await checkSourceLinks(facts, register);

  if (warnings.length) {
    console.warn(`Truth System check produced ${warnings.length} warning(s):`);
    for (const warning of warnings) console.warn(`- ${warning}`);
  }
  if (failures.length) {
    console.error(`Truth System check failed with ${failures.length} issue(s):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(`Truth System check passed: ${register.answers.length} answers, ${evaluation.questions.length} evaluation prompts, ${facts.phones.length} phone roles, and no unapproved public answers.`);
}

await run();
