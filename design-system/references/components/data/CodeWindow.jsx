import React from 'react';
const KW = /^(SELECT|FROM|WHERE|AND|OR|GROUP|BY|ORDER|LIMIT|AS|INSERT|INTO|VALUES|JOIN|ON|DESC|ASC|curl|const|let|await|import|from|export|return|if|true|false|null|monitors|alerts)$/i;
function hl(line) {
  const out = []; const re = /(--.*$|#.*$|\/\/.*$)|('[^']*'|"[^"]*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w-]*)|(\s+|.)/g; let m;
  while ((m = re.exec(line))) {
    if (m[1]) out.push(<span style={{ color: 'var(--code-comment)' }}>{m[1]}</span>);
    else if (m[2]) out.push(<span style={{ color: 'var(--code-string)' }}>{m[2]}</span>);
    else if (m[3]) out.push(<span style={{ color: 'var(--code-number)' }}>{m[3]}</span>);
    else if (m[4]) out.push(KW.test(m[4]) ? <span style={{ color: 'var(--code-keyword)' }}>{m[4]}</span> : m[4]);
    else out.push(m[5]);
  }
  return out.map((x, i) => <React.Fragment key={i}>{x}</React.Fragment>);
}
export function CodeWindow({ code = '', title, tabs, activeTab, onTab, lineNumbers = true, status, statusTone = 'up', highlight = true, style }) {
  const lines = code.replace(/\n$/, '').split('\n');
  const sc = statusTone === 'down' ? 'var(--status-down)' : statusTone === 'info' ? 'var(--status-info)' : 'var(--status-up)';
  return (
    <div style={{ background: 'var(--light-top-edge), var(--surface-code)', border: '1px solid var(--border-default)', boxShadow: 'var(--elev-1-shadow), var(--elev-1-edge)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', fontFamily: 'var(--font-sans)', minWidth: 0, ...style }}>
      {(title || tabs) && <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 44, padding: '0 16px', borderBottom: '1px solid var(--hairline)' }}>
        <span style={{ display: 'flex', gap: 6 }}>{[0, 1, 2].map(i => <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--hairline-strong)' }} />)}</span>
        {title && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{title}</span>}
        {tabs && <span style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>{tabs.map(t => <button key={t} type="button" onClick={() => onTab && onTab(t)}
          style={{ border: 0, cursor: 'pointer', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-sans)',
            background: t === activeTab ? 'var(--surface-elevated)' : 'transparent', color: t === activeTab ? 'var(--on-dark)' : 'var(--text-muted)' }}>{t}</button>)}</span>}
      </div>}
      <pre style={{ margin: 0, padding: '20px 24px', overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: 14, lineHeight: 1.55, color: 'var(--code-fn)' }}>
        {lines.map((l, i) => <div key={i} style={{ display: 'flex', gap: 20 }}>
          {lineNumbers && <span style={{ width: 18, flex: 'none', textAlign: 'right', color: 'var(--text-muted-soft)', userSelect: 'none' }}>{i + 1}</span>}
          <span style={{ whiteSpace: 'pre' }}>{highlight ? hl(l) : l || ' '}</span></div>)}
      </pre>
      {status && <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 16px', borderTop: '1px solid var(--hairline)', background: 'var(--surface-soft)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc }} />{status}</div>}
    </div>
  );
}
