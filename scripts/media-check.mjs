import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(process.argv[2] ?? process.cwd());
const maxHeroVideoBytes = 2 * 1024 * 1024;
const maxSocialImageBytes = 250 * 1024;
const expectedDuration = 10.033333;
const failures = [];

const heroVideos = [
  "images/guardian-hero-variants/guardian-local-trust.mp4",
];
const socialImage = "images/interlockgo-social.jpg";

function fail(file, message) {
  failures.push(`${file}: ${message}`);
}

function topLevelMp4Atoms(buffer) {
  const atoms = [];
  let offset = 0;
  while (offset + 8 <= buffer.length) {
    let size = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    let headerSize = 8;
    if (size === 1) {
      if (offset + 16 > buffer.length) break;
      const largeSize = buffer.readBigUInt64BE(offset + 8);
      if (largeSize > BigInt(Number.MAX_SAFE_INTEGER)) break;
      size = Number(largeSize);
      headerSize = 16;
    } else if (size === 0) {
      size = buffer.length - offset;
    }
    if (size < headerSize || offset + size > buffer.length) break;
    atoms.push({ type, offset, size });
    offset += size;
  }
  return atoms;
}

function probeVideo(absolutePath) {
  const ffprobe = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration,size:stream=codec_name,profile,codec_type,width,height,r_frame_rate,pix_fmt",
      "-of",
      "json",
      absolutePath,
    ],
    { encoding: "utf8" },
  );
  if (!ffprobe.error && ffprobe.status === 0) {
    const metadata = JSON.parse(ffprobe.stdout);
    const videoStreams = metadata.streams.filter((stream) => stream.codec_type === "video");
    const otherStreams = metadata.streams.filter((stream) => stream.codec_type !== "video");
    const stream = videoStreams[0] ?? {};
    return {
      codec: stream.codec_name,
      profile: stream.profile,
      width: stream.width,
      height: stream.height,
      frameRate: stream.r_frame_rate,
      pixelFormat: stream.pix_fmt,
      duration: Number(metadata.format.duration),
      size: Number(metadata.format.size),
      videoStreamCount: videoStreams.length,
      otherStreamCount: otherStreams.length,
    };
  }

  const mediainfo = spawnSync("mediainfo", ["--Output=JSON", absolutePath], { encoding: "utf8" });
  if (!mediainfo.error && mediainfo.status === 0) {
    const metadata = JSON.parse(mediainfo.stdout);
    const tracks = metadata.media?.track ?? [];
    const general = tracks.find((track) => track["@type"] === "General") ?? {};
    const videoStreams = tracks.filter((track) => track["@type"] === "Video");
    const otherStreams = tracks.filter(
      (track) => !["General", "Video"].includes(track["@type"]),
    );
    const stream = videoStreams[0] ?? {};
    return {
      codec: stream.Format === "AVC" ? "h264" : stream.Format,
      profile: String(stream.Format_Profile ?? "").split("@")[0],
      width: Number(stream.Width),
      height: Number(stream.Height),
      frameRate: Math.abs(Number(stream.FrameRate) - 30) < 0.001 ? "30/1" : stream.FrameRate,
      pixelFormat:
        stream.ChromaSubsampling === "4:2:0" && Number(stream.BitDepth) === 8
          ? "yuv420p"
          : `${stream.ChromaSubsampling ?? "unknown"}/${stream.BitDepth ?? "unknown"}-bit`,
      duration: Number(general.Duration ?? stream.Duration),
      size: Number(general.FileSize),
      videoStreamCount: videoStreams.length,
      otherStreamCount: otherStreams.length,
    };
  }

  const ffprobeMessage = ffprobe.error?.message ?? ffprobe.stderr.trim();
  const mediainfoMessage = mediainfo.error?.message ?? mediainfo.stderr.trim();
  throw new Error(`neither ffprobe nor MediaInfo succeeded (${ffprobeMessage}; ${mediainfoMessage})`);
}

for (const relativePath of heroVideos) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(relativePath, "missing");
    continue;
  }

  let metadata;
  try {
    metadata = probeVideo(absolutePath);
  } catch (error) {
    fail(relativePath, `media probe failed: ${error.message}`);
    continue;
  }

  if (metadata.videoStreamCount !== 1) {
    fail(relativePath, `expected one video stream, found ${metadata.videoStreamCount}`);
  }
  if (metadata.otherStreamCount !== 0) {
    fail(relativePath, "must be silent and contain no non-video streams");
  }

  if (metadata.codec !== "h264") fail(relativePath, `codec is ${metadata.codec}; expected h264`);
  if (metadata.profile !== "High") fail(relativePath, `profile is ${metadata.profile}; expected High`);
  if (metadata.width !== 1280 || metadata.height !== 720) {
    fail(relativePath, `dimensions are ${metadata.width}x${metadata.height}; expected 1280x720`);
  }
  if (metadata.frameRate !== "30/1") {
    fail(relativePath, `frame rate is ${metadata.frameRate}; expected 30/1`);
  }
  if (metadata.pixelFormat !== "yuv420p") {
    fail(relativePath, `pixel format is ${metadata.pixelFormat}; expected yuv420p`);
  }

  if (!Number.isFinite(metadata.duration) || Math.abs(metadata.duration - expectedDuration) > 0.002) {
    fail(relativePath, `duration is ${metadata.duration}; expected approximately ${expectedDuration}`);
  }
  if (!Number.isFinite(metadata.size) || metadata.size > maxHeroVideoBytes) {
    fail(relativePath, `size is ${metadata.size} bytes; limit is ${maxHeroVideoBytes}`);
  }

  const atoms = topLevelMp4Atoms(fs.readFileSync(absolutePath));
  const moovIndex = atoms.findIndex((atom) => atom.type === "moov");
  const mdatIndex = atoms.findIndex((atom) => atom.type === "mdat");
  if (moovIndex === -1 || mdatIndex === -1 || moovIndex > mdatIndex) {
    fail(relativePath, "moov atom is not before mdat; MP4 fast-start is missing");
  }
}

function inspectJpeg(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(relativePath, "missing");
    return;
  }

  const buffer = fs.readFileSync(absolutePath);
  if (buffer.length > maxSocialImageBytes) {
    fail(relativePath, `size is ${buffer.length} bytes; limit is ${maxSocialImageBytes}`);
  }
  if (buffer.readUInt16BE(0) !== 0xffd8) {
    fail(relativePath, "is not a JPEG");
    return;
  }

  let offset = 2;
  let width;
  let height;
  let progressive = false;
  const metadataMarkers = [];
  while (offset + 4 <= buffer.length) {
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > buffer.length) break;
    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) break;
    if (marker === 0xc2) {
      progressive = true;
      height = buffer.readUInt16BE(offset + 3);
      width = buffer.readUInt16BE(offset + 5);
    }
    if (marker === 0xe1 || marker === 0xe2 || marker === 0xfe) {
      metadataMarkers.push(`0x${marker.toString(16)}`);
    }
    offset += segmentLength;
  }

  if (width !== 1200 || height !== 630) {
    fail(relativePath, `dimensions are ${width}x${height}; expected 1200x630`);
  }
  if (!progressive) fail(relativePath, "must use progressive JPEG encoding");
  if (metadataMarkers.length > 0) {
    fail(relativePath, `contains metadata marker(s): ${metadataMarkers.join(", ")}`);
  }
}

inspectJpeg(socialImage);

if (failures.length > 0) {
  console.error(`Media check failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Media check passed: one fast-start 720p H.264 video and one 1200x630 social JPEG.");
