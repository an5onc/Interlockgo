import fs from "node:fs";

const html = fs.readFileSync("lifesafer/index.html", "utf8");
const css = fs.readFileSync("lifesafer/lifesafer.css", "utf8");

const failures = [];

if (!html.includes('id="hero-video"')) {
  failures.push("LifeSafer hero should include a scrubbed video element with id=\"hero-video\".");
}

if (!html.includes("../images/lifesafer-hero-variants/variant-b-local-trust.mp4")) {
  failures.push("LifeSafer hero should use the approved Variant B Local Trust MP4.");
}

if (!html.includes("../images/lifesafer-hero-variants/variant-b-poster.png")) {
  failures.push("LifeSafer hero should use the Variant B poster as its fallback frame.");
}

if (html.includes("hero-frames/frame-") || html.includes("TOTAL_FRAMES")) {
  failures.push("LifeSafer hero should not preload the old 301 JPEG frame sequence.");
}

if (html.includes('id="hero-canvas"') || html.includes("getContext('2d')")) {
  failures.push("LifeSafer hero should not use the old canvas renderer.");
}

if (html.includes('id="hero-content"') || html.includes("hero-video-overlay")) {
  failures.push("LifeSafer hero should not include text or dark overlay layers over the video.");
}

if (!html.includes("video.currentTime") || !html.includes("video.duration")) {
  failures.push("LifeSafer scroll script should scrub video.currentTime from scroll progress.");
}

if (!css.includes(".hero-video")) {
  failures.push("LifeSafer CSS should style the hero video layer.");
}

if (css.includes(".hero-canvas")) {
  failures.push("LifeSafer CSS should not keep stale .hero-canvas rules.");
}

if (css.includes(".hero-video-overlay") || css.includes(".hero__title--scroll")) {
  failures.push("LifeSafer CSS should not keep stale hero text overlay styles.");
}

if (failures.length) {
  console.error(`LifeSafer hero check failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("LifeSafer hero uses approved Variant B scrubbed MP4.");
