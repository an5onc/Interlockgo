import fs from "node:fs";

const html = fs.readFileSync("guardian/index.html", "utf8");
const css = fs.readFileSync("guardian/guardian.css", "utf8");

const failures = [];

if (!html.includes('id="hero-video"')) {
  failures.push('Guardian hero should include a scrubbed video element with id="hero-video".');
}

if (!html.includes("../images/guardian-hero-variants/guardian-local-trust.mp4")) {
  failures.push("Guardian hero should use the Guardian Local Trust MP4.");
}

if (!html.includes("../images/guardian-hero-variants/guardian-local-trust-poster.jpg")) {
  failures.push("Guardian hero should use the Guardian Local Trust JPEG poster frame.");
}

if (html.includes("hero-frame") || html.includes("hero-grid") || html.includes("hero-meta")) {
  failures.push("Guardian hero should not keep the old text/stat overlay hero.");
}

if (html.includes("hero-video-overlay") || html.includes('id="hero-content"')) {
  failures.push("Guardian hero should not include page overlay layers over the video.");
}

if (!html.includes("video.currentTime") || !html.includes("video.duration")) {
  failures.push("Guardian scroll script should scrub video.currentTime from scroll progress.");
}

if (!css.includes(".hero-video") || !css.includes(".hero-scroll-wrapper")) {
  failures.push("Guardian CSS should style the scroll-scrubbed video hero.");
}

if (css.includes(".hero-video-overlay")) {
  failures.push("Guardian CSS should not include a video overlay layer.");
}

if (failures.length) {
  console.error(`Guardian hero check failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Guardian hero uses the Guardian Local Trust scrubbed MP4.");
