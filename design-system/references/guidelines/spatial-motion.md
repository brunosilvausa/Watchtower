# Neon Spatial Motion — Spatial Interactions (Phase 2)

> Every interaction should communicate depth, material, hierarchy, and physical intention.

No motion library was added. Springs are solved two ways from the same presets:
- **CSS:** pre-computed `linear()` curves in `tokens/motion.css`, with a cubic-bezier fallback where `linear()` is unsupported. Used for discrete state changes (hover, press, menus, dialogs, indicators, toggles).
- **JS:** `createSpring()` in `components/core/spatial.js`, a requestAnimationFrame semi-implicit Euler solver at 240Hz substeps. Used for continuous pointer-driven motion (tilt, reflection, magnetic, parallax). It writes CSS custom properties or transforms directly and **never calls React setState per frame**.

## Tokens (`tokens/motion.css`)
| Group | Tokens |
|---|---|
| Duration | `--motion-instant` 100 · `--motion-fast` 160 · `--motion-normal` 240 · `--motion-slow` 360 · `--motion-emphasis` 480 |
| Easing | `--ease-standard` · `--ease-enter` · `--ease-exit` · `--ease-spatial` |
| Spatial | `--spatial-perspective` 1200px · `--spatial-hover-z` 8px · `--spatial-featured-z` 20px · `--spatial-tilt-subtle/medium/maximum` 3/6/8° · `--spatial-button-hover-y` −1.5px · `--spatial-button-press-y` 1px · `--spatial-button-press-scale` .985 · `--spatial-magnetic-max` 4px · `--spatial-neon-glow` → `--glow-primary` |
| Springs | `--spring-{gentle,responsive,spatial,expressive}` (linear() curve) + `--spring-*-duration` |
| Legacy | `--dur-*`, `--ease-out`, `--ease-spring`, `--transition-spatial`, `--transition-spring` → aliases. `--depth-perspective`, `--depth-feature`, `--tilt-max` (elevation.css) → alias the `--spatial-*` tokens |

## Spring presets
| Preset | Stiffness | Damping | ζ | Settle | Overshoot | Used for |
|---|---|---|---|---|---|---|
| Gentle | 120 | 20 | 0.91 | 685ms | 0.1% | background parallax |
| Responsive | 380 | 36 | 0.92 | 431ms | 0% | button lift, menus, tooltips, magnetic |
| Spatial | 200 | 24 | 0.85 | 681ms | 0.6% | card tilt/lift, dialogs, tab and sidebar indicators, toasts |
| Expressive | 260 | 24 | 0.74 | 631ms | 2.9% | switch thumb, checkbox tick |

## Primitives (`components/core/spatial.js`)
- `useSpatialTilt(ref, { max, lift, spring, enabled })` writes `--wt-rx --wt-ry --wt-tz --wt-gx --wt-gy --wt-hover`. Pair with `tiltTransform` on the element and `spatialLayers(reflection)` as its first children. The layers are a lift shadow, an integrated specular highlight and a top-edge light, and only their opacity changes. The bounding rect is cached on pointer-enter (no feedback loop), moves are batched once per frame, `will-change` is set only while hovered, and it stops for touch, coarse pointers and reduced motion.
- `useMagnetic(ref, { strength })` applies a ≤5px pull through the CSS `translate` property, so it composes with hover/press `transform` without fighting their transitions.
- `usePresence(open, exitMs)` keeps an element mounted through `enter → open → exit → closed` for exit animations.
- `createSpring`, `springPresets`, `resolveSpring`, `useReducedMotion`, `prefersReducedMotion`, `setMotionPreference('reduce' | 'system')`, `hasFinePointer`.
- `window.<Namespace>.SpatialMotion` exposes `SPRINGS`, `createSpring`, `setMotionPreference`, `prefersReducedMotion` and `TILT_LEVELS` to plain-HTML consumers.

## Components
| Component | Spatial behaviour |
|---|---|
| **Tilt** | wrapper; `max` preset/deg, `lift`, `reflection`, `spring` |
| **Magnetic** *(new)* | wrapper; `strength` ≤5 |
| **Card** | `tilt` (true/subtle/medium/maximum) or `interactive` (8px lift + light, no rotation) |
| **StatCard** | `featured` → subtle tilt, 16px lift |
| **Button** | spring hover lift, instant press compression, neon glow on primary hover, `loading` (spinner, aria-busy), `magnetic` (not allowed on danger) |
| **IconButton** | same lift/press, `magnetic`, `aria-pressed` when `active` is set |
| **Tabs** | sliding liquid-glass indicator, arrow-key navigation with roving tabindex |
| **Sidebar** | sliding active indicator (neon reflection), restrained hover fill, `aria-current="page"` |
| **Select** | depth-aware menu enter/exit, `aria-expanded`, Esc closes |
| **Tooltip** | 4px rise + fade, `aria-describedby`, Esc closes |
| **Dialog** | spatial entry (forward 14px + scale .96), faster exit, focus trap, initial focus, focus restore, labelled/described |
| **Toast** | rise + scale on mount |
| **Switch / Checkbox** | spring thumb/tick, thumb squash while pressed; Checkbox now keyboard-operable |
| **Input** | token transitions, `valid` state, `aria-invalid`, error `role="alert"` |
| **AmbientBackdrop** | two-layer parallax driven by a gentle spring, written via refs (no re-renders) |

**Where spatial motion is *not* applied:** DataTable, LineChart, DonutChart, CodeWindow, forms and incident lists. They keep Z1 and stay still.

## Reduced motion
`@media (prefers-reduced-motion: reduce)` or `html[data-motion="reduce"]` (set via `setMotionPreference`) zeroes every `--spatial-*` distance and angle and every spring duration, and collapses `--motion-slow` and `--motion-emphasis` to `--motion-fast`. The JS hooks also stop pointer tracking. Opacity and colour feedback stay at 100–160ms, focus outlines are unchanged, and the loading spinner keeps rotating because it is functional feedback.

## Performance notes
- Only `transform` and `opacity` animate continuously. Box-shadow changes happen on discrete hover/press, and the tilt "shadow development" is an opacity fade on a pre-rendered shadow layer.
- Blur is never animated. Dialogs drop their own backdrop-filter, so only the scrim blurs.
- Frame rate has not been measured. Measure with your browser's Performance panel on target hardware.

## Playground
`playground/index.html` → **Spatial interactions** section. Its sliders (tilt, perspective, elevation, stiffness, damping, reflection, duration) and the simulated reduced-motion switch affect only that section, apart from the html attribute set by the reduced-motion switch.
