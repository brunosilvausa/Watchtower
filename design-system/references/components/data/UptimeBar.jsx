import React from 'react';
const C = { up: 'var(--status-up)', down: 'var(--status-down)', degraded: 'var(--status-degraded)', none: 'var(--surface-elevated)' };
export function UptimeBar({ days = [], height = 32, uptime, startLabel, endLabel = 'Today', style }) {
  const [hover, setHover] = React.useState(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'var(--font-sans)', ...style }}>
      <div style={{ display: 'flex', gap: 2, height }} onMouseLeave={() => setHover(null)}>
        {days.map((d, i) => {
          const s = typeof d === 'string' ? d : d.status;
          return <span key={i} onMouseEnter={() => setHover(i)} title={typeof d === 'object' && d.label ? d.label : s}
            style={{ flex: 1, minWidth: 2, borderRadius: 2, background: C[s] || C.none, opacity: hover == null || hover === i ? 1 : 0.55 }} />;
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>{startLabel || days.length + ' days ago'}</span>
        <span style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
        {uptime && <span style={{ color: 'var(--text-body-strong)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{uptime} uptime</span>}
        <span style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
        <span>{endLabel}</span>
      </div>
    </div>
  );
}
