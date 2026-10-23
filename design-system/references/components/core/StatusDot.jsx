import React from 'react';
const C = { up: 'var(--status-up)', down: 'var(--status-down)', degraded: 'var(--status-degraded)', info: 'var(--status-info)', paused: 'var(--text-muted-soft)' };
export function StatusDot({ status = 'up', size = 8, pulse, style }) {
  const c = C[status] || C.up;
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size, flex: 'none', ...style }}>
      {pulse && <span style={{ position: 'absolute', inset: -size * 0.5, borderRadius: '50%', background: c, opacity: 0.2 }} />}
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: c, boxShadow: pulse ? '0 0 ' + size + 'px ' + c : 'none' }} />
    </span>
  );
}
