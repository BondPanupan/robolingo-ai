# Backend (`src/server/`)

โค้ดฝั่ง server ทั้งหมด จัดชั้นแบบเดียวกับ `booking-engine-backend` (NestJS) แต่ไม่มี DI — use-case และ service เป็นฟังก์ชัน/อ็อบเจกต์ธรรมดา
`route.ts` ใน `src/app/api/` ทำหน้าที่เป็น **controller**: อ่าน request → เรียก use-case → ตอบ JSON เท่านั้น ไม่มี logic

```
src/app/api/                      # controller (Next route handler)
├── line/webhook/route.ts
├── conversations/route.ts
├── conversations/[id]/read/route.ts
├── messages/route.ts
├── messages/[id]/content/route.ts
├── messages/image/route.ts       # แอดมินส่งรูป (multipart)
├── media/[id]/(preview/)route.ts # ไฟล์รูปที่แอดมินส่ง — สาธารณะ ให้ LINE ดึงได้ (ไม่อยู่หลัง Basic Auth)
└── link-preview/route.ts         # Open Graph ของลิงก์ในข้อความ

src/server/
├── app/<feature>/                # business logic แยกตาม feature (≈ booking-engine-backend/src/app)
│   ├── use-cases/*.use-case.ts   #   1 ไฟล์ = 1 endpoint/งาน
│   ├── dto/*.dto.ts              #   ตรวจ/แปลง body ของ request
│   └── lib/                      #   helper ของ feature นั้น เช่น to-*-view.ts (document → response)
│       conversation/  message/  line-webhook/  media/  link-preview/
├── databaseModules/<entity>/     # query ต่อ collection — ไม่มี business logic
│   ├── <entity>.service.ts
│   └── interfaces/<entity>.interface.ts
├── schemas/*.schema.ts           # Mongoose schema + model
├── database/connect-db.ts        # เชื่อม MongoDB (MONGODB_URI)
├── line/                         # LINE Messaging API (≈ verification/ ของ booking-engine: service ภายนอก)
│   ├── line.service.ts
│   ├── line-signature.ts (+ .spec.ts)
│   └── interfaces/line-webhook.interface.ts
├── auth/basic-auth.ts            # Basic Auth ของหน้าแอดมิน (ใช้ใน src/proxy.ts)
└── common/                       # HttpException, toErrorResponse, ตรวจ LINE userId, public-base-url, sniff-image-type
```

## ทิศทางการ import

`route.ts` → `app/<feature>/use-cases` → `databaseModules/*` + `line/` → `schemas/`

- use-case โยน `HttpException` (`BadRequestException`, `NotFoundException`, ...) — controller แปลงเป็น `{ error }` ด้วย `toErrorResponse`
- type ของ response ใช้ตัวเดียวกับ frontend จาก `@/lib/chat-api` (สัญญา API มีที่เดียว)
- ห้าม import `src/server/*` จาก client component — มี secret (token, รหัสผ่าน) และ Mongoose

## Test

```bash
npm test   # node:test — ไฟล์ *.spec.ts ข้างโค้ดที่ทดสอบ
```
