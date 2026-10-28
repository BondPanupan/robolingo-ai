import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dockerfile ใช้ .next/standalone — image จริงมีแค่ server + asset ไม่ต้องพก node_modules ทั้งก้อน
  // (Vercel ไม่สนค่านี้ deploy ได้เหมือนเดิม)
  output: "standalone",
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
