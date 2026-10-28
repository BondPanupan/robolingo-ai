import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { messages, minutesAgo, pendingMessages, SAMPLE_IMAGE_URL, SAMPLE_STICKER_URL } from "@/stories/fixtures";
import { MessageBubble, PendingBubble } from "./MessageBubble";

const meta = {
  title: "Inbox/MessageBubble",
  component: MessageBubble,
  decorators: [
    (Story) => (
      <div style={{ display: "flex", flexDirection: "column", width: 420 }}>
        <Story />
      </div>
    ),
  ],
  args: { message: messages[0] },
} satisfies Meta<typeof MessageBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inbound: Story = {};

export const Outbound: Story = {
  args: { message: messages[1] },
};

/** ลูกค้ายังไม่ได้ตอบหลังข้อความนี้ — ไม่รู้ว่าอ่านหรือยัง จึงไม่แสดง "อ่านแล้ว" */
export const OutboundNotYetRead: Story = {
  args: { message: { ...messages[1], readAt: null } },
};

export const Multiline: Story = {
  args: { message: messages[4] },
};

/** รูปที่ backend ยังไม่ได้เก็บ contentUrl → placeholder */
export const ImagePlaceholder: Story = {
  args: { message: messages[2] },
};

/** คลิกรูป → Modal Box รูปใหญ่, ปุ่ม "ปิด" ปิด (Esc ใช้ได้กับคีย์บอร์ดจริง แต่ปุ่มจำลองของ user-event ไม่ทำให้ <dialog> ปิด) */
export const ImageOpensModal: Story = {
  args: { message: { ...messages[2], contentUrl: SAMPLE_IMAGE_URL } },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "ดูรูปขนาดใหญ่" }));
    const dialog = await page.findByRole("dialog", { name: "รูปภาพ" });
    await expect(dialog).toHaveAttribute("open");
    await expect(within(dialog).getByRole("button", { name: "ปิดหน้าต่าง" })).toHaveFocus();
    await userEvent.click(within(dialog).getByRole("button", { name: "ปิด" }));
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
  },
};

export const StickerWithContent: Story = {
  args: { message: { ...messages[3], contentUrl: SAMPLE_STICKER_URL } },
};

export const UnsupportedType: Story = {
  args: { message: { ...messages[0], id: "x", type: "other", text: null, createdAt: minutesAgo(1) } },
};

export const Sending: Story = {
  render: () => <PendingBubble pending={pendingMessages[0]} onRetry={fn()} onDiscard={fn()} />,
};

export const Failed: Story = {
  render: () => <PendingBubble pending={pendingMessages[1]} onRetry={fn()} onDiscard={fn()} />,
};

const pendingImage = {
  ...pendingMessages[0],
  text: "",
  image: { full: new Blob(), preview: new Blob(), objectUrl: SAMPLE_IMAGE_URL },
};

/** รูปที่ย่อแล้วขึ้นทันทีระหว่างอัปโหลด */
export const SendingImage: Story = {
  render: () => <PendingBubble pending={pendingImage} onRetry={fn()} onDiscard={fn()} />,
};

/** ส่งรูปไม่ผ่าน — แสดงเหตุผลจาก server (เช่น เปิดเว็บผ่าน http://localhost) */
export const FailedImage: Story = {
  render: () => (
    <PendingBubble
      pending={{ ...pendingImage, status: "failed", error: "ส่งรูปได้เมื่อเปิดเว็บผ่าน HTTPS สาธารณะเท่านั้น" }}
      onRetry={fn()}
      onDiscard={fn()}
    />
  ),
};
