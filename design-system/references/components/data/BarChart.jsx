import React from 'react';
import { useReducedMotion, typo } from '../core/spatial.js';
import { Skeleton } from '../feedback/Skeleton.jsx';
import { StateMessage } from '../feedback/StateMessage.jsx';
import { isNum, niceTicks, chartKeys, tooltipStyle, axisText } from './chartUtils.js';
export function BarChart({ data = [], labels = [], comparison, name = 'Value', comparisonName = 'Previous', height = 220, min, max, ticks = 5, format = v => v, formatAxis,
  color = 'var(--chart-bar)', highlight, onHighlight, loading, error, emptyText = 'No data for this range', ariaLabel, animate = true, style }) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(600);
  const [hi, setHi] = React.useState(highlight ?? null);
  const reduced = useReducedMotion();
  const [grown, setGrown] = React.useState(false);
  React.useEffect(() => { setHi(highlight ?? null); }, [highlight]);
  React.useEffect(() => {
    if (!ref.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(e => setW(Math.max(200, Math.round(e[0].contentRect.width)))); ro.observe(ref.current); return () => ro.disconnect();
  }, []);
  React.useEffect(() => { const r = requestAnimationFrame(() => setGrown(true)); return () => cancelAnimationFrame(r); }, []);
  const setHL = i => { setHi(i); onHighlight && onHighlight(i); };
  const n = data.length;
  const hasData = data.some(isNum) || (comparison || []).some(isNum);
  const frame = { height, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-md)' };
  let body;
  if (loading) body = <div aria-busy="true"><Skeleton variant="block" height={height} /><span className="wt-sr-only">Loading chart</span></div>;
  else if (error) body = <div style={frame}><StateMessage compact kind="error" title={typeof error === 'string' ? error : 'Couldn’t load this chart'} /></div>;
  else if (!hasData) body = <div style={frame}><StateMessage compact kind="empty" title={emptyText} /></div>;
  else {
    const vals = data.concat(comparison || []).filter(isNum);
    let lo = Math.min(min ?? 0, ...vals, 0), top = Math.max(max ?? 0, ...vals, 0);
    if (lo === top) top = lo + 1;
    const padL = 46, padB = 26, padT = 10, padR = 8;
    const slot = (w - padL - padR) / Math.max(1, n);
    const groupW = Math.min(slot * 0.62, comparison ? 36 : 28);
    const bw = comparison ? groupW / 2 - 1 : groupW;
    const y = v => padT + (1 - (v - lo) / (top - lo)) * (height - padT - padB);
    const x0 = i => padL + slot * i + (slot - groupW) / 2;
    const fa = formatAxis || format;
    const every = Math.max(1, Math.ceil(labels.length / Math.max(2, Math.floor((w - padL) / 48))));
    const bar = (v, i, bx, fill, key, muted) => {
      if (!isNum(v)) return <rect key={key} x={bx} y={y(0) - 14} width={bw} height={14} rx="3" fill="none" stroke="var(--border-default)" strokeDasharray="3 3" />;
      const yv = y(v), y0 = y(0), neg = v < 0;
      return <rect key={key} x={bx} y={neg ? y0 : yv} width={bw} height={Math.max(1, Math.abs(y0 - yv))} rx="3" fill={!muted && hi === i ? 'var(--chart-highlight)' : fill}
        opacity={hi == null || hi === i ? 1 : muted ? 0.35 : 0.5}
        style={{ transformBox: 'fill-box', transformOrigin: neg ? 'center top' : 'center bottom', transform: !animate || reduced || grown ? 'scaleY(1)' : 'scaleY(0)',
          transition: 'transform var(--spring-spatial-duration) var(--spring-spatial), opacity var(--motion-fast) var(--ease-standard), fill var(--motion-fast) var(--ease-standard)', transitionDelay: animate && !grown ? Math.min(i * 18, 240) + 'ms' : '0ms' }} />;
    };
    const move = e => { const r = ref.current.getBoundingClientRect(); const i = Math.floor((e.clientX - r.left - padL) / slot); setHL(i >= 0 && i < n ? i : null); };
    const tipY = hi != null ? Math.min(...[data[hi], comparison && comparison[hi]].filter(isNum).map(v => y(Math.max(v, 0))), y(0) - 14) : 0;
    body = (
      <div tabIndex={0} role="group" aria-label={ariaLabel || 'Bar chart'} aria-roledescription="chart" onKeyDown={e => chartKeys(e, hi, n, setHL)} style={{ position: 'relative', borderRadius: 'var(--radius-sm)' }}>
        <svg width={w} height={height} onMouseMove={move} onMouseLeave={() => setHL(highlight ?? null)} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
          {niceTicks(lo, top, ticks).map((t, i) => <g key={i}><line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" />
            <text x={padL - 10} y={y(t) + 4} textAnchor="end" {...axisText}>{fa(+t.toFixed(2))}</text></g>)}
          <line x1={padL} x2={w - padR} y1={y(0)} y2={y(0)} stroke="var(--chart-zero)" />
          {hi != null && <rect x={padL + slot * hi} y={padT} width={slot} height={height - padT - padB} fill="var(--chart-band)" rx="4" />}
          {data.map((v, i) => <g key={i}>
            {comparison && bar(comparison[i], i, x0(i), 'var(--chart-series-muted)', 'c', true)}
            {bar(v, i, comparison ? x0(i) + bw + 2 : x0(i), color, 'v')}
          </g>)}
          {labels.map((l, i) => (i % every === 0 || i === hi) && <text key={i} x={padL + slot * i + slot / 2} y={height - 6} textAnchor="middle" {...axisText} fill={hi === i ? 'var(--text-primary)' : 'var(--chart-axis)'}>{l}</text>)}
        </svg>
        {hi != null && <div style={{ ...tooltipStyle, left: Math.min(Math.max(padL + slot * hi + slot / 2, 80), w - 80), top: Math.max(0, tipY - 12), transform: 'translate(-50%, -100%)' }}>
          <div style={{ ...typo('caption'), color: 'var(--text-tertiary)', marginBottom: 4 }}>{labels[hi]}</div>
          {[[name, data[hi], color], ...(comparison ? [[comparisonName, comparison[hi], 'var(--chart-series-muted)']] : [])].map(([nm, v, c]) =>
            <div key={nm} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, lineHeight: 1.5 }}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
              <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{nm}</span>
              <span style={{ color: isNum(v) ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{isNum(v) ? format(v) : 'No data'}</span>
            </div>)}
        </div>}
        <span className="wt-sr-only" aria-live="polite">{hi != null ? labels[hi] + ': ' + name + ' ' + (isNum(data[hi]) ? format(data[hi]) : 'no data') + (comparison ? ', ' + comparisonName + ' ' + (isNum(comparison[hi]) ? format(comparison[hi]) : 'no data') : '') : ''}</span>
      </div>
    );
  }
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', minWidth: 0, fontFamily: 'var(--font-sans)', ...style }}>
      {comparison && !loading && hasData && <div style={{ display: 'flex', gap: 16, marginBottom: 10, ...typo('caption'), color: 'var(--text-secondary)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />{name}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--chart-series-muted)' }} />{comparisonName}</span></div>}
      {body}
      {hasData && !loading && !error && <table className="wt-sr-only"><caption>{ariaLabel || 'Chart data'}</caption>
        <thead><tr><th scope="col">Label</th><th scope="col">{name}</th>{comparison && <th scope="col">{comparisonName}</th>}</tr></thead>
        <tbody>{data.map((v, i) => <tr key={i}><th scope="row">{labels[i] ?? i + 1}</th><td>{isNum(v) ? format(v) : 'No data'}</td>{comparison && <td>{isNum(comparison[i]) ? format(comparison[i]) : 'No data'}</td>}</tr>)}</tbody></table>}
    </div>
  );
}
