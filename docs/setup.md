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
