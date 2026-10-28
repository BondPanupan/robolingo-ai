import type { LinkPreview } from "@/lib/chat-api";
import { BadRequestException, NotFoundException } from "../../../common/http-exception";
import { parseOpenGraph } from "../lib/parse-open-graph";
import { isFetchableUrl } from "../lib/public-address";

const TIMEOUT_MS = 5_000;
const MAX_REDIRECTS = 3;
const MAX_BYTES = 512 * 1024;
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const USER_AGENT = "Mozilla/5.0 (compatible; RobolingoLinkPreview/1.0)";

// แชตเดียวกันถูก poll ทุก 3 วินาที และหลายแอดมินเปิดลิงก์เดียวกัน — จำผลไว้ (รวมผลว่าง) ไม่ต้องยิงเว็บปลายทางซ้ำ
const cache = new Map<string, { value: LinkPreview | null; expiresAt: number }>();

function remember(key: string, value: LinkPreview | null) {
  if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value!);
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

/** follow redirect เอง เพื่อตรวจทุกปลายทางว่าไม่ใช่ที่อยู่ภายใน */
async function fetchHtml(start: URL): Promise<{ html: string; finalUrl: string } | null> {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!(await isFetchableUrl(url))) return null;

    const res = await fetch(url, {
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
    });

    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel();
      url = new URL(location, url);
      continue;
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !res.body || !/text\/html|application\/xhtml/i.test(contentType)) {
      await res.body?.cancel();
      return null;
    }

    return { html: await readHead(res.body, contentType), finalUrl: url.href };
  }
  return null;
}

/** อ่านแค่ถึง </head> หรือ MAX_BYTES — og:* อยู่ใน <head> เสมอ ไม่ต้องโหลดทั้งหน้า */
async function readHead(body: ReadableStream<Uint8Array>, contentType: string): Promise<string> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
      if (new TextDecoder("latin1").decode(value).includes("</head>")) break;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  const bytes = Buffer.concat(chunks);
  // charset จาก header ก่อน ไม่มีค่อยดู <meta charset> (เว็บไทยเก่า ๆ บางเว็บเป็น TIS-620/windows-874)
  const charset =
    contentType.match(/charset=["']?([\w-]+)/i)?.[1] ??
    new TextDecoder("latin1").decode(bytes.subarray(0, 2048)).match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] ??
    "utf-8";
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

/** GET /api/link-preview?url= — การ์ดพรีวิวลิงก์ (Open Graph) ของลิงก์ในข้อความ */
export async function getLinkPreviewUseCase(rawUrl: string): Promise<LinkPreview> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new BadRequestException("Invalid url");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new BadRequestException("Invalid url");

  const key = url.href;
  const cached = cache.get(key);
  let preview: LinkPreview | null;
  if (cached && cached.expiresAt > Date.now()) {
    preview = cached.value;
  } else {
    preview = null;
    try {
      const page = await fetchHtml(url);
      if (page) {
        const og = parseOpenGraph(page.html, page.finalUrl);
        if (og.title || og.image) preview = { url: key, ...og };
      }
    } catch {
      // timeout, DNS, TLS ฯลฯ — เว็บปลายทางเปิดไม่ได้ก็แค่ไม่มีการ์ด
    }
    remember(key, preview);
  }

  if (!preview) throw new NotFoundException("No preview for this link");
  return preview;
}
