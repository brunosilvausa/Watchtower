import React from 'react';
export function Avatar({ name = '', src, size = 32, style }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <span title={name} style={{ width: size, height: size, flex: 'none', borderRadius: '50%', overflow: 'hidden', display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-strong)',
      color: 'var(--text-body-strong)', fontSize: Math.round(size * 0.38), fontWeight: 600, fontFamily: 'var(--font-sans)', ...style }}>
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
    </span>
  );
}
