import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    environmentMatchGlobs: [
      ["src/server/**", "node"],
    ],
    setupFiles: ["src/client/test-setup.ts"],
  },
});
