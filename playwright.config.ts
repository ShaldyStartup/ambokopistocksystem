import { defineConfig } from "@playwright/test";
const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";
const local = ["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname);
export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL, channel: process.env.E2E_BROWSER_CHANNEL || undefined },
  workers: 1,
  webServer: local
    ? {
        command: "npm run dev -- --hostname 127.0.0.1",
        url: baseURL + "/login",
        reuseExistingServer: !process.env.CI,
        timeout: 60000,
      }
    : undefined,
});
