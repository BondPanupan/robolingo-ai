import type { NextConfig } from "next";

/** hostname ของ PUBLIC_BASE_URL (เช่น ngrok) — undefined ถ้าไม่ได้ตั้งหรือรูปแบบผิด */
function publicHostname(): string | undefined {
  try {
    return process.env.PUBLIC_BASE_URL ? new URL(process.env.PUBLIC_BASE_URL).hostname : undefined;
  } catch {
    return undefined;
  }
}
const tunnelHost = publicHostname();

const nextConfig: NextConfig = {
  // Dockerfile ใช้ .next/standalone — image จริงมีแค่ server + asset ไม่ต้องพก node_modules ทั้งก้อน
  // (Vercel ไม่สนค่านี้ deploy ได้เหมือนเดิม)
  output: "standalone",
  // next dev บล็อกไฟล์ dev (JS chunk, HMR) ที่ถูกขอจากโดเมนอื่นนอกจาก localhost — เปิดเว็บผ่าน tunnel แล้ว
  // React ไม่ทำงานเลย อนุญาตเฉพาะโดเมนใน PUBLIC_BASE_URL (มีผลแค่ตอน dev)
  allowedDevOrigins: tunnelHost ? [tunnelHost] : [],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
