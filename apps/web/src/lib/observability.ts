import "server-only";
import { createLogger, processMetrics } from "@watchtower/runtime";

const state = globalThis as typeof globalThis & { watchtowerMetricsTimer?: NodeJS.Timeout };

export function startProcessMetrics() {
  if (state.watchtowerMetricsTimer) return;
  const logger = createLogger("web");
  const sample = () => logger.info({ event: "process_metrics", ...processMetrics() }, "Process resources");
  sample();
  state.watchtowerMetricsTimer = setInterval(sample, 60_000);
  state.watchtowerMetricsTimer.unref();
}
