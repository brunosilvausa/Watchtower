import { expect, it } from "vitest";
import { processMetrics } from "./metrics.js";

it("reports actual process resource measurements with explicit units", () => {
  const sample = processMetrics();
  expect(sample.rssBytes).toBeGreaterThan(0);
  expect(sample.uptimeSeconds).toBeGreaterThanOrEqual(0);
  expect(sample.cpuUserMicroseconds).toBeGreaterThanOrEqual(0);
  expect(sample.cpuSystemMicroseconds).toBeGreaterThanOrEqual(0);
  expect(sample).not.toHaveProperty("checksTotal");
});
