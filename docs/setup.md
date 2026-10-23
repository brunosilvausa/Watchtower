# Current full-product setup — 2026-10-22

The full reference product is now authorized and implemented locally. Earlier M1/visual/landing entries below are historical snapshots, not current scope restrictions. Use the [full-product plan](superpowers/plans/2026-10-22-full-product.md), [current architecture](architecture.md), and [execution ledger](evidence/full-product/progress.md).

Local startup: `pnpm setup:product`, `pnpm db:up`, `pnpm db:migrate`, then `pnpm dev:product`; run `pnpm dev:monitoring` separately to enable actual checks. Configuration files and local mail are private and ignored by Git. Existing files, database volume and unrelated services were preserved. No deployment, push, external message or payment was performed.

Current results:115unit tests,58PostgreSQL tests,8product browser cases,10landing cases,3design-system cases and2setup checks passed. Five independent review cycles completed and17material findings were corrected. Evidence: [validation](evidence/full-product/validation.md) and [reviews](evidence/full-product/reviews.md). Provider adapters and security controls have local tests; actual provider credentials, hosted egress, enterprise SSO/SCIM and passkey hardware require operational validation. Previous vulnerability-audit results below are historical unless explicitly refreshed in the current evidence.

---

# M1 setup evidence

Date: 2026-10-21 (America/New_York). Scope: local M1 only. Canonical approval and additional gates are in [the architecture](superpowers/specs/2026-10-21-watchtower-private-beta-design.md).

## Provenance and versions

Toolkit: `soumatheusgomes/vibe-coding-toolkit` revision `790a895304e0c08b70a5b215c9d334f1c86b816c`, inspected from a temporary checkout outside the application. Official `create-next-app@16.4.2` scaffold was generated outside the repository and incorporated into `apps/web`, preserving the existing architecture.

Node 24.22.0; pnpm 12.11.2; Next 16.4.2; React 19.3.0; TypeScript 5.9.3; Tailwind 4.3.3; Better Auth 1.7.12; Drizzle ORM 0.45.4 / Kit 0.31.11; pg 8.23.1; PostgreSQL 18.3; Vitest 5.0.5; ESLint 9.39.5; Playwright 1.64.1. Exact manifests and pnpm-lock.yaml are authoritative. TypeScript 5.9.3 follows the scaffold's supported major rather than adopting the new registry TypeScript 7 major without need.

Dependencies and peers were checked against the registry. pnpm 12 uses `allowBuilds`; an initial install rejected dependency postinstall scripts. The project explicitly approved esbuild, sharp and unrs-resolver only, then installation completed. No global build approval was changed. Project settings reside in pnpm-workspace.yaml.

Context7 resolve/query succeeded for Next.js and Drizzle. Better Auth documentation had been consulted during architecture planning. No authentication code was initialized in M1. Source APIs are documented by the installed Next package and official upstream docs.

## Decisions and deviations

- Separate workspace packages use compiled ESM and bounded lazy database access. No Turborepo dependency is needed for five packages.
- Schema is deliberately limited to identity key/workspaces/memberships. M2 generates/reviews Better Auth storage for its actual configuration.
- shadcn CLI 4.22.1 rejected the documented `base-nova` preset argument; the supported `--base base --preset nova` initialized it. Keep configuration/tokens; remove unused generated button and dependencies. Use existing clsx/tailwind-merge utility.
- System fonts avoid build-time external font downloads. No dashboard, login controls or synthetic monitoring values are rendered.
- M1 measures process resources and local database storage. Later saturation/SSRF/usage gates are specified, not falsely reported as executed.
- No commits, pushes, remote CI, deployment, paid services, emails or hosted database access.

## Checks

| Check | Observed state |
|---|---|
| `pnpm check` | Passed: lint, types, typed promises, 3 custom-rule checks, 21 unit tests, packages/worker/Next build and worker process smoke |
| `pnpm test:db` | Passed: 3 local PostgreSQL integration tests covering migrations/roles/RLS/constraints/context reset |
| `pnpm db:generate` | Passed; no schema drift or extra migration generated |
| Initial + repeated migration | Applied to empty dedicated database; second application preserves journal count |
| `pnpm test:browser` | Passed: desktop and mobile Chromium, static page and no runtime errors/overflow |
| `pnpm db:usage` | Measured actual local database/table bytes and approximate row counts |
| Dependency audit | Production: 0 advisories. Development: 1 high advisory in braces, no published fix; triage below |
| Independent final review | Completed; no M1 blocker. Test cleanup robustness fixed; see docs/evidence/review.md |

Evidence is in `docs/evidence/`; database details in `docs/database.md`. Red checks observed before fixes include logger credential leakage and database URL/HMR/browser-entry tests. Build does not read `.env` or open a database connection. No security guarantee or production-capacity claim follows from these checks.

## Capabilities and harness

| Capability | State |
|---|---|
| Ponytail full / Caveman / Superpowers | Existing native instructions/skills reused; no copied plugin caches |
| RTK | Native hook observed. Vitest 5 condensed parser failed; `rtk bypass` recovered full output for diagnosis |
| Context7 | Live resolve and query validated; no local duplicate connection |
| Eight official Vercel web skills | Installed project-locally with source lock; deployment/optimization actions not executed |
| find-skills | Existing global skill reused to avoid duplicate name |
| next-dev-loop | Installed; agent-browser absent, so skill workflow not executed. Playwright validation is separate evidence |
| next-bundle-optimizer | Installed; Next analyzer CLI supported, no optimization requested |
| supabase-postgres-best-practices | Installed; PostgreSQL stays local/provider-neutral, no Supabase service adopted |
| shadcn | Installed and CLI configuration inspected |
| differential-review | Installed; initial review uses repository baseline because Git has no commits |
| gh-fix-ci | Not selected: no Actions workflow, PR or failed run in scope |
| Sentry MCP | Not selected: no service/account authorized |
| Graphify 0.9.91 | Code-only extraction: 346 nodes / 398 edges; no LLM/provider calls. SQL parser unavailable, so SQL coverage incomplete |
| Harness2 | Native method adaptation; no CLI lab, API billing, proxy or model change |

Codex native session and inherited agent model/authentication were preserved. Exact backend model identifier and token/cost accounting are not exposed by these tool calls; none is invented. The database specialist operated only on allocated files and the dedicated local service. Fresh-context instruction retrieval passed: reviewer found the canonical design, M1 scope and database-free commands. Native client restart was not tested.

Canonical context index: root AGENTS.md, automatically discoverable by supported clients, links architecture, current implementation and evidence. Re-read current code and rerun affected checks after source/config/schema/dependency changes. No personal memory store was modified.

## Outstanding boundaries

M2 is not authorized. Hosted SSRF validation, 300-target saturation tests, provider cost attribution, delivery of email, production backups/RPO/RTO and commercial readiness remain untested. Global agent-browser and Graphify SQL parser were not installed. Local development role passwords must never be used remotely.

## Dependency risk triage and final verification

`pnpm audit --prod --json` completed with exit 0 and zero advisories. `pnpm audit --dev --json` completed with exit 1: braces 3.0.3, GHSA-vfj7-8cjw-p6xm, high, through eslint-config-next → fast-glob → micromatch. The registry and [upstream advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) report no published patched version. It is used by local lint tooling; this M1 app does not accept user-provided glob expressions. Do not pass untrusted glob patterns to development tooling; review upstream fixes before upgrades or public release. This is an unresolved development dependency risk, not an audit PASS.

An earlier moderate esbuild advisory (GHSA-67mh-4wv8-2f99) was resolved by a targeted `@esbuild-kit/core-utils>esbuild: 0.25.12` override. The [upstream advisory](https://github.com/advisories/GHSA-67mh-4wv8-2f99) affects esbuild's development server. The updated dependency graph passed offline schema generation, real PostgreSQL tests, type/lint/unit/build gates and browser smoke; no forced downgrade or prerelease was used. Reassess/remove the override when Drizzle's loader dependency is updated.

Initial audit attempts were slow; a bounded retry timed out, then the final audits completed and replaced the interim reports. Final raw results are audit-production.json and audit-development.json. The application does not run esbuild's serving API.

Typed lint measured 3.25 seconds wall time in the initial full profile; timing is machine-specific. `pnpm install --frozen-lockfile` passed after the security override. Runtime MCP tools/list, get_compilation_issues (empty issue list) and get_routes were checked on a dedicated loopback Next dev server. This is partial framework runtime evidence, not a successful next-dev-loop skill run because agent-browser remains unavailable. Next analyzer command support was checked, but no bundle optimization was performed.

Final cleanup: dedicated Next dev/test processes stopped; Watchtower PostgreSQL container stopped with exit 0 and named volume preserved. Other projects were not stopped. Browser logs include only a Node NO_COLOR/FORCE_COLOR warning from the test harness, not an application runtime failure.

## Design system integration — 2026-10-22

Scope: local M1 visual foundation, autonomous user-requested export integration plus homepage identity. Skills: AIOX UX/development guidance, Superpowers brainstorming/planning/native execution/independent review/verification, Ponytail full and concise Portuguese communication. No commits, pushes, deployment, database operation, email or remote-system mutation.

The source export contained 181 files and 36 component purposes. All are represented in `design-system`: 169 files preserved byte-identically and 12 intentionally adapted for local paths, fonts, icon loading and the border-token collision. Original hashes and mapping are in `design-system/provenance.json` and `preservation-check.json`. `design-system-export` was removed only after validation. Root DESIGN.md is the visual contract; references retain historical kits and original APIs separately from the typed application components.

Versions remain Next 16.4.2, React 19.3.0, TypeScript 5.9.3, Tailwind 4.3.3. A private source workspace package reuses React/types at the same versions; no new third-party runtime library or stack upgrade. Local asset packages: Fontsource Inter/JetBrains Mono 5.3.0 and Lucide static 0.460.0, with licenses/provenance. Reference-only React18.3.1 and Babel7.29.0 preserve standalone HTML without joining the app bundle.

Context7 resolve/query was used for Tailwind v4 source registration and theme integration; installed Next16.4.2 docs supplied CSS, server/client and notFound behavior. An offline pnpm install lacked cached registry metadata; the regular pinned install succeeded, followed by successful `pnpm install --frozen-lockfile`.

| Check | Result |
|---|---|
| `pnpm check` | PASS: lint, TypeScript, typed lint, custom-rule checks, 25 unit tests, package/worker/Next build and worker smoke |
| `pnpm test:browser` | PASS: 4 desktop/mobile cases; homepage content/no signup/no errors/no horizontal overflow; showcase and raw reference paths return 404 in production |
| `pnpm test:design-system` | PASS: desktop/tablet/mobile interactive showcase; local assets, font availability, tokens, blur, buttons, links, forms, tabs, dialog focus/restore, commands, data selection, chart missing samples, tooltip hover travel, explicit and OS reduced motion |
| `node scripts/verify-design-references.mjs` | PASS: 84 local links, local font files, no unsafe SVG injection/application dependence on the removed export |
| Historical HTML browser check | PASS: 30 pages, no page errors, failed resources or external requests |
| Reduced transparency | PASS under Chromium CDP media emulation: frosted filter none, solid rgb(23, 28, 34) |
| Visual inspection | Actual screenshots inspected for desktop/mobile homepage and showcase; material grid preserves frosted, smoked, liquid, metal and neon distinctions |
| Independent review | Completed in fresh native context; missing numeric data and tooltip hover findings fixed with regressions |
| Final cleanup | Export removed; dedicated local servers stopped; existing sessions/other projects preserved |

Evidence: `docs/evidence/design-system/` contains command outputs, reference checks, review notes and screenshots. Some intermediate browser runs failed on bugs subsequently fixed (dialog focus boundary, switch pointer layer, tooltip diagonal travel). One pair of runs collided in shared Playwright artifacts; configurations now use separate result directories. One dev-server cold-start attempt timed out; a later owned-server run succeeded. Reduced-motion CSS is optimized to an identity matrix rather than literal `none`; the test checks the resulting lack of transformation. These failed attempts are not reported as PASS.

Limitations: no real-device frame-rate measurement, screen-reader certification, full contrast audit or hosted validation. Historical reference kits retain their original illustrative behavior and unapproved commercial claims. The exported arbitrary styling/helper APIs are not guaranteed; the smaller typed API and canonical tokens are documented. Database tests and vulnerability audit were not repeated because schema/backend/dependency versions were unchanged. The previous dependency advisory record is historical, not refreshed by this task.

## Landing page implementation — 2026-10-22

User approved reproducing the Claude artifact locally with demonstrative interactions and private-beta CTAs. The homepage now uses Portuguese copy, a CSS lighthouse, local preview fields, an incident sequence, feature cards, a synthetic history slider, onboarding explanation, native FAQ and beta notice. Source is a Next Server Component with small client islands and scoped CSS Modules. No dependency added; no signup/auth route, request to a user-entered URL, storage, database change, email, commit, push or deploy.

Context7 resolve/query and installed Next 16.4.2 docs were consulted for Server/Client composition and CSS Modules. The existing Tailwind loader's broad CSS rule produced 13 warnings with module syntax; narrowing it to globals.css leaves CSS Modules to Next. Final build has no CSS warnings. The shared Tabs API gained an optional orientation; existing horizontal callers retain their behavior.

Validation after final implementation:
- `pnpm check`: PASS (lint, types, typed lint, custom lint-rule checks, 25 unit tests, all builds and worker smoke).
- `pnpm test:browser`: PASS, 10 cases across desktop/mobile, with extra 768px and 320px viewport checks. Validates local-only preview, no storage/outbound request, beta anchors, vertical keyboard tabs, history range, FAQ, pause/autoplay/reduced motion, no root overflow, and production exclusion of showcase/references.
- `pnpm test:design-system`: PASS, 3 desktop/tablet/mobile cases after the shared Tabs and loader changes, including existing horizontal tab behavior and interactive states.
- `git diff --check`: PASS.
- Fresh independent static review: one keyboard orientation finding, fixed with an observed failing regression before implementation; no other material finding. Actual desktop/mobile hero, full-page and incident screenshots inspected.

Evidence: `docs/evidence/landing/` holds final check/browser/showcase logs, initial expected-red tests, review and screenshots. Browser harness emits the existing NO_COLOR/FORCE_COLOR warning; no application page errors were observed. Dedicated test servers stopped after the suites.

Limits: responsive Chromium emulation is not physical-device or screen-reader certification. No full WCAG audit, hosted performance, live monitoring, auth or deployment validation. Earlier dependency advisory evidence was not refreshed; no dependency versions changed. The reference's public signup/free-plan/live-check claims were intentionally replaced by the approved private-beta/demo copy.

### HTML-source fidelity refinement — 2026-10-22

The user provided the original bundled HTML and repeated the landing request. Read its JSON template as inert data. Ported source lighthouse SVG and ring/sweep geometry, brand glyph, sticky header, headline/timestamp proportions and structured incident tab labels. Existing beta/demo scope remains unchanged. No bundled script, iframe or second runtime was imported. Source hash and review notes: `docs/evidence/landing/html-source.md`.

Fresh final validation: `pnpm check` PASS (25 unit tests, lint/types/build/worker); `pnpm test:browser` PASS (10 cases, including actual animation pause/reduced-motion checks and internal tab/panel bounds at 320/700/768px); `git diff --check` PASS. Desktop hero and incident screenshots inspected. Independent review's suspected tablet overflow did not reproduce with added internal-width checks; no speculative layout change was made.

Fresh showcase retry was blocked by the user's existing Next development server on port 3000, which was preserved. The earlier three showcase passes predate the ReactNode label refinement and are not presented as current rerun evidence. The refinement changes label typing without altering shared tab behavior; production tests cover the new labels. No deploy, live monitoring, physical-device test or screen-reader certification.
