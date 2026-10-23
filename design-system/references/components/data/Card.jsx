import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { material, useSpatialTilt, spatialLayers, tiltTransform, typo } from '../core/spatial.js';
export function Card({ variant = 'frosted', padding = 'lg', title, icon, action, eyebrow, tilt, interactive, lift, children, style, bodyStyle, ...rest }) {
  const ref = React.useRef(null);
  const v = variant === 'dark' || variant === 'glass' ? 'frosted' : variant;
  const yellow = v === 'yellow';
  const spatial = !!tilt || !!interactive;
  const live = useSpatialTilt(ref, { enabled: spatial, max: tilt ? (tilt === true ? 'medium' : tilt) : 0, lift: lift ?? (tilt ? 20 : 8) });
  let surface;
  if (yellow) surface = { ...material('neon', 2), color: 'var(--primary-foreground)' };
  else if (v === 'flat') surface = { background: 'var(--surface-nested-strong)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' };
  else if (v === 'outline') surface = { background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-primary)' };
  else if (v === 'elevated') surface = { ...material('frosted', 2), color: 'var(--text-primary)' };
  else surface = { ...material(['smoked', 'liquid', 'metal', 'solid'].includes(v) ? v : 'frosted', 1), color: 'var(--text-primary)' };
  const pad = padding === 'xl' ? 'var(--space-xl)' : padding === 'md' ? 'var(--space-md)' : padding === 'none' ? 0 : 'var(--space-lg)';
  return (
    <section ref={ref} {...rest}
      style={{ position: 'relative', borderRadius: 'var(--radius-lg)', padding: pad, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', minWidth: 0,
        fontFamily: 'var(--font-sans)', ...surface, ...(spatial ? { transform: tiltTransform, zIndex: 'calc(1 + var(--wt-hover, 0) * 2)' } : null), ...style }}>
      {spatial && live && spatialLayers(yellow ? 0.6 : 1)}
      {(title || action || eyebrow) && (
        <header style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {icon && <span style={{ width: 32, height: 32, flex: 'none', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: yellow ? 'rgba(0,0,0,.08)' : 'var(--surface-nested-strong)', border: yellow ? 'none' : '1px solid var(--border-default)',
              boxShadow: yellow ? 'none' : 'var(--elev-1-edge)', color: yellow ? 'var(--primary-foreground)' : 'var(--text-strong)' }}><Icon name={icon} size={16} /></span>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              {eyebrow && <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: yellow ? 'rgba(16,18,0,.66)' : 'var(--text-tertiary)' }}>{eyebrow}</span>}
              {title && <h3 style={{ margin: 0, ...typo('card-title'), color: 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h3>}
            </div>
          </div>
          {action}
        </header>
      )}
      {children != null && <div style={{ position: 'relative', minWidth: 0, ...bodyStyle }}>{children}</div>}
    </section>
  );
}
