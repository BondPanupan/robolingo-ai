# Production image — multi-stage build using Next.js `output: "standalone"` (see next.config.ts).
# Final image ships only the standalone server + static assets, not the full source tree/node_modules.
# Secrets (LINE token/secret, MONGODB_URI, Basic Auth) come in at runtime via env — never baked in.
# For local dev with hot reload, use Dockerfile.dev + docker-compose.yml instead.
# Pattern reference: booking-engine-frontend/Dockerfile

# deps/builder รันบน platform ของเครื่องที่ build ($BUILDPLATFORM) ไม่ใช่ปลายทาง:
# - ผลของ next build เป็น JS ใช้ได้ทุก platform และ standalone ไม่มี native module (ตรวจแล้ว ไม่มีไฟล์ .node)
# - build linux/amd64 บน Mac (arm64) ผ่าน Rosetta จะพัง: Docker ใส่ --no-opt ให้ node แล้ว next ส่งต่อเข้า
#   NODE_OPTIONS ของ worker ซึ่ง node ไม่ยอม ("--no-opt is not allowed in NODE_OPTIONS") — และ native เร็วกว่ามาก
FROM --platform=$BUILDPLATFORM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# เน็ตหลุดกลางทาง (ECONNRESET) ไม่ให้ build ล้มทันที: ลองโหลดซ้ำหลายรอบ และเก็บ cache ของ npm ข้าม build
# (cache mount ของ BuildKit — แพ็กเกจที่โหลดแล้วไม่ต้องโหลดใหม่ตอนรันซ้ำ และไม่ติดไปใน image)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --no-fund \
      --fetch-retries=5 --fetch-retry-mintimeout=10000 --fetch-retry-maxtimeout=60000

FROM --platform=$BUILDPLATFORM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
# sharp (ย่อรูปของ next/image) ติดมาเป็น native binary ของ $BUILDPLATFORM — ใช้บน platform ปลายทางไม่ได้
# แอปนี้ไม่ใช้ next/image (images.unoptimized ใน next.config.ts) จึงตัดทิ้ง ไม่ให้มีไฟล์ผิด arch ใน image
RUN rm -rf .next/standalone/node_modules/@img

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# standalone output ไม่รวม public/ และ .next/static ให้เองต้อง copy เพิ่มตามเอกสาร Next.js
COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000
CMD ["node", "server.js"]
