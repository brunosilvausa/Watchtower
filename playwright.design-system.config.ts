import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/design-system",
  outputDir: "test-results/design-system",
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3138", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: { command: "pnpm --filter @watchtower/web dev --port 3138", url: "http://127.0.0.1:3138", reuseExistingServer: false, timeout: 120_000 },
});
