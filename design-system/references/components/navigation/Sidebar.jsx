import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { Wordmark } from './Wordmark.jsx';
import { material, typo } from '../core/spatial.js';
export function Sidebar({ workspace, sections = [], active, onSelect, footer, collapsed, onCollapsedChange, label = 'Main', style }) {
  const nav = React.useRef(null);
  const [ind, setInd] = React.useState(null);
  const [hover, setHover] = React.useState(null);
  const measure = React.useCallback(() => {
    const el = nav.current && nav.current.querySelector('[aria-current="page"]');
    setInd(p => !el ? null : (p && p.y === el.offsetTop && p.h === el.offsetHeight ? p : { y: el.offsetTop, h: el.offsetHeight, first: !p }));
  }, []);
  React.useLayoutEffect(measure, [active, sections, measure]);
  React.useEffect(() => {
    if (!nav.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure); ro.observe(nav.current); return () => ro.disconnect();
  }, [measure]);
  return (
    <aside aria-label={label + ' navigation'} style={{ width: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)', transition: 'width var(--spring-spatial-duration) var(--spring-spatial)', overflow: 'hidden', flex: 'none', display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 16px', ...material('smoked', 2), borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-sans)', minHeight: 0, ...style }}>
      {!collapsed && <div style={{ padding: '0 8px' }}><Wordmark size={22} /></div>}
      {workspace && (
        <button type="button" onClick={workspace.onClick} aria-label={'Workspace: ' + workspace.name + (workspace.plan ? ', ' + workspace.plan : '') + '. Switch workspace'} style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : undefined, gap: 10, padding: collapsed ? 8 : 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
          background: 'var(--surface-inset)', boxShadow: 'var(--inset-well)', cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ width: 28, height: 28, flex: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: 'var(--on-primary)', boxShadow: 'var(--glow-primary), var(--material-neon-edge)', fontWeight: 700, fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{(workspace.name || '?')[0].toUpperCase()}</span>
          {!collapsed && <><span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{workspace.name}</span>
            {workspace.plan && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{workspace.plan}</span>}
          </span>
          <Icon name="chevrons-up-down" size={14} color="var(--text-muted)" /></>}
        </button>
      )}
      <nav ref={nav} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 18, flex: 1, overflowY: 'auto' }}>
        {ind && <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: ind.h, transform: 'translateY(' + ind.y + 'px)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)', background: 'var(--neon-reflection)', boxShadow: 'var(--elev-1-shadow), var(--elev-2-edge)', pointerEvents: 'none',
          transition: ind.first ? 'none' : 'transform var(--spring-spatial-duration) var(--spring-spatial)' }} />}
        {sections.map((s, si) => (
          <div key={si} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {s.label && collapsed && <div aria-hidden="true" style={{ height: 1, margin: '0 12px 8px', background: 'var(--border-subtle)' }} />}
            {s.label && !collapsed && <div style={{ padding: '0 12px 8px', fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{s.label}</div>}
            {s.items.map(it => {
              const on = it.id === active;
              return (
                <button key={it.id} type="button" aria-current={on ? 'page' : undefined} aria-label={collapsed ? it.label + (it.badge != null ? ', ' + it.badge : '') : undefined} title={collapsed ? it.label : undefined} onClick={() => onSelect && onSelect(it.id)}
                  onMouseEnter={() => setHover(it.id)} onMouseLeave={() => setHover(h => (h === it.id ? null : h))}
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : undefined, gap: 12, height: 'max(40px, var(--touch-min))', padding: collapsed ? 0 : '0 12px',
                  borderRadius: 'var(--radius-md)', border: '1px solid transparent', background: !on && hover === it.id ? 'var(--surface-nested)' : 'transparent',
                  transition: 'background var(--motion-fast) var(--ease-standard), color var(--motion-fast) var(--ease-standard)',
                  color: on ? 'var(--text-primary)' : hover === it.id ? 'var(--text-strong)' : 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: on ? 600 : 500, cursor: 'pointer', textAlign: 'left' }}>
                  <Icon name={it.icon} size={18} color={on ? 'var(--primary)' : 'currentColor'} style={{ filter: on ? 'var(--glow-icon-neon)' : 'none', transition: 'filter var(--motion-normal) var(--ease-standard)' }} />
                  {!collapsed && <span style={{ flex: 1 }}>{it.label}</span>}
                  {it.badge != null && collapsed && <span aria-hidden="true" style={{ position: 'absolute', top: 8, right: 14, width: 7, height: 7, borderRadius: '50%', background: it.badgeTone === 'down' ? 'var(--status-down)' : 'var(--text-tertiary)', boxShadow: '0 0 0 2px var(--background-elevated)' }} />}
                  {it.badge != null && !collapsed && <span style={{ minWidth: 20, height: 18, padding: '0 6px', borderRadius: 999, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: it.badgeTone === 'down' ? 'var(--status-down)' : 'var(--surface-elevated)', color: it.badgeTone === 'down' ? '#fff' : 'var(--text-body-strong)' }}>{it.badge}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      {!collapsed && footer}
      {onCollapsedChange && <button type="button" onClick={() => onCollapsedChange(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}
        style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 10, height: 'max(36px, var(--touch-min))', padding: collapsed ? 0 : '0 12px', border: 0, borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-tertiary)', ...typo('label'), cursor: 'pointer' }}>
        <Icon name={collapsed ? 'panel-left-open' : 'panel-left-close'} size={16} />{!collapsed && 'Collapse'}</button>}
    </aside>
  );
}
