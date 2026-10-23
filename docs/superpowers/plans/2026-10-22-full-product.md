# Watchtower Full Product Implementation Plan

> **For agentic workers:** Execute using the user-selected `aiox:aiox-dev` alternative with bounded delegation and independent review. Steps use checkbox (`- [ ]`) syntax for tracking. Do not force commits or worktrees over the preserved dirty baseline.

**Goal:** Implement and locally validate the complete supplied dashboard/login product, with real persisted backend behavior and five final code review cycles.

**Architecture:** Extend the existing modular Next.js monolith, PostgreSQL database and separate Node worker. Authenticate with Better Auth using separate auth tables, authorize every workspace operation before RLS context, and keep provider/network operations behind explicit server-only adapters and durable jobs.

**Tech Stack:** Existing pinned Next.js, React, TypeScript, Better Auth, PostgreSQL/Drizzle, Zod, Vitest, Playwright and `@design-system`.

**Spec:** `docs/superpowers/specs/2026-10-22-full-product-design.md`

## Global Constraints

- Preserve existing dirty changes; do not reset, clean, deploy, push, purchase services or send real messages.
- Keep strict TypeScript, Node ESM, server-only service boundaries and named workspace exports.
- Keep each JavaScript/TypeScript file at or below 350 lines; split focused modules before exceeding the enforced limit.
- Reuse `@design-system` and canonical semantic tokens; retain keyboard access, reduced motion and responsive layouts.
- Authorize membership before setting transaction-local workspace context; RLS alone is not authentication.
- Persist product state in PostgreSQL; browser storage is limited to harmless view preferences.
- Provider absence must produce an explicit unconfigured state, never simulated success.
- Do not claim live geographic coverage, payment settlement, notification delivery or hosted SSRF safety from local tests.
- Keep `pnpm check` independent of databases and external services; database and browser integration commands are explicit.
- Default public probes reject private, loopback, link-local, metadata and reserved addresses at connection time, including DNS rebinding and redirects.
- Five final code review cycles must have recorded findings, fixes and validation evidence.

## Review Focus

1. User A sends B's workspace/resource ID, a removed member reuses a session, or a viewer submits a mutation: deny before data access; task 1 and 2 integration assertions.
2. DNS changes between validation and socket creation, redirects hit private hosts, or a multistep flow captures a secret: no prohibited socket and no secret in result/logs; task 3 transport assertions.
3. Workers complete after lease expiry/config change, invitations race, or a billing webhook replays: at most one valid effect, no quota overflow; tasks 1–3 PostgreSQL assertions.
4. No observations, missing regions, maintenance/DST boundaries or unconfigured providers: preserve unknown/unconfigured status, never invent success; tasks 2–4 assertions.
5. Keyboard-only/mobile interaction or a failed network mutation: focus and error message remain usable, no false success toast; task 4 browser assertions.

## Execution record and interface discipline

The controller records task state and deviations in `docs/evidence/full-product/progress.md`. Baseline snapshot: `/var/folders/rn/86blbjds5tvf_jr_145cvk140000gn/T/watchtower-before-product-45qdvt0j`; initial `pnpm check` passed 25 tests and lint/build checks. The user approved implementation and delegated remaining design decisions; no further approval question is required. Interface amendments must be recorded before dispatching their dependent task.

This is five work packages, not permission to have concurrent writers to shared files. Shared schema migrations/exports belong to the current backend implementer. Each package receives independent review. Each package has its own test cycle; do not compress required capabilities into placeholder buttons.

### Task 1: Persisted identity, authorization and product schema

**Files:** Modify `packages/database/src/schema.ts`, `packages/database/src/index.ts`, `packages/database/migrations/meta/_journal.json`; create reviewed `packages/database/migrations/0002_full_product.sql`, `packages/database/src/product.ts`, `packages/database/tests/product.integration.test.ts`, `apps/web/src/lib/auth.ts`, `apps/web/src/lib/auth-client.ts`, `apps/web/src/lib/access.ts`, `apps/web/src/app/api/auth/[...all]/route.ts`, `apps/web/src/lib/access.test.ts`. Update explicit dependencies/configuration only as required.

**Interfaces:** `Actor = { userId: string; sessionId: string; platformAdmin: boolean; mfaVerified: boolean }`; `WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer'`; `Permission = 'read' | 'monitor:write' | 'incident:write' | 'maintenance:write' | 'workspace:admin' | 'billing:write' | 'workspace:delete'`; `requireActor(headers: Headers): Promise<Actor>`; `requireWorkspace(actor: Actor, workspaceId: string, permission: Permission): Promise<{ workspaceId: string; role: WorkspaceRole }>`; `auth` exports Better Auth instance. PostgreSQL service helpers must establish transaction-local context only after membership verification. Internal test helpers may use explicit local runtime pools.

- [ ] Write `rejectsUnauthenticated`, `deniesForeignWorkspace`, `deniesSuspendedWorkspace`, `viewerCannotMutate`, `lastOwnerCannotBeRemoved`, `inviteConsumedOnce` tests. Assert unauthenticated=401, forbidden=403/404 without foreign data, one success for concurrent invite consumption, and owner count remains >=1.
- [ ] Run `pnpm test` and the focused local DB integration command; record the expected failures before implementation.
- [ ] Add reviewed migrations covering all spec entities and tenant references, separate Better Auth `auth_user` identity/session/account/verification/plugin tables and legacy identity linkage. Preserve applied migrations and existing workspace IDs. Preserve the existing id-only `users` fixtures and runtime denial of direct users-table access; use a restricted identity bridge function where needed. Migrate the owner-only membership role constraint to the four specified roles. The tenant context key remains `app.workspace_id`. Add runtime grants/RLS with no blanket tenant bypass.
- [ ] Configure Better Auth email/password (minimum 10), verified email, reset expiry 1800 seconds, remember-session 2592000 seconds, TOTP/recovery, passkeys, configured social/SAML and SCIM plugins. Review current plugin APIs and pin compatible missing packages. No provider secrets in client bundles or logs. Verify membership and suspension on every request. Provision identity/workspace exactly once.
- [ ] Run `pnpm check` and `pnpm test:db`; record actual results and review the diff. Export a concrete auth/schema interface report to the controller; no commits.

### Task 2: Authorized product services and API

**Files:** Create `packages/database/src/product-service.ts`, `packages/database/src/product-validation.ts`, `packages/database/src/product-validation.test.ts`, `packages/database/tests/product-service.integration.test.ts`, `apps/web/src/lib/product.ts`, `apps/web/src/app/api/workspaces/[workspaceId]/[...path]/route.ts`, `apps/web/src/app/api/v1/[...path]/route.ts`, `apps/web/src/app/api/billing/webhook/route.ts`, `apps/web/src/app/status/[slug]/page.tsx`, `apps/web/src/app/api/status/[slug]/route.ts`; extend task 1 migrations through a new reviewed migration if necessary.

**Interfaces:** `MonitorType = 'http' | 'keyword' | 'ping' | 'port' | 'heartbeat' | 'ssl' | 'domain' | 'dns' | 'api'`; `ProductRequest = { method: 'GET' | 'POST' | 'PATCH' | 'DELETE'; path: string[]; body: unknown }`; `ProductResponse = { status: number; data: unknown }`; `handleWorkspaceRequest(actor: Actor, workspaceId: string, request: ProductRequest): Promise<ProductResponse>`; `getWorkspaceDashboard(actor: Actor, workspaceId: string, range: '24h' | '7d' | '30d'): Promise<DashboardData>`. `DashboardData` contains observed summary, monitors, incidents, channels, usage and capability state; exact DTO exports live in `product.ts` and must be handed to the UI implementer.

- [ ] Write failing assertions for all CRUD scope boundaries, cross-workspace child IDs, invalid type-specific monitor inputs, concurrent quota creation, last-owner transfer/removal, replayed invitation/webhook, malicious CSV cells and blank coverage. Expect no cross-tenant read/write, zero duplicate billing effects, preserved history and null uptime when observed denominator is zero.
- [ ] Run `pnpm test` and `pnpm test:db` to capture missing behavior.
- [ ] Implement real monitor configuration/CRUD/import/export, incidents/ack/manual resolve/timeline, one-time and weekly maintenance, team/invitation flows, status pages/password/subscribers/custom-domain verification, audit/profile/preferences, API keys/scopes, webhook configuration, plan/usage/checkout/portal/invoices, platform tenants/suspension/support/drain/flags and dashboard aggregates. Centralize Zod schemas and role checks; never implement generic unrestricted table writes.
- [ ] Enforce catalog values from the spec, 7-day invitation expiry and 365-day audit retention. Hash invitation/API/heartbeat secrets, return raw keys only once; encrypt reusable secrets. Verify billing signatures before parsing actions and deduplicate provider event IDs. Owner-only deletion requires recent authentication and a deliberate confirmation; no automatic deletion during tests outside test-owned rows.
- [ ] Run unit and PostgreSQL tests, then `pnpm check`; hand off exact DTO/route contracts and real error responses. Independent review must reject any catalog control backed only by an in-memory update.

### Task 3: Probe execution, providers and durable jobs

**Files:** Create `packages/runtime/src/probes.ts`, `packages/runtime/src/probes.test.ts`, `packages/runtime/src/providers.ts`, `packages/runtime/src/providers.test.ts`, `packages/database/src/jobs.ts`, `packages/database/tests/jobs.integration.test.ts`, `apps/web/src/app/api/heartbeat/[token]/route.ts`; modify `apps/worker/src/main.ts`, package exports and scoped configuration schema.

**Interfaces:** `ProbeResult = { state: 'up' | 'down' | 'degraded' | 'unknown'; durationMs: number | null; statusCode: number | null; errorCode: string | null; observedAt: Date; expiresAt?: Date }`; `executeProbe(config: MonitorConfig, signal: AbortSignal): Promise<ProbeResult>`; `claimChecks(workerId: string, region: string, limit: number): Promise<ClaimedCheck[]>`; `completeCheck(claim: ClaimedCheck, result: ProbeResult): Promise<boolean>` (false means expired/stale claim); `deliverNotification(job: DeliveryJob): Promise<{ state: 'accepted' | 'unconfigured' | 'retry' | 'failed'; providerId?: string }>`; shared `MonitorConfig`, `ClaimedCheck`, `DeliveryJob` are exported from the owning package with no browser import.

- [ ] Write protocol assertions for all nine kinds, all twelve channel adapters and provider absence. Add forbidden-IP/rebinding/redirect/mixed-DNS cases asserting zero forbidden socket opens; stale lease returns false; concurrent workers produce one applied result/outbox event; 2 failures open and 2 recoveries close; maintenance suppresses notification; missed heartbeat opens only after grace.
- [ ] Run unit/DB tests and record expected failures.
- [ ] Implement validated/pinned network transports, bounded multi-step flows, capability-gated ICMP, trusted RDAP parsing, heartbeat verification and workspace-scoped private probe registration. Persist advertised regions/capabilities and real probe heartbeats; do not pretend the local worker is six deployed regions.
- [ ] Implement leases/fencing/quota fairness, atomic result/incident/outbox completion, config changes, crash recovery, retention and operational metrics. No open DB transaction during network I/O. Bound concurrency, response bytes, redirects, steps and catch-up work.
- [ ] Implement adapter-specific signed/authenticated payloads for all listed channels and billing calls. Outbox retries use stable idempotency keys and capped backoff; acknowledgment cancels 5/15-minute escalation, reminders use 30 minutes and quiet periods honor timezone. Weekly summaries and verified status subscriptions use the same durable delivery path. Unconfigured does not count as accepted or delivered.
- [ ] Run controlled fixtures and real local DB concurrency tests; run `pnpm check`. Record providers/regions/ICMP capabilities not live-verified, plus saturation/host safety gaps. Independent review checks retry races and network policy.

### Task 4: Complete reference frontend and login

**Files:** Create `apps/web/src/app/(auth)/login/page.tsx`, `apps/web/src/app/(auth)/signup/page.tsx`, `apps/web/src/app/(auth)/reset-password/page.tsx`, `apps/web/src/app/(auth)/verify/page.tsx`, `apps/web/src/app/(auth)/invite/page.tsx`, `apps/web/src/app/dashboard/[[...path]]/page.tsx`, `apps/web/src/app/dashboard/product-shell.tsx`, `apps/web/src/app/dashboard/product-views.tsx`, `apps/web/src/app/dashboard/product.module.css`, `apps/web/src/lib/product-client.ts`, `tests/browser/product.spec.ts`; modify existing landing CTAs only where they should enter the now-real product. Split views by domain when needed; preserve named design-system components.

**Interfaces:** Consume task 1 `auth-client`, task 2 DTO/routes and task 3 capability/delivery states. `ProductShell` receives authenticated initial workspace DTO; client calls fetch real API endpoints and revalidate on success. No database imports in presentation, no reference runtime script imports and no sample metrics in authenticated production routes.

- [ ] Write browser tests for signup/verify/login/reset, workspace onboarding, create/pause/resume monitor, incident acknowledgment, invitation acceptance, status publication, API key one-time reveal and role-denied mutations. Assert mutation survives reload, failure displays error without success, password fields are labelled and dialogs restore focus.
- [ ] Run the focused production-build browser suite and capture missing route/UI failures on dedicated port 3137.
- [ ] Build login/reset/MFA/invitation/onboarding and shell matching the local reference. Add dashboard, monitors/details/import, incidents/details, status pages/editor, maintenance, integrations/escalation, team, billing, API/webhooks, audit/settings and platform views. Every listed button submits a real supported operation, navigates somewhere valid or states the exact unconfigured prerequisite.
- [ ] Implement PT/EN labels, timezone/date preferences, search/command palette, responsive navigation, notifications and accessible graphs/tables. Never report six operating regions or successful delivery from a static example. Preserve dark materials, canonical spacing and visible focus; empty data is an intentional product state.
- [ ] Run keyboard/mobile checks at 390px and desktop 1440px, failed-request checks, `pnpm test:browser`, `pnpm test:design-system` and `pnpm check`. Compare reference screenshots with rendered product views. Independent review checks every reference navigation/control against persisted behavior.

### Task 5: Full regression, five review cycles and delivery evidence

**Files:** Create `docs/evidence/full-product/progress.md`, `docs/evidence/full-product/validation.md`, `docs/evidence/full-product/reviews.md`; update `docs/architecture.md`, `docs/setup.md`, `docs/quality.md`, `README.md` and safe environment examples to describe actual implementation. Only update changed assertions and do not erase dated prior evidence.

**Interfaces:** Test commands remain `pnpm check`, `pnpm test:db`, `pnpm test:browser`, `pnpm test:design-system`; evidence records exact execution time, code state, results, fixtures, omitted checks and provider configuration requirements.

- [ ] Add end-to-end assertions that a fresh local user can create a workspace/monitor, a controlled probe result appears, failure opens an incident, a local provider fixture receives one logical alert, recovery appears and a second tenant cannot read any of it. Persist and restart web/worker to prove state survives.
- [ ] Run full local suites, inspect generated SQL and verify no external provider effects. Fix failures before reviews.
- [ ] Review cycle 1: reference/spec completeness. Record each surface as implemented/tested or explicitly incomplete; fix missing real behavior.
- [ ] Review cycle 2: auth, secrets, roles, RLS, public endpoints and outbound SSRF. Fix bypasses and add focused regression evidence.
- [ ] Review cycle 3: data integrity, quotas, leases, restart, maintenance, timezones and provider replay. Fix race/state bugs and re-run affected checks.
- [ ] Review cycle 4: browser fidelity, responsive layouts, keyboard/focus, language and failed/unconfigured states. Fix broken controls and accessibility regressions.
- [ ] Review cycle 5: final whole-change review against original baseline and all previous findings. Verify significant findings are closed and run affected/full gates as justified by fixes.
- [ ] Deliver concise actual completion and tests, link local evidence and list exact live provider/host/region limitations. Do not claim five clean cycles if any cycle has unresolved material findings; do not claim full product completion while required features remain placeholders. No commit, push or deployment.

## Self-review

The coverage matrix maps every supplied product area to a work package. Interface owners and handoffs are explicit; adapters and private/regional execution retain operational limitations instead of fake success. Test assertions cover all five Review Focus classes. Further decomposition inside a package is allowed only as recorded implementation steps that preserve full coverage and one writer per file.

## Execution disposition — 2026-10-22

The five implementation packages are complete locally; actual code and checks supersede planning estimates. Detailed completion is in [execution ledger](../../evidence/full-product/progress.md), [validation](../../evidence/full-product/validation.md) and [five reviews](../../evidence/full-product/reviews.md). Original task checklists above preserve the proposed workflow rather than falsely asserting every proposed test ran verbatim.

Coverage was split by boundary: real PostgreSQL tests exercise roles/RLS, identity, invitation/public flows, scoped lifecycle, worker results/incidents/deliveries, concurrency and checkout; controlled runtime transports cover all nine probes/twelve channels; browser tests exercise actual signup/mail verification/login, persisted monitor/API edits, channel repair, public publication, preferences, two-workspace routing, errors and mobile keyboard logout. The proposed single browser-through-worker-through-provider/restart scenario was verified through these separate suites, not one combined deployed end-to-end run. Password reset/TOTP and public subscription flows have service integration tests rather than full browser journeys. No claim of exhaustive UI/provider combinations or production readiness follows.

Five fresh independent review cycles found and closed API edit data loss, heartbeat conversion, reporting/controls gaps, checkout duplication, unbounded webhook input, invitation queue omission, worker lock inversion, stopped-monitor alerts and workspace navigation/mobile controls. Migration followups through0022 preserve previously applied SQL. Provider delivery, real OAuth/SAML/SCIM/passkeys, remote regions, hosted network protection, sustained load and recovery drills remain operational qualification work.
