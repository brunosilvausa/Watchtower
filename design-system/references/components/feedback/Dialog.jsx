import React from 'react';
import { IconButton } from '../core/IconButton.jsx';
import { material, usePresence, useReducedMotion } from '../core/spatial.js';
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
export function Dialog({ open, title, description, children, actions, onClose, width = 480 }) {
  const { mounted, state, visible } = usePresence(open, 180);
  const reduced = useReducedMotion();
  const panel = React.useRef(null);
  const closeRef = React.useRef(onClose); closeRef.current = onClose;
  const uid = React.useId ? React.useId() : 'wt-dialog';
  React.useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const t = setTimeout(() => {
      const p = panel.current; if (!p) return;
      const f = p.querySelector('[autofocus],[data-autofocus],input,select,textarea') || p.querySelector(FOCUSABLE) || p;
      f.focus();
    }, 40);
    const key = e => {
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current && closeRef.current(); return; }
      if (e.key !== 'Tab' || !panel.current) return;
      const els = Array.from(panel.current.querySelectorAll(FOCUSABLE));
      if (!els.length) { e.preventDefault(); return; }
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', key);
    return () => { clearTimeout(t); window.removeEventListener('keydown', key); if (prev && prev.focus) prev.focus(); };
  }, [open]);
  if (!mounted) return null;
  const exiting = state === 'exit';
  const enterT = 'transform var(--spring-spatial-duration) var(--spring-spatial), opacity var(--motion-normal) var(--ease-enter)';
  const exitT = 'transform var(--motion-fast) var(--ease-exit), opacity var(--motion-fast) var(--ease-exit)';
  const rest = exiting ? 'translate3d(0, 6px, 0) scale(.985)' : 'translate3d(0, 14px, 0) scale(.96)';
  return (
    <div onClick={() => closeRef.current && closeRef.current()} style={{ position: 'fixed', inset: 0, zIndex: 'var(--layer-4)', background: 'var(--scrim)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-sans)',
      opacity: visible ? 1 : 0, transition: visible ? 'opacity var(--motion-normal) var(--ease-enter)' : 'opacity var(--motion-fast) var(--ease-exit)' }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={uid + '-t'} aria-describedby={description ? uid + '-d' : undefined} tabIndex={-1}
        onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: width, borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 20, outline: 'none',
        ...material('overlay', 4), backdropFilter: 'none', WebkitBackdropFilter: 'none', boxShadow: 'var(--elev-4-shadow), var(--elev-4-edge)',
        opacity: visible ? 1 : 0, transform: reduced || visible ? 'none' : rest, transition: visible ? enterT : exitT }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h2 id={uid + '-t'} style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>{title}</h2>
            {description && <p id={uid + '-d'} style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--text-secondary)' }}>{description}</p>}
          </div>
          {onClose && <IconButton icon="x" label="Close" variant="ghost" shape="square" size={32} onClick={onClose} />}
        </div>
        {children}
        {actions && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>{actions}</div>}
      </div>
    </div>
  );
}
