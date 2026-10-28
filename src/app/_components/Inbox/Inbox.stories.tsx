import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Inbox } from "./Inbox";

/**
 * หน้า Inbox ทั้งหน้า ต่อกับ backend จำลอง (lib/mock-chat.ts — Storybook ตั้ง NEXT_PUBLIC_MOCK_API=1 ให้)
 * คลิกแชท ส่งข้อความ หรือพิมพ์คำว่า "fail" เพื่อดู error ได้จริง; ข้อความขาเข้าใหม่เด้งทุก ~20 วินาที
 */
const meta = {
  title: "Inbox/Inbox (full page)",
  component: Inbox,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Inbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
