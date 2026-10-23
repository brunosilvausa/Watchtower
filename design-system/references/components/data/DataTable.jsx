import React from 'react';
import { typo } from '../core/spatial.js';
import { Skeleton } from '../feedback/Skeleton.jsx';
import { StateMessage } from '../feedback/StateMessage.jsx';
export function DataTable({ columns = [], rows = [], onRowClick, rowKey = 'id', dense, emptyText = 'Nothing here yet.', emptyState, error, onRetry, loading, loadingRows = 4,
  selectedKey, caption, stickyHeader, style }) {
  const [hover, setHover] = React.useState(null);
  const [focus, setFocus] = React.useState(null);
  const body = React.useRef(null);
  const pad = dense ? '9px 16px' : '13px 16px';
  const keyOf = (r, i) => r[rowKey] ?? i;
  const onKey = (e, i, r) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick && onRowClick(r); return; }
    const to = e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowUp' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? rows.length - 1 : null;
    if (to == null) return; e.preventDefault();
    const tr = body.current && body.current.children[Math.max(0, Math.min(rows.length - 1, to))]; tr && tr.focus();
  };
  const tabRow = rows.findIndex((r, i) => keyOf(r, i) === selectedKey);
  const state = (node) => <tr><td colSpan={columns.length} style={{ padding: 'var(--space-lg) 16px' }}>{node}</td></tr>;
  return (
    <div role={caption ? 'region' : undefined} aria-label={caption} tabIndex={caption ? 0 : undefined}
      style={{ width: '100%', overflowX: 'auto', fontFamily: 'var(--font-sans)', borderRadius: 'var(--radius-sm)', ...style }}>
      <table aria-busy={loading || undefined} style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, ...typo('body-sm') }}>
        {caption && <caption className="wt-sr-only">{caption}</caption>}
        <thead><tr>{columns.map((c, i) => (
          <th key={c.key} scope="col" style={{ textAlign: c.align || 'left', width: c.width, padding: '10px 16px', ...typo('label'), fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap',
            background: 'var(--surface-nested-strong)', boxShadow: 'var(--elev-1-edge)', position: stickyHeader ? 'sticky' : undefined, top: stickyHeader ? 0 : undefined, zIndex: stickyHeader ? 1 : undefined,
            borderTopLeftRadius: i === 0 ? 8 : 0, borderBottomLeftRadius: i === 0 ? 8 : 0, borderTopRightRadius: i === columns.length - 1 ? 8 : 0, borderBottomRightRadius: i === columns.length - 1 ? 8 : 0 }}>{c.label}</th>))}</tr></thead>
        <tbody ref={body}>
          {loading && Array.from({ length: loadingRows }, (_, ri) => <tr key={'s' + ri} aria-hidden="true">{columns.map((c, ci) => <td key={c.key} style={{ padding: pad, borderBottom: '1px solid var(--border-subtle)' }}>
            <Skeleton lines={1} width={c.align === 'right' ? '48%' : ci === 0 ? '72%' : '56%'} style={{ marginLeft: c.align === 'right' ? 'auto' : 0 }} /></td>)}</tr>)}
          {loading && <tr className="wt-sr-only"><td>Loading rows</td></tr>}
          {!loading && error && state(<StateMessage compact kind="error" title={typeof error === 'string' ? error : 'Couldn’t load this table'} action={onRetry && <button type="button" onClick={onRetry} style={{ border: '1px solid var(--border-default)', background: 'var(--surface-nested)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', ...typo('label'), cursor: 'pointer' }}>Retry</button>} />)}
          {!loading && !error && rows.length === 0 && state(emptyState || <StateMessage compact kind="empty" title={emptyText} />)}
          {!loading && !error && rows.map((r, ri) => {
            const k = keyOf(r, ri), sel = selectedKey != null && k === selectedKey, hv = hover === ri, fc = focus === ri;
            return (
              <tr key={k} tabIndex={onRowClick ? ((tabRow === -1 ? ri === 0 : ri === tabRow) ? 0 : -1) : undefined} aria-selected={selectedKey != null ? sel : undefined}
                onClick={onRowClick ? () => onRowClick(r) : undefined} onKeyDown={onRowClick ? e => onKey(e, ri, r) : undefined}
                onMouseEnter={() => setHover(ri)} onMouseLeave={() => setHover(h => (h === ri ? null : h))} onFocus={() => setFocus(ri)} onBlur={() => setFocus(f => (f === ri ? null : f))}
                style={{ cursor: onRowClick ? 'pointer' : 'default', outline: fc ? '2px solid var(--primary)' : 'none', outlineOffset: -2,
                  background: sel ? 'var(--surface-nested-strong)' : hv && onRowClick ? 'var(--surface-nested)' : 'transparent', transition: 'background var(--motion-fast) var(--ease-standard)' }}>
                {columns.map((c, ci) => (
                  <td key={c.key} style={{ textAlign: c.align || 'left', padding: pad, height: 'max(0px, var(--touch-min))', color: c.muted ? 'var(--text-tertiary)' : 'var(--text-strong)', borderBottom: ri === rows.length - 1 ? 0 : '1px solid var(--border-subtle)',
                    boxShadow: sel && ci === 0 ? 'inset 2px 0 0 var(--primary)' : 'none',
                    fontFamily: c.mono ? 'var(--font-mono)' : undefined, fontSize: c.mono ? 13 : 14, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: 'var(--numeric-features)', whiteSpace: 'nowrap' }}>
                    {c.render ? c.render(r[c.key], r) : (r[c.key] == null ? <span style={{ color: 'var(--text-tertiary)' }} aria-label="No data">—</span> : r[c.key])}
                  </td>))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
