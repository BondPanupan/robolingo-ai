// URL สาธารณะของเว็บนี้ — ใช้สร้างลิงก์ไฟล์ที่ให้เซิร์ฟเวอร์ LINE มาดึง (LINE รับเฉพาะ https)

import { BadRequestException } from "./http-exception";

/**
 * PUBLIC_BASE_URL ก่อน (ตั้งเมื่อเข้าเว็บผ่าน localhost แต่มี tunnel/โดเมนจริง)
 * ไม่ตั้งก็ใช้ origin ที่แอดมินเปิดเว็บอยู่ (Vercel, ngrok ส่ง x-forwarded-* มาให้)
 * @throws BadRequestException ถ้าไม่ใช่ https — LINE จะปฏิเสธรูปอยู่ดี บอกแอดมินให้ชัดก่อนเสียโควตา push
 */
export function resolvePublicBaseUrl(request: Request): string {
  const configured = process.env.PUBLIC_BASE_URL?.trim();
  let base: string;
  if (configured) {
    base = configured;
  } else {
    const url = new URL(request.url);
    const proto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? url.protocol.replace(":", "");
    const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() ?? request.headers.get("host") ?? url.host;
    base = `${proto}://${host}`;
  }

  if (!base.startsWith("https://")) {
    throw new BadRequestException(
      "ส่งรูปได้เมื่อเปิดเว็บผ่าน HTTPS สาธารณะเท่านั้น (เช่น โดเมน Vercel หรือ ngrok) หรือตั้ง PUBLIC_BASE_URL",
    );
  }
  return base.replace(/\/+$/, "");
}
