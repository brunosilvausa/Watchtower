# Watchtower M1 Implementation Plan

> For agentic workers: execute with Superpowers executing-plans in this session, with a database specialist and a fresh final reviewer. User authorized M1 execution on 2026-10-21; no further implementation approval is needed within M1.

**Goal:** Deliver a locally runnable, tested monorepo foundation without M2–M6 product functionality.

**Architecture:** pnpm workspace with apps/web, apps/worker, packages/database and packages/runtime. PostgreSQL runs in a project-specific local Docker service. Shared runtime provides validated configuration and redacted operational logging; database provides the initial schema and explicit migrations.

**Tech stack:** Next.js 16.4.2, TypeScript, Node 24, PostgreSQL, Drizzle, Vitest; stable registry versions pinned in manifests and lockfile.

**Spec:** ../specs/2026-10-21-watchtower-private-beta-design.md (approved; canonical).

## Global constraints

- M1 only: no login/invitation flows, tenant API, monitoring scheduler, checks, incidents, emails or billing.
- No deploy, paid service, remote migration, push, global configuration or inference-provider changes.
- No commits in this delivery; preserve the existing checkout and architecture document.
- check/build must work without database credentials; database tests explicitly use disposable local PostgreSQL.
- RLS tests use runtime roles, not superuser assertions alone.
- Add simultaneous-failure/saturation tests and deployed SSRF proof as later release gates, not pretend M1 executes them.

## Review focus

- Missing/invalid environment variables must not leak their value (runtime unit tests).
- Import/build must not create database connections (database lifecycle tests).
- Runtime role cannot see or alter another workspace; transaction context cannot leak (real PostgreSQL tests).
- Worker shutdown must terminate its heartbeat cleanly and report process resource metrics (process smoke test).
- Migration/test commands must refuse remote or wrong database targets (local-target tests and migration integration).

## Task 1 — workspace and runtime

Files: root manifests/config; apps/web; apps/worker; packages/runtime; tests/runtime tests.
Interfaces: @watchtower/runtime exports createLogger, parseEnv and configuration schemas; worker consumes logger and emits process health only.
- [x] Scaffold official Next application in a temporary directory and incorporate into apps/web.
- [x] Pin dependency versions and configure workspace TypeScript/build boundaries.
- [x] Add tests for validation/redaction and worker smoke before validating implementation.
- [x] Implement minimal worker lifecycle and process metrics, no job execution.
- [x] Run unit tests, types and both builds.

## Task 2 — local persistence

Files: packages/database/**, compose.yaml, infra/postgres/**, docs/database.md.
Interfaces: @watchtower/database exposes lazy getDb()/closeDatabase(); schema contains identity-compatible core and workspace/membership foundation only.
- [x] Database specialist reads approved spec and keeps scope at schema/roles/migrations, not auth or membership services.
- [x] Define generated initial migration plus explicit role/RLS hardening; local-only migration runner.
- [x] Configure dedicated PostgreSQL container with loopback binding and named volume.
- [x] Test empty database migration, repeat application, constraints and runtime-role RLS isolation with real PostgreSQL.

## Task 3 — quality and toolkit

Files: eslint-rules/**, ESLint configurations, scripts/**, project skills, docs/evidence/**.
- [x] Adapt toolkit lint profiles to every workspace, including typed async checks and database import guard.
- [x] Install applicable official local skills, avoiding installed global duplicates; record unavailable runtime capabilities.
- [x] Run lint/rule self-check/typecheck/unit/build plus separate database and process smoke tests.
- [x] Audit production/development dependencies, inspect browser and generate deterministic code-only Graphify graph.

## Task 4 — documentation and review

Files: nine manifest documents, canonical architecture amendment, evidence, plan ledger.
- [x] Mark architecture approved and add three user requirements with milestone-specific validation gates.
- [x] Document actual files, commands, limitations, versions and provenance; no claims of M2 or hosted validation.
- [x] Fresh-context final review and instruction retrieval smoke; resolve material findings and rerun affected checks.
- [x] Stop owned processes/container, preserve local volume, report evidence and remain at M1.

## Execution ledger

- Preflight: empty local Git repository plus untracked canonical architecture; Node 24.22.0, pnpm 12.11.2 and Docker available. Other projects' containers must remain untouched.
- Toolkit revision: 790a895304e0c08b70a5b215c9d334f1c86b816c.
- Ruling: user explicitly authorized M1 in this directory; no worktree or additional approval gate. Record all work without commits.
- Ruling: initial schema implements identity/tenancy storage only. Monitoring/incident/outbox schemas remain logical in architecture until their milestones.
- Ruling: resource metrics in M1 measure running processes and local database sizes, not fictitious check counts or provider costs.

- Task 1: complete — pinned workspace, safe runtime, static web and worker lifecycle; final unit/build/process checks passed.
- Task 2: complete — dedicated PostgreSQL, initial schema, local-target migration guard, roles/FORCE RLS; 3 real integration tests passed.
- Task 3: complete — credential-free quality gate, browser smoke, code graph and audits. Production audit clean; unfixable braces development advisory recorded.
- Task 4: complete — canonical architecture amended, nine documents filled, fresh review/retrieval smoke completed; M2 remains unauthorized.
- Ruling: pnpm 12 uses allowBuilds rather than the older template key. Kept approvals local and limited to necessary native build packages.
- Ruling: remove unused shadcn generated button and dependencies; keep initialization/tokens and existing class helper.
- Ruling: targeted esbuild transitive override fixes the published advisory; reran affected checks. No published braces fix exists; record scoped dev-tool risk rather than force a downgrade.
- Review correction: database test fixtures roll back on setup failure and close pools in cleanup finally.
