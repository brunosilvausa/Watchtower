import React from 'react';
/* ---------- environment ---------- */
const mm = q => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q) : null);
export function prefersReducedMotion() {
  if (typeof document !== 'undefined' && document.documentElement.dataset.motion === 'reduce') return true;
  const q = mm('(prefers-reduced-motion: reduce)');
  return !!(q && q.matches);
}
export function hasFinePointer() { const q = mm('(hover: hover) and (pointer: fine)'); return q ? q.matches : true; }
/** 'reduce' forces reduced motion app-wide (sets html[data-motion]); 'system' follows the OS. */
export function setMotionPreference(pref) {
  const el = document.documentElement;
  if (pref === 'reduce') el.dataset.motion = 'reduce'; else delete el.dataset.motion;
  window.dispatchEvent(new Event('wt:motion'));
}
export function useReducedMotion() {
  const [r, setR] = React.useState(prefersReducedMotion);
  React.useEffect(() => {
    const q = mm('(prefers-reduced-motion: reduce)');
    const h = () => setR(prefersReducedMotion());
    if (q) q.addEventListener ? q.addEventListener('change', h) : q.addListener(h);
    window.addEventListener('wt:motion', h);
    return () => { if (q) q.removeEventListener ? q.removeEventListener('change', h) : q.removeListener(h); window.removeEventListener('wt:motion', h); };
  }, []);
  return r;
}

export function useMediaQuery(query) {
  const [m, setM] = React.useState(() => { const q = mm(query); return q ? q.matches : false; });
  React.useEffect(() => {
    const q = mm(query); if (!q) return;
    const h = () => setM(q.matches); h();
    q.addEventListener ? q.addEventListener('change', h) : q.addListener(h);
    return () => { q.removeEventListener ? q.removeEventListener('change', h) : q.removeListener(h); };
  }, [query]);
  return m;
}
/** Width of an element, tracked with ResizeObserver. */
export function useElementWidth(ref, initial) {
  const [w, setW] = React.useState(initial || 0);
  React.useEffect(() => {
    const el = ref.current; if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(e => setW(Math.round(e[0].contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  return w;
}

/* ---------- typography (longhands — never use the `font` shorthand inline: it drops size when longhands follow) ---------- */
const TYPE = {
  display: { fontSize: 72, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-2.5px' },
  'page-heading': { fontSize: 32, lineHeight: 1.2, fontWeight: 700, letterSpacing: '-1px' },
  'section-heading': { fontSize: 24, lineHeight: 1.3, fontWeight: 700, letterSpacing: '-0.4px' },
  'card-title': { fontSize: 16, lineHeight: 1.4, fontWeight: 600 },
  body: { fontSize: 15, lineHeight: 1.55, fontWeight: 400 },
  'body-sm': { fontSize: 14, lineHeight: 1.5, fontWeight: 400 },
  caption: { fontSize: 12, lineHeight: 1.4, fontWeight: 500 },
  label: { fontSize: 13, lineHeight: 1.3, fontWeight: 500 },
  overline: { fontSize: 12, lineHeight: 1.4, fontWeight: 600, letterSpacing: '1.5px' },
  'value-xl': { fontSize: 56, lineHeight: 1, fontWeight: 700, letterSpacing: '-1.5px', fontVariantNumeric: 'tabular-nums' },
  'value-lg': { fontSize: 32, lineHeight: 1.1, fontWeight: 700, letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' },
  'value-md': { fontSize: 18, lineHeight: 1.3, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  'value-sm': { fontSize: 14, lineHeight: 1.4, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  mono: { fontSize: 13, lineHeight: 1.55, fontWeight: 400, fontFamily: 'var(--font-mono)' },
};
export function typo(role) { return TYPE[role] || TYPE.body; }

/* ---------- springs ---------- */
const SPRINGS = {
  gentle: { stiffness: 120, damping: 20, mass: 1 },
  responsive: { stiffness: 380, damping: 36, mass: 1 },
  spatial: { stiffness: 200, damping: 24, mass: 1 },
  expressive: { stiffness: 260, damping: 24, mass: 1 },
};
export const springPresets = SPRINGS;
export function resolveSpring(s) { return typeof s === 'string' ? (SPRINGS[s] || SPRINGS.spatial) : { ...SPRINGS.spatial, ...(s || {}) }; }
/** rAF-driven multi-value spring. Calls onFrame(values) each frame until settled; never touches React state. */
export function createSpring(initial, config, onFrame) {
  let cfg = resolveSpring(config);
  const x = initial.slice(), v = initial.map(() => 0);
  let target = initial.slice(), raf = 0, last = 0;
  const step = t => {
    const dt = Math.min(0.064, last ? (t - last) / 1000 : 1 / 60); last = t;
    const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
    for (let s = 0; s < n; s++) for (let i = 0; i < x.length; i++) {
      const f = -cfg.stiffness * (x[i] - target[i]) - cfg.damping * v[i];
      v[i] += (f / cfg.mass) * h; x[i] += v[i] * h;
    }
    let moving = false;
    for (let i = 0; i < x.length; i++) {
      if (Math.abs(v[i]) > 0.002 || Math.abs(x[i] - target[i]) > 0.002) moving = true; else { x[i] = target[i]; v[i] = 0; }
    }
    onFrame(x);
    if (moving) raf = requestAnimationFrame(step); else { raf = 0; last = 0; }
  };
  return {
    set(t, immediate) {
      target = t.slice();
      if (immediate) { for (let i = 0; i < x.length; i++) { x[i] = target[i]; v[i] = 0; } onFrame(x); return; }
      if (!raf) { last = 0; raf = requestAnimationFrame(step); }
    },
    config(c) { cfg = resolveSpring(c); },
    stop() { if (raf) cancelAnimationFrame(raf); raf = 0; },
    get value() { return x.slice(); },
  };
}

/* ---------- materials ---------- */
const MAT = {
  solid: { bg: 'var(--solid-bg)', filter: 'none', border: 'var(--solid-border)', edge: 'var(--rim-solid)' },
  frosted: { bg: 'var(--light-top-edge), var(--glass-frosted-bg)', filter: 'var(--glass-frosted-filter)', border: 'var(--glass-frosted-border)', edge: 'var(--rim-frosted)' },
  smoked: { bg: 'var(--smoked-depth), var(--glass-smoked-bg)', filter: 'var(--glass-smoked-filter)', border: 'var(--glass-smoked-border)', edge: 'var(--rim-smoked)' },
  overlay: { bg: 'var(--light-top-edge), var(--glass-overlay-bg)', filter: 'var(--glass-smoked-filter)', border: 'var(--glass-overlay-border)', edge: 'var(--rim-overlay)' },
  liquid: { bg: 'var(--glass-liquid-sheen), var(--glass-liquid-bg)', filter: 'var(--glass-liquid-filter)', border: 'var(--glass-liquid-border)', edge: 'var(--glass-liquid-edge)' },
  metal: { bg: 'var(--metal-brush), var(--metal-bg)', filter: 'none', border: 'var(--metal-border)', edge: 'var(--metal-edge)' },
  neon: { bg: 'var(--material-neon-surface)', filter: 'none', border: 'var(--material-neon-border)', edge: 'var(--glow-primary), var(--material-neon-surface-edge)' },
};
/** Style object for a material at elevation z (0–4). */
export function material(kind, z) {
  const m = MAT[kind] || MAT.frosted;
  const lvl = z == null ? 1 : Math.max(0, Math.min(4, z));
  return {
    background: m.bg, backdropFilter: m.filter, WebkitBackdropFilter: m.filter, border: '1px solid ' + m.border,
    boxShadow: (lvl > 0 ? 'var(--elev-' + lvl + '-shadow), ' : '') + (m.edge || 'var(--elev-' + Math.max(1, lvl) + '-edge)'),
  };
}
/** Legacy helper — maps old level/shadow names onto material(). */
export function glass(level, shadow) {
  const kind = level === 'menu' ? 'overlay' : level === 'nav' ? 'smoked' : 'frosted';
  const z = { none: 0, low: 1, floating: 2, high: 3 }[shadow || 'floating'] ?? 2;
  return material(kind, level === 'elevated' ? Math.max(z, 2) : z);
}

/* ---------- spatial tilt + reactive light ---------- */
const TILT_LEVELS = { subtle: 3, medium: 6, maximum: 8 };
/** Transform that reads the CSS vars written by useSpatialTilt. Put on the tilting element. */
export const tiltTransform = 'perspective(var(--spatial-perspective)) rotateX(var(--wt-rx, 0deg)) rotateY(var(--wt-ry, 0deg)) translateZ(var(--wt-tz, 0px))';
/**
 * Pointer-responsive tilt, lift and light. Writes --wt-rx/--wt-ry/--wt-tz/--wt-gx/--wt-gy/--wt-hover on the element
 * from a rAF spring — no React re-renders. Mouse only; off for touch and reduced motion.
 */
export function useSpatialTilt(ref, opts) {
  const o = opts || {};
  const reduced = useReducedMotion();
  const live = o.enabled !== false && !reduced;
  const optsRef = React.useRef(o); optsRef.current = o;
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const s = el.style;
    const write = v => {
      s.setProperty('--wt-rx', v[0].toFixed(3) + 'deg'); s.setProperty('--wt-ry', v[1].toFixed(3) + 'deg'); s.setProperty('--wt-tz', v[2].toFixed(2) + 'px');
      s.setProperty('--wt-gx', v[3].toFixed(1) + '%'); s.setProperty('--wt-gy', v[4].toFixed(1) + '%'); s.setProperty('--wt-hover', v[5].toFixed(3));
    };
    const rest = [0, 0, 0, 50, 20, 0];
    const spring = createSpring(rest, o.spring || 'spatial', write);
    write(rest);
    if (!live || !hasFinePointer()) return () => spring.stop();
    let rect = null, p = null, raf = 0, idle = 0;
    const flush = () => {
      raf = 0; if (!p || !rect) return;
      const c = optsRef.current;
      const max = Math.min(typeof c.max === 'string' ? TILT_LEVELS[c.max] || 6 : c.max ?? 6, 8);
      const lift = Math.min(c.lift ?? 20, 20);
      const cx = Math.max(0, Math.min(1, (p.x - rect.left) / rect.width)), cy = Math.max(0, Math.min(1, (p.y - rect.top) / rect.height));
      spring.config(c.spring || 'spatial');
      spring.set([(0.5 - cy) * 2 * max, (cx - 0.5) * 2 * max, lift, cx * 100, cy * 100, 1]);
    };
    const enter = e => { if (e.pointerType !== 'mouse') return; clearTimeout(idle); rect = el.getBoundingClientRect(); s.willChange = 'transform'; };
    const move = e => { if (e.pointerType !== 'mouse') return; if (!rect) rect = el.getBoundingClientRect(); p = { x: e.clientX, y: e.clientY }; if (!raf) raf = requestAnimationFrame(flush); };
    const leave = () => {
      rect = null; p = null; if (raf) cancelAnimationFrame(raf); raf = 0;
      spring.config(optsRef.current.spring || 'spatial'); spring.set(rest);
      idle = setTimeout(() => { s.willChange = ''; }, 900);
    };
    el.addEventListener('pointerenter', enter); el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
    window.addEventListener('scroll', leave, { passive: true });
    return () => {
      el.removeEventListener('pointerenter', enter); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave);
      window.removeEventListener('scroll', leave); if (raf) cancelAnimationFrame(raf); clearTimeout(idle); spring.stop(); write(rest); s.willChange = '';
    };
  }, [live]);
  return live;
}
/** Lift shadow + integrated specular + edge light, all driven by --wt-hover (opacity only). Render first inside the tilting element. */
export function spatialLayers(reflection) {
  const k = reflection == null ? 1 : Math.max(0, reflection);
  const base = { position: 'absolute', pointerEvents: 'none', opacity: 'var(--wt-hover, 0)' };
  return [
    React.createElement('span', { key: 'wt-sh', 'aria-hidden': true, style: { ...base, inset: 0, borderRadius: 'inherit', boxShadow: 'var(--elev-3-shadow)' } }),
    React.createElement('span', { key: 'wt-gl', 'aria-hidden': true, style: { ...base, inset: 0, borderRadius: 'inherit', mixBlendMode: 'screen',
      background: 'radial-gradient(75% 65% at var(--wt-gx, 50%) var(--wt-gy, 20%), rgba(255,255,255,' + (0.08 * k).toFixed(3) + '), rgba(255,255,255,0) 72%)' } }),
    React.createElement('span', { key: 'wt-ed', 'aria-hidden': true, style: { ...base, left: 10, right: 10, top: 0, height: 1,
      background: 'radial-gradient(35% 100% at var(--wt-gx, 50%) 0%, rgba(255,255,255,' + (0.5 * k).toFixed(2) + '), rgba(255,255,255,0))' } }),
  ];
}

/* ---------- magnetic ---------- */
/** Pulls the element ≤ strength px (max 5) toward the pointer via the CSS `translate` property (--wt-mx/--wt-my). */
export function useMagnetic(ref, opts) {
  const o = opts || {};
  const reduced = useReducedMotion();
  const live = o.enabled !== false && !reduced;
  const strength = Math.min(o.strength ?? 4, 5);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const write = v => { el.style.setProperty('--wt-mx', v[0].toFixed(2) + 'px'); el.style.setProperty('--wt-my', v[1].toFixed(2) + 'px'); };
    write([0, 0]);
    if (!live || !hasFinePointer()) return;
    const spring = createSpring([0, 0], 'responsive', write);
    let rect = null, p = null, raf = 0;
    const flush = () => {
      raf = 0; if (!p || !rect) return;
      const dx = (p.x - (rect.left + rect.width / 2)) / (rect.width / 2), dy = (p.y - (rect.top + rect.height / 2)) / (rect.height / 2);
      spring.set([Math.max(-1, Math.min(1, dx)) * strength, Math.max(-1, Math.min(1, dy)) * strength]);
    };
    const enter = e => { if (e.pointerType === 'mouse') rect = el.getBoundingClientRect(); };
    const move = e => { if (e.pointerType !== 'mouse') return; if (!rect) rect = el.getBoundingClientRect(); p = { x: e.clientX, y: e.clientY }; if (!raf) raf = requestAnimationFrame(flush); };
    const leave = () => { rect = null; p = null; spring.set([0, 0]); };
    el.addEventListener('pointerenter', enter); el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointerenter', enter); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); if (raf) cancelAnimationFrame(raf); spring.stop(); write([0, 0]); };
  }, [live, strength]);
  return live;
}
export const magneticStyle = { translate: 'var(--wt-mx, 0px) var(--wt-my, 0px)' };

/* ---------- presence (enter / exit) ---------- */
/** Keeps an element mounted through its exit transition. state: 'closed' | 'enter' | 'open' | 'exit'. */
export function usePresence(open, exitMs) {
  const [state, setState] = React.useState(open ? 'enter' : 'closed');
  const ref = React.useRef(state); ref.current = state;
  React.useEffect(() => {
    let t, r1, r2;
    if (open) { setState('enter'); r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setState('open')); }); }
    else if (ref.current !== 'closed') { setState('exit'); t = setTimeout(() => setState('closed'), exitMs ?? 160); }
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); clearTimeout(t); };
  }, [open]);
  return { mounted: state !== 'closed', state, visible: state === 'open' };
}

/** Namespace-visible bundle of the spatial utilities (for playgrounds and plain-HTML consumers). */
export const SpatialMotion = { SPRINGS, createSpring, setMotionPreference, prefersReducedMotion, TILT_LEVELS };
/** Namespace-visible type roles for kits/plain HTML: Typography.style('label') → longhand style object. */
export const Typography = { style: typo, roles: TYPE };
