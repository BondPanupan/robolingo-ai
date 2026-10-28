import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { InboxViews } from "./InboxViews";

const meta = {
  title: "Inbox/InboxViews",
  component: InboxViews,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ display: "grid", width: 220, height: 420 }}>
        <Story />
      </div>
    ),
  ],
  args: { view: "all", counts: { all: 12, unread: 3 }, onChange: fn() },
} satisfies Meta<typeof InboxViews>;

export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {};

export const Unread: Story = {
  args: { view: "unread" },
};
