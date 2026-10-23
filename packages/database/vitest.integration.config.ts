import { defineConfig } from 'vitest/config';
export default defineConfig({ resolve: { alias: { 'server-only': new URL('./tests/server-only.ts', import.meta.url).pathname } }, test: { include: ['tests/**/*.integration.test.ts'], testTimeout: 15000, hookTimeout: 15000, fileParallelism: false } });
