# Neon Spatial Glass — Design System Guide

> Premium design is not the quantity of visual effects. It is the precision, consistency, and purpose behind every detail.

This guide documents what is implemented, not plans. The detailed specs are `visual-foundation.md` (Phase 1: tokens, materials, elevation, lighting, type) and `spatial-motion.md` (Phase 2: springs and spatial interaction). Live reference: `playground/index.html`.

## 1. Philosophy
Dark, translucent, dimensional, precise. Every effect must help someone read, orient or act. When an effect competes with a number, the number wins.

## 2. Emphasis levels
| Level | What | Treatment |
|---|---|---|
| **Primary** | the main action, the critical metric, the selected nav item, focus | neon `--primary`, neon material, `--glow-primary`, featured tilt |
| **Secondary** | supporting cards, charts, context | frosted glass Z1, white/grey type, monochrome charts |
| **Tertiary** | metadata, dividers, background light | `--text-tertiary`, `--border-subtle`, atmosphere at ≤7% |

Rules: one neon element per region (one primary button, one highlighted KPI, one neon chart series). Secondary KPI cards use `emphasis="secondary"`, a quieter nested surface with a smaller value.

## 3. Colour usage
- `--primary` #EFFF00: primary action, selected/active, focus, the single most important metric or series. Never body text, never large decoration, never every icon.
- Text: `--text-primary` for values and headings, `--text-secondary` for body, `--text-tertiary` for meta. `--text-disabled` only for disabled or "—".
- Status colours (up/degraded/down/info) only for status, **always with a word, icon or sign**.

## 4. Materials — when to use which
| Use | Material |
|---|---|
| Cards, KPI tiles, chart cards | Frosted (Z1) |
| Sidebar, top nav | Smoked (Z2) |
| Menus, tooltips, toasts, dialogs, command palette | Overlay (Z3/Z4) |
| Floating icon buttons, active tab pill | Liquid |
| Secondary buttons, control trays | Brushed metal |
| Primary buttons, featured card, CTA band, featured pricing | Neon |
| Dense tables, incident lists | Solid (opaque, no blur) |
| Inputs, nested panels | **No material**: nested fills / inset wells |

**Don't use glass:** behind dense numbers or tables, nested inside another glass surface, on long reading text, or on anything that must stay legible over unknown backgrounds. Use the overlay material there; it's 90% opaque.

## 5. Elevation
Z0 page · Z1 cards · Z2 nav and floating · Z3 popovers · Z4 modals. Raise only on interaction (hover lift ≤ 8px; featured ≤ 20px). Data stays at Z1.

## 6. Lighting
Light comes from the top-left; every surface has a top-edge highlight. Glow is allowed only on: primary hover, focus, selected switch/checkbox, the active nav icon, neon metric text, and the neon material. **Don't** glow chart lines, status dots at rest, or secondary icons.

## 7. Motion principles
- Durations: 100ms for presses, 160ms for colour and fades, 240ms for entrances, 360ms+ only for emphasis (chart reveal).
- Springs: *responsive* for controls, *spatial* for surfaces and indicators, *expressive* only for toggles, *gentle* only for background parallax.
- Entrances are opacity + ≤14px + scale ≥ .96. Exits are faster than entrances.
- One moving thing per interaction. No continuous decorative motion. Spinners and skeleton pulses are the only loops.
- **3D tilt:** only on one featured card per region (the KPI hero, the neon feature card, the featured pricing tier). **Never** on charts, tables, forms, lists, or confirmation UI.
- **Magnetic:** only on one high-priority, non-destructive CTA or floating icon action.
- Reduced motion: everything spatial stops; fades of 160ms or less remain.

## 8. Component variants (summary)
- **Button:** primary · secondary (metal) · outline · ghost · inverse · danger; sm/md/lg; `loading`, `disabled`, `magnetic`.
- **Card:** frosted · elevated · smoked · liquid · metal · flat · outline · yellow; `tilt`, `interactive`.
- **StatCard:** `featured` / `emphasis="secondary"`; `trend`, `loading`, `unavailable`.
- **Charts:** LineChart, BarChart, DonutChart, Sparkline, UptimeBar, SegmentGauge.
- **States:** Skeleton (loading), StateMessage (empty, unavailable, partial, error, success).
- **Navigation:** Sidebar (expanded/collapsed rail), AppTopBar (breadcrumbs, command trigger, mobile menu), CommandPalette, TopNav (mobile sheet), Footer.

## 9. Chart styling
- **Hierarchy:** the primary series is white and solid with an area fill; comparison series are grey, dashed and 1.5px. Neon (`--chart-highlight`) marks only the hovered or selected point or bar, and the single designated hero series. Bars default to light neutral (`--chart-bar`) and the active bar turns neon.
- Monochrome by default: `--chart-series-1` (white) for current, `--chart-series-2` (grey, dashed) for comparison, `--chart-series-primary` (neon) for the one series to look at.
- Gridlines are `--chart-grid` (6%), plus a stronger `--chart-zero` line whenever the range crosses zero. Axis text is 11px, tabular, tertiary.
- Area fill is 18% → 0. No glow on lines.
- **Data integrity:** `null`/missing values are gaps (lines) or dashed placeholders (bars), never 0. Tooltips say "No data". Formatting comes from the caller's `format` (currency, %, ms); components never round or recompute values.
- Interaction: crosshair + band, multi-series overlay tooltip, ←/→/Home/End/Esc from the keyboard, live-region announcement, and a hidden data table for screen readers. Legend toggles have `aria-pressed`.
- Motion: first render reveals left to right (lines) or grows from zero (bars); range changes cross-fade. Neither runs under reduced motion. Values never animate between numbers, so nothing appears that isn't in the data.

## 10. Loading, empty, error, partial
| Situation | Use |
|---|---|
| Fetching | `loading` prop / Skeleton shaped like the result; container `aria-busy` + sr-only label |
| Nothing exists yet | StateMessage `empty` + an existing action |
| Not applicable / not collected | StateMessage `unavailable` or "—" with a reason; **never 0** |
| Some data missing | StateMessage `partial` (role=status) + gaps in charts |
| Request failed | StateMessage `error` (role=alert) + Retry only if retry exists |
| Action completed | Toast or StateMessage `success`, only after the backend confirms |

## 11. Tables
Flat surface inside a Z1 card, rounded header strip, 1px subtle dividers, numbers right-aligned and tabular, mono for IDs and durations. Hover fill, selected row (fill + 2px neon inset), keyboard rows (↑/↓/Home/End/Enter), `caption` names the scroll region. Overflow scrolls horizontally inside the card.

## 12. Forms
Label (13/500) above the field, hint or error below, linked via `aria-describedby`. States: default, focus (neon border + glow), required (neon asterisk), valid (emerald + check), error (rose + icon + role=alert), read-only (dashed, no well), disabled (50%). Inputs use 16px text on touch devices to stop iOS zoom.

## 13. Iconography
- **Family:** Lucide outline only, loaded from CDN and rendered inline so it inherits `currentColor`.
- **Stroke:** a constant 1.5px optical stroke at every size (the `Icon` component scales stroke-width); override with `strokeWidth` only for illustration.
- **Sizes:** 12 (breadcrumb chevrons), 14–16 (tables, badges, inputs), 18 (nav, buttons, icon buttons), 20–22 (feature cards).
- **Colour:** `--text-tertiary` at rest, `--text-primary` on hover or active, status colours only for status icons, **neon only for the active nav icon and the selected check**.
- **Disabled:** inherit the control's opacity; never recolour on their own.
- Icon-only buttons always have `label` (accessible name + tooltip).

## 14. Spacing & layout
4px base scale plus semantic tokens: `--space-card` 24 (16 on mobile), `--space-card-lg` 32, `--space-grid` 16, `--space-page-x/y` 20 (12 on mobile), `--space-section` 96 (64 on mobile), `--header-height` 64, `--control-height` 40 (44 on touch).

## 15. Responsive
- **App:** ≥1280 full sidebar · 1024–1279 collapsed rail (user can toggle) · <1024 off-canvas drawer behind a menu button. Overview grid goes 4 → 2 → 1 columns with named areas, and the hero KPI stays first. The header hides the search field below 760px container width (search icon instead) and reduces the user chip to initials. "Add monitor" becomes an icon button below 600px.
- **Website:** headings use `clamp()`, hero and product splits stack below 1024, features and pricing go 3 → 2 → 1, and the nav becomes a sheet below 900px.
- **Touch:** `--touch-min` 44px applies to every interactive primitive on coarse pointers.

## 16. Accessibility
- Visible 2px neon focus outline on every focusable element; skip links in both kits; landmarks (`aside` nav label, `main`, breadcrumb `nav`).
- Dialog and command palette: focus moves in, Tab is trapped, Esc closes, focus returns to the trigger.
- Select is a combobox with arrow-key listbox navigation; Tabs use roving tabindex; table rows and charts are keyboard-operable.
- Contrast: see the playground audit (text tokens over each material composited on #0B0D10). Secondary and tertiary text are AA on every listed surface; disabled text is exempt.
- Known limits are listed in the readme.

## 17. Performance
- Only `transform` and `opacity` animate continuously; blur is never animated; pointer effects write CSS variables from requestAnimationFrame springs (no React re-renders); `will-change` only while hovered.
- One backdrop-filter per stack. Dialogs and the command palette drop their own blur (the scrim provides it).
- Charts re-measure via ResizeObserver; axis labels thin out automatically instead of overlapping.
- **Nothing has been measured.** Profile on target hardware before claiming numbers. The biggest remaining cost is the count of blurred Z1 cards on dense dashboards (~12 on Overview).

## 18. Anti-patterns
- Neon on every icon, chart line or card.
- Glass nested in glass; blur behind tables or financial figures.
- Tilt or magnetic on charts, tables, forms, destructive or financial-confirmation actions.
- Showing 0 for missing data; inventing success messages; skeletons for data that failed.
- Colour-only status or deltas.
- Continuous ambient animation; bouncy springs on data.
- Equal visual weight for every KPI.
