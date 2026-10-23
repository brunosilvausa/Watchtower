import { describe, expect, it } from "vitest";
import { chartDomain, lineRuns, clampPercent, smoothPath, nonnegativeSample } from "./chart-math";

describe("chart data boundaries", () => {
  it("keeps missing samples as separate runs", () => {
    expect(lineRuns([1, null, 0, Number.NaN, 3])).toEqual([[[0, 1]], [[2, 0]], [[4, 3]]]);
  });
  it("uses all series and includes negative ranges and zero", () => {
    expect(chartDomain([[2], [-10, 20, null]])).toEqual([-10, 20]);
    expect(chartDomain([[4, 4]])).toEqual([0, 4]);
  });
  it("provides finite empty domains and clamps nonfinite meters", () => {
    expect(chartDomain([[null, Number.NaN, Infinity]])).toEqual([0, 1]);
    expect(clampPercent(Infinity)).toBeNull();
    expect(nonnegativeSample(Number.NaN)).toBeNull();
    expect(nonnegativeSample(-1)).toBeNull();
    expect(nonnegativeSample(0)).toBe(0);
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(-1)).toBe(0);
  });
});

it("keeps smooth paths finite for empty and single samples", () => {
  expect(smoothPath([])).toBe("");
  expect(smoothPath([[1, 2]])).toBe("M1,2");
  expect(smoothPath([[0, 1], [2, 3]])).toContain("C");
  expect(smoothPath([[0, 1], [2, 3]])).not.toContain("NaN");
});
