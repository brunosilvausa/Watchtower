import React from 'react';
export function Switch({ checked, defaultChecked, onChange, label, description, disabled, style }) {
  const [inner, setInner] = React.useState(!!defaultChecked);
  const [press, setPress] = React.useState(false);
  const on = checked ?? inner;
  const toggle = () => { if (disabled) return; if (checked == null) setInner(!on); onChange && onChange(!on); };
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, fontFamily: 'var(--font-sans)', ...style }}>
      <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={toggle}
        onPointerDown={() => setPress(true)} onPointerUp={() => setPress(false)} onPointerLeave={() => setPress(false)}
        style={{ position: 'relative', width: 36, height: 20, flex: 'none', borderRadius: 999, border: 0, padding: 0,
        background: on ? 'var(--primary)' : 'var(--surface-nested-hover)', boxShadow: on ? 'var(--glow-primary), var(--material-neon-edge)' : 'var(--inset-well)', cursor: 'inherit',
        transition: 'background var(--motion-fast) var(--ease-standard), box-shadow var(--motion-normal) var(--ease-standard)' }}>
        <span style={{ position: 'absolute', top: 2, left: 2, width: 16, height: 16, borderRadius: 999, background: on ? 'var(--primary-foreground)' : 'var(--text-secondary)', boxShadow: '0 1px 3px rgba(0,0,0,.45)',
          transformOrigin: on ? 'right center' : 'left center',
          transform: 'translateX(' + (on ? 16 : 0) + 'px) scaleX(' + (press && !disabled ? 1.18 : 1) + ')',
          transition: 'transform var(--spring-expressive-duration) var(--spring-expressive), background var(--motion-fast)' }} />
      </button>
      {(label || description) && <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {label && <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>}
        {description && <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{description}</span>}
      </span>}
    </label>
  );
}
