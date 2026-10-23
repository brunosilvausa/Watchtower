import { describe, expect, it } from "vitest";
import { formatProductDate } from "./date-preferences";
describe("product date preferences", () => {
  it("uses the selected timezone across calendar-day boundaries", () => {
    expect(formatProductDate("2026-10-22T01:30:00Z", { timezone: "America/New_York", dateFormat: "DD/MM/YYYY" })).toBe("21/10/2026 21:30 (America/New_York)");
    expect(formatProductDate("2026-10-22T01:30:00Z", { timezone: "UTC", dateFormat: "MM/DD/YYYY" })).toBe("10/22/2026 01:30 (UTC)");
    expect(formatProductDate("2026-10-22T01:30:00Z", { timezone: "UTC", dateFormat: "YYYY-MM-DD" })).toBe("2026-10-22 01:30 (UTC)");
  });
  it("keeps missing/invalid observations unknown", () => {
    expect(formatProductDate(null, { timezone: "UTC", dateFormat: "DD/MM/YYYY" })).toBe("—");
    expect(formatProductDate("invalid", { timezone: "UTC", dateFormat: "DD/MM/YYYY" })).toBe("—");
  });
});
