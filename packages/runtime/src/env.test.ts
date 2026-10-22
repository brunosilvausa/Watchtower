import { describe, expect, it } from "vitest";
import { databaseUrlSchema, parseEnv, logLevelSchema } from "./env.js";

describe("environment boundary", () => {
  it("rejects a missing database URL without leaking input", () => {
    expect(() => parseEnv("DATABASE_URL", undefined, databaseUrlSchema)).toThrow("Invalid or missing environment variable: DATABASE_URL");
    expect(() => parseEnv("DATABASE_URL", "https://secret:password@host", databaseUrlSchema)).toThrow(/^Invalid or missing environment variable: DATABASE_URL$/);
  });
  it("accepts PostgreSQL URLs and defaults logging", () => {
    expect(parseEnv("DATABASE_URL", "postgresql://localhost/watchtower", databaseUrlSchema)).toBe("postgresql://localhost/watchtower");
    expect(parseEnv("LOG_LEVEL", undefined, logLevelSchema)).toBe("info");
  });
  it("rejects unknown log levels", () => {
    expect(() => parseEnv("LOG_LEVEL", "password", logLevelSchema)).toThrow(/^Invalid or missing environment variable: LOG_LEVEL$/);
  });
});
