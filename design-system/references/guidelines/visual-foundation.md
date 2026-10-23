# Neon Spatial Glass — Visual Foundation (Phase 1)

Dark sophistication, translucent materials, spatial depth, precise type, and controlled neon light.
Everything here is a CSS custom property reachable from `styles.css`. Components read tokens only. Legacy token names still resolve (they're aliases at the bottom of each token file).

## Token files
| File | Contents |
|---|---|
| `tokens/colors.css` | brand, cool neutral ramp, semantic background/surface/border/text/status, legacy aliases |
| `tokens/materials.css` | frosted, smoked, overlay, liquid, metal, neon + fallbacks |
| `tokens/elevation.css` | Z0–Z4 shadows, edge lights, layers, scrim (+ Phase 2 depth tokens) |
| `tokens/lighting.css` | glows, ambient colours, neon reflection, atmosphere, grain |
| `tokens/typography.css` | scale + semantic role shorthands, numeric features |
| `tokens/base.css` | utility classes: `.wt-mat-*`, `.wt-ambient`, `.wt-page-heading`, `.wt-value-*`, `.wt-num` … |

## Color
- **Brand:** `--primary` #EFFF00 · `--primary-active` #D6E600 · `--primary-disabled` #3D4216 · `--primary-foreground` #101200.
- **Background / surfaces (solid):** `--background-base` #0B0D10 · `--background-elevated` #11151A · `--surface-primary` #171C22 · `--surface-secondary` #1E252D · `--surface-tertiary` #29313A. The neutral ramp moved from warm grey to a cool blue-black.
- **Nested fills (inside a material, never blurred):** `--surface-nested` 4% · `--surface-nested-strong` 7% · `--surface-nested-hover` 10% · `--surface-inset` black 26% · `--surface-code`.
- **Borders:** `--border-subtle` 7% · `--border-default` 12% · `--border-strong` 18% · `--border-focus` = primary.
- **Text:** `--text-primary` #F5F7F8 · `--text-strong` #DDE3E8 · `--text-secondary` #B1BBC5 · `--text-tertiary` #89949F · `--text-disabled` #5F6A75 (disabled only).
- Neon goes on: the primary action, selected/checked state, the active nav icon, focus, key metrics, featured cards. Nowhere else.

## Materials
| Material | Tokens | Use | Elevation |
|---|---|---|---|
| **Solid** | opaque surface-primary, 6% border, rim `--rim-solid`, no blur | dense tables, incident history, structural panels | Z1 |
| **A · Frosted** | bg white 5.5%, blur 24 + saturate 150%, border 12% | cards, stat cards, widgets, top-bar search & user chip | Z1 (Z2 for `elevated`) |
| **B · Smoked** | bg ink 76%, blur 28 + saturate 140%, border 9% | sidebar, marketing nav, structural panels | Z2 |
| **Overlay** (smoked+) | bg ink 90%, smoked filter, border 12% | menus, tooltips, chart tooltips, toasts (Z3), dialogs (Z4) | Z3–Z4 |
| **C · Liquid** | bg white 8% + 155° specular sheen, blur 20 + saturate 180% + brightness 1.06, border 20%, inner light edge | floating icon buttons, active tab pill, selected floating panels | Z2 |
| **D · Brushed metal** | 3-stop dark gradient + 1px/3px brushed lines, top highlight, dark lip, no blur | secondary buttons, inverse buttons, control trays | Z1 |
| **Neon** | 160° yellow gradient, white top edge, primary glow | primary buttons, featured card, featured pricing tier, CTA band | Z1–Z2 |

**Rules:** only one backdrop-filter per stack. Content inside a material uses nested fills. Dense tables live in a frosted Z1 card and are never raised further. Per element: `material(kind, z)` from `components/core/spatial.js` in JS, or the `.wt-mat-{frosted|smoked|overlay|liquid|metal|neon}` classes in CSS.

**Fallbacks:** without backdrop-filter support, or under `prefers-reduced-transparency`, materials resolve to solid surfaces: frosted → surface-primary, smoked → background-elevated, overlay → surface-primary, liquid → surface-secondary.

## Elevation
| Level | Material | Shadow | Edge | Layer | Examples |
|---|---|---|---|---|---|
| Z0 | background + atmosphere | none | none | 0 | page |
| Z1 | frosted / metal | `--elev-1-shadow` (2 layers) | `--elev-1-edge` 8% top | 1 | cards, tables, inputs' containers |
| Z2 | smoked / liquid | `--elev-2-shadow` (3 layers) | 10% | 20 | sidebar, nav, floating buttons |
| Z3 | overlay | `--elev-3-shadow` (3 layers) | 12% | 50 | dropdowns, tooltips, toasts |
| Z4 | overlay | `--elev-4-shadow` (3 layers) | 14% | 100 | modals (+ `--scrim` and a 6px blur) |

## Lighting
- **Direction:** light comes from the top-left. Every material gets a top-edge highlight (`--light-top-edge` + edge inset) and a dark bottom lip.
- **Atmosphere:** `--atmosphere` combines faint neon (7%) top-left, cool blue (6%) top-right and neon (4%) at the bottom, over a vertical fade from elevated to base to near-black. Applied via `.wt-ambient` or `AmbientBackdrop`.
- **Grain:** `--grain` SVG noise at `--grain-opacity` 3.5%, overlay blend.
- **Neon reflection:** `--neon-reflection` (active sidebar row) and `--neon-reflection-under` (light spill beneath an active element).
- **Glows:** `--glow-primary` 24px/18% (primary hover, selected controls, featured), `--glow-focus` 18px/22%, `--glow-text-neon` (yellow metrics), `--glow-icon-neon` (active nav icon).

## Typography roles
| Role | Token | Spec |
|---|---|---|
| Display | `--type-display` | 72/1.05 · 700 · −2.5px |
| Page heading | `--type-page-heading` | 32/1.2 · 700 · −1px |
| Section heading | `--type-section-heading` | 24/1.3 · 700 · −0.4px |
| Card title | `--type-card-title` | 16/1.4 · 600 |
| Body | `--type-body` / `--type-body-sm` | 15/1.55 · 14/1.5 · 400 |
| Label | `--type-label` | 13/1.3 · 500 |
| Caption | `--type-caption` | 12/1.4 · 500 |
| Overline | `--type-overline` | 12/1.4 · 600 · +1.5px · uppercase |
| Values | `--type-value-xl/lg/md/sm` | 56·32·18·14, tabular (`--numeric-features`: tnum, cv01) |

## Playground
`playground/index.html` (dev only, not in the Design System tab). It has toggles for background (flat / atmosphere / grain) and a simulated no-backdrop-filter fallback, plus a live contrast audit computed from the tokens.

## Final refinement (Oct 2026)
- **Rim light per material:** `--rim-solid`, `--rim-smoked`, `--rim-frosted` (top-left light, bottom-right shade), `--rim-overlay`, liquid edge. Materials now differ by edge as well as opacity.
- **Smoked** got darker and denser (ink 84%) with a vertical `--smoked-depth` falloff. **Frosted** got slightly brighter (6.5%) with a 165° top-left sheen. **Overlay** is 94% with a 16% border. **Liquid** has a stronger sheen.
- **Elevation:** every level starts with a 1px contact shadow; the ambient spread grows with each level.
- **Atmosphere:** a cool key light at the top-left, a faint white fill and a 4% neon bounce at the bottom-left, with a vignette at the bottom-right. This replaces the olive neon smear. AmbientBackdrop now reads the same tokens.
- **Contrast:** `--text-tertiary` #89949F → #959FAA; `--text-disabled` #5F6A75 → #66717C. "—" for missing data now uses tertiary (AA) rather than disabled.
- **Typography bug:** inline `font: var(--type-*)` shorthands lost their size when longhands followed, so the featured KPI rendered at about 18px. Components now spread `typo(role)` longhands; kits use `WT.Typography.style(role)`. The CSS classes (`.wt-page-heading` etc.) were unaffected.
