import React from 'react';
import { useReducedMotion, typo } from '../core/spatial.js';
import { Skeleton } from '../feedback/Skeleton.jsx';
import { StateMessage } from '../feedback/StateMessage.jsx';
import { isNum, smoothPath, runs, niceTicks, chartKeys, tooltipStyle, axisText } from './chartUtils.js';
export function LineChart({ series = [], labels = [], height = 240, min, max, ticks = 5, format = v => v, formatAxis, highlight, onHighlight, interactive = true,
  legend, loading, error, emptyText = 'No data for this range', ariaLabel, animate = true, style }) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(600);
  const [hi, setHi] = React.useState(highlight ?? null);
  const [hidden, setHidden] = React.useState({});
  const reduced = useReducedMotion();
  const [revealed, setRevealed] = React.useState(false);
  const uid = (React.useId ? React.useId() : 'lc').replace(/:/g, '');
  React.useEffect(() => { setHi(highlight ?? null); }, [highlight]);
  React.useEffect(() => {
    if (!ref.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(e => setW(Math.max(200, Math.round(e[0].contentRect.width)))); ro.observe(ref.current); return () => ro.disconnect();
  }, []);
  React.useEffect(() => { const r = requestAnimationFrame(() => setRevealed(true)); return () => cancelAnimationFrame(r); }, []);
  const setHL = i => { setHi(i); onHighlight && onHighlight(i); };
  const vis = series.map((s, i) => ({ ...s, i })).filter(s => !hidden[s.i]);
  const hasData = series.some(s => (s.data || []).some(isNum));
  const n = Math.max(1, ...series.map(s => (s.data || []).length));
  let body;
  if (loading) body = <div aria-busy="true"><Skeleton variant="block" height={height} /><span className="wt-sr-only">Loading chart</span></div>;
  else if (error) body = <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-md)' }}><StateMessage compact kind="error" title={typeof error === 'string' ? error : 'Couldn’t load this chart'} /></div>;
  else if (!hasData) body = <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-md)' }}><StateMessage compact kind="empty" title={emptyText} /></div>;
  else {
    const all = vis.flatMap(s => s.data).filter(isNum);
    let lo = min ?? (all.length ? Math.min(...all) : 0), top = max ?? (all.length ? Math.max(...all) : 1);
    if (lo === top) { lo -= 1; top += 1; }
    const padL = 46, padB = 26, padT = 10, padR = 10;
    const x = i => padL + (n === 1 ? 0.5 : i / (n - 1)) * (w - padL - padR);
    const y = v => padT + (1 - (v - lo) / (top - lo)) * (height - padT - padB);
    const fa = formatAxis || format;
    const every = Math.max(1, Math.ceil(labels.length / Math.max(2, Math.floor((w - padL) / 56))));
    const sig = vis.map(s => s.i + ':' + s.data.join(',')).join('|');
    const move = e => { if (!interactive) return; const r = ref.current.getBoundingClientRect(); const i = Math.round(((e.clientX - r.left - padL) / (w - padL - padR)) * (n - 1)); setHL(Math.max(0, Math.min(n - 1, i))); };
    const top0 = hi != null ? Math.min(...vis.map(s => (isNum(s.data[hi]) ? y(s.data[hi]) : height)), height - padB) : 0;
    body = (
      <div tabIndex={interactive ? 0 : undefined} role="group" aria-label={ariaLabel || 'Line chart'} aria-roledescription="chart"
        onKeyDown={interactive ? e => chartKeys(e, hi, n, setHL) : undefined} style={{ position: 'relative', borderRadius: 'var(--radius-sm)' }}>
        <svg width={w} height={height} onMouseMove={move} onMouseLeave={() => interactive && setHL(highlight ?? null)} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            {vis.map(s => <linearGradient key={s.i} id={uid + 'g' + s.i} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color || 'var(--chart-series-1)'} stopOpacity="var(--chart-area-opacity)" style={{ stopOpacity: 'var(--chart-area-opacity)' }} />
              <stop offset="100%" stopColor={s.color || 'var(--chart-series-1)'} stopOpacity="0" /></linearGradient>)}
            <clipPath id={uid + 'c'}><rect x="0" y="-12" width={w} height={height + 24}
              style={{ transformBox: 'fill-box', transformOrigin: 'left center', transform: !animate || reduced || revealed ? 'scaleX(1)' : 'scaleX(0)', transition: 'transform var(--motion-emphasis) var(--ease-standard)' }} /></clipPath>
          </defs>
          {niceTicks(lo, top, ticks).map((t, i) => <g key={i}>
            <line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" />
            <text x={padL - 10} y={y(t) + 4} textAnchor="end" {...axisText}>{fa(+t.toFixed(2))}</text></g>)}
          {lo < 0 && top > 0 && <line x1={padL} x2={w - padR} y1={y(0)} y2={y(0)} stroke="var(--chart-zero)" />}
          {labels.map((l, i) => (i % every === 0 || i === hi) && <text key={i} x={x(i)} y={height - 6} textAnchor="middle" {...axisText} fill={hi === i ? 'var(--text-primary)' : 'var(--chart-axis)'}>{l}</text>)}
          {hi != null && <rect x={x(hi) - 14} y={padT} width={28} height={height - padT - padB} fill="var(--chart-band)" />}
          {hi != null && <line x1={x(hi)} x2={x(hi)} y1={padT} y2={height - padB} stroke="var(--chart-crosshair)" />}
          <g clipPath={'url(#' + uid + 'c)'}>
            <g key={sig} style={{ animation: reduced ? undefined : 'wt-fade-in var(--motion-normal) var(--ease-standard)' }}>
              {vis.map(s => {
                const segs = runs(s.data, x, y);
                return <g key={s.i}>
                  {s.area && segs.map((seg, k) => seg.length > 1 && <path key={'a' + k} d={smoothPath(seg) + ' L' + seg[seg.length - 1][0] + ',' + (height - padB) + ' L' + seg[0][0] + ',' + (height - padB) + ' Z'} fill={'url(#' + uid + 'g' + s.i + ')'} />)}
                  {segs.map((seg, k) => <path key={k} d={smoothPath(seg)} fill="none" stroke={s.color || 'var(--chart-series-1)'} strokeWidth={s.width || 2} strokeDasharray={s.dashed ? '5 5' : undefined} strokeLinecap="round" strokeLinejoin="round" />)}
                  {segs.map((seg, k) => seg.length === 1 && <circle key={'p' + k} cx={seg[0][0]} cy={seg[0][1]} r="2.5" fill={s.color || 'var(--chart-series-1)'} />)}
                </g>;
              })}
            </g>
          </g>
          {hi != null && vis.map((s, k) => isNum(s.data[hi]) && (k === 0
            ? <circle key={s.i} cx={x(hi)} cy={y(s.data[hi])} r="5" fill="var(--chart-highlight)" stroke="var(--background-base)" strokeWidth="2.5" />
            : <circle key={s.i} cx={x(hi)} cy={y(s.data[hi])} r="3.5" fill="var(--background-base)" stroke={s.color || 'var(--chart-series-2)'} strokeWidth="1.5" />))}
        </svg>
        {hi != null && <div style={{ ...tooltipStyle, left: Math.min(Math.max(x(hi), 80), w - 80), top: Math.max(0, top0 - 16), transform: 'translate(-50%, -100%)' }}>
          <div style={{ ...typo('caption'), color: 'var(--text-tertiary)', marginBottom: 4 }}>{labels[hi]}</div>
          {vis.map(s => <div key={s.i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, lineHeight: 1.5 }}>
            <svg width="12" height="4" aria-hidden="true"><line x1="0" y1="2" x2="12" y2="2" stroke={s.color || 'var(--chart-series-1)'} strokeWidth="2" strokeDasharray={s.dashed ? '3 2' : undefined} /></svg>
            <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{s.name || 'Value'}</span>
            <span style={{ color: isNum(s.data[hi]) ? (s === vis[0] ? 'var(--text-primary)' : 'var(--text-secondary)') : 'var(--text-tertiary)', fontWeight: s === vis[0] ? 700 : 500, fontVariantNumeric: 'tabular-nums' }}>{isNum(s.data[hi]) ? format(s.data[hi]) : 'No data'}</span>
          </div>)}
        </div>}
        <span className="wt-sr-only" aria-live="polite">{hi != null ? labels[hi] + ': ' + vis.map(s => (s.name || 'Value') + ' ' + (isNum(s.data[hi]) ? format(s.data[hi]) : 'no data')).join(', ') : ''}</span>
      </div>
    );
  }
  const named = series.filter(s => s.name).length > 1;
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', minWidth: 0, fontFamily: 'var(--font-sans)', ...style }}>
      {legend && named && !loading && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginBottom: 10 }}>
          {series.map((s, i) => s.name && <button key={i} type="button" aria-pressed={!hidden[i]}
            onClick={() => setHidden(h => { const nx = { ...h, [i]: !h[i] }; return series.every((_, j) => nx[j]) ? h : nx; })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 'max(24px, var(--touch-min))', border: 0, background: 'transparent', padding: 0, cursor: 'pointer', ...typo('caption'), color: hidden[i] ? 'var(--text-disabled)' : 'var(--text-secondary)', transition: 'color var(--motion-fast)' }}>
            <svg width="18" height="6" aria-hidden="true"><line x1="0" y1="3" x2="18" y2="3" stroke={s.color || 'var(--chart-series-1)'} strokeWidth="2" strokeDasharray={s.dashed ? '4 3' : undefined} opacity={hidden[i] ? 0.3 : 1} /></svg>
            <span style={{ textDecoration: hidden[i] ? 'line-through' : 'none' }}>{s.name}</span>
          </button>)}
        </div>
      )}
      {body}
      {hasData && !loading && !error && <table className="wt-sr-only"><caption>{ariaLabel || 'Chart data'}</caption>
        <thead><tr><th scope="col">Label</th>{series.map((s, i) => <th key={i} scope="col">{s.name || 'Value'}</th>)}</tr></thead>
        <tbody>{Array.from({ length: n }, (_, r) => <tr key={r}><th scope="row">{labels[r] ?? r + 1}</th>{series.map((s, i) => <td key={i}>{isNum(s.data[r]) ? format(s.data[r]) : 'No data'}</td>)}</tr>)}</tbody></table>}
    </div>
  );
}
