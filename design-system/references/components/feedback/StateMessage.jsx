import React from 'react';
import { typo } from '../core/spatial.js';
import { Icon } from '../core/Icon.jsx';
const KIND = {
  empty: { icon: 'inbox', tone: 'var(--text-tertiary)', role: undefined },
  unavailable: { icon: 'circle-slash', tone: 'var(--text-tertiary)', role: undefined },
  partial: { icon: 'triangle-alert', tone: 'var(--status-degraded)', role: 'status' },
  error: { icon: 'circle-alert', tone: 'var(--status-down)', role: 'alert' },
  success: { icon: 'circle-check', tone: 'var(--status-up)', role: 'status' },
};
export function StateMessage({ kind = 'empty', title, description, action, icon, compact, style }) {
  const k = KIND[kind] || KIND.empty;
  const disc = <span style={{ width: compact ? 28 : 40, height: compact ? 28 : 40, flex: 'none', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--surface-nested-strong)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--elev-1-edge)', color: k.tone }}><Icon name={icon || k.icon} size={compact ? 15 : 18} /></span>;
  if (compact) return (
    <div role={k.role} style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-sans)', ...style }}>
      {disc}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ ...typo('label'), color: 'var(--text-strong)' }}>{title}</span>
        {description && <span style={{ ...typo('caption'), color: 'var(--text-tertiary)' }}>{description}</span>}
      </div>
      {action && <div style={{ marginLeft: 'auto' }}>{action}</div>}
    </div>
  );
  return (
    <div role={k.role} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, padding: 'var(--space-xl) var(--space-lg)', fontFamily: 'var(--font-sans)', ...style }}>
      {disc}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 380 }}>
        <span style={{ ...typo('card-title'), color: 'var(--text-primary)' }}>{title}</span>
        {description && <span style={{ ...typo('body-sm'), color: 'var(--text-secondary)', textWrap: 'pretty' }}>{description}</span>}
      </div>
      {action && <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>{action}</div>}
    </div>
  );
}
