import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { conversations } from "@/stories/fixtures";
import { ConversationList } from "./ConversationList";

const meta = {
  title: "Inbox/ConversationList",
  component: ConversationList,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ display: "grid", width: 340, height: 560 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    conversations,
    error: null,
    isLoading: false,
    selectedId: null,
    view: "all",
    onViewChange: fn(),
    onSelect: fn(),
    onPopout: fn(),
    onRetry: fn(),
  },
} satisfies Meta<typeof ConversationList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** badge ยังไม่อ่าน, preview ข้อความ/สติกเกอร์/รูป, ชื่อยาวถูกตัด — hover แถวเพื่อดูปุ่ม ↗ */
export const Default: Story = {};

export const Selected: Story = {
  args: { selectedId: "U1002" },
};

export const UnreadView: Story = {
  args: { view: "unread" },
};

export const Loading: Story = {
  args: { conversations: undefined, isLoading: true },
};

export const LoadError: Story = {
  args: { conversations: undefined, error: new Error("Request failed (500)") },
};

/** โหลดได้แล้วแต่ poll รอบล่าสุดล้ม → แถบเตือนด้านบน รายการเดิมยังอยู่ */
export const ReconnectingError: Story = {
  args: { error: new Error("Network error") },
};

export const Empty: Story = {
  args: { conversations: [] },
};
