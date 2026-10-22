import { defineConfig, globalIgnores } from "eslint/config";
import drizzle from "eslint-plugin-drizzle";
import base from "./eslint-rules/next-base.mjs";

export default defineConfig([
  ...base,
  globalIgnores(["**/.next/**", "**/dist/**", "**/next-env.d.ts", ".vitest/**", "test-results/**", "playwright-report/**"]),
  { settings: { next: { rootDir: "apps/web/" } } },
  {
    files: ["apps/**/*.{ts,tsx}", "packages/**/*.ts"],
    plugins: { drizzle },
    rules: {
      "quality/no-direct-console": ["error", { logger: "the redacted server logger" }],
      "quality/no-direct-data-access": ["error", {
        modules: ["@watchtower/database", "@/db", "@/db/index"],
        bindings: ["db", "getDb"], layers: ["/src/app/", "/src/components/"], extensions: [".tsx"],
      }],
      "drizzle/enforce-delete-with-where": ["error", { drizzleObjectName: ["db"] }],
      "drizzle/enforce-update-with-where": ["error", { drizzleObjectName: ["db"] }],
    },
  },
  {
    files: ["apps/web/src/components/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { patterns: ["@watchtower/database", "@watchtower/runtime"] }] },
  },
]);
