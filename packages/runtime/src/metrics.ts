export function processMetrics() {
  const cpu = process.cpuUsage();
  return {
    uptimeSeconds: process.uptime(),
    rssBytes: process.memoryUsage().rss,
    cpuUserMicroseconds: cpu.user,
    cpuSystemMicroseconds: cpu.system,
  };
}
