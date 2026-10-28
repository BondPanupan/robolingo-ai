import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fireEvent, fn, userEvent, within } from "storybook/test";
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
  args: { onSend: fn(), disabled: false },
} satisfies Meta<typeof Composer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

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
