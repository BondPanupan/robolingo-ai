import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { messages, minutesAgo, pendingMessages, SAMPLE_STICKER_URL } from "@/stories/fixtures";
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

export const Multiline: Story = {
  args: { message: messages[4] },
};

/** รูปที่ backend ยังไม่ได้เก็บ contentUrl → placeholder */
export const ImagePlaceholder: Story = {
  args: { message: messages[2] },
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
