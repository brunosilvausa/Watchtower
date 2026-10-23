import React from 'react';
import { Wordmark } from './Wordmark.jsx';
import { useMediaQuery } from '../core/spatial.js';
const DEFAULT = [
  { title: 'Product', links: ['Monitors', 'Status pages', 'Alerting', 'API'] },
  { title: 'Use cases', links: ['Solo developers', 'Small teams', 'Agencies', 'Homelabs'] },
  { title: 'Resources', links: ['Docs', 'Changelog', 'Guides', 'System status'] },
  { title: 'Company', links: ['About', 'Security', 'Privacy', 'Contact'] },
];
export function Footer({ columns = DEFAULT, note = '© 2026 Watchtower. Your data stays in your workspace.', style }) {
  const narrow = useMediaQuery('(max-width: 767px)');
  return (
    <footer style={{ position: 'relative', background: 'var(--background-base)', borderTop: '1px solid var(--hairline)', fontFamily: 'var(--font-sans)', ...style }}>
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '64px 32px', display: 'grid', gridTemplateColumns: narrow ? 'repeat(2, minmax(0,1fr))' : '1.4fr repeat(' + columns.length + ', 1fr)', gap: 32 }}>
        <div style={{ gridColumn: narrow ? '1 / -1' : undefined }}><Wordmark size={22} /></div>
        {columns.map(c => <div key={c.title} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--on-dark)' }}>{c.title}</span>
          {c.links.map(l => <a key={l} href="#" style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>{l}</a>)}
        </div>)}
      </div>
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '20px 32px 40px', fontSize: 13, color: 'var(--text-muted-soft)' }}>{note}</div>
    </footer>
  );
}
