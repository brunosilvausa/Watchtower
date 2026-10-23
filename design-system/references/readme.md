# Watchtower Design System

Watchtower helps individuals and small teams monitor their own digital systems — websites, APIs, cron jobs, TCP services — from **private workspaces**. The commercial product is a **multi-tenant SaaS**: every user belongs to one or more workspaces (personal, team, client), and all data, monitors and alerts are scoped to a workspace. It is not a local, on-device monitoring utility.

## Sources
- **Brand spec** (pasted in chat): a black-canvas / electric-yellow marketing system (later revised to neon `#EFFF00` + dark glass, see Revision note) written up from ClickHouse's public site. Used here as the *visual language* only — tokens, type scale, radii, component treatments. Nothing ClickHouse-branded (name, logo, copy) is used.
- **Reference screenshots** (`uploads/CleanShot 2026-10-21 at 11.4x.xx PM@2x.png`): a dark finance dashboard ("Credixa") showing sidebar card, ⌘K top bar, KPI stat cards, smooth line charts with dashed comparison series, donut, tables with rounded header strips, dashed-divider rate lists, and a segmented blue bar gauge. Used for **app layout and data-viz patterns**, re-skinned with Watchtower tokens. The Credixa name and Poppins type were not adopted.
- No codebase, Figma file, logo, or font binaries were provided.

## Products
1. **Watchtower app** — authenticated workspace dashboard (`ui_kits/app`).
2. **Marketing website** — home + pricing (`ui_kits/website`).

---

## Content fundamentals
- **Voice:** plain, technical, calm. Watchtower is the thing that stays awake so you don't have to — copy states facts, not hype. "api.acme.dev is down" beats "Uh oh! Something went wrong."
- **Person:** address the reader as **you**; the product speaks as **Watchtower** or implicit ("We'll check it every 30 seconds" is fine in dialogs). Never "I".
- **Casing:** Sentence case for headings, buttons and nav ("Add monitor", "Start free", "Members & settings"). UPPERCASE only for eyebrows/section labels and yellow "NEW" badges, with +1.5px tracking.
- **Numbers carry the message:** lead with the metric — "99.98%", "142ms", "4m 12s". Units hug the number (`142ms`, `30s`), thousands get commas, use tabular figures.
- **Status words are fixed:** Operational / Up · Degraded · Down · Paused · Maintenance · Resolved / Ongoing. Don't invent synonyms.
- **Show the real thing:** URLs, hosts, IDs, YAML, cURL in JetBrains Mono. Marketing shows a real config, not an illustration of one.
- **Privacy is stated plainly:** "Your data stays in your workspace." No security theatre.
- **No emoji** in UI or marketing. Unicode only for ⌘ / → in keyboard hints.
- Examples: "Know when your stack breaks before your users do." · "Free for 10 monitors. No card required." · "Heartbeat expected by 03:10 was not received." · "Pay per workspace, not per seat."

## Visual foundations — Neon Spatial Glass
Full spec: **`guidelines/visual-foundation.md`**. Live comparison: **`playground/index.html`** (dev only).

- **Canvas:** cool blue-black `#0B0D10` with a restrained atmosphere (faint neon top-left, cool blue top-right) and 3.5% film grain. Dark only.
- **Brand colour:** Electric Neon Yellow `#EFFF00` (active `#D6E600`, disabled `#3D4216`, foreground `#101200`). Used for the primary action, selection, focus, key metrics and featured surfaces. Never for body text or large decoration.
- **Materials:** *Frosted* glass (5.5%, blur 24) for cards; *Smoked* glass (ink 76%, blur 28) for sidebar and nav; *Overlay* (ink 90%) for menus, tooltips, toasts and dialogs; *Liquid* glass (sheen + inner light) for floating controls and the active tab; *Brushed metal* for secondary buttons; *Neon* for primary and featured.
- **One blur per stack:** content inside a material uses translucent nested fills (`--surface-nested*`) and recessed wells (`--surface-inset`) — never a second backdrop-filter. Without backdrop-filter, or with reduced transparency, everything falls back to solid surfaces.
- **Elevation Z0–Z4:** each level pairs a material, a multi-layer shadow, a top-edge light and a z-layer. Tables and text-heavy cards stay at Z1.
- **Lighting:** light comes from the top-left; top-edge highlights and dark bottom lips on every surface. Neon glow only on primary hover, focus, selected controls, the active nav icon and yellow metrics.
- **Type:** Inter (700 display with negative tracking, 600 titles, 400 body) and JetBrains Mono. Semantic roles: page heading 32, section 24, card title 16, label 13, values 56/32/18/14 with tabular numerals.
- **Radii:** 4 / 6 / 8 (buttons, inputs, menus) / 12 (cards, panels) / pill (badges) / circle (icon buttons).
- **Spacing:** 4px base; card padding 24 (app) / 32 (marketing); grid gap 16; marketing bands 96px apart; container 1280px.
- **Charts:** monochrome lines, yellow for the single hero series, overlay-glass tooltips.
- **Motion — Neon Spatial Motion** (full spec: **`guidelines/spatial-motion.md`**): four spring presets (gentle, responsive, spatial, expressive) as CSS `linear()` curves plus a rAF solver, with no library. Pointer tilt (≤8°) and reactive reflection only on featured cards; magnetic pull (≤4px) only on high-priority non-destructive CTAs. Sliding indicators in Tabs and the Sidebar, depth-aware menus, tooltips and dialogs. Tables, charts and forms never move. Reduced motion (OS setting or `setMotionPreference`) removes all spatial movement and keeps short fades.
- **Imagery:** none. The product UI and real code are the imagery.

## Iconography
- **Lucide** outline icons (1.5–2px stroke, rounded joins), loaded from the `lucide-static` CDN and rendered by the `Icon` component as a CSS mask so they inherit `currentColor`. **Substitution:** the reference screenshots use a similar outline set (Iconsax-style); Lucide is the closest CDN match.
- Sizes: 14–16 in tables/badges, 18 in nav/buttons, 20–22 in feature cards.
- Icons sit bare or inside a 28–32px hairline/elevated disc in card headers.
- No emoji, no PNG icons, no icon font. Unicode only for ⌘K.
- **Logo:** none provided. The `Wordmark` component typesets "Watchtower" in Inter 700 with tight tracking. Replace when a real mark exists.

## Fonts
Inter (400/500/600/700) and JetBrains Mono (400/500/600) are loaded from the Fontsource CDN in `tokens/fonts.css`. **No binaries were supplied** — send licensed files (or confirm Inter is final) and they'll be self-hosted.

---

## Index
- `styles.css` — entry point (imports only)
- `tokens/` — `fonts`, `colors`, `materials`, `elevation`, `lighting`, `typography`, `spacing`, `shape`, `motion`, `base` (utilities: `.wt-mat-*`, `.wt-ambient`, type roles)
- `guidelines/visual-foundation.md` — material, elevation, lighting and type-role spec
- `guidelines/spatial-motion.md` — motion tokens, springs, primitives, reduced-motion spec
- `guidelines/design-system.md` — **start here**: emphasis levels, material choice, chart styling, states, tables, forms, icons, responsive, a11y, performance, anti-patterns
- `playground/index.html` (+ `spatial.jsx`, `showcase.jsx`) — dev-only Neon Spatial Glass Showcase (foundations → responsive preview)
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand)
- `components/` — React primitives (below), one `@dsCard` per folder
- `ui_kits/app/` — app click-through · `ui_kits/website/` — marketing site
- `thumbnail.html` · `SKILL.md`

## Components
- **core/** — Icon, Button, IconButton, Badge, StatusDot, Avatar, Tilt, Magnetic, AmbientBackdrop (+ `spatial.js`: `material()`, `useSpatialTilt()`, `useMagnetic()`, `usePresence()`, `createSpring()`, `springPresets`, `setMotionPreference()`, `useReducedMotion()`; namespace object `SpatialMotion`)
- **forms/** — Input, Select, Tabs, Switch, Checkbox
- **data/** — Card, StatCard, StatCallout, SegmentGauge, UptimeBar, LineChart, BarChart, DonutChart, Sparkline, DataTable, CodeWindow (+ `chartUtils.js`)
- **navigation/** — Wordmark, Sidebar, AppTopBar, CommandPalette, TopNav, Footer
- **feedback/** — Dialog, Toast, Tooltip, Skeleton, StateMessage

### Intentional additions
No source defined a component inventory, so the standard set was authored. Beyond the spec's named components:
- **Icon** — wraps Lucide CDN glyphs.
- **Wordmark** — typeset stand-in for the missing logo.
- **UptimeBar**, **StatusDot** — core to a monitoring product; not in either source.
- **Avatar**, **Switch**, **Checkbox**, **Dialog**, **Toast**, **Tooltip** — standard primitives needed by the app kit.
- **Amber `--status-degraded`** — added to the semantic palette for the degraded state.
- **Tilt**, **AmbientBackdrop**, **Magnetic** — spatial interaction primitives.
- **BarChart**, **Sparkline**, **Skeleton**, **StateMessage**, **CommandPalette** — Phase 3 product polish (CommandPalette activates the existing ⌘K hint).

### Revision notes
- Oct 2026 (a): yellow `#faff69` → `#EFFF00`; flat system → glass + spatial depth (replaces the original spec's no-shadow/no-hover rules).
- Oct 2026 (b) — Phase 1 Neon Spatial Glass: cool neutral ramp, four-material system, Z0–Z4 elevation, lighting tokens, semantic type roles, playground. Glass intensity reduced from 12% to 5.5% frosted; legacy tokens aliased.
- Oct 2026 (c) — Phase 2 Neon Spatial Motion: motion tokens, spring presets, ref-based tilt/reflection/magnetic/parallax, presence transitions, sliding nav indicators, dialog focus management, playground section.
- Oct 2026 (d) — Phase 3 Product Polish: chart system (gaps for missing data, keyboard + screen-reader tables, legends), KPI hierarchy, skeleton/empty/error/partial states, table keyboard + selection, form states, command palette, collapsible sidebar, breadcrumbs, responsive kits, touch targets, icon stroke rule, design-system guide, full showcase.

- Oct 2026 (e) — Final visual refinement: solid material + per-material rim light, denser smoked / brighter frosted, contact-shadow elevation, cohesive atmosphere, tertiary/disabled contrast raised, chart neon reserved for highlights, featured KPI at value-xl, inline-font-shorthand bug fixed.

### Known limitations
- Not measured: frame rate, paint cost, bundle size. Dense dashboards still carry ~12 blurred cards.
- No automated a11y run (axe/Lighthouse) in this environment. Checks so far are manual reasoning plus the live contrast table, which assumes a flat background.
- Charts have no data-point tab stops (one focus stop, then arrows). The hidden table is the full alternative.
- Lucide icons are fetched per name from a CDN, so offline use needs local copies.
- The website kit has no customer logos or real copy; the status-pages screen is intentionally empty.
