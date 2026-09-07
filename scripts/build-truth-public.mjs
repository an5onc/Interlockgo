import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), "..");

const paths = {
  facts: path.join(repositoryRoot, "knowledge/internal/business-facts.json"),
  answers: path.join(repositoryRoot, "knowledge/internal/answer-register.json"),
  publicFacts: path.join(repositoryRoot, "knowledge/public/business-facts.json"),
  publicAnswers: path.join(repositoryRoot, "knowledge/public/answers.json"),
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function isPublicConfirmed(item) {
  return item?.classification === "public" && item?.status === "confirmed";
}

function publicSources(sources = []) {
  return sources.map(({ title, url, authorityLevel, verifiedOn }) => ({
    title,
    url,
    authorityLevel,
    verifiedOn,
  }));
}

function publicFactItem(item) {
  const { internalNotes: _internalNotes, ...safe } = item;
  if (safe.sources) safe.sources = publicSources(safe.sources);
  return safe;
}

export function buildPublicPayloads() {
  const facts = readJson(paths.facts);
  const register = readJson(paths.answers);

  const publicFacts = {
    schemaVersion: facts.schemaVersion,
    recordId: facts.recordId,
    catalogReviewedOn: facts.lastReviewedDate,
    nextCatalogReview: facts.nextReviewDate,
    responsibleOwner: facts.responsibleOwner,
    publicationRule: "Only public facts with status confirmed are included.",
    business: {
      publicBusinessName: isPublicConfirmed(facts.publicBusinessName)
        ? publicFactItem(facts.publicBusinessName)
        : null,
      address: isPublicConfirmed(facts.address) ? publicFactItem(facts.address) : null,
      phones: facts.phones.filter(isPublicConfirmed).map(publicFactItem),
      hours: isPublicConfirmed(facts.hours) ? publicFactItem(facts.hours) : null,
      holidayExceptions: facts.holidayExceptions.filter(isPublicConfirmed).map(publicFactItem),
      supportedProviders: facts.supportedProviders.filter(isPublicConfirmed).map(publicFactItem),
      supportedDeviceModels: facts.supportedDeviceModels.filter(isPublicConfirmed).map(publicFactItem),
      services: facts.services.filter(isPublicConfirmed).map(publicFactItem),
      serviceAreas: facts.serviceAreas.filter(isPublicConfirmed).map(publicFactItem),
      appointmentMethods: facts.appointmentMethods.filter(isPublicConfirmed).map(publicFactItem),
      pricing: isPublicConfirmed(facts.pricing) ? publicFactItem(facts.pricing) : null,
      legalAndRegulatoryLimitations: [...facts.legalAndRegulatoryLimitations],
    },
  };

  const approvedAnswers = register.answers
    .filter((answer) => answer.classification === "public" && answer.status === "approved")
    .map((answer) => ({
      id: answer.id,
      category: answer.category,
      customerWording: answer.customerWording,
      alternateWording: [...answer.alternateWording],
      answer: answer.publicAnswer,
      sources: publicSources(answer.sources),
      applicability: [...answer.applicability],
      effectiveDate: answer.effectiveDate,
      lastReviewedDate: answer.lastReviewedDate,
      nextReviewDate: answer.nextReviewDate,
      warning: answer.warning,
      publicationDestinations: [...answer.publicationDestinations],
    }))
    .sort((left, right) => left.id.localeCompare(right.id));

  const publicAnswers = {
    schemaVersion: register.schemaVersion,
    catalogId: register.catalogId,
    catalogReviewedOn: register.lastReviewedDate,
    publicationRule: "Only public answers with status approved are included.",
    answerCount: approvedAnswers.length,
    answers: approvedAnswers,
  };

  return { publicFacts, publicAnswers };
}

export function serializePublicPayloads() {
  const { publicFacts, publicAnswers } = buildPublicPayloads();
  return {
    publicFacts: `${JSON.stringify(publicFacts, null, 2)}\n`,
    publicAnswers: `${JSON.stringify(publicAnswers, null, 2)}\n`,
  };
}

function checkFile(file, expected) {
  if (!fs.existsSync(file)) return `${path.relative(repositoryRoot, file)} is missing`;
  const actual = fs.readFileSync(file, "utf8");
  return actual === expected ? null : `${path.relative(repositoryRoot, file)} is stale`;
}

function run() {
  const check = process.argv.includes("--check");
  const unexpected = process.argv.slice(2).filter((argument) => argument !== "--check");
  if (unexpected.length) {
    console.error("Usage: node scripts/build-truth-public.mjs [--check]");
    process.exit(1);
  }

  const output = serializePublicPayloads();
  if (check) {
    const failures = [
      checkFile(paths.publicFacts, output.publicFacts),
      checkFile(paths.publicAnswers, output.publicAnswers),
    ].filter(Boolean);
    if (failures.length) {
      console.error("Generated Truth System output check failed:");
      for (const failure of failures) console.error(`- ${failure}`);
      console.error("Run: node scripts/build-truth-public.mjs");
      process.exit(1);
    }
    console.log("Generated public Truth System output is current.");
    return;
  }

  fs.mkdirSync(path.dirname(paths.publicFacts), { recursive: true });
  fs.writeFileSync(paths.publicFacts, output.publicFacts);
  fs.writeFileSync(paths.publicAnswers, output.publicAnswers);
  console.log("Generated knowledge/public/business-facts.json and knowledge/public/answers.json.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) run();
