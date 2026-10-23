import React from 'react';
import { usePresence } from '../core/spatial.js';
export function Tooltip({ content, children, placement = 'top', style }) {
  const [show, setShow] = React.useState(false);
  const { mounted, visible } = usePresence(show, 100);
  const id = React.useId ? React.useId() : undefined;
  const pos = placement === 'bottom' ? { top: '100%', marginTop: 8 } : { bottom: '100%', marginBottom: 8 };
  const dy = placement === 'bottom' ? -4 : 4;
  return (
    <span onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onFocus={() => setShow(true)} onBlur={() => setShow(false)}
      onKeyDown={e => e.key === 'Escape' && setShow(false)} aria-describedby={mounted ? id : undefined}
      style={{ position: 'relative', display: 'inline-flex', ...style }}>
      {children}
      {mounted && <span id={id} role="tooltip" style={{ position: 'absolute', left: '50%', ...pos, zIndex: 'var(--layer-3)', whiteSpace: 'nowrap', pointerEvents: 'none',
        transform: 'translateX(-50%) translateY(' + (visible ? 0 : dy) + 'px)', opacity: visible ? 1 : 0,
        transition: visible ? 'opacity var(--motion-fast) var(--ease-enter), transform var(--spring-responsive-duration) var(--spring-responsive)' : 'opacity var(--motion-instant) var(--ease-exit), transform var(--motion-instant) var(--ease-exit)',
        padding: '6px 10px', borderRadius: 'var(--radius-md)', background: 'var(--light-top-edge), var(--glass-overlay-bg)', backdropFilter: 'var(--glass-smoked-filter)', WebkitBackdropFilter: 'var(--glass-smoked-filter)', border: '1px solid var(--glass-overlay-border)', boxShadow: 'var(--elev-3-shadow), var(--elev-3-edge)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500 }}>{content}</span>}
    </span>
  );
}
