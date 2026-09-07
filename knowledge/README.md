# InterlockGo Truth System

This directory is the governed source for InterlockGo business facts and reusable answers. It does not replace the public website. It is designed to prevent the website, staff guidance, provider listings, and future internal assistants from drifting into contradictory copies.

## Directory boundaries

- `internal/` contains canonical records and staff context. It must never be copied wholesale into a public site artifact.
- `public/` contains generated, redacted output. Never edit generated files by hand.
- `restricted/` documents the boundary for customer or confidential material. No restricted customer data belongs in this repository.
- `schemas/` defines the record contracts.

The deployed `main` branch uses a curated GitHub Pages artifact. `knowledge/internal/` is intentionally not a deployment seed and must remain excluded from that artifact. A future deployment change must prove this separation with `node scripts/truth-system-check.mjs`.

## Workflow

Customer signal -> verification -> draft answer -> human approval -> publication -> monitoring -> scheduled review.

Calls, reviews, customer questions, social posts, and AI output are topic signals only. They cannot establish a fact or override Colorado DMV, provider, or approved InterlockGo sources.

## Commands

```sh
node scripts/build-truth-public.mjs --check
node scripts/truth-system-check.mjs
node scripts/truth-system-check.mjs --check-links
```

`--check-links` performs network requests and is intentionally optional. The default validator is deterministic and offline.

## Approval rule

Only records with both `classification: "public"` and `status: "approved"` may enter generated public output. Approval requires an approver and approval date. Draft, outdated, retired, staff-only, and restricted records are excluded.

The initial register is a source-backed draft set. It is not a release authorization and does not change `faq/index.html`, `llms.txt`, production, or any external listing.
