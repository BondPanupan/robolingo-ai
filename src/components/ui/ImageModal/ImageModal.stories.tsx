import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { SAMPLE_IMAGE_URL, SAMPLE_PICTURE_URL } from "@/stories/fixtures";
import { ImageModal } from "./ImageModal";

const meta = {
  title: "UI/ImageModal",
  component: ImageModal,
  parameters: { layout: "fullscreen" },
  args: {
    src: SAMPLE_IMAGE_URL,
    alt: "[รูปภาพ]",
    title: "รูปภาพ",
    subtitle: "ลูกค้าส่ง · วันนี้ 20:07",
    onClose: fn(),
  },
} satisfies Meta<typeof ImageModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Landscape: Story = {};

/** รูปแนวตั้ง/สี่เหลี่ยม — กล่องกว้างเท่าเดิม รูปอยู่กลาง */
export const Square: Story = {
  args: { src: SAMPLE_PICTURE_URL },
};

/** เปิด/ปิดซ้ำได้ — ปิดด้วย Esc, ปุ่ม ×, ปุ่ม "ปิด" หรือคลิกพื้นหลังนอกกล่อง */
export const Toggle: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => setIsOpen(true)}>เปิดรูป</button>
        {isOpen && <ImageModal {...args} onClose={() => setIsOpen(false)} />}
      </div>
    );
  },
};
