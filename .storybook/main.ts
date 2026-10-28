import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  framework: "@storybook/nextjs-vite",
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  staticDirs: ["../public"],
  core: { disableTelemetry: true },
  // Stories that render the whole Inbox talk to the in-browser fake backend, never a real /api.
  env: (config) => ({ ...config, NEXT_PUBLIC_MOCK_API: "1" }),
};

export default config;
