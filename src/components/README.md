# Component Library

shared components ของโปรเจกต์ (แยกออกจาก `app/` เพื่อไม่ให้ path ใต้ `app/` ถูกตีความเป็น route)

```
src/components/
├── ui/       # base UI ที่ generic ไม่ผูกกับ business logic (Avatar, ...)
├── layout/   # ชิ้นส่วนโครงหน้า (TopBar, ...)
└── index.ts  # barrel export รวมทุกกลุ่ม
```

## Convention ต่อ component

แต่ละ component อยู่ในโฟลเดอร์ของตัวเอง ใช้ PascalCase:

```
ui/Avatar/
├── Avatar.tsx          # ตัว component
├── Avatar.module.css   # style (CSS Modules)
├── Avatar.stories.tsx  # Storybook stories (colocate กับ component)
└── index.ts            # re-export เพื่อ import สั้น ๆ เช่น "@/components/ui/Avatar"
```

## Storybook

```bash
npm run storybook        # dev ที่ http://localhost:6006
npm run build-storybook  # build static ไปที่ storybook-static/
```

- story อยู่ข้าง component เสมอ (`Name.stories.tsx`) ทั้งใน `components/` และ `app/_components/`
- ข้อมูลตัวอย่างใช้ร่วมกันจาก `src/stories/fixtures.ts`
- `Inbox (full page)` ต่อกับ backend จำลอง (`NEXT_PUBLIC_MOCK_API=1` ตั้งใน `.storybook/main.ts`)
- ทดสอบ interaction ด้วย `play` (ดู `Composer.stories.tsx`) — พิมพ์ข้อความใน textarea ให้ใช้ `fireEvent.change`
  เพราะ `userEvent.type` ไม่อัปเดต state ของ React 19.3 controlled input ในโปรเจกต์นี้

- Import ผ่าน barrel เสมอ: `import { Avatar } from "@/components/ui/Avatar";`
- component ที่ผูกกับหน้าใดหน้าหนึ่งให้ colocate ไว้ใต้ route นั้นแทน เช่น `app/_components/` ของหน้า Inbox (`/`)

## โครงสร้างอื่นใน `src/`

| Path | เก็บอะไร |
| --- | --- |
| `app/_components/` | component เฉพาะหน้า Inbox (`Inbox`, `ConversationList`, `ChatPanel`, `Composer`, `MessageBubble`, `InboxViews`, `ContactPanel`) |
| `lib/chat-api.ts` | type ของ API + client ที่เรียก `/api/*` (`chatApi`) |
| `lib/mock-chat.ts` | backend จำลองในเบราว์เซอร์ เปิดด้วย `NEXT_PUBLIC_MOCK_API=1` |
| `lib/chat-format.ts` | format วันที่/ข้อความ preview |
| `lib/usePolling.ts` | hook ดึงข้อมูลซ้ำเป็นระยะ (realtime แบบ polling) |
| `lib/config.ts` | ค่า config ฝั่ง client |
| `types/` | เฉพาะไฟล์ `.d.ts` ของ global/third-party |
