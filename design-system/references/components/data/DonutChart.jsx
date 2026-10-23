import React from 'react';
import { typo } from '../core/spatial.js';
import { StateMessage } from '../feedback/StateMessage.jsx';
export function DonutChart({ segments = [], size = 180, thickness = 18, value, label, legend = true, format = v => v, ariaLabel, emptyText = 'Nothing to show yet', style }) {
  const [hi, setHi] = React.useState(null);
  const total = segments.reduce((a, s) => a + (s.value > 0 ? s.value : 0), 0);
  const summary = (ariaLabel ? ariaLabel + ': ' : '') + segments.map(s => s.label + ' ' + format(s.value) + (total ? ' (' + Math.round((s.value / total) * 100) + '%)' : '')).join(', ');
  if (!total) return <div style={{ height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}><StateMessage compact kind="empty" title={emptyText} /></div>;
  const r = (size - thickness) / 2, c = 2 * Math.PI * r, gap = segments.filter(s => s.value > 0).length > 1 ? 2 : 0;
  let off = 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, fontFamily: 'var(--font-sans)', ...style }}>
      <div role="img" aria-label={summary} style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-nested-strong)" strokeWidth={thickness} />
          {segments.map((s, i) => { if (!(s.value > 0)) return null; const len = (s.value / total) * c; const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={hi === i ? thickness + 4 : thickness}
            strokeDasharray={Math.max(0, len - gap) + ' ' + (c - Math.max(0, len - gap))} strokeDashoffset={-off} opacity={hi == null || hi === i ? 1 : 0.4}
            style={{ transition: 'opacity var(--motion-fast) var(--ease-standard), stroke-width var(--motion-fast) var(--ease-standard)' }} />; off += len; return el; })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <span style={{ ...typo('value-lg'), fontSize: 24, letterSpacing: '-0.5px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{hi != null ? format(segments[hi].value) : value}</span>
          <span style={{ ...typo('caption'), color: 'var(--text-tertiary)' }}>{hi != null ? segments[hi].label : label}</span>
        </div>
      </div>
      {legend && <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 14px' }}>
        {segments.map((s, i) => <li key={i} onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...typo('caption'), color: 'var(--text-secondary)', cursor: 'default' }}>
          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />{s.label}
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{format(s.value)}</span></li>)}
      </ul>}
    </div>
  );
}
