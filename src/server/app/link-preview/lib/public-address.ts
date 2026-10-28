// กัน SSRF: ลิงก์ในแชตมาจากลูกค้า (ใครก็ส่งได้) — ห้ามให้ server ไปเปิด localhost/วงแลน/metadata ของ cloud แทนเขา

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function ipv4ToNumber(ip: string): number {
  return ip.split(".").reduce((n, part) => n * 256 + Number(part), 0);
}

// [network, prefix length] — loopback, private, link-local (รวม 169.254.169.254 metadata), CGNAT, multicast ฯลฯ
const BLOCKED_IPV4: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

export function isPublicAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const n = ipv4ToNumber(ip);
    return !BLOCKED_IPV4.some(([network, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return ((n & mask) >>> 0) === ((ipv4ToNumber(network) & mask) >>> 0);
    });
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPublicAddress(mapped[1]);
    if (lower === "::" || lower === "::1") return false;
    // fc00::/7 (unique local), fe80::/10 (link-local), ff00::/8 (multicast)
    return !/^(f[cd]|fe[89ab]|ff)/.test(lower);
  }
  return false;
}

/**
 * true = เปิดได้: http(s), พอร์ตมาตรฐาน, และทุก IP ที่ชื่อโดเมน resolve ได้เป็น IP สาธารณะ
 * (ยังมีช่องว่าง DNS rebinding ระหว่าง lookup กับ fetch — ยอมรับได้สำหรับการดึงแค่ <head> ของหน้าเว็บ)
 */
export async function isFetchableUrl(url: URL): Promise<boolean> {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (url.port && url.port !== "80" && url.port !== "443") return false;
  if (url.username || url.password) return false;

  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) return isPublicAddress(host);
  if (!host.includes(".") || host.endsWith(".localhost") || host.endsWith(".internal")) return false;

  try {
    const addresses = await lookup(host, { all: true, verbatim: true });
    return addresses.length > 0 && addresses.every((a) => isPublicAddress(a.address));
  } catch {
    return false;
  }
}
