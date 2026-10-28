import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { conversations, messages, pendingMessages } from "@/stories/fixtures";
import { ChatPanel, ChatPlaceholder } from "./ChatPanel";

const meta = {
  title: "Inbox/ChatPanel",
  component: ChatPanel,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ display: "grid", height: 640, maxWidth: 760 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    conversation: conversations[0],
    messages,
    pending: [],
    error: null,
    isLoading: false,
    onSend: fn(),
    onSendImage: fn(async () => {}),
    onRetrySend: fn(),
    onDiscard: fn(),
    onRetryLoad: fn(),
    onBack: fn(),
    onPopout: fn(),
  },
} satisfies Meta<typeof ChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** ข้อความที่กำลังส่ง + ส่งไม่สำเร็จ (optimistic UI) */
export const WithPending: Story = {
  args: { pending: pendingMessages },
};

/** หน้าต่างแยก: ไม่มีปุ่มย้อนกลับ/ปุ่ม ↗ */
export const Popout: Story = {
  args: { onBack: undefined, onPopout: undefined },
};

export const Loading: Story = {
  args: { messages: undefined, isLoading: true },
};

export const LoadError: Story = {
  args: { messages: undefined, error: new Error("Request failed (502)") },
};

export const Reconnecting: Story = {
  args: { error: new Error("Network error") },
};

export const Empty: Story = {
  args: { messages: [] },
};

export const Placeholder: StoryObj = {
  render: () => <ChatPlaceholder />,
};
