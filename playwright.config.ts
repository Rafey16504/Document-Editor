import { defineConfig, devices } from "@playwright/test";

const PORT = 3210;

// A production build on its own port and database file, so a running `next dev`
// and local.db are untouched (D-014).
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx tsx tests/e2e/prepare-db.ts && npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: { DATABASE_URL: "file:e2e.db" },
  },
});
