import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { material, usePresence, useReducedMotion, typo } from '../core/spatial.js';
export function CommandPalette({ open, onClose, items = [], placeholder = 'Search pages and actions…', emptyText = 'No matches' }) {
  const { mounted, visible } = usePresence(open, 140);
  const reduced = useReducedMotion();
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState(0);
  const input = React.useRef(null), list = React.useRef(null);
  const closeRef = React.useRef(onClose); closeRef.current = onClose;
  const uid = (React.useId ? React.useId() : 'cmd').replace(/:/g, '');
  React.useEffect(() => {
    if (!open) return;
    const prev = document.activeElement; setQ(''); setActive(0);
    const t = setTimeout(() => input.current && input.current.focus(), 30);
    return () => { clearTimeout(t); prev && prev.focus && prev.focus(); };
  }, [open]);
  const ql = q.trim().toLowerCase();
  const results = items.filter(it => !ql || (it.label + ' ' + (it.group || '') + ' ' + (it.keywords || '')).toLowerCase().includes(ql));
  React.useEffect(() => { setActive(0); }, [ql]);
  React.useEffect(() => { const el = list.current && list.current.querySelector('[data-active="true"]'); if (el && list.current) { const r = el.offsetTop, h = el.offsetHeight; if (r < list.current.scrollTop) list.current.scrollTop = r; else if (r + h > list.current.scrollTop + list.current.clientHeight) list.current.scrollTop = r + h - list.current.clientHeight; } }, [active]);
  const run = it => { if (!it) return; closeRef.current && closeRef.current(); setTimeout(() => it.onSelect && it.onSelect(), 0); };
  const onKey = e => {
    if (e.key === 'Escape') { e.preventDefault(); closeRef.current && closeRef.current(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(results.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(results[active]); }
    else if (e.key === 'Tab') e.preventDefault();
  };
  if (!mounted) return null;
  let lastGroup = null;
  return (
    <div onClick={() => closeRef.current && closeRef.current()} style={{ position: 'fixed', inset: 0, zIndex: 'var(--layer-4)', background: 'var(--scrim)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '12vh 16px 16px',
      opacity: visible ? 1 : 0, transition: visible ? 'opacity var(--motion-fast) var(--ease-enter)' : 'opacity var(--motion-instant) var(--ease-exit)', fontFamily: 'var(--font-sans)' }}>
      <div role="dialog" aria-modal="true" aria-label="Command palette" onClick={e => e.stopPropagation()} onKeyDown={onKey}
        style={{ width: '100%', maxWidth: 560, borderRadius: 'var(--radius-lg)', overflow: 'hidden', ...material('overlay', 4), backdropFilter: 'none', WebkitBackdropFilter: 'none', boxShadow: 'var(--elev-4-shadow), var(--elev-4-edge)',
          opacity: visible ? 1 : 0, transform: reduced || visible ? 'none' : 'translateY(-8px) scale(.98)',
          transition: visible ? 'opacity var(--motion-fast) var(--ease-enter), transform var(--spring-responsive-duration) var(--spring-responsive)' : 'opacity var(--motion-instant) var(--ease-exit), transform var(--motion-instant) var(--ease-exit)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', height: 56, borderBottom: '1px solid var(--border-subtle)' }}>
          <Icon name="search" size={18} color="var(--text-tertiary)" />
          <input ref={input} value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder} role="combobox" aria-expanded="true" aria-controls={uid + '-lb'} aria-autocomplete="list"
            aria-activedescendant={results[active] ? uid + '-' + active : undefined}
            style={{ flex: 1, minWidth: 0, height: '100%', background: 'transparent', border: 0, outline: 'none', color: 'var(--text-primary)', fontSize: 16, fontFamily: 'var(--font-sans)' }} />
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 6px', borderRadius: 'var(--radius-xs)', background: 'var(--surface-nested-hover)', color: 'var(--text-secondary)' }}>esc</kbd>
        </div>
        <div ref={list} id={uid + '-lb'} role="listbox" aria-label="Results" style={{ position: 'relative', maxHeight: 360, overflowY: 'auto', padding: 6 }}>
          {results.length === 0 && <div role="status" style={{ padding: '24px 12px', textAlign: 'center', ...typo('body-sm'), color: 'var(--text-tertiary)' }}>{emptyText}</div>}
          {results.map((it, i) => {
            const head = it.group && it.group !== lastGroup ? (lastGroup = it.group) : null;
            const act = i === active;
            return <React.Fragment key={it.id}>
              {head && <div role="presentation" style={{ padding: '10px 10px 4px', ...typo('overline'), letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{head}</div>}
              <div id={uid + '-' + i} role="option" aria-selected={act} data-active={act} onMouseMove={() => setActive(i)} onClick={() => run(it)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 10px', minHeight: 'max(40px, var(--touch-min))', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  background: act ? 'var(--neon-reflection)' : 'transparent', color: act ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'background var(--motion-instant)' }}>
                {it.icon && <Icon name={it.icon} size={16} color={act ? 'var(--primary)' : 'var(--text-tertiary)'} />}
                <span style={{ flex: 1, fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.label}</span>
                {it.hint && <span style={{ ...typo('caption'), color: 'var(--text-tertiary)' }}>{it.hint}</span>}
                {it.shortcut && <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 6px', borderRadius: 'var(--radius-xs)', background: 'var(--surface-nested-hover)', color: 'var(--text-secondary)' }}>{it.shortcut}</kbd>}
              </div>
            </React.Fragment>;
          })}
        </div>
        <div aria-hidden="true" style={{ display: 'flex', gap: 16, padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', ...typo('caption'), color: 'var(--text-tertiary)' }}>
          <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span>
        </div>
      </div>
    </div>
  );
}
