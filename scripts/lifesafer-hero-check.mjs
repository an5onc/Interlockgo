import fs from "node:fs";

const html = fs.readFileSync("lifesafer/index.html", "utf8");
const css = fs.readFileSync("lifesafer/lifesafer.css", "utf8");

const failures = [];

// --- New 3D showcase hero must be present ---
if (!html.includes('id="hero-scene"') || !html.includes('id="hero-stage"')) {
  failures.push('LifeSafer hero should include the 3D scene (id="hero-scene" and id="hero-stage").');
}

if (!html.includes("../images/ls250-hero-800.webp")) {
  failures.push("LifeSafer hero should show the L250 product photo (images/ls250-hero-800.webp).");
}

if (!html.includes("hero-compare--card")) {
  failures.push("LifeSafer hero should include the to-scale credit card comparison.");
}

if (!html.includes("hero-compare--phone")) {
  failures.push("LifeSafer hero should include the cell phone outline comparison.");
}

if (!/<h1\b[^>]*id="page-title"/.test(html) || !html.includes('class="hero__copy"')) {
  failures.push("LifeSafer hero should contain the page H1 inside the hero copy block.");
}

if (!html.includes('class="hero__ctas"') || !html.includes('href="tel:') || !html.includes('href="../appointments/"')) {
  failures.push("LifeSafer hero should include call and appointment CTAs.");
}

if (
  !html.includes("pointer: fine") ||
  !html.includes("prefers-reduced-motion") ||
  !html.includes("requestAnimationFrame") ||
  !html.includes("rotateX")
) {
  failures.push("LifeSafer tilt script should be rAF-throttled and gated on fine pointers and motion preference.");
}

// --- Old scroll-scrub video hero must be gone ---
if (
  html.includes('id="hero-video"') ||
  html.includes("hero-scroll-wrapper") ||
  html.includes("video.currentTime") ||
  html.includes("lifesafer-hero-variants")
) {
  failures.push("LifeSafer page should not keep the old scroll-scrubbed video hero.");
}

// --- CSS ---
if (!css.includes(".hero-scene") || !css.includes(".hero-device") || !css.includes("--mm:") || !css.includes("perspective")) {
  failures.push("LifeSafer CSS should style the 3D scene with the shared --mm px-per-mm scale.");
}

if (!css.includes("prefers-reduced-motion")) {
  failures.push("LifeSafer CSS should include a reduced-motion fallback for the hero.");
}

if (css.includes(".hero-video") || css.includes(".hero-scroll-wrapper") || css.includes("182, 255, 46")) {
  failures.push("LifeSafer CSS should not keep stale video-hero or lime-accent rules.");
}

// --- Handbook downloads ---
if (
  !html.includes('id="handbook-language-dialog"') ||
  !html.includes("/files/Lifesafer-Handbook.pdf") ||
  !html.includes("/files/Lifesafer-Handbook-Spanish.pdf")
) {
  failures.push("LifeSafer page should offer the EN/ES handbook download dialog.");
}

if (failures.length) {
  console.error(`LifeSafer hero check failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("LifeSafer hero uses the 3D to-scale device showcase with handbook downloads.");
