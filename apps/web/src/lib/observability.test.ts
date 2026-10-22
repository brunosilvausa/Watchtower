import { afterEach, expect, it, vi } from "vitest";

const { info } = vi.hoisted(() => ({ info: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@watchtower/runtime", () => ({
  createLogger: () => ({ info }),
  processMetrics: () => ({ rssBytes: 123 }),
}));
import { startProcessMetrics } from "./observability";

const state = globalThis as typeof globalThis & { watchtowerMetricsTimer?: NodeJS.Timeout };
afterEach(() => {
  clearInterval(state.watchtowerMetricsTimer);
  delete state.watchtowerMetricsTimer;
  vi.useRealTimers();
});

it("does not duplicate resource timers on repeated instrumentation registration", () => {
  vi.useFakeTimers();
  startProcessMetrics();
  startProcessMetrics();
  expect(info).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(60_000);
  expect(info).toHaveBeenCalledTimes(2);
  expect(info).toHaveBeenLastCalledWith({ event: "process_metrics", rssBytes: 123 }, "Process resources");
});
