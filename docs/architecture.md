# Implemented architecture — full local product

The [full-product design](superpowers/specs/2026-10-22-full-product-design.md) supersedes the former M1-only execution scope. The [private-beta architecture](superpowers/specs/2026-10-21-watchtower-private-beta-design.md) remains historical context. Current validation and external limitations are recorded in [setup](setup.md) and [execution evidence](evidence/full-product/progress.md).

## Processes and boundaries

The pnpm monorepo contains `apps/web` (Next.js/React), `apps/worker` (Node TypeScript), `packages/runtime` (configuration, logging, probes and delivery adapters), and `packages/database` (PostgreSQL schema, authorization and domain services). Packages export compiled ESM with browser-rejection entry points; web identity/server helpers use `server-only`. Presentation never queries PostgreSQL directly.

Better Auth initializes lazily after validating configuration, using a separate scoped authentication role. Email verification, password recovery, session management, TOTP, passkeys and explicitly configured social/enterprise identity paths use persisted identities. Local mail writes private development files; external mail requires provider configuration. Platform access requires an explicitly provisioned administrator and session-specific MFA. Support access is timed, read-only and audited.

Workspace operations authorize current membership before setting transaction-local RLS context. PostgreSQL FORCE RLS and scoped roles complement application permissions. Workspace locking serializes quotas and membership mutations. Public status, hashed API credentials, heartbeat ingestion, billing reconciliation and worker operations use narrow functions. Secrets are encrypted at rest and absent from list/detail DTOs; tokens are revealed only when created.

## Product services

Authenticated APIs provide monitor configuration/history, incidents, maintenance, alert channels/policies, teams/invitations, public status configuration and updates, billing, API credentials/webhooks, audit, preferences, private probes and delayed workspace deletion. CSV import validates the complete transaction; exports escape spreadsheet formulas. Password-protected status pages, double-opt-in subscriptions and DNS ownership verification use separate public/server flows. The platform view uses persisted tenant, subscription, queue and probe evidence rather than demonstration values.

Nine monitor types run through bounded adapters: HTTP, keyword, ping, TCP port, heartbeat, TLS certificate, domain expiry, DNS and API sequences. Public probes resolve and pin vetted addresses; private agents require explicit enrollment and allowed CIDRs. Region schedules and leases fence stale results. Incidents use repeated observations and regional quorum. Notification outboxes retain retries, deduplication, recovery, escalation and terminal failures. Providers remain inactive without configuration.

The worker's default smoke mode samples process resources without executing jobs. `WATCHTOWER_WORKER_ENABLED=true` enables monitoring, dispatch, retention and lifecycle work. Runtime probes and provider requests can reach external systems only when the operator runs configured workers; no live provider delivery was performed during implementation.

## Frontend and local operations

The application reuses the Neon Spatial Glass design system through `@design-system` and canonical tokens. It includes the landing page, split login/signup/recovery flows, responsive workspace dashboard and public status pages. Demonstrative landing interactions remain labelled as examples; dashboard metrics derive from persisted observations, with missing evidence represented explicitly. `/design-system` remains development-only and reference archives remain outside public routes.

`pnpm setup:product` prepares private local configuration without printing secrets. `pnpm dev:product` starts the web application and `pnpm dev:monitoring` starts the explicitly enabled worker. Migration commands target the dedicated local PostgreSQL service and never run during imports, requests or builds. Applied SQL migrations are immutable. The persistent volume is preserved.

`pnpm check` is credential-free and does not connect to the database. PostgreSQL integration, product browser, foundation browser and design-system suites are explicit commands. Local tests do not prove hosted network isolation, geographic deployment, live payment/delivery, enterprise identity interoperability, real-device accessibility or operational recovery.
