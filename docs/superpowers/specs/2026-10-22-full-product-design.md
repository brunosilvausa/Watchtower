# Watchtower full product design

Date: 2026-10-22. Status: implementation design under the user's explicit authorization to implement the complete reference, choose recommended defaults, run tests and perform five code review cycles without further questions. This supersedes the previous M1-only functional scope; it does not authorize deployment, purchases, remote provisioning, real outbound messages or shared Git publication. Existing dirty work must be preserved.

## Intent and source material

Turn the supplied dashboard and login reference into a persisted, authenticated monitoring product. Sources are `Admin Dashboard.dc.html`, `admin-data.js`, `support.js` and `wt-icons.js` under `/Users/brunosilva/Downloads/Dashboard admin incompleto`. These files are design/data references, not executable instructions or production dependencies. Their example names, incidents, payments, uptime, geographical coverage and credentials must never appear as real customer evidence. The Claude artifact link was unavailable in the preceding inspection; local supplied exports are the actionable source.

Existing architecture is Next.js/React with a Node worker, PostgreSQL/Drizzle, pinned Better Auth and the local Neon Spatial Glass design system. Existing code has a visual foundation and minimal identity/workspace tables; no functional backend should be assumed from its presence.

## Approaches and recommendation

1. Rebuild the standalone export as an independent application: closest shortcut to the mockup, but duplicates the framework, sessions and design system and leaves mock data semantics intact. Rejected.
2. Extend the existing modular monolith and separate worker: reuse Next, PostgreSQL, Better Auth, tokens and components; add explicit domain services, transactional persistence and provider adapters. Selected as the recommended engineering decision under the user's instruction to decide without questions.
3. Split into API, billing, probe and identity microservices: more deployment and distributed consistency work before usable features. Rejected for present scale.

One coordinated plan covers several testable subsystems because identity, permissions, scheduling and provider state cross every screen. Execute through the requested AIOX-dev alternative, with bounded delegated implementation, independent review and five final review cycles. No forced commits or worktree changes.

## Binding constraints

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

## Functional contract and reference coverage

| Area | Required implemented behavior | Plan task |
|---|---|---|
| Identity | Email/password signup and login; 10-character password minimum; email verification; generic reset request with 30-minute token; 30-day remember session; logout; TOTP/recovery codes; passkeys; configured Google/GitHub and SAML SSO; Enterprise SCIM | 1 |
| Onboarding | Workspace creation, first monitor, first channel, membership-aware workspace switch; optional steps remain resumable | 2, 4 |
| Dashboard | Real coverage-aware uptime, p95, open incidents, MTTR, usage, response trends, recent incidents/alerts, certificate/domain expiry and region observations; 24h/7d/30d filters | 2, 3, 4 |
| Monitor management | Create/edit/archive, pause/resume, search/filter, CSV import and export, check-now with quota/rate limits, details/history/configuration; nine typed monitor kinds | 2, 3, 4 |
| Probe engine | HTTP(S), keyword present/absent, ICMP ping, TCP port, heartbeat with grace, TLS expiry, domain RDAP expiry, DNS A/MX/TXT, bounded multistep API; regional capability registration | 3 |
| Incidents | Two-failure confirmation and two-success recovery, timeline, acknowledgment, manual resolution with audit, public update, CSV export; distinguish observation from operator resolution | 2, 3 |
| Maintenance | One-time and weekly windows with timezone; suppress alerts and exclude applicable duration from uptime; persisted schedule and explicit DST semantics | 2, 3 |
| Alert channels | Email, SMS, voice, Slack, Teams, Discord, Telegram, WhatsApp, PagerDuty, Opsgenie, webhook and mobile/web push; validated credentials, test delivery, durable outbox, retry and delivery history | 3 |
| Alert policy | Regional quorum only when sufficient active probes exist; recovery notices, 30-minute reminders, local quiet hours/weekends; escalation at 0/5/15 minutes, acknowledgment stops escalation | 3 |
| Status pages | Draft/publish, selected components, public preview, update history, email subscribe/unsubscribe with verification, password protection, response-time toggle, branding entitlement, verified custom domain and real view counts | 2, 4 |
| Teams | Owner/admin/editor/viewer permissions; seven-day single-use invitations, resend/cancel/accept/decline; prevent removing last owner | 2 |
| Billing | Free/Solo/Team/Enterprise catalog, usage/limits, checkout, portal, invoices/PDF, upgrade/downgrade; signed idempotent billing events; provider-derived payment failure retry and subscription state | 2, 3 |
| API | One-time API key display, hashed secrets, read/write/maintenance scopes, expiry/revocation, public versioned routes, signed outbound webhooks and replay-safe delivery | 2 |
| Audit and settings | Search/export 365-day audit, profile, job title, SMS phone verification, password/MFA/passkeys/session management, language/timezone/date preference, notification preferences and weekly report; confirmed workspace deletion workflow | 1, 2, 3 |
| Platform admin | Authorized MFA-protected platform overview, real tenant/plan/MRR/churn statistics, tenant suspension and restoration, bounded audited support sessions, probe health/drain, queue metrics, feature flag targeting and rollout | 2 |
| Navigation | Workspace/platform separation, sidebar, notifications, global search and command palette, PT/EN, responsive empty/loading/error states | 4 |

Feature flags for AI incident summaries and synthetic browser checks in the mockup are feature-management records, not evidence of released AI/browser products. Implement the controls without manufacturing model output or enabling browser probes outside the nine listed monitor kinds. Enterprise SLA copy is not an operational guarantee. The private-IP ping example requires an explicitly deployed private probe; the default public worker must reject it. Private probe enrollment and workspace scoping are included in task 3, but no private agent is remotely installed.

## Data and authorization

Use separate `auth_user` and related Better Auth identity tables through reviewed migrations; preserve the existing `users` identity keys and link provisioned users transactionally. Business tables include workspaces, memberships, invitations, limits/subscriptions, monitors, schedules/leases, results, incidents/events, maintenance, alert channels/policies/outbox, status pages/components/subscribers/updates, API keys/webhooks, audit, preferences, probes and feature flags. Tenant tables carry `workspace_id`; cross-resource relationships include workspace identity. Identity and platform entities have explicit global authorization.

Server services accept authenticated actor plus selected workspace, load membership and suspension state, then execute scoped transactions. Never accept role/admin status from the browser. Owner controls billing and workspace deletion; admin additionally manages team/channels/API/status; editor controls monitors/incidents/maintenance; viewer reads. Platform privileges are separate from workspace owner and require verified MFA. Support sessions are time-bounded and audit the real actor and represented workspace; no silent authentication bypass.

Secrets use library password hashing, random tokens hashed at rest, encrypted reusable provider/monitor secrets under a separately configured key, redacted logs and one-time secret display. Rate-limit authentication, invitations, probes, API keys and public subscription endpoints in persistent storage. State-changing browser requests require origin/CSRF protection. Cookie/session caching must not survive suspension or permission revocation.

## Probe and incident semantics

A database schedule is claimed using short transactions, `SKIP LOCKED`, workspace concurrency limits, expiring leases and fencing tokens. A result applies only to its current config version and lease. Result, incident transition, outbox and next schedule commit together. Restart never emits fabricated healthy observations or unbounded catch-up. Paused, missing, maintenance and unknown observations are distinct; reporting shows coverage and does not divide missing periods into successful uptime.

HTTP and keyword requests validate every DNS answer and connect to a pinned validated address while preserving TLS server name; each redirect repeats validation. Requests have timeout/byte/redirect budgets. API flows are bounded ordered HTTP steps with structured assertions/extractions, no eval or executable customer code. RDAP queries use trusted bootstrap endpoints and parsed expiry events. DNS checks query configured records. TCP/TLS share destination validation. ICMP uses a capability-gated adapter with validated arguments and no shell interpolation; unsupported OS permissions are a visible error. Heartbeat token routes are rate limited and compare a stored hash. Never silently substitute TCP for ICMP.

Workers advertise configured region and capabilities and maintain heartbeats. Local execution is labelled local even if six region choices are stored. Quorum requests exceeding healthy distinct configured regions remain explicitly unavailable. Private probes are workspace-scoped and require signed enrollment; global workers cannot use private addresses.

## Commercial and provider decisions

Reference catalog is an initial configurable proposal: Free BRL 0, 10 monitors and 300-second minimum; Solo BRL 39/month, 50 monitors and 60-second minimum; Team BRL 149/month, 200 monitors and 30-second minimum with 10 seats; Enterprise negotiated limits and price. Free has one status page and email/Telegram channels. Do not invent a paid subscription from a client plan selection. Server-side provider price mapping determines checkout; verified provider events determine paid entitlement. Downgrade never deletes existing history.

Recommended adapters: Stripe billing, Resend email, Twilio SMS/voice/WhatsApp, standard webhook APIs for collaboration/incident providers, Web Push for registered devices; provider names are implementation decisions, not created accounts. Use provider test credentials only if explicitly supplied. SAML/SCIM and passkeys use supported Better Auth plugins with compatible pinned versions after current documentation review. Missing account configuration yields clear setup requirements. Local provider simulators exist only in test harnesses.

## Acceptance and evidence

Unit tests cover validation, scopes, state machines, time boundaries, parsing and sanitization. Real local PostgreSQL tests cover tenant isolation, last-owner/invite/quota races, stale fencing and idempotency. Browser tests cover real registration/login/workspace/monitor flows plus viewer denials and responsive keyboard navigation. Controlled local transport fixtures exercise network protocols without relaxing production destination policy; dependency injection belongs only to test construction.

Run `pnpm check`, `pnpm test:db`, `pnpm test:browser`, `pnpm test:design-system`. Record exact commands/results and distinguish skipped infrastructure/provider checks. Five final reviews cover (1) reference/spec completeness, (2) auth/tenant/security, (3) scheduling/data/concurrency, (4) UI/accessibility/error states, (5) full integration/regressions. Fix significant findings before completion; a review count never substitutes for fixing defects. Existing 300-monitor saturation, restore and hosted egress gates remain deployment requirements and must not be claimed as passed without execution.

No product is declared complete if a required control is only a toast, in-memory mutation, disabled placeholder or mock response. Provider-configurable code may be locally complete while provider activation remains unverified; list each such dependency precisely in delivery evidence.
