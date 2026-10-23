# Product Visual Fidelity Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans with native implementation and one independent final review. Existing user authority overrides repeated gates, forced commits and worktrees.

**Goal:** Restore the reference composition in login, navigation, overview and monitor list while preserving real product flows.
**Architecture:** Extend existing named UI primitives compatibly; use focused product components and canonical tokens. Keep all backend contracts and authenticated behavior.
**Tech Stack:** Existing Next/React/TypeScript, CSS Modules, design-system, Playwright.
**Spec:** docs/superpowers/specs/2026-10-22-product-visual-fidelity-design.md

## Global Constraints
No dependencies, schema/auth changes, demo-runtime imports, fake observed values, commits or deployment. Preserve current work and sessions. Desktop1440x1000, mobile390x844, tablet768x1024; use canonical material/spacing tokens. Source ceiling350lines.

## Review Focus
- Second workspace survives context/navigation/reload and actions remain scoped.
- Unknown metrics/history remain visibly unknown despite reference's sample values.
- Recovery-code MFA accepts alphanumeric input; disabled external providers remain honest.
- Collapse/mobile controls retain accessible names, keyboard and logout.
- Filtering and reporting never mutate or conceal data outside selected scope.

### Task1: Login composition
**Files:** auth-form.tsx,auth.module.css; new auth-preview.tsx; tokens/product.css and styles.css if semantic dimensions needed.
**Interfaces:** AuthPreview({english:boolean}) is presentation only; AuthForm existing API/actions unchanged.
- [x] Port original split frame,400px-form,dividers,icons,footer and clearly illustrative uptime/code panel.
- [x] Verify login/signup/recovery labels and no misleading sample uptime via product browser tests.

### Task2: Navigation and header
**Files:** design-system/components/navigation.tsx,components.css; dashboard/product-shell.tsx; new workspace-navigation.tsx and shell.module.css.
**Interfaces:** Sidebar retains existing items/active/label and adds optional group/icon/badge/collapsed presentation; WorkspaceNavigation consumes workspaces,selected workspace,actual dashboard counts,identity and current callbacks.
- [x] Implement grouped icon navigation, selector, collapse, real monitor usage, breadcrumb/search/context/avatar.
- [x] Preserve existing selection persistence, notifications, preferences and sign-out; verify two-workspace journey and mobile keyboard control.

### Task3: Overview and monitor composition
**Files:** dashboard/product-views.tsx; new overview.tsx,overview.module.css,monitor-list.tsx,monitor-list.module.css; lib/product-client.ts only for exact existing DTO typing.
**Interfaces:** Overview consumes DashboardData,range/setRange,Translate and workspace/user display context; MonitorList consumes rows,canWrite/canAdmin,busy,onEdit,onAction,workspaceId/reload.
- [x] Replace generic KPI/chart/list composition with the reference's five metrics and2:1 chart row, three summary cards and regional/incidents evidence.
- [x] Use real date range,CSV report,empty states; wire monitor status/type/search filters and compact domain columns preserving all actions.
- [x] Verify active-range selection, valid report contents, empty/history states, filter combinations and no tenant persistence regression.

### Task4: Comparison and verification
**Files:** tests/browser/product-auth.spec.ts,product.spec.ts; docs/evidence/visual-fidelity/.
- [x] Capture matching reference/application screenshots and inspect desktop/mobile/tablet; record measurable geometry and remaining deviations.
- [x] Run pnpm check, pnpm test:product, pnpm test:browser and pnpm test:design-system for shared navigation changes.
- [x] Independent final review; fix material regressions and rerun affected gates.
- [x] Record final scope/results and give local access instructions.

## Execution rulings
Native implementation. No forced commit/worktree: existing dirty workspace is explicitly preserved. Design/plan approval repetition waived by existing user authority. Functional assertions accompany changed behavior; visual styling uses screenshot/geometry evidence rather than mirror CSS unit tests.
