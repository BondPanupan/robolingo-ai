import type { Preview } from "@storybook/nextjs-vite";
import { fontVariables } from "../src/app/fonts";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: { expanded: true },
    backgrounds: {
      options: {
        app: { name: "App", value: "#f5f8fa" },
        surface: { name: "Surface", value: "#ffffff" },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: "app" },
  },
  decorators: [
    (Story) => (
      <div className={fontVariables} style={{ fontFamily: "var(--font-latin), var(--font-thai), sans-serif" }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
