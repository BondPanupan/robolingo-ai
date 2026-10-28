import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PopoutIcon } from "./PopoutIcon";

const meta = {
  title: "UI/PopoutIcon",
  component: PopoutIcon,
  args: { size: 16 },
} satisfies Meta<typeof PopoutIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** สีตาม currentColor ของ parent */
export const Colored: Story = {
  render: (args) => (
    <span style={{ color: "var(--highlight)" }}>
      <PopoutIcon {...args} size={24} />
    </span>
  ),
};
