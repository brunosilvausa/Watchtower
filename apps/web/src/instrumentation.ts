export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startProcessMetrics } = await import("./lib/observability");
    startProcessMetrics();
  }
}
