import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { usePresence, typo } from '../core/spatial.js';
export function Select({ options = [], value, onChange, icon, label, size = 'md', align = 'left', disabled, style }) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const { mounted, visible } = usePresence(open, 120);
  const ref = React.useRef(null), btn = React.useRef(null);
  const uid = (React.useId ? React.useId() : 'sel').replace(/:/g, '');
  React.useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);
  const norm = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
  const curIdx = Math.max(0, norm.findIndex(o => o.value === value));
  const cur = norm[curIdx] || { label: '' };
  const openAt = i => { setActive(i); setOpen(true); };
  const choose = i => { const o = norm[i]; if (o) onChange && onChange(o.value); setOpen(false); btn.current && btn.current.focus(); };
  const onKey = e => {
    if (disabled) return;
    if (e.key === 'Escape') { if (open) { e.preventDefault(); setOpen(false); } return; }
    if (e.key === 'Tab') { setOpen(false); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!open) return openAt(curIdx); setActive(a => (a + (e.key === 'ArrowDown' ? 1 : -1) + norm.length) % norm.length); return; }
    if (e.key === 'Home' && open) { e.preventDefault(); setActive(0); return; }
    if (e.key === 'End' && open) { e.preventDefault(); setActive(norm.length - 1); return; }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open ? choose(active) : openAt(curIdx); }
  };
  const h = size === 'sm' ? 'max(32px, var(--touch-min))' : 'var(--control-height)';
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-sans)', ...style }}>
      {label && <span id={uid + '-l'} style={{ ...typo('label'), color: 'var(--text-strong)' }}>{label}</span>}
      <button ref={btn} type="button" role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={uid + '-lb'} aria-labelledby={label ? uid + '-l ' + uid + '-v' : undefined}
        aria-activedescendant={open && active >= 0 ? uid + '-o' + active : undefined} disabled={disabled}
        onKeyDown={onKey} onClick={() => (open ? setOpen(false) : openAt(curIdx))} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: h,
        padding: size === 'sm' ? '0 10px' : '0 14px', borderRadius: 'var(--radius-md)', border: '1px solid ' + (open ? 'var(--border-strong)' : 'var(--border-default)'), opacity: disabled ? 0.5 : 1,
        background: 'var(--light-top-edge), var(--surface-nested-strong)', boxShadow: 'var(--elev-1-edge)', color: 'var(--text-primary)', fontSize: size === 'sm' ? 13 : 14, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
        transition: 'border-color var(--motion-fast) var(--ease-standard)' }}>
        {icon && <Icon name={icon} size={15} color="var(--text-tertiary)" />}
        <span id={uid + '-v'} style={{ flex: 1, textAlign: 'left' }}>{cur.label}</span>
        <Icon name="chevron-down" size={14} color="var(--text-tertiary)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--spring-responsive-duration) var(--spring-responsive)' }} />
      </button>
      {mounted && (
        <div id={uid + '-lb'} role="listbox" aria-labelledby={label ? uid + '-l' : undefined} style={{ position: 'absolute', top: '100%', [align]: 0, marginTop: 6, minWidth: '100%', zIndex: 'var(--layer-3)', padding: 4,
          transformOrigin: 'top ' + align, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(-4px) scale(.98)', pointerEvents: visible ? 'auto' : 'none',
          transition: visible ? 'opacity var(--motion-fast) var(--ease-enter), transform var(--spring-responsive-duration) var(--spring-responsive)' : 'opacity var(--motion-instant) var(--ease-exit), transform var(--motion-instant) var(--ease-exit)',
          background: 'var(--light-top-edge), var(--glass-overlay-bg)', backdropFilter: 'var(--glass-smoked-filter)', WebkitBackdropFilter: 'var(--glass-smoked-filter)', border: '1px solid var(--glass-overlay-border)', boxShadow: 'var(--elev-3-shadow), var(--elev-3-edge)', borderRadius: 'var(--radius-md)' }}>
          {norm.map((o, i) => {
            const sel = o.value === cur.value, act = i === active;
            return (
              <div key={o.value} id={uid + '-o' + i} role="option" aria-selected={sel} onMouseEnter={() => setActive(i)} onMouseDown={e => e.preventDefault()} onClick={() => choose(i)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '8px 10px', minHeight: 'max(0px, var(--touch-min))', borderRadius: 'var(--radius-sm)',
                  fontSize: 13, color: sel || act ? 'var(--text-primary)' : 'var(--text-secondary)', background: act ? 'var(--surface-nested-hover)' : sel ? 'var(--surface-nested)' : 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {o.label}{sel && <Icon name="check" size={14} color="var(--primary)" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
