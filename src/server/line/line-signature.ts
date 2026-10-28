// ตรวจ x-line-signature ของ webhook: base64(HMAC-SHA256(channel secret, raw body))
// ต้องใช้ body ดิบก่อน parse JSON — parse แล้ว stringify ใหม่ไบต์จะไม่ตรง

import { createHmac, timingSafeEqual } from "node:crypto";

export function signLineBody(body: string, channelSecret: string): string {
  return createHmac("sha256", channelSecret).update(body, "utf8").digest("base64");
}

export function verifyLineSignature(
  body: string,
  signature: string | null | undefined,
  channelSecret: string,
): boolean {
  if (!signature || !channelSecret) return false;

  const expected = Buffer.from(signLineBody(body, channelSecret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
