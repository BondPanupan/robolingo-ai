// แยกข้อความเป็นช่วงข้อความธรรมดากับลิงก์ http(s) — ใช้ทำลิงก์คลิกได้และหา URL สำหรับการ์ดพรีวิว

export type TextPart = { kind: "text"; text: string } | { kind: "link"; text: string; href: string };

const URL_PATTERN = /https?:\/\/[^\s<>"'“”‘’]+/gi;
// วรรคตอนท้าย URL มักเป็นของประโยค ไม่ใช่ของลิงก์ เช่น "ดูที่ https://a.com/x."
const TRAILING_PUNCTUATION = /[.,;:!?)\]}>…]+$/;

export function linkify(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    let url = match[0];
    const trailing = url.match(TRAILING_PUNCTUATION)?.[0] ?? "";
    // วงเล็บปิดที่มีคู่เปิดอยู่ใน URL เป็นของลิงก์ (เช่น wikipedia/Foo_(bar))
    if (trailing.startsWith(")") && url.split("(").length > url.split(")").length - 1) {
      url = url.slice(0, url.length - trailing.length + 1);
    } else {
      url = url.slice(0, url.length - trailing.length);
    }
    if (!URL.canParse(url)) continue;

    const start = match.index;
    if (start > last) parts.push({ kind: "text", text: text.slice(last, start) });
    parts.push({ kind: "link", text: url, href: url });
    last = start + url.length;
  }

  if (last < text.length) parts.push({ kind: "text", text: text.slice(last) });
  return parts;
}

/** ลิงก์แรกในข้อความ — LINE ก็แสดงการ์ดพรีวิวแค่ลิงก์แรก */
export function firstLink(text: string): string | null {
  return linkify(text).find((part) => part.kind === "link")?.href ?? null;
}
