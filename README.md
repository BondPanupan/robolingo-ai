This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Docker

ต้องมี `.env.local` ก่อน (copy จาก `.env.example` แล้วใส่ค่า LINE และ Basic Auth) — ไม่ต้องตั้ง `MONGODB_URI` เพราะ compose ใส่ให้

MongoDB ใน compose เปิด `--auth` เสมอ (dev ใช้ user `robolingo` / `robolingo-dev` ถ้าไม่ได้ตั้ง `MONGO_ROOT_USERNAME` / `MONGO_ROOT_PASSWORD`)
ต่อจากเครื่อง host (Compass, mongosh หรือ `npm run dev`) ด้วย URI ที่ยืนยันตัวตนกับ db `admin` แต่ใช้งาน db `line-webchat`:

```
mongodb://robolingo:robolingo-dev@localhost:27017/line-webchat?authSource=admin
```

```bash
docker compose up --build                   # dev: MongoDB + Next (hot reload) → http://localhost:3000
WEB_PORT=3200 docker compose up             # ถ้าพอร์ต 3000 ไม่ว่าง
docker compose --profile tunnel up          # + Cloudflare quick tunnel ให้ LINE ส่ง webhook เข้ามาได้
docker compose logs tunnel | grep trycloudflare   # → Webhook URL = <URL ที่ได้>/api/line/webhook
docker compose down                         # หยุด (เพิ่ม -v เพื่อลบข้อมูลใน MongoDB)
```

Production (`Dockerfile` = Next.js standalone, MongoDB เปิด `--auth`): สร้างไฟล์ `.env` ข้างโปรเจกต์ (โครงเดียวกับ `.env.example` พร้อม `MONGO_ROOT_USERNAME` / `MONGO_ROOT_PASSWORD`) แล้ว

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

ต้องมี reverse proxy ที่เป็น HTTPS อยู่ข้างหน้า — LINE เรียก webhook ได้เฉพาะ HTTPS

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
