import React from 'react';
export function Tabs({ items = [], value, onChange, size = 'md', style }) {
  const norm = items.map(i => typeof i === 'string' ? { value: i, label: i } : i);
  const list = React.useRef(null);
  const [ind, setInd] = React.useState(null);
  const measure = React.useCallback(() => {
    const el = list.current && list.current.querySelector('[aria-selected="true"]');
    if (el) setInd(p => (p && p.x === el.offsetLeft && p.w === el.offsetWidth ? p : { x: el.offsetLeft, w: el.offsetWidth }));
  }, []);
  React.useLayoutEffect(measure, [value, norm.length, size, measure]);
  React.useEffect(() => {
    if (!list.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure); ro.observe(list.current); return () => ro.disconnect();
  }, [measure]);
  const onKey = e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = norm.findIndex(t => t.value === value);
    const n = norm[(i + (e.key === 'ArrowRight' ? 1 : -1) + norm.length) % norm.length];
    onChange && onChange(n.value);
    requestAnimationFrame(() => { const b = list.current && list.current.querySelector('[aria-selected="true"]'); b && b.focus(); });
  };
  return (
    <div ref={list} role="tablist" onKeyDown={onKey} style={{ position: 'relative', display: 'inline-flex', gap: 4, padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--surface-inset)', boxShadow: 'var(--inset-well)', ...style }}>
      {ind && <span aria-hidden="true" style={{ position: 'absolute', top: 4, bottom: 4, left: 0, width: ind.w, transform: 'translateX(' + ind.x + 'px)', borderRadius: 'var(--radius-sm)',
        background: 'var(--glass-liquid-sheen), var(--surface-nested-hover)', boxShadow: 'var(--glass-liquid-edge), 0 2px 8px rgba(0,0,0,.35)',
        transition: 'transform var(--spring-spatial-duration) var(--spring-spatial), width var(--spring-spatial-duration) var(--spring-spatial)' }} />}
      {norm.map(t => {
        const on = t.value === value;
        return (
          <button key={t.value} role="tab" aria-selected={on} tabIndex={on ? 0 : -1} type="button" onClick={() => onChange && onChange(t.value)}
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 'var(--touch-min)', padding: size === 'sm' ? '5px 10px' : '8px 14px', borderRadius: 'var(--radius-sm)', border: 0, background: 'transparent',
              color: on ? 'var(--text-primary)' : 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', fontSize: size === 'sm' ? 12 : 14, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'color var(--motion-fast) var(--ease-standard)' }}>
            {t.label}
            {t.count != null && <span style={{ fontSize: 11, color: on ? 'var(--primary)' : 'var(--text-disabled)', fontVariantNumeric: 'tabular-nums', transition: 'color var(--motion-fast)' }}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
