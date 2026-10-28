import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { conversations } from "@/stories/fixtures";
import { ContactPanel } from "./ContactPanel";

const meta = {
  title: "Inbox/ContactPanel",
  component: ContactPanel,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ display: "grid", width: 300, height: 480 }}>
        <Story />
      </div>
    ),
  ],
  args: { conversation: conversations[0] },
} satisfies Meta<typeof ContactPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unread: Story = {};

export const Read: Story = {
  args: { conversation: conversations[1] },
};

/** ยังไม่ได้เลือกแชท */
export const NoSelection: Story = {
  args: { conversation: undefined },
};
