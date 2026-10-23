import React from 'react';
export function Wordmark({ size = 20, color = 'var(--on-dark)', style }) {
  return <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: size, letterSpacing: (-size * 0.035).toFixed(2) + 'px', lineHeight: 1, color, whiteSpace: 'nowrap', ...style }}>Watchtower</span>;
}
