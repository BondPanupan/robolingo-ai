import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SAMPLE_IMAGE_URL } from "@/stories/fixtures";
import { LinkPreviewCard } from "./LinkPreview";

/** การ์ดอย่างเดียว (ไม่ยิง /api/link-preview) — วางใน bubble ทั้งขาเข้าและขาออกเพื่อดูสี */
const meta = {
  title: "Inbox/LinkPreviewCard",
  component: LinkPreviewCard,
  args: {
    preview: {
      url: "https://booking.example.com/bistro/status/BKK-7NAXV9",
      title: "สถานะการจอง · Bistro De L'Aurore",
      description: "เข้าสู่ระบบจัดการร้าน ดูคิวและสถานะการจองของคุณได้ที่นี่",
      image: SAMPLE_IMAGE_URL,
      siteName: "Saveurnote",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 420 }}>
        <div style={{ padding: "10px 14px", border: "1px solid #dfe3eb", borderRadius: 8, background: "#fff" }}>
          <Story />
        </div>
        <div style={{ padding: "10px 14px", borderRadius: 8, color: "#fff", background: "#425b76" }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof LinkPreviewCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {};

export const NoImage: Story = {
  args: { preview: { ...meta.args.preview, image: null } },
};

/** หน้าเว็บมีแค่ <title> — ไม่มีคำอธิบาย ไม่มีชื่อเว็บ ใช้โดเมนแทน */
export const TitleOnly: Story = {
  args: { preview: { url: "https://www.example.com/page", title: "Example page", description: null, image: null, siteName: null } },
};
