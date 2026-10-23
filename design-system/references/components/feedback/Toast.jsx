import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { material } from '../core/spatial.js';
const T = { up: ['circle-check', 'var(--status-up)'], down: ['circle-alert', 'var(--status-down)'], degraded: ['triangle-alert', 'var(--status-degraded)'], info: ['info', 'var(--status-info)'], neutral: ['bell', 'var(--primary)'] };
export function Toast({ tone = 'neutral', title, message, action, onClose, style }) {
  const [ic, c] = T[tone] || T.neutral;
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => { const r = requestAnimationFrame(() => setShown(true)); return () => cancelAnimationFrame(r); }, []);
  return (
    <div role="status" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: 360, maxWidth: '100%', padding: 16, ...material('overlay', 3),
      borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-sans)',
      opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translate3d(0, 10px, 0) scale(.98)',
      transition: 'opacity var(--motion-normal) var(--ease-enter), transform var(--spring-spatial-duration) var(--spring-spatial)', ...style }}>
      <Icon name={ic} size={18} color={c} style={{ marginTop: 1, filter: 'drop-shadow(0 0 6px ' + c + ')' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-dark)' }}>{title}</span>
        {message && <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-body)' }}>{message}</span>}
        {action && <div style={{ marginTop: 6 }}>{action}</div>}
      </div>
      {onClose && <button type="button" aria-label="Dismiss" onClick={onClose} style={{ border: 0, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}><Icon name="x" size={16} /></button>}
    </div>
  );
}
