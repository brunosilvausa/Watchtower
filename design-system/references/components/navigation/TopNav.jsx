import React from 'react';
import { Wordmark } from './Wordmark.jsx';
import { Button } from '../core/Button.jsx';
import { IconButton } from '../core/IconButton.jsx';
import { useMediaQuery, usePresence, material } from '../core/spatial.js';
export function TopNav({ links = ['Product', 'Use cases', 'Pricing', 'Docs', 'Changelog'], active, onNav, onSignIn, onCta, ctaLabel = 'Start free', style }) {
  const narrow = useMediaQuery('(max-width: 899px)');
  const [open, setOpen] = React.useState(false);
  const sheet = usePresence(open && narrow, 140);
  React.useEffect(() => { if (!narrow) setOpen(false); }, [narrow]);
  const nav = l => { setOpen(false); onNav && onNav(l); };
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 20, height: 'var(--nav-height)', background: 'var(--glass-smoked-bg)', backdropFilter: 'var(--glass-smoked-filter)', WebkitBackdropFilter: 'var(--glass-smoked-filter)', borderBottom: '1px solid var(--glass-smoked-border)', boxShadow: 'var(--elev-2-shadow)', fontFamily: 'var(--font-sans)', ...style }}>
      <div style={{ maxWidth: 'var(--container-max)', height: '100%', margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px)', display: 'flex', alignItems: 'center', gap: narrow ? 12 : 40 }}>
        <a href="#" aria-label="Watchtower home" onClick={e => { e.preventDefault(); nav('home'); }} style={{ textDecoration: 'none' }}><Wordmark size={20} /></a>
        {narrow ? <span style={{ flex: 1 }} /> : <nav aria-label="Primary" style={{ display: 'flex', gap: 28, flex: 1 }}>
          {links.map(l => <a key={l} href="#" onClick={e => { e.preventDefault(); nav(l); }} aria-current={active === l ? 'page' : undefined}
            style={{ fontSize: 14, fontWeight: 500, textDecoration: 'none', color: active === l ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color var(--motion-fast)' }}>{l}</a>)}
        </nav>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!narrow && <Button variant="ghost" onClick={onSignIn}>Sign in</Button>}
          <Button size={narrow ? 'sm' : 'md'} onClick={onCta}>{ctaLabel}</Button>
          {narrow && <IconButton icon={open ? 'x' : 'menu'} label={open ? 'Close menu' : 'Open menu'} variant="ghost" shape="square" aria-expanded={open} aria-controls="wt-topnav-sheet" onClick={() => setOpen(!open)} />}
        </div>
      </div>
      {sheet.mounted && <nav id="wt-topnav-sheet" aria-label="Primary" style={{ position: 'absolute', top: '100%', left: 12, right: 12, marginTop: 8, padding: 8, borderRadius: 'var(--radius-lg)', ...material('overlay', 3), display: 'flex', flexDirection: 'column',
        opacity: sheet.visible ? 1 : 0, transform: sheet.visible ? 'none' : 'translateY(-6px)', transition: 'opacity var(--motion-fast) var(--ease-enter), transform var(--spring-responsive-duration) var(--spring-responsive)' }}>
        {links.map(l => <a key={l} href="#" aria-current={active === l ? 'page' : undefined} onClick={e => { e.preventDefault(); nav(l); }} style={{ display: 'flex', alignItems: 'center', minHeight: 44, padding: '0 12px', borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 500, textDecoration: 'none', color: active === l ? 'var(--text-primary)' : 'var(--text-secondary)', background: active === l ? 'var(--surface-nested-hover)' : 'transparent' }}>{l}</a>)}
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 4px' }} />
        <a href="#" onClick={e => { e.preventDefault(); setOpen(false); onSignIn && onSignIn(); }} style={{ display: 'flex', alignItems: 'center', minHeight: 44, padding: '0 12px', fontSize: 15, color: 'var(--text-secondary)', textDecoration: 'none' }}>Sign in</a>
      </nav>}
    </header>
  );
}
