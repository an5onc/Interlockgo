import fs from "node:fs";

const html = fs.readFileSync("guardian/index.html", "utf8");
const css = fs.readFileSync("guardian/guardian.css", "utf8");

const failures = [];

// --- New 3D showcase hero must be present ---
if (!html.includes('id="hero-scene"') || !html.includes('id="hero-stage"')) {
  failures.push('Guardian hero should include the 3D scene (id="hero-scene" and id="hero-stage").');
}

if (!html.includes("../images/guardian-hero-800.webp")) {
  failures.push("Guardian hero should show the AMS2500 product photo (images/guardian-hero-800.webp).");
}

if (!html.includes("hero-compare--card")) {
  failures.push("Guardian hero should include the to-scale credit card comparison.");
}

if (!html.includes("hero-compare--phone")) {
  failures.push("Guardian hero should include the cell phone outline comparison.");
}

if (!/<h1\b[^>]*id="page-title"/.test(html) || !html.includes('class="hero__copy"')) {
  failures.push("Guardian hero should contain the page H1 inside the hero copy block.");
}

if (!html.includes('class="hero__ctas"') || !html.includes('href="tel:') || !html.includes('href="../appointments/"')) {
  failures.push("Guardian hero should include call and appointment CTAs.");
}

if (
  !html.includes("pointer: fine") ||
  !html.includes("prefers-reduced-motion") ||
  !html.includes("requestAnimationFrame") ||
  !html.includes("rotateX")
) {
  failures.push("Guardian tilt script should be rAF-throttled and gated on fine pointers and motion preference.");
}

// --- Old scroll-scrub video hero must be gone ---
if (
  html.includes('id="hero-video"') ||
  html.includes("hero-scroll-wrapper") ||
  html.includes("video.currentTime") ||
  html.includes("guardian-hero-variants")
) {
  failures.push("Guardian page should not keep the old scroll-scrubbed video hero.");
}

// --- CSS ---
if (!css.includes(".hero-scene") || !css.includes(".hero-device") || !css.includes("--mm:") || !css.includes("perspective")) {
  failures.push("Guardian CSS should style the 3D scene with the shared --mm px-per-mm scale.");
}

if (!css.includes("prefers-reduced-motion")) {
  failures.push("Guardian CSS should include a reduced-motion fallback for the hero.");
}

if (css.includes(".hero-video") || css.includes(".hero-scroll-wrapper")) {
  failures.push("Guardian CSS should not keep stale video-hero rules.");
}

if (failures.length) {
  console.error(`Guardian hero check failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Guardian hero uses the 3D to-scale device showcase.");
