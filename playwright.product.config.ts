import { defineConfig, devices } from "@playwright/test";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
const spool = process.env.AUTH_MAIL_DIRECTORY ?? mkdtempSync(join(tmpdir(), "watchtower-browser-mail-"));
mkdirSync(spool, { recursive: true, mode: 0o700 });
process.env.AUTH_MAIL_DIRECTORY = spool;
export default defineConfig({ testDir: "./tests/browser", testMatch: /product.*\.spec\.ts/, outputDir: "test-results/product", workers: 1, fullyParallel: false, reporter: "list", use: { baseURL: "http://127.0.0.1:3137", trace: "retain-on-failure" }, projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }, { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } }], webServer: { command: "pnpm --filter @watchtower/web start --port 3137", url: "http://127.0.0.1:3137", reuseExistingServer: false, timeout: 30000, env: { DATABASE_URL: process.env.DATABASE_TEST_URL ?? "postgresql://watchtower_app:local-app-only@127.0.0.1:55432/watchtower_dev", BETTER_AUTH_URL: "http://127.0.0.1:3137", BETTER_AUTH_SECRET: randomBytes(32).toString("hex"), PRODUCT_ENCRYPTION_KEY: randomBytes(32).toString("hex"), MAIL_TRANSPORT: "local", AUTH_MAIL_DIRECTORY: spool } } });
