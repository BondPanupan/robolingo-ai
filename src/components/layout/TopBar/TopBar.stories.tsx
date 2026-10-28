import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TopBar } from "./TopBar";

const meta = {
  title: "Layout/TopBar",
  component: TopBar,
  parameters: { layout: "fullscreen" },
  args: { online: true },
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Online: Story = {};

/** การ poll รายการแชทล้มเหลว → จุดแดง */
export const Offline: Story = {
  args: { online: false },
};
