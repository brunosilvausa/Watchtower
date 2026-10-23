# Watchtower design system integration

Date: 2026-10-22. Scope: local visual foundation extending M1, including the existing homepage. The user requested autonomous end-to-end integration and answered yes to applying the identity to the homepage. No deployment, commits, database changes, authentication or monitoring implementation.

## Intent and constraints
Turn the Claude Design export into a typed, reusable Next.js design system, retaining Neon Spatial Glass: #EFFF00, cool blue-black canvas, Inter and JetBrains Mono, frosted/smoked/liquid/metal/neon materials, directional rims, elevation and reduced-motion-aware spatial feedback. Keep the current private-beta message truthful. Synthetic showcase examples are explicitly labelled. Dark only; do not invent a light theme.

## Approaches
1. Import the generated browser bundle: faithful initially but untyped, CDN-dependent, browser-only and inaccessible in several controls. Rejected as production code; retain only for historical HTML references.
2. Adopt the exported tokens and visual treatments, adapt reusable React components to strict TypeScript and platform semantics, integrate with existing Tailwind/shadcn token names. Selected by the implementer under the autonomous request; no claim that the user chose internal architecture.
3. Replace the export with generic shadcn styling: easier but loses the requested visual identity. Rejected.

## Structure and behavior
`design-system/tokens` is the sole canonical token implementation. `design-system/components` contains named typed exports; a Next alias imports these directly through a private workspace source package that reuses the installed React version, without a new third-party runtime dependency. Existing cn helper remains available. Material classes and spring curves retain source values. Components separate server-compatible presentation from client interactions. Native form controls and modal dialog provide keyboard/inert semantics. Charts retain missing data, text alternatives and keyboard inspection. Tables use real controls for row actions.

`design-system/references` retains useful export HTML, kits, screenshots and their original browser dependencies as archival examples. Canonical tokens are shared, not duplicated. Local pinned fonts/icons and vendor scripts remove network requirements. Browser bundle remains reference-only and never enters the application. Reference kit prices/features are unapproved examples.

The `/design-system` route is development-only and returns 404 in production, with no opt-in environment bypass. Production browser smoke verifies that boundary; a separate dedicated development server verifies the showcase. The homepage uses the same components/tokens without simulated metrics or signup.

## Acceptance
Typed reusable controls, cards, navigation, feedback, charts and motion; all applicable states; responsive desktop/tablet/mobile showcase; preserved visual references; local fonts; correct disabled/loading links and controls; keyboard modal/select/tabs; reduced motion and transparency; lint/type/unit/build/browser checks; no dependency on the original directory before deleting only that directory. Root DESIGN.md explains source of truth and usage. Record evidence and limits in docs/setup.md.

## Builder decisions
Use CSS spring curves rather than a second animation library. Keep one blur per stack; solid inner fills. Preserve all original source as reference where necessary for reproducibility, but expose only adapted components to app imports. No global tools, hooks or remotely executed review service. Independent native review uses inherited session model.
