import React from 'react';
const TONES = {
  neutral:  { bg: 'var(--surface-elevated)', fg: 'var(--text-body-strong)' },
  yellow:   { bg: 'var(--primary)', fg: 'var(--on-primary)' },
  up:       { bg: 'var(--status-up-bg)', fg: 'var(--status-up)' },
  down:     { bg: 'var(--status-down-bg)', fg: 'var(--status-down)' },
  degraded: { bg: 'var(--status-degraded-bg)', fg: 'var(--status-degraded)' },
  info:     { bg: 'var(--status-info-bg)', fg: 'var(--status-info)' },
  outline:  { bg: 'transparent', fg: 'var(--text-body)', border: 'var(--hairline-strong)' },
};
export function Badge({ tone = 'neutral', dot, uppercase, shape = 'pill', children, style }) {
  const t = TONES[tone] || TONES.neutral;
  const upper = uppercase ?? tone === 'yellow';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 22, padding: '0 9px', whiteSpace: 'nowrap',
      borderRadius: shape === 'pill' ? 'var(--radius-pill)' : 'var(--radius-xs)', background: t.bg, color: t.fg,
      border: t.border ? '1px solid ' + t.border : 'none', fontFamily: 'var(--font-sans)',
      fontSize: upper ? 11 : 12, fontWeight: upper ? 600 : 500, letterSpacing: upper ? '1.2px' : 0,
      textTransform: upper ? 'uppercase' : 'none', fontVariantNumeric: 'tabular-nums', ...style }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />}
      {children}
    </span>
  );
}
