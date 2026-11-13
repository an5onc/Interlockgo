import test from "node:test";
import assert from "node:assert/strict";
import { attribute, decodeEntities, metaContent } from "./seo-html.mjs";

test("metadata preserves apostrophes and works with reordered attributes", () => {
  assert.equal(metaContent(`<meta content="Colorado's DMV &amp; interlock help" name="description" />`, "description"), "Colorado's DMV & interlock help");
  assert.equal(metaContent(`<meta name='description' content='Call the "Evans" shop'>`, "description"), 'Call the "Evans" shop');
});

test("attribute names are exact and support mixed quote styles", () => {
  assert.equal(attribute(`<a data-href="wrong" href='/getstarted/'>`, "href"), "/getstarted/");
  assert.equal(attribute(`<meta NAME=description content="Local service">`, "name"), "description");
  assert.equal(attribute(`<img data-alt="not an alt">`, "alt"), null);
  assert.equal(attribute(`<img alt="">`, "alt"), "");
});

test("metadata handles Open Graph, whitespace, and encoded characters", () => {
  assert.equal(metaContent(`<meta content='LifeSafer &#38; Guardian\n in Evans' property='og:title'>`, "og:title"), "LifeSafer & Guardian in Evans");
  assert.equal(decodeEntities("Colorado&#39;s &#x44;MV &amp; help"), "Colorado's DMV & help");
  assert.equal(decodeEntities("&#x110000;"), "\uFFFD");
  assert.equal(metaContent("<title>Test</title>", "description"), "");
});
