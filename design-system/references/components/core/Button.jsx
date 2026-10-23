import React from 'react';
import { Icon } from './Icon.jsx';
import { useMagnetic, magneticStyle } from './spatial.js';
const SIZES = {
  sm: { height: 32, padding: '0 14px', fontSize: 13, radius: 'var(--radius-sm)', icon: 16, gap: 6 },
  md: { height: 'var(--control-height)', padding: '0 20px', fontSize: 14, radius: 'var(--radius-md)', icon: 16, gap: 8 },
  lg: { height: 48, padding: '0 24px', fontSize: 15, radius: 'var(--radius-md)', icon: 18, gap: 8 },
};
const V = {
  primary: {
    bg: 'var(--material-neon-bg)', bgHover: 'var(--material-neon-bg-hover)', bgActive: 'var(--material-neon-bg-active)',
    fg: 'var(--primary-foreground)', border: 'var(--material-neon-border)',
    sh: 'var(--material-neon-edge), 0 1px 0 rgba(0,0,0,.45), var(--elev-1-shadow)',
    shHover: 'var(--material-neon-edge), 0 2px 0 rgba(0,0,0,.45), var(--elev-2-shadow), var(--glow-primary)',
    shActive: 'inset 0 2px 4px rgba(0,0,0,.28), 0 0 0 rgba(0,0,0,0)',
  },
  secondary: {
    bg: 'var(--metal-brush), var(--metal-bg)', bgHover: 'var(--metal-brush), var(--metal-bg-hover)', bgActive: 'var(--metal-bg-active)',
    fg: 'var(--text-primary)', border: 'var(--metal-border)',
    sh: 'var(--metal-edge), var(--elev-1-shadow)', shHover: 'var(--metal-edge), var(--elev-2-shadow)', shActive: 'inset 0 2px 4px rgba(0,0,0,.45)',
  },
  outline: { bg: 'transparent', bgHover: 'var(--surface-nested)', bgActive: 'var(--surface-nested)', fg: 'var(--text-primary)', border: 'var(--border-strong)', sh: 'none', shHover: 'none', shActive: 'inset 0 2px 4px rgba(0,0,0,.3)' },
  ghost: { bg: 'transparent', bgHover: 'var(--surface-nested)', bgActive: 'var(--surface-nested)', fg: 'var(--text-secondary)', border: 'transparent', sh: 'none', shHover: 'none', shActive: 'none' },
  inverse: {
    bg: 'linear-gradient(180deg, var(--wt-ink-800), var(--wt-ink-1000))', bgHover: 'linear-gradient(180deg, var(--wt-ink-700), var(--wt-ink-950))', bgActive: 'var(--wt-ink-1000)', fg: 'var(--text-primary)', border: 'rgba(255,255,255,.1)',
    sh: 'var(--metal-edge), var(--elev-1-shadow)', shHover: 'var(--metal-edge), var(--elev-2-shadow)', shActive: 'inset 0 2px 4px rgba(0,0,0,.6)',
  },
  danger: { bg: 'var(--status-down-bg)', bgHover: 'rgba(239,68,68,.18)', bgActive: 'rgba(239,68,68,.24)', fg: 'var(--status-down)', border: 'rgba(239,68,68,.25)', sh: 'none', shHover: '0 0 18px rgba(239,68,68,.18)', shActive: 'inset 0 2px 4px rgba(0,0,0,.3)' },
};
export function Button({ variant = 'primary', size = 'md', icon, iconRight, disabled, loading, magnetic, fullWidth, href, type = 'button', onClick, children, style, ...rest }) {
  const ref = React.useRef(null);
  const [hover, setHover] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = V[variant] || V.primary;
  const inert = disabled || loading;
  useMagnetic(ref, { enabled: !!magnetic && !inert && variant !== 'danger' });
  const primaryDisabled = disabled && variant === 'primary';
  const state = inert ? 'rest' : pressed ? 'active' : hover ? 'hover' : 'rest';
  const lifts = variant !== 'ghost' && variant !== 'outline';
  const css = {
    position: 'relative', display: fullWidth ? 'flex' : 'inline-flex', width: fullWidth ? '100%' : undefined,
    alignItems: 'center', justifyContent: 'center', gap: s.gap, height: typeof s.height === 'number' ? 'max(' + s.height + 'px, var(--touch-min))' : s.height, padding: s.padding,
    fontFamily: 'var(--font-sans)', fontSize: s.fontSize, fontWeight: 600, lineHeight: 1, whiteSpace: 'nowrap',
    borderRadius: s.radius, border: '1px solid ' + (primaryDisabled ? 'transparent' : v.border), textDecoration: 'none',
    background: primaryDisabled ? 'var(--primary-disabled)' : state === 'active' ? v.bgActive : state === 'hover' ? v.bgHover : v.bg,
    boxShadow: primaryDisabled ? 'none' : state === 'active' ? v.shActive : state === 'hover' ? v.shHover : v.sh,
    transform: !lifts || inert ? 'none' : state === 'active' ? 'translateY(var(--spatial-button-press-y)) scale(var(--spatial-button-press-scale))' : state === 'hover' ? 'translateY(var(--spatial-button-hover-y))' : 'none',
    color: primaryDisabled ? 'var(--text-disabled)' : v.fg,
    opacity: disabled && !primaryDisabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : loading ? 'progress' : 'pointer',
    transition: state === 'active'
      ? 'transform var(--motion-instant) var(--ease-standard), box-shadow var(--motion-instant) var(--ease-standard), background var(--motion-instant)'
      : 'transform var(--spring-responsive-duration) var(--spring-responsive), box-shadow var(--motion-fast) var(--ease-standard), background var(--motion-fast) var(--ease-standard), opacity var(--motion-fast)',
    ...(magnetic ? magneticStyle : null), ...style,
  };
  const Tag = href ? 'a' : 'button';
  return (
    <Tag ref={ref} href={href} type={href ? undefined : type} disabled={disabled} aria-disabled={inert || undefined} aria-busy={loading || undefined}
      onClick={inert ? undefined : onClick} style={css}
      onMouseEnter={() => setHover(true)} onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      onMouseLeave={() => { setPressed(false); setHover(false); }}
      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') setPressed(true); }} onKeyUp={() => setPressed(false)} onBlur={() => setPressed(false)} {...rest}>
      {loading
        ? <span aria-hidden="true" style={{ width: s.icon - 2, height: s.icon - 2, borderRadius: '50%', border: '2px solid currentColor', borderRightColor: 'transparent', animation: 'wt-spin 700ms linear infinite', opacity: 0.8 }} />
        : icon && <Icon name={icon} size={s.icon} />}
      {children}
      {iconRight && !loading && <Icon name={iconRight} size={s.icon} />}
    </Tag>
  );
}
