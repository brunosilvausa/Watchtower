import React from 'react';
export function StatCallout({ value, label, size = 'lg', align = 'left', style }) {
  const fs = size === 'xl' ? 72 : size === 'md' ? 40 : 56;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: align, fontFamily: 'var(--font-sans)', ...style }}>
      <span style={{ fontSize: fs, fontWeight: 700, lineHeight: 1, letterSpacing: size === 'md' ? '-1px' : '-1.5px', color: 'var(--primary)', textShadow: 'var(--glow-text-neon)', fontFeatureSettings: 'var(--numeric-features)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      {label && <span style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--text-body)', maxWidth: 260 }}>{label}</span>}
    </div>
  );
}
