// Basic Auth ของหน้าแอดมิน — user/password มาจาก env (BASIC_AUTH_USER / BASIC_AUTH_PASSWORD)
// เปลี่ยนรหัสได้ทุกเมื่อ: แก้ค่า env ใน Vercel แล้ว redeploy เบราว์เซอร์ที่จำรหัสเก่าไว้จะถูกถามใหม่

import { timingSafeEqual } from "node:crypto";

export interface BasicAuthCredentials {
  user: string;
  password: string;
}

/** null = ยังไม่ได้ตั้งค่า env */
export function getBasicAuthCredentials(): BasicAuthCredentials | null {
  const user = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !password) return null;
  return { user, password };
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  // timingSafeEqual ต้องการความยาวเท่ากัน — เทียบกับตัวเองแทนเพื่อไม่ให้เวลาบอกความยาวรหัส
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

/** ตรวจ header `Authorization: Basic <base64(user:password)>` */
export function isAuthorized(header: string | null, expected: BasicAuthCredentials): boolean {
  if (!header?.startsWith("Basic ")) return false;

  let decoded: string;
  try {
    decoded = Buffer.from(header.slice("Basic ".length), "base64").toString("utf8");
  } catch {
    return false;
  }

  const sep = decoded.indexOf(":");
  if (sep === -1) return false;

  // เช็คทั้งสองค่าเสมอ ไม่ short-circuit
  const userOk = safeEqual(decoded.slice(0, sep), expected.user);
  const passwordOk = safeEqual(decoded.slice(sep + 1), expected.password);
  return userOk && passwordOk;
}
