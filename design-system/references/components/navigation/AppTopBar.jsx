import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { IconButton } from '../core/IconButton.jsx';
import { material, useElementWidth, typo } from '../core/spatial.js';
export function AppTopBar({ searchPlaceholder = 'Search monitors, incidents…', onSearch, onCommand, shortcut = '⌘K', actions, user, breadcrumbs, title, onMenu, style }) {
  const ref = React.useRef(null);
  const w = useElementWidth(ref, 1000);
  const narrow = w < 760;
  const initials = user ? user.name.split(' ').map(x => x[0]).join('').slice(0, 2) : '';
  const crumbs = breadcrumbs && breadcrumbs.length > 0;
  const userChip = user && (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: narrow || crumbs ? 4 : '6px 14px 6px 6px', borderRadius: 'var(--radius-md)', ...material('frosted', 1), flex: 'none' }} aria-label={user.name + (user.role ? ', ' + user.role : '')}>
      <span aria-hidden="true" style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--surface-nested-strong)', color: 'var(--text-strong)', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{initials}</span>
      {!narrow && !crumbs && <span style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{user.name}</span>
        {user.role && <span style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.3 }}>{user.role}</span>}
      </span>}
    </div>
  );
  const search = onCommand
    ? <button type="button" onClick={onCommand} aria-label={'Search and jump to (' + shortcut + ')'} aria-keyshortcuts="Meta+K Control+K"
        style={{ flex: 1, maxWidth: 420, display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 8px 0 14px', borderRadius: 'var(--radius-md)', ...material('frosted', 1), cursor: 'pointer', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', fontSize: 14, textAlign: 'left' }}>
        <Icon name="search" size={16} /><span style={{ flex: 1 }}>{searchPlaceholder}</span>
        <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '4px 7px', borderRadius: 'var(--radius-xs)', background: 'var(--surface-nested-hover)', color: 'var(--text-secondary)' }}>{shortcut}</kbd>
      </button>
    : <label style={{ flex: 1, maxWidth: 420, display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 8px 0 14px', borderRadius: 'var(--radius-md)', ...material('frosted', 1) }}>
        <Icon name="search" size={16} color="var(--text-tertiary)" />
        <input aria-label="Search" placeholder={searchPlaceholder} onChange={e => onSearch && onSearch(e.target.value)} style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-sans)' }} />
        <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '4px 7px', borderRadius: 'var(--radius-xs)', background: 'var(--surface-nested-hover)', color: 'var(--text-secondary)' }}>{shortcut}</kbd>
      </label>;
  return (
    <header ref={ref} style={{ display: 'flex', alignItems: 'center', gap: narrow ? 8 : 16, minHeight: 'var(--header-height)', fontFamily: 'var(--font-sans)', minWidth: 0, ...style }}>
      {onMenu && <IconButton icon="menu" label="Open navigation" variant="ghost" shape="square" onClick={onMenu} />}
      {crumbs || title ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: narrow ? 1 : '0 1 auto' }}>
          {crumbs && <nav aria-label="Breadcrumb"><ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', alignItems: 'center', gap: 6, ...typo('caption'), color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {breadcrumbs.map((b, i) => { const last = i === breadcrumbs.length - 1; return <li key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              {i > 0 && <Icon name="chevron-right" size={12} color="var(--text-disabled)" />}
              {b.onClick && !last ? <button type="button" onClick={b.onClick} style={{ border: 0, background: 'transparent', padding: 0, color: 'var(--text-tertiary)', font: 'inherit', cursor: 'pointer' }}>{b.label}</button>
                : <span aria-current={last ? 'page' : undefined} style={{ color: last ? 'var(--text-strong)' : undefined, overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.label}</span>}</li>; })}
          </ol></nav>}
          {title && <span style={{ ...typo('card-title'), color: 'var(--text-primary)' }}>{title}</span>}
        </div>
      ) : (!narrow && userChip)}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>{!narrow && search}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: narrow ? 6 : 10, flex: 'none' }}>
        {narrow && <IconButton icon="search" label={'Search (' + shortcut + ')'} onClick={onCommand} />}
        {actions}
        {(crumbs || title || narrow) && userChip}
      </div>
    </header>
  );
}
