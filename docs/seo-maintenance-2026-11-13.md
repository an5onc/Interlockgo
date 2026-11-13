# SEO maintenance — November 13, 2026

The checks below describe local verification before release. Deployment uses the existing GitHub Pages workflow on `main`; the workflow result and live-site checks establish release status separately.

## Changes

- Rewrote the homepage title, description, and visible H1 around ignition interlock service in Evans. Added the shop address, single-location service-area context, and helpful links to installation preparation, hours, and the installer guide.
- Tightened search and social metadata on the Evans, contact, appointment, and installer-guide pages. Made the FAQ, forms, service-area, and review headings more descriptive.
- Added favicon declarations using the existing square InterlockGo logo across all 28 pages.
- Standardized all 17 LocalBusiness records to the same Evans business name and homepage URL. Page-specific canonical URLs, descriptions, and service areas remain distinct.
- Consolidated robots.txt into one wildcard group. The existing `/lilly/` and `/resume/` exclusions now also apply to crawlers that previously had their own unrestricted group. Public assets remain crawlable.
- Updated sitemap modification dates for pages whose copy, headings, or business schema changed. Pages receiving only a favicon retain their existing dates.
- Corrected undefined theme colors that made the appointment and SMS terms heroes display light text on a light background. Restored appointment service icons, corrected service-area text tokens, and improved wrapping of contact and appointment headings.
- Added the installer guide as an explicit deployment seed.

## Maintenance checks

Metadata parsing now preserves apostrophes, supports either quoting style and reordered attributes, and decodes HTML entities. Three regression tests cover those cases. Removed arbitrary minimum word counts from the top-page checker; its title and description limits remain editorial targets.

The site audit now checks favicon declarations, matching social/canonical URLs, consistent business identity and address, reciprocal language alternates, incoming HTML links, sitemap duplicates and invalid/future dates, shared crawler policy, and undefined inline CSS tokens. GitHub Pages CI runs the metadata regression tests and top-page checks against both source and the curated artifact.

## Verification

- Source and built-artifact SEO checks: 28 HTML pages, 25 sitemap URLs, zero failures.
- Existing media, LifeSafer/Guardian hero, JavaScript syntax, Truth System, and generated-public-output checks passed.
- Curated build: 74 files, approximately 16.86 MB. Internal/restricted knowledge, development scripts, social tooling, and unused production assets remain excluded.
- HTTP checks: all 25 sitemap routes and five public resources returned 200; four nonpublic paths returned 404.
- Visual checks: desktop homepage, homepage/local-service content at 390 pixels, and contact, appointment, and SMS terms pages at 320 pixels.
- Negative regression check: reintroducing the removed appointment color token caused the artifact audit to fail; the original file was restored afterward.
- One existing advisory remains about the long FAQ page. It is a readability prompt, not an indexing failure or evidence of a ranking problem.

## Remaining measurement and release work

The release check found that the repository still had GitHub Pages `build_type: legacy`, allowing the automatic branch publisher to compete with the curated workflow. Changed the Pages setting to `workflow`, preserving the custom domain, and added a CI check that rejects legacy publishing. Exclusion verification must request exact internal JSON/development filenames as well as directories; a directory returning 404 does not prove its files are unavailable.

Live verification also found that `actions/upload-pages-artifact@v4` does not accept `include-hidden-files` and strips `.well-known/security.txt` from its tar archive. The workflow now archives the already curated `_site/` directory explicitly, verifies the required dotfiles in the archive, and uploads that tar using the same pinned `upload-artifact` implementation used by the original action. This preserves the Pages artifact format and excludes repository-only files.

Search Console has no selected property in the available HYPD connection, so clicks, impressions, rankings, and Google-selected canonical URLs were not verified. Select the property at [HYPD sources](https://app.hypd.ai/sources?utm_source=mcp&utm_content=none_selected) for that review. No Business Profile or external listing was changed.

After deployment, verify the live pages, robots.txt, and sitemap, then monitor Search Console. Local checks establish technical readiness; they do not establish Google indexing or ranking gains.

References: [Google crawler rule precedence](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec), [helpful content and word counts](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [favicon guidance](https://developers.google.com/search/docs/appearance/favicon-in-search), [local business markup](https://developers.google.com/search/docs/appearance/structured-data/local-business).
