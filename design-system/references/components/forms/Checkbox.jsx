import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Checkbox({ checked, defaultChecked, onChange, label, disabled, style }) {
  const [inner, setInner] = React.useState(!!defaultChecked);
  const on = checked ?? inner;
  const toggle = () => { if (disabled) return; if (checked == null) setInner(!on); onChange && onChange(!on); };
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-strong)', ...style }}>
      <span role="checkbox" aria-checked={on} aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : 0} onClick={toggle}
        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } }}
        style={{ width: 18, height: 18, flex: 'none', borderRadius: 'var(--radius-xs)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: on ? 'var(--primary)' : 'var(--surface-inset)', border: '1px solid ' + (on ? 'var(--primary)' : 'var(--border-strong)'), boxShadow: on ? 'var(--glow-primary), var(--material-neon-edge)' : 'var(--inset-well)',
        transition: 'background var(--motion-fast) var(--ease-standard), border-color var(--motion-fast), box-shadow var(--motion-normal)' }}>
        <span style={{ display: 'inline-flex', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(.4)', transition: 'transform var(--spring-expressive-duration) var(--spring-expressive), opacity var(--motion-instant)' }}>
          <Icon name="check" size={13} color="var(--primary-foreground)" />
        </span>
      </span>
      <span onClick={toggle}>{label}</span>
    </label>
  );
}
