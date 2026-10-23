import { describe, expect, it } from "vitest";
import { monitorStepsPatch } from "./monitor-steps";
describe("protected monitor workflow edits", () => {
  it("omits protected steps even when no editable plaintext exists", () => {
    expect(monitorStepsPatch(true, false, "")).toEqual({});
    expect(monitorStepsPatch(true, false, '[{"url":"https://example.com"}]')).toEqual({});
  });
  it("replaces steps only after explicit replacement with valid input", () => {
    expect(monitorStepsPatch(true, true, '[{"url":"https://service.example/check"}]')).toEqual({ steps: [{ url: "https://service.example/check" }] });
    expect(() => monitorStepsPatch(true, true, "")).toThrow();
    expect(() => monitorStepsPatch(false, false, "[]")).toThrow();
  });
});
