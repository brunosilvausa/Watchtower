import { expect, it } from "vitest";
import { createLogger } from "./logger.js";

it("redacts credentials while keeping operational measurements", () => {
  let output = "";
  const logger = createLogger("test", { write: (chunk: string) => { output += chunk; } });
  logger.info({ password: "private-value", token: "private-value", databaseUrl: "private-value", req: { headers: { authorization: "private-value", cookie: "private-value", "x-api-key": "private-value" } }, rssBytes: 123 }, "sample");
  expect(output).not.toContain("private-value");
  expect(JSON.parse(output)).toMatchObject({ service: "test", rssBytes: 123, msg: "sample" });
});
