import React from 'react';
import { createSpring, useReducedMotion, hasFinePointer } from './spatial.js';
export function AmbientBackdrop({ parallax = true, intensity = 1, position = 'fixed', style }) {
  const reduced = useReducedMotion();
  const far = React.useRef(null), near = React.useRef(null);
  React.useEffect(() => {
    const a = far.current, b = near.current;
    const write = v => { if (a) a.style.transform = 'translate3d(' + (v[0] * -28).toFixed(1) + 'px,' + (v[1] * -28).toFixed(1) + 'px,0)'; if (b) b.style.transform = 'translate3d(' + (v[0] * -12).toFixed(1) + 'px,' + (v[1] * -12).toFixed(1) + 'px,0)'; };
    write([0, 0]);
    if (!parallax || reduced || !hasFinePointer()) return;
    const spring = createSpring([0, 0], 'gentle', write);
    let raf = 0, p = null;
    const flush = () => { raf = 0; if (p) spring.set([p.x / window.innerWidth - 0.5, p.y / window.innerHeight - 0.5]); };
    const move = e => { if (e.pointerType !== 'mouse') return; p = { x: e.clientX, y: e.clientY }; if (!raf) raf = requestAnimationFrame(flush); };
    window.addEventListener('pointermove', move, { passive: true });
    return () => { window.removeEventListener('pointermove', move); if (raf) cancelAnimationFrame(raf); spring.stop(); };
  }, [parallax, reduced]);
  const a = v => (v * intensity).toFixed(3);
  const layer = { position: 'absolute', inset: -80, willChange: parallax && !reduced ? 'transform' : undefined };
  return (
    <div aria-hidden="true" style={{ position, inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden', background: 'var(--atmosphere)', backgroundColor: 'var(--background-base)', ...style }}>
      <div ref={far} style={{ ...layer, opacity: intensity, background: 'radial-gradient(55% 60% at 8% -6%, var(--ambient-cool), transparent 70%), radial-gradient(40% 46% at 4% 104%, var(--ambient-neon), transparent 72%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'var(--grain)', opacity: 'var(--grain-opacity)', mixBlendMode: 'overlay' }} />
      <div ref={near} style={{ ...layer, opacity: intensity, background: 'radial-gradient(38% 42% at 30% 0%, var(--ambient-white), transparent 70%)' }} />
    </div>
  );
}
