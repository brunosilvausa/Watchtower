import React from 'react';
const isNum = v => typeof v === 'number' && isFinite(v);
export function Sparkline({ data = [], width = 96, height = 28, color = 'var(--chart-series-2)', area = true, ariaLabel, style }) {
  const vals = data.filter(isNum);
  const uid = (React.useId ? React.useId() : 'sp').replace(/:/g, '');
  if (vals.length < 2) return <span role="img" aria-label={ariaLabel ? ariaLabel + ': not enough data' : 'Not enough data'} style={{ display: 'inline-block', width, height, borderBottom: '1px dashed var(--border-default)', ...style }} />;
  const lo = Math.min(...vals), hi = Math.max(...vals), p = 3;
  const x = i => p + (i / (data.length - 1)) * (width - p * 2);
  const y = v => p + (1 - (v - lo) / (hi - lo || 1)) * (height - p * 2);
  const segs = []; let cur = [];
  data.forEach((v, i) => { if (isNum(v)) cur.push([x(i), y(v)]); else { if (cur.length) segs.push(cur); cur = []; } });
  if (cur.length) segs.push(cur);
  const d = s => s.map((pt, i) => (i ? 'L' : 'M') + pt[0].toFixed(1) + ',' + pt[1].toFixed(1)).join(' ');
  let li = data.length - 1; while (li >= 0 && !isNum(data[li])) li--;
  return (
    <svg role="img" aria-label={ariaLabel || 'Trend'} width={width} height={height} style={{ display: 'block', overflow: 'visible', ...style }}>
      <defs><linearGradient id={uid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".22" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {area && segs.map((s, i) => s.length > 1 && <path key={'a' + i} d={d(s) + ' L' + s[s.length - 1][0] + ',' + height + ' L' + s[0][0] + ',' + height + ' Z'} fill={'url(#' + uid + ')'} />)}
      {segs.map((s, i) => <path key={i} d={d(s)} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />)}
      {li >= 0 && <circle cx={x(li)} cy={y(data[li])} r="2.5" fill={color} />}
    </svg>
  );
}
