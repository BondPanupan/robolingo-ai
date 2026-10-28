import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SAMPLE_PICTURE_URL } from "@/stories/fixtures";
import { Avatar } from "./Avatar";

const meta = {
  title: "UI/Avatar",
  component: Avatar,
  args: { name: "สมหญิง ใจดี", src: null, size: 44 },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ไม่มีรูป → ตัวอักษรแรกของชื่อ สีพื้นคำนวณจากชื่อ */
export const Initial: Story = {};

export const WithPicture: Story = {
  args: { src: SAMPLE_PICTURE_URL },
};

/** URL รูปเสีย (เช่น LINE CDN หมดอายุ) → fallback เป็นตัวอักษร */
export const BrokenPicture: Story = {
  args: { src: "https://invalid.example/broken.png" },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {[24, 36, 44, 72].map((size) => (
        <Avatar key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const ColorsByName: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 8 }}>
      {["Kittipong", "Nok", "สมหญิง", "ร้านป้าแดง", "Alice", "Bob"].map((name) => (
        <Avatar key={name} {...args} name={name} />
      ))}
    </div>
  ),
};
