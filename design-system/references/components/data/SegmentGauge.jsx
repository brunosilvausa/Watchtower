import React from 'react';
const TONE = { primary: '239,255,0', up: '34,197,94', down: '239,68,68', degraded: '245,158,11', info: '59,130,246' };
export function SegmentGauge({ value = 0, segments = 20, tone = 'primary', height = 56, scale = true, fade = true, style }) {
  const rgb = TONE[tone] || TONE.primary;
  const lit = Math.round((Math.max(0, Math.min(100, value)) / 100) * segments);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'var(--font-sans)', ...style }}>
      {scale && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
        {[0, 25, 50, 75, 100].map(n => <span key={n}>{n}</span>)}
      </div>}
      <div role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} style={{ display: 'flex', gap: 3, height }}>
        {Array.from({ length: segments }).map((_, i) => {
          const on = i < lit;
          const a = fade && lit > 1 ? 1 - (i / (lit - 1)) * 0.75 : 1;
          return <span key={i} style={{ flex: 1, borderRadius: 4, background: on ? 'rgba(' + rgb + ',' + a.toFixed(2) + ')' : 'var(--surface-elevated)', boxShadow: on ? '0 0 12px rgba(' + rgb + ',' + (a * 0.35).toFixed(2) + '), inset 0 1px 0 rgba(255,255,255,.25)' : 'inset 0 1px 2px rgba(0,0,0,.35)' }} />;
        })}
      </div>
    </div>
  );
}
