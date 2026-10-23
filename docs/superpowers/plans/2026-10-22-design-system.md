# Design System Integration Implementation Plan

> For agentic workers: use superpowers:executing-plans for native execution and a fresh final review. Existing project/user instructions override worktree, commit and repeated approval defaults.

**Goal:** Integrate the exported visual identity as reusable, tested components and a local showcase.
**Architecture:** Canonical root design-system tokens, typed components and references; web imports via @design-system. No new third-party runtime dependency or backend or public showcase.
**Tech Stack:** Next 16.4.2, React 19.3.0, TypeScript 5.9.3, Tailwind 4.3.3, existing Vitest/Playwright.
**Spec:** docs/superpowers/specs/2026-10-22-design-system-design.md

## Global constraints
Local visual M1 only. Preserve homepage copy and architecture. No upgrades, commits, deploy, DB access or remote mutations. Dark-only #EFFF00 identity. All new visual values are tokens. Reference code is archival, never production imports.

## Review focus
Disabled/loading links must not navigate. Empty/missing chart data must not become fabricated zeroes. Keyboard modal restores focus and blocks background. OS reduced motion overrides showcase preference. Production cannot serve the showcase or raw references.

### Task 1: Consolidate foundations and references
- [x] Inventory export and document compatibility decisions.
- [x] Preserve HTML/JS/assets in references, share canonical tokens, vendor required scripts/fonts/icons with versions/licenses.
- [x] Add typed alias and lint/type boundaries; map Tailwind semantic names without duplicate values.
- [x] Validate local reference URLs and inventory hashes.
Files: design-system/{tokens,assets,references}, apps/web/src/app/globals.css, tsconfig files, eslint config.

### Task 2: Adapt components
- [x] Implement core, forms, surfaces, navigation, feedback, data and motion modules using native semantics and exported materials.
- [x] Add tests for chart gaps/ranges and disabled/loading links; verify red then green where meaningful.
- [x] Keep strict types, no any/ts-ignore, no duplicate runtime library.
Interfaces: named exports from design-system/index.ts; client components declare use client individually.

### Task 3: Integrate and verify
- [x] Apply identity to existing homepage; create interactive development-only showcase and production 404 test.
- [x] Run pnpm check and pnpm test:browser; test showcase on dedicated dev port with Playwright including keyboard, motion, widths and font loading.
- [x] Inspect screenshots and offline references; resolve regressions.
Files: apps/web/src/app/{page.tsx,design-system}, tests/browser, separate showcase test config.

### Task 4: Documentation, review and cleanup
- [x] Root DESIGN.md, instruction links, architecture/design/setup amendments, provenance and component disposition report.
- [x] Fresh native review; fix important findings and run affected checks.
- [x] Verify source independence and preserved files before removing only design-system-export.
- [x] Report concrete checks, limitations and final export state.

## Execution ledger
Ruling: Proceed without further confirmation because the attachment explicitly requests autonomous execution and project AGENTS says existing authority overrides repeated approval gates. The yes answer is interpreted as homepage visual integration; copy and M1 behavior are preserved.
Ruling: Reference bundle is retained because original HTML requires it. It is excluded only from source lint/build, not from reference browser checks.
Pre-flight: Tasks 2/3 consume Task 1 tokens and alias; Task 4 depends on all validations. No incompatible interfaces identified.

Ruling: A private source workspace package is needed so root-level TSX resolves the existing React/types correctly under pnpm; versions are unchanged. Offline installation lacked registry metadata, so a normal pinned install resolved the workspace and then frozen reproduction is checked.
Ruling: Reference React18/Babel is historical, not a second application framework. Existing kits remain archival; their source API is not promised as production compatibility.
Review fixes: nonfinite donut/gauge values must display Missing/unavailable, never zero; tooltip receives an invisible hover bridge; reduced spatial styles explicitly disable transition.

Completion: All four tasks complete. pnpm check PASS (25 unit tests); production browser 4/4; showcase desktop/tablet/mobile 3/3; historical HTML 30/30; 84 local reference links. Independent findings fixed and reviewed through regression checks. Export removed after preservation assertions. Work remains local and uncommitted.
