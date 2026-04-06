import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    environmentMatchGlobs: [
      ["src/server/**", "node"],
    ],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".claude"],
    setupFiles: ["src/client/test-setup.ts"],
  },
});
