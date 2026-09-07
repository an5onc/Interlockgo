# Governance and publication policy

## Source hierarchy

1. Current Colorado DMV rule, official form, or the customer's individualized DMV letter.
2. Current LifeSafer or Guardian documentation.
3. Approved InterlockGo policy, rate sheet, hours, and procedures.
4. Verified technician experience.
5. Customer conversations, questions, reviews, social content, and AI output as topic signals only.

The customer's current DMV notice controls their case. Colorado DMV determines eligibility, duration, extensions, and removal authorization. InterlockGo is not a law firm and does not provide legal advice.

## Classifications

- `public`: safe for publication after approval.
- `staff-only`: operating guidance that must remain in the internal catalog.
- `restricted`: customer data, credentials, financial details, confidential business data, or case-specific records. Restricted content is not stored in this repository.

Never retain raw calls, card data or security codes, driver records, court records, DMV letters containing personal information, customer identifiers, credentials, or secrets. De-identified question summaries may be added as topic signals only.

## Statuses

- `draft`: sourced but not approved for publication.
- `approved`: reviewed by a named human approver and eligible for its declared destinations.
- `outdated`: review date or source is no longer current; must not publish.
- `retired`: intentionally withdrawn; retained only for audit history.

## Required controls

The validator blocks or flags:

- unapproved or non-public answers in public output;
- regulated answers without a level-1 Colorado DMV source;
- missing or expired review dates;
- conflicting or unverified business facts being exported as confirmed;
- prices without a named source and effective date;
- invented appointment availability or removal eligibility;
- personalized legal advice;
- topic signals promoted to factual authority;
- restricted fields or likely customer identifiers in public output;
- duplicate IDs and unsupported mass-generated content;
- sitemap, crawlability, JSON-LD phone, address, and hours drift.

## Review cadence

- Hours, phones, appointment methods, provider listings, and prices: every 30 days and after any owner/provider change.
- Colorado regulatory answers: every 90 days and after a DMV rule/form change.
- Device-operation answers: every 180 days and after provider documentation changes.
- Service areas and general shop procedures: every 180 days.

Temporary closures and holiday hours require an explicit start/end time, timezone, owner, approval, and removal date. An empty exception list means "no exception has been recorded," not "the shop is definitely open."

## Owner confirmation queue

Before website integration, confirm:

1. The routing and intended purpose of 970-812-1994 and 970-368-3466.
2. The approved legal-entity wording for public and staff use.
3. Supported LifeSafer and Guardian device models and vehicle limitations.
4. The current signed rate sheets and effective dates.
5. Holiday/temporary closure handling and backup approver.
