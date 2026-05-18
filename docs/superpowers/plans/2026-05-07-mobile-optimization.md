# Mobile Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize InterlockGo for common mobile devices across the static site.

**Architecture:** Add a shared mobile baseline in `theme.css`, matching homepage overrides in `index.html`, and targeted page-level overrides for CSS that is inline or page-specific. Keep edits CSS-only unless markup is required to make mobile navigation accessible.

**Tech Stack:** Static HTML, CSS, local Python static server, Codex in-app Browser.

---

### Task 1: Shared Mobile Baseline

**Files:**
- Modify: `/Users/ansoncordeiro/dev/Interlockgo/theme.css`

- [ ] Add mobile-safe container padding, readable type scales, full-width button behavior, robust mobile nav sizing, reduced section padding, card/grid stack rules, and fixed call button safe-area placement.
- [ ] Include compatibility rules for legacy city-page classes such as `.main-card`, `.hero__content`, `.hero__cta`, `.hero__proof`, `.logos`, `.testimonials__grid`, `.faq__question`, `.faq__answer`, `.cta-card`, `.hero-section`, `.hero-content`, `.content-grid`, `.service-grid`, `.faq-grid`, and `.info-grid`.
- [ ] Verify no desktop rules are changed outside media queries except harmless touch-target defaults.

### Task 2: Homepage Mobile Overrides

**Files:**
- Modify: `/Users/ansoncordeiro/dev/Interlockgo/index.html`

- [ ] Add a mobile media block before the inline stylesheet closes.
- [ ] Tighten homepage nav, hero, meta chips, CTA row, stats, services, process, why, calculator, FAQ, big CTA, footer, and floating call button.
- [ ] Preserve homepage desktop styling and all existing links.

### Task 3: Page-Specific Mobile Fixes

**Files:**
- Modify: `/Users/ansoncordeiro/dev/Interlockgo/getstarted/getstarted.css`
- Modify: `/Users/ansoncordeiro/dev/Interlockgo/faq/faq.css`
- Modify: `/Users/ansoncordeiro/dev/Interlockgo/forms/forms.css`
- Modify: `/Users/ansoncordeiro/dev/Interlockgo/hours/hours.css`
- Modify: `/Users/ansoncordeiro/dev/Interlockgo/lifesafer/lifesafer.css`
- Modify: `/Users/ansoncordeiro/dev/Interlockgo/guardian/guardian.css`
- Modify: `/Users/ansoncordeiro/dev/Interlockgo/contactus/index.html`
- Modify: `/Users/ansoncordeiro/dev/Interlockgo/pricing-calculator/index.html`
- Modify: `/Users/ansoncordeiro/dev/Interlockgo/service-areas/index.html`
- Modify: `/Users/ansoncordeiro/dev/Interlockgo/financing/index.html`

- [ ] Add scoped mobile rules for page CSS not covered by `theme.css`.
- [ ] Stack awkward control rows, reduce card padding, keep long addresses/emails wrapping, and size maps/device video heroes for phones.

### Task 4: Browser Verification

**Files:**
- No source changes expected.

- [ ] Run the local static server at `http://127.0.0.1:8088/`.
- [ ] Check representative pages at 360x780, 390x844, and 412x915: `/`, `/getstarted/`, `/contactus/`, `/faq/`, `/pricing-calculator/`, `/service-areas/`, `/evans/`, `/lifesafer/`, `/guardian/`, `/forms/`, `/hours/`, `/financing/`.
- [ ] Exercise mobile navigation on a page with a hamburger.
- [ ] Exercise the homepage or pricing calculator control.
- [ ] Capture mobile screenshots and console health for final QA.
