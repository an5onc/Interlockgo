# InterlockGo Site-Wide Mobile Optimization Design

## Goal

Make InterlockGo feel pristine on common iPhone and Android widths without changing the desktop design, SEO structure, business copy, or production deployment state.

## Approved Direction

Use a shared mobile system plus template-specific fixes. The shared system lives in `theme.css` for most internal pages. The homepage has a large inline stylesheet, so it receives matching mobile overrides directly in `index.html`. Pages with inline CSS or separate page CSS get small scoped mobile rules where the shared stylesheet cannot reach.

## Mobile Requirements

- Support narrow phones from 360px through 430px without horizontal scroll, clipped text, cramped controls, or overlapping fixed UI.
- Keep navigation usable with a full-screen menu on pages that have a hamburger and a compact call CTA on pages that do not.
- Reduce oversized hero spacing and headline scale so first screens show useful content and a clear CTA.
- Make button groups, calculator controls, cards, accordions, forms, maps, and CTAs stack cleanly with 44px minimum touch targets.
- Keep body copy readable with tighter mobile line lengths, stronger contrast, and predictable vertical rhythm.
- Preserve all existing links, structured data, canonical URLs, and analytics scripts.

## Scope

This pass covers the homepage, shared internal page templates, city/service-area pages, get started, contact, pricing calculator, FAQ, forms, hours, Lifesafer, Guardian, and financing.

## Verification

Use the local static server and browser viewport checks at 360x780, 390x844, and 412x915. Validate page load, meaningful content, no framework/error overlays, relevant console warnings/errors, screenshots, and at least one interaction such as mobile nav or calculator input.
