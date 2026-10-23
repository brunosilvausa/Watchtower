import React from 'react';
import { useReducedMotion } from '../core/spatial.js';
export function Skeleton({ variant = 'text', width, height, lines = 1, radius, style }) {
  const reduced = useReducedMotion();
  const anim = reduced ? undefined : 'wt-skeleton 1.8s var(--ease-standard) infinite';
  const bar = (w, h, r, k, delay) => <span key={k} style={{ display: 'block', width: w, height: h, borderRadius: r, background: 'var(--skeleton-base)', animation: anim, animationDelay: delay }} />;
  if (variant === 'circle') return <span aria-hidden="true" style={{ display: 'inline-block', flex: 'none', ...style }}>{bar(width || 32, height || width || 32, '50%', 0)}</span>;
  if (variant === 'text') return (
    <span aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 8, width: width || '100%', ...style }}>
      {Array.from({ length: lines }, (_, i) => bar(lines > 1 && i === lines - 1 ? '62%' : '100%', height || 12, 'var(--radius-xs)', i, i * 120 + 'ms'))}
    </span>
  );
  return <span aria-hidden="true" style={{ display: 'block', width: width || '100%', ...style }}>{bar('100%', height || 80, radius || 'var(--radius-md)', 0)}</span>;
}
