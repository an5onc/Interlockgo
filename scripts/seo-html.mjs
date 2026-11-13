// Match the enclosing quote so apostrophes inside double-quoted attributes
// (and double quotes inside single-quoted attributes) remain part of the value.
export function attribute(tag, name) {
  const match = tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match ? (match[1] ?? match[2] ?? match[3] ?? "") : null;
}

export function decodeEntities(value) {
  const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (entity, code) => {
    if (!code.startsWith("#")) return named[code.toLowerCase()];
    const point = /^#x/i.test(code) ? parseInt(code.slice(2), 16) : Number(code.slice(1));
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)
      ? String.fromCodePoint(point) : "\uFFFD";
  });
}

export function metaContent(html, name) {
  const tag = [...html.matchAll(/<meta\b[^>]*>/gi)].find(([tag]) =>
    (attribute(tag, "name") ?? attribute(tag, "property"))?.toLowerCase() === name.toLowerCase());
  return tag ? decodeEntities(attribute(tag[0], "content") ?? "").replace(/\s+/g, " ").trim() : "";
}
