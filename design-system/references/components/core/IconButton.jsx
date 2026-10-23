import React from 'react';
import { Icon } from './Icon.jsx';
import { useMagnetic, magneticStyle } from './spatial.js';
export function IconButton({ icon, label, variant = 'dark', shape = 'circle', size, dot, active, magnetic, onClick, style, ...rest }) {
  const ref = React.useRef(null);
  const [hover, setHover] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  useMagnetic(ref, { enabled: !!magnetic });
  let skin;
  if (variant === 'primary') skin = { background: pressed ? 'var(--material-neon-bg-active)' : 'var(--material-neon-bg)', border: '1px solid var(--material-neon-border)', color: 'var(--primary-foreground)',
    boxShadow: pressed ? 'inset 0 2px 4px rgba(0,0,0,.28)' : 'var(--material-neon-edge), ' + (hover ? 'var(--elev-2-shadow), var(--glow-primary)' : 'var(--elev-1-shadow)') };
  else if (variant === 'ghost') skin = { background: hover || active ? 'var(--surface-nested)' : 'transparent', border: '1px solid transparent', color: active ? 'var(--text-primary)' : 'var(--text-secondary)' };
  else skin = { background: 'var(--glass-liquid-sheen), ' + (hover || active ? 'var(--surface-nested-hover)' : 'var(--glass-liquid-bg)'),
    backdropFilter: 'var(--glass-liquid-filter)', WebkitBackdropFilter: 'var(--glass-liquid-filter)', border: '1px solid var(--glass-liquid-border)', color: active || hover ? 'var(--text-primary)' : 'var(--text-secondary)',
    boxShadow: pressed ? 'inset 0 2px 4px rgba(0,0,0,.35)' : 'var(--glass-liquid-edge), ' + (hover ? 'var(--elev-2-shadow)' : 'var(--elev-1-shadow)') };
  const lifts = variant !== 'ghost';
  return (
    <button ref={ref} type="button" aria-label={label} title={label} aria-pressed={active == null ? undefined : !!active} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => { setPressed(false); setHover(false); }}
      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') setPressed(true); }} onKeyUp={() => setPressed(false)} onBlur={() => setPressed(false)}
      style={{ position: 'relative', width: size ? 'max(' + size + 'px, var(--touch-min))' : 'var(--icon-button-size)', height: size ? 'max(' + size + 'px, var(--touch-min))' : 'var(--icon-button-size)', flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer',
        borderRadius: shape === 'circle' ? '50%' : 'var(--radius-md)', ...skin,
        transform: !lifts ? 'none' : pressed ? 'translateY(var(--spatial-button-press-y)) scale(.96)' : hover ? 'translateY(var(--spatial-button-hover-y))' : 'none',
        transition: pressed ? 'transform var(--motion-instant) var(--ease-standard), box-shadow var(--motion-instant)' : 'transform var(--spring-responsive-duration) var(--spring-responsive), box-shadow var(--motion-fast) var(--ease-standard), background var(--motion-fast)',
        ...(magnetic ? magneticStyle : null), ...style }} {...rest}>
      <Icon name={icon} size={size ? Math.round(size * 0.5) : 18} />
      {dot && <span style={{ position: 'absolute', top: '20%', right: '20%', width: 7, height: 7, borderRadius: '50%', background: dot === true ? 'var(--primary)' : dot,
        boxShadow: '0 0 0 2px var(--background-base)' + (dot === true ? ', var(--glow-primary-strong)' : '') }} />}
    </button>
  );
}
