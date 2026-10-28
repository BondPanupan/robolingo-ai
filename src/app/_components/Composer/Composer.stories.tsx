import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fireEvent, fn, userEvent, within } from "storybook/test";
import { SAMPLE_IMAGE_URL, SAMPLE_PICTURE_URL } from "@/stories/fixtures";
import { Composer } from "./Composer";

const meta = {
  title: "Inbox/Composer",
  component: Composer,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <Story />
      </div>
    ),
  ],
  args: { onSend: fn(), onPickImages: fn(), disabled: false },
} satisfies Meta<typeof Composer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** ไม่มี onPickImages = ไม่มีปุ่มแนบรูป */
export const TextOnly: Story = {
  args: { onPickImages: undefined },
};

/** เลือกหลายรูปจากปุ่ม → ส่งต่อไปแนบทั้งหมดตามลำดับ */
export const PicksImages: Story = {
  play: async ({ args, canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')!;
    const files = [new File(["a"], "a.jpg", { type: "image/jpeg" }), new File(["b"], "b.png", { type: "image/png" })];
    fireEvent.change(input, { target: { files } });
    await expect(args.onPickImages).toHaveBeenCalledWith(files);
  },
};

export const PreparingImage: Story = {
  args: { isPreparingImage: true },
};

const sampleAttachments = [
  { id: "1", file: new File([], "photo-1.jpg", { type: "image/jpeg" }), url: SAMPLE_IMAGE_URL },
  { id: "2", file: new File([], "avatar.png", { type: "image/png" }), url: SAMPLE_PICTURE_URL },
  { id: "3", file: new File([], "IMG_0042.HEIC", { type: "image/heic" }), url: "blob:broken" },
];

/** รูปที่แนบไว้ก่อนส่ง (รูปที่ 3 แสดงตัวอย่างไม่ได้ → ชื่อนามสกุลแทน) — ส่งได้แม้ไม่พิมพ์ข้อความ */
export const WithAttachments: Story = {
  args: { attachments: sampleAttachments, onRemoveAttachment: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "เอา photo-1.jpg ออก" }));
    await expect(args.onRemoveAttachment).toHaveBeenCalledWith("1");
    await userEvent.click(canvas.getByRole("button", { name: "ส่ง" }));
    await expect(args.onSend).toHaveBeenCalledWith("");
  },
};

/** เปิดไฟล์รูปไม่ได้ (เช่น HEIC บน Chrome) → ข้อความแจ้งแทน hint */
export const ImageError: Story = {
  args: { imageError: 'เปิดไฟล์ "photo.heic" ไม่ได้ ลองใช้ไฟล์ JPG หรือ PNG' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

/** Enter ส่ง (ตัดช่องว่างหัวท้าย), Shift+Enter ไม่ส่ง */
export const SendsOnEnter: Story = {
  args: {
    disabled: true
  },

  play: async ({ args, canvasElement }) => {
    const box = within(canvasElement).getByRole("textbox", { name: "ข้อความ" });
    // user-event's typing doesn't reach React 19.3's controlled textarea here; fireEvent.change does.
    fireEvent.change(box, { target: { value: "  สวัสดีครับ\nมีสีดำครับ  " } });
    await userEvent.click(box);
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
    await expect(args.onSend).not.toHaveBeenCalled();
    await userEvent.keyboard("{Enter}");
    await expect(args.onSend).toHaveBeenCalledWith("สวัสดีครับ\nมีสีดำครับ");
    await expect(box).toHaveValue("");
  }
};
