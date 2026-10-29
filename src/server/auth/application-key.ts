import { timingSafeEqual } from "node:crypto";

export function isApplicationKeyValid(): boolean {
  const provided = process.env.APPLICATION_KEY;
  const expected = process.env.APPLICATION_KEY_EXPECTED;
  if (!provided || !expected) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}
