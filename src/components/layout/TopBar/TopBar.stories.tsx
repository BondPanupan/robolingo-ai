import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { TopBar } from "./TopBar";

const meta = {
  title: "Layout/TopBar",
  component: TopBar,
  parameters: { layout: "fullscreen" },
  args: { online: true, soundEnabled: true, onSoundChange: fn() },
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Online: Story = {};

/** การ poll รายการแชทล้มเหลว → จุดแดง */
export const Offline: Story = {
  args: { online: false },
};

export const SoundOff: Story = {
  args: { soundEnabled: false },
};

/** กดปุ่มเสียงสลับเปิด/ปิด */
export const ToggleSound: Story = {
  render: (args) => {
    const [enabled, setEnabled] = useState(true);
    return (
      <TopBar
        {...args}
        soundEnabled={enabled}
        onSoundChange={(next) => {
          setEnabled(next);
          args.onSoundChange?.(next);
        }}
      />
    );
  },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: /เสียง/ });
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(button);
    await expect(args.onSoundChange).toHaveBeenCalledWith(false);
    await expect(button).toHaveAttribute("aria-pressed", "false");
  },
};
