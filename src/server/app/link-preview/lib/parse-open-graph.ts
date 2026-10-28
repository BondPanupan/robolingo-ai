// ดึง Open Graph (og:title/description/image/site_name) จาก HTML ของหน้าเว็บ — ไม่มี DOM ฝั่ง server จึงใช้ regex กับ <meta>
// ใช้แค่ <head> ก็พอ: ผู้เรียกตัด HTML ให้สั้นแล้ว

export interface IOpenGraph {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

// entity ที่เจอบ่อยใน <title>/og:* — ตัวอื่นเว็บส่วนใหญ่ใช้แบบตัวเลข (&#...;) ซึ่งแปลงได้ทุกตัว
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  middot: "·",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  laquo: "«",
  raquo: "»",
  copy: "©",
};

export function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/** attribute ของแท็กเดียว เช่น `property="og:title" content='x'` → { property: "og:title", content: "x" } */
function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of tag.matchAll(/([a-z:_-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/gi)) {
    attrs[match[1].toLowerCase()] = decodeHtmlEntities(match[3] ?? match[4] ?? match[5] ?? "");
  }
  return attrs;
}

function clean(value: string | undefined, maxLength: number): string | null {
  const text = value?.replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

/** URL ของรูปต้องเป็น http(s) แบบเต็ม — relative path แปลงเทียบกับหน้าเว็บ */
function absoluteHttpUrl(value: string | undefined, pageUrl: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim(), pageUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function parseOpenGraph(html: string, pageUrl: string): IOpenGraph {
  const meta: Record<string, string> = {};
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = parseAttributes(tag);
    const key = (attrs.property ?? attrs.name)?.toLowerCase();
    // ค่าแรกชนะ: บางหน้ามี og:image หลายรูป รูปแรกคือรูปหลัก
    if (key && attrs.content !== undefined && !(key in meta)) meta[key] = attrs.content;
  }
  const titleTag = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];

  return {
    title: clean(meta["og:title"] ?? meta["twitter:title"] ?? (titleTag && decodeHtmlEntities(titleTag)), 200),
    description: clean(meta["og:description"] ?? meta["twitter:description"] ?? meta.description, 300),
    image: absoluteHttpUrl(meta["og:image"] ?? meta["og:image:url"] ?? meta["twitter:image"], pageUrl),
    siteName: clean(meta["og:site_name"], 100),
  };
}
