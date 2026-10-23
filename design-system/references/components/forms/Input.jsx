import React from 'react';
import { typo } from '../core/spatial.js';
import { Icon } from '../core/Icon.jsx';
export function Input({ label, hint, error, valid, icon, kbd, suffix, value, defaultValue, placeholder, type = 'text', disabled, readOnly, required, mono, onChange, id, style, inputStyle, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const auto = React.useId ? React.useId() : undefined;
  const fid = id || auto;
  const msgId = (error || hint) ? fid + '-msg' : undefined;
  const border = error ? 'var(--status-down)' : focus && !readOnly ? 'var(--border-focus)' : valid ? 'rgba(34,197,94,.55)' : readOnly ? 'var(--border-subtle)' : 'var(--border-default)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-sans)', minWidth: 0, ...style }}>
      {label && <label htmlFor={fid} style={{ display: 'flex', alignItems: 'baseline', gap: 6, ...typo('label'), color: disabled ? 'var(--text-tertiary)' : 'var(--text-strong)' }}>
        {label}{required && <span aria-hidden="true" style={{ color: 'var(--primary)' }}>*</span>}{readOnly && <span style={{ ...typo('caption'), color: 'var(--text-tertiary)' }}>Read only</span>}</label>}
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, height: 'var(--control-height)', padding: '0 14px', borderRadius: 'var(--radius-md)',
        background: readOnly ? 'transparent' : 'var(--surface-inset)', border: '1px ' + (readOnly ? 'dashed ' : 'solid ') + border, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'text',
        boxShadow: readOnly ? 'none' : focus && !error ? 'var(--glow-focus), var(--inset-well)' : 'var(--inset-well)',
        transition: 'border-color var(--motion-fast) var(--ease-standard), box-shadow var(--motion-normal) var(--ease-standard)' }}>
        {icon && <Icon name={icon} size={16} color="var(--text-tertiary)" />}
        <input id={fid} aria-invalid={error ? true : undefined} aria-describedby={msgId} aria-required={required || undefined} required={required}
          type={type} value={value} defaultValue={defaultValue} placeholder={placeholder} disabled={disabled} readOnly={readOnly}
          onChange={onChange} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ flex: 1, minWidth: 0, height: '100%', background: 'transparent', border: 0, outline: 'none', color: readOnly ? 'var(--text-secondary)' : 'var(--text-primary)', cursor: 'inherit',
            fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', fontSize: 'max(14px, min(16px, calc(var(--touch-min) * 999)))', ...inputStyle }} {...rest} />
        {valid && !error && <Icon name="circle-check" size={16} color="var(--status-up)" title="Valid" />}
        {error && <Icon name="circle-alert" size={16} color="var(--status-down)" />}
        {suffix && <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{suffix}</span>}
        {kbd && <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 6px', borderRadius: 'var(--radius-xs)', background: 'var(--surface-nested-hover)', color: 'var(--text-secondary)' }}>{kbd}</kbd>}
      </span>
      {(error || hint) && <span id={msgId} role={error ? 'alert' : undefined} style={{ ...typo('caption'), color: error ? 'var(--status-down)' : 'var(--text-tertiary)' }}>{error || hint}</span>}
    </div>
  );
}
