import { createLogger, processMetrics } from "@watchtower/runtime";

const logger = createLogger("worker");
const sample = () => logger.info({ event: "process_metrics", ...processMetrics() }, "Process resources");
const heartbeat = setInterval(sample, 60_000);

function stop(signal: NodeJS.Signals) {
  clearInterval(heartbeat);
  logger.info({ event: "worker_stopped", signal }, "Worker stopped");
}

process.once("SIGTERM", () => stop("SIGTERM"));
process.once("SIGINT", () => stop("SIGINT"));
logger.info({ event: "worker_started", mode: "foundation" }, "Worker ready; job execution is not implemented in M1");
sample();
