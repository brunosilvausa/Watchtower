import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const child = spawn(process.execPath, ["apps/worker/dist/main.js"], {
  env: { ...process.env, LOG_LEVEL: "info" }, stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
let errors = "";
let signaled = false;
const timeout = setTimeout(() => child.kill("SIGKILL"), 10_000);
child.stdout.on("data", (chunk) => {
  output += String(chunk);
  if (!signaled && output.includes('"event":"worker_started"')) {
    signaled = true;
    child.kill("SIGTERM");
  }
});
child.stderr.on("data", (chunk) => { errors += String(chunk); });
const code = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("close", resolve);
}).finally(() => clearTimeout(timeout));
assert.equal(code, 0, errors || output);
assert.equal(errors, "");
const events = output.trim().split("\n").map((line) => JSON.parse(line));
assert(events.some((event) => event.event === "worker_started" && event.mode === "foundation"));
assert(events.some((event) => event.event === "process_metrics" && event.rssBytes > 0));
assert(events.some((event) => event.event === "worker_stopped" && event.signal === "SIGTERM"));
assert(!output.includes("DATABASE_URL"));
process.stdout.write("PASS worker startup, resource metrics and SIGTERM shutdown; no jobs executed\n");
