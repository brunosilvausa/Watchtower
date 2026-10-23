# Watchtower — Neon Spatial Glass

Canonical visual contract, integrated 2026-10-22. Read alongside the M1 architecture. This design system is a local visual foundation, not authentication, monitoring or commercial readiness.

## Identity
Dark-only cool blue-black canvas; electric neon yellow `#EFFF00`; Inter interface typography; JetBrains Mono for code, identifiers and technical values. One neon focal point per region. Status always has a textual label. Calm, technical copy. No invented metrics or commercial promises in product screens.

Preserve frosted/smoked/liquid glass, brushed metal, directional rim light, multilayer elevation and restrained spatial motion. Dense data uses solid surfaces. Never stack backdrop filters; nested content uses translucent fills. Reduced transparency/no-backdrop support falls back to solids.

## Source of truth
- `design-system/tokens/*.css`: canonical values, semantic roles, materials, light, elevation, motion and compatibility aliases.
- `design-system/styles.css`: application stylesheet entry; `components.css`: reusable treatments.
- `design-system/components/*`: strict TypeScript implementations; `index.ts`: named exports.
- `design-system/assets`: pinned, local fonts and reference icons with licenses and provenance.
- `design-system/references`: historical HTML, original source, kits, screenshots and guidelines. These are review references, never runtime application imports.
- `design-system/provenance.json`: original export inventory and hashes. `assets/provenance.json`: downloaded asset versions.

The workspace package `@watchtower/design-system` reuses React 19.3.0 already installed. The web alias `@design-system` resolves its source. No second React version is added to the application. Reference HTML alone retains its original React 18 UMD/Babel runtime for historical reproducibility.

Tailwind v4 uses `@theme inline` and explicit `@source` registration in the web globals. shadcn semantic names alias the exported canonical colors; there is no parallel neutral theme. Existing `cn` remains available. Do not generate tokens from `_ds_manifest.json`: that export merges media override values incorrectly.

## Use

```tsx
import { Button, Card, Input } from "@design-system";

<Card material="frosted" title="Preferences">
  <Input label="Display name" name="displayName" />
  <Button type="submit">Save</Button>
</Card>
```

Client boundaries are declared in interactive component modules. Callbacks belong in client callers; static content can be rendered by server components. Never import runtime/database modules into design-system components. Public package imports use named exports. Styles are imported once in the application root.

Use `material="solid|frosted|smoked|liquid|metal|neon|overlay"` for Card. Button variants are primary, secondary, outline, ghost, inverse and danger; sizes sm/md/lg. Loading controls are disabled. Disabled/loading links omit href and are removed from keyboard navigation. Forms forward native attributes; native select/checkbox/switch semantics cover keyboard and form submission. Tabs own their labelled panels. Dialog uses native modality plus boundary focus cycling and restore. Tooltip attaches its description to a single focusable child.

Charts take explicit names/labels, show data tables, support arrow/Home/End/Escape inspection and preserve null/NaN gaps. Line charts support dashed comparisons and optional area fill; legends can toggle series. Tables use explicit row action buttons, never keyboard handlers on entire rows. All example datasets are synthetic.

## Typography, spacing and effects
Use semantic type classes (`wt-page-heading`, `wt-card-title`, `wt-body`, `wt-code`, `wt-value-*`) and canonical space/radius tokens. Font files are local; no runtime or build-time font network request. Use tabular numerals for metrics. Reuse material classes and elevation tokens instead of inline shadow recipes.

`Tilt` and `Magnetic` are opt-in on featured/high-priority elements. They use bounded pointer variables and the source CSS spring curves. Never apply spatial motion to tables, forms or destructive actions. `setMotionPreference("reduce")` forces reduction; `"system"` returns to the OS. The OS reduce setting cannot be overridden. Pointer effects are off for touch/coarse pointers. Loading spinners remain functional feedback.

## Responsive and accessibility rules
Layout containers must shrink (`min-width: 0`); tables and code blocks scroll within labelled regions. Card grids collapse at tablet/mobile sizes. Use at least 44px touch targets on coarse pointers. Visible focus, native labels, meaningful heading hierarchy, descriptive button names, text status and real disabled behavior are mandatory. Error/info text uses brighter semantic variants for contrast. Do not use neon surfaces as unqualified containers for status colors.

Use `prefers-reduced-motion`, `prefers-reduced-transparency`, and solid fallbacks. Contrast must be checked against the actual composite background. Browser checks are not full WCAG certification. Do not add a light theme without a separate design decision.

## Showcase and references
Run `pnpm dev`, then visit `/design-system`. The route returns 404 unless NODE_ENV is development. No public production bypass, signup, API calls, notifications or billing. Do not move references into `public/`.

For historical HTML, serve the `design-system` directory locally:

```sh
python3 -m http.server 3139 --bind 127.0.0.1 --directory design-system
```

Open `/references/playground/index.html` on that server. All 30 HTML references resolve locally, including fonts/scripts/icons. The reference kits contain unapproved example pricing, claims and data. Their original component APIs/known limitations are historical, not the typed application contract. The live Next showcase is the implementation source of truth.

## Extend and validate
Reuse the named component before adding another. Put visual constants in the relevant token file; use semantic names in consumers. Keep one canonical implementation per purpose. Export prop types when callers need them. Preserve native semantics, reduced motion and all existing checks. Add focused tests for new behavior.

`pnpm check`, `pnpm test:browser`, `pnpm test:design-system`, and `node scripts/verify-design-references.mjs` cover the integration. See `docs/setup.md` for dated evidence and `design-system/README.md` for selection decisions.
