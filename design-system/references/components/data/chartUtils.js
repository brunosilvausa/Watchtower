import React from 'react';
export const isNum = v => typeof v === 'number' && isFinite(v);
export function smoothPath(pts) {
  if (pts.length === 1) return 'M' + pts[0][0] + ',' + pts[0][1];
  let d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ' C' + c1[0].toFixed(1) + ',' + c1[1].toFixed(1) + ' ' + c2[0].toFixed(1) + ',' + c2[1].toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
  }
  return d;
}
/** Split a series into continuous runs; null/undefined/NaN are gaps (never coerced to 0). */
export function runs(data, x, y) {
  const out = []; let cur = [];
  data.forEach((v, i) => { if (isNum(v)) cur.push([x(i), y(v)]); else { if (cur.length) out.push(cur); cur = []; } });
  if (cur.length) out.push(cur);
  return out;
}
export function niceTicks(lo, hi, count) { return Array.from({ length: count }, (_, i) => lo + ((hi - lo) * i) / (count - 1)); }
/** Shared keyboard handler: ←/→ move, Home/End jump, Esc clears. */
export function chartKeys(e, hi, n, set) {
  if (e.key === 'ArrowRight') { e.preventDefault(); set(hi == null ? 0 : Math.min(n - 1, hi + 1)); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); set(hi == null ? n - 1 : Math.max(0, hi - 1)); }
  else if (e.key === 'Home') { e.preventDefault(); set(0); }
  else if (e.key === 'End') { e.preventDefault(); set(n - 1); }
  else if (e.key === 'Escape') set(null);
}
export const tooltipStyle = { position: 'absolute', pointerEvents: 'none', zIndex: 2, minWidth: 120, padding: '8px 10px', borderRadius: 'var(--radius-md)',
  background: 'var(--light-top-edge), var(--glass-overlay-bg)', border: '1px solid var(--glass-overlay-border)', boxShadow: 'var(--elev-3-shadow), var(--elev-3-edge)', whiteSpace: 'nowrap' };
export const axisText = { fill: 'var(--chart-axis)', fontSize: 11, fontFamily: 'var(--font-sans)', style: { fontVariantNumeric: 'tabular-nums' } };
