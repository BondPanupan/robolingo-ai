# Production image — multi-stage build using Next.js `output: "standalone"` (see next.config.ts).
# Final image ships only the standalone server + static assets, not the full source tree/node_modules.
# Secrets (LINE token/secret, MONGODB_URI, Basic Auth) come in at runtime via env — never baked in.
# For local dev with hot reload, use Dockerfile.dev + docker-compose.yml instead.
# Pattern reference: booking-engine-frontend/Dockerfile

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

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
