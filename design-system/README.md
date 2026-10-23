# Integrated design system

Read [DESIGN.md](../DESIGN.md) for the canonical contract.

## Audit and selection — 2026-10-22

Source: 181 files, 36 React components, 2 helpers, 11 token files and 30 HTML references. The destination originally had neutral Tailwind/shadcn tokens, `cn`, system fonts and one static page; no component catalog or icon/motion/chart dependency. Existing Next 16.4.2, React 19.3.0, Tailwind 4.3.3, TypeScript 5.9.3, ESLint 9.39.5, Vitest 5.0.5 and Playwright 1.64.1 remain pinned. No source DESIGN.md was present; guidelines/readme are preserved.

| Export family | Integrated named components | Adaptation |
|---|---|---|
| Core | Icon, Button, IconButton, Badge, StatusDot, Avatar, Tilt, Magnetic, AmbientBackdrop | Local SVG geometry; truthful disabled/loading state; CSS spring curves; bounded, opt-in pointer interaction |
| Forms | Input, Select, Tabs, Switch, Checkbox | Native labels/controls; typed native props; owned tab panels and keyboard navigation |
| Data | Card, StatCard, StatCallout, CodeWindow, DataTable, LineChart, BarChart, DonutChart, Sparkline, SegmentGauge, UptimeBar | Typed data/renderers; gaps/finite ranges; actual data tables; explicit row actions; named/clamped meters and textual status history |
| Navigation | Wordmark, Sidebar, AppTopBar, CommandPalette, TopNav, Footer | Reusable presentational shells; local action callbacks; labelled command input |
| Feedback | Dialog, Toast, Tooltip, Skeleton, StateMessage | Native modal/inert background/scroll lock/focus cycling; described trigger; live messages |

All 36 component purposes are integrated; this is not a drop-in API compatibility layer for the export. No production callers existed. The new smaller typed API is canonical: Card uses `material` instead of multiple legacy `variant` aliases; charts require accessible labels and explicit series names; DataTable is generic with render callbacks; forms use native events; Select uses native options; Tabs include panels. App/website kits remain reference compositions rather than new product routes. MobileNav is a small composition of existing Dialog and IconButton.

## Preserved and consolidated

Source visual tokens, materials, typography, shadows, grain, gradient, lighting and spring curves are retained. Component style constants are consolidated into shared CSS/tokens. Source JS typography duplication is replaced by semantic CSS. The source `shape.css` overwrote the color `--border-strong` with a complete border; it is renamed `--border-strong-line`. Canonical fonts are self-hosted from Fontsource 5.3.0; extra 700 mono file is retained from the pinned package. Local reference Lucide 0.460.0 `pie-chart` aliases `chart-pie` because that historical name no longer exists in the package.

Historical JSX, type declarations, prompts, screenshots, guidelines, manifest, adherence rules and bundle remain under references. The bundle is necessary for original HTML and is never imported by the application. Its SVG fetch is redirected to pinned local icons. React18/Babel vendor assets are reference-only. Tokens exist only in the canonical token directory; reference styles import them. Metadata `.thumbnail` and SKILL.md remain provenance, not active application instructions. No source material is discarded merely for being non-React.

The exported Oxlint selectors assume the old API and incorrectly treat interface names as components. They are preserved, not installed. Existing ESLint/typed lint applies to the new package; database/runtime import restrictions extend to it. Only archival references are excluded. TypeScript enforces variant/prop correctness instead of duplicated syntax selectors.

## Known differences and limits

The raw kits are historical mockups with nonfunctional application actions and unapproved pricing/claims. They retain source limitations; use the new Next showcase for component behavior. Ambient background retains atmosphere/grain without continuous parallax. Spatial interaction uses source CSS spring curves rather than another JS spring solver. Select prioritizes native keyboard/mobile behavior; option popups use the browser's presentation. Original arbitrary style knobs and private helper namespaces are not a supported public API.

No cloud/browser delivery, hardware frame-rate budget, full assistive-technology certification or functional monitoring is claimed. Filesystem and browser evidence is recorded separately. The original export is removed only after preservation, offline browser verification and application validation.

To reproduce the historical HTML browser check, start the loopback reference server shown in DESIGN.md, then run `node scripts/check-design-reference-browser.mjs`. It writes the 30-page result and screenshot under `docs/evidence/design-system`. Stop only that dedicated server afterwards.
