import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Each test file gets its own module graph, so its own in-memory database (D-014).
    setupFiles: ["tests/setup.ts"],
    env: {
      DATABASE_URL: ":memory:",
      SESSION_SECRET: "test-secret-0123456789-0123456789-0123456789",
    },
  },
});
