export type Sample = number | null;
export function finite(value: Sample): value is number { return typeof value === "number" && Number.isFinite(value); }
export function chartDomain(series: Sample[][]): [number, number] {
  const values = series.flat().filter(finite);
  if (!values.length) return [0, 1];
  const low = Math.min(0, ...values); const high = Math.max(0, ...values);
  return [low, high === low ? low + 1 : high];
}
export function lineRuns(data: Sample[]): [number, number][][] {
  const runs: [number, number][][] = []; let current: [number, number][] = [];
  data.forEach((value, index) => {
    if (finite(value)) current.push([index, value]);
    else if (current.length) { runs.push(current); current = []; }
  });
  if (current.length) runs.push(current);
  return runs;
}
export function clampPercent(value: number) { return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null; }
export function smoothPath(points: [number, number][]) {
  if (!points.length) return "";
  let path = `M${points[0][0]},${points[0][1]}`;
  for (let index = 0; index < points.length - 1; index++) {
    const a = points[index - 1] ?? points[index]; const b = points[index];
    const c = points[index + 1]; const d = points[index + 2] ?? c;
    path += ` C${b[0] + (c[0] - a[0]) / 6},${b[1] + (c[1] - a[1]) / 6} ${c[0] - (d[0] - b[0]) / 6},${c[1] - (d[1] - b[1]) / 6} ${c[0]},${c[1]}`;
  }
  return path;
}

export function nonnegativeSample(value: Sample) { return finite(value) && value >= 0 ? value : null; }
