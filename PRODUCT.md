# Watchtower product scope

Watchtower helps individuals and small teams monitor their own digital systems from private workspaces. The commercial product is a multi-tenant SaaS, not a personal local monitoring utility.

Primary reference: [approved architecture](docs/superpowers/specs/2026-10-21-watchtower-private-beta-design.md). This summary does not override it.

## Intended beta

Invite-only access for 10–30 users, individual workspaces, public HTTP/HTTPS uptime checks, persistent history, incidents, email alerts and administrative controls. Limits are configurable per workspace and independent from billing. Prices and commercial quotas are not defined.

Intended flow: authorized invitation, verified identity, private workspace, target registration, recurring checks, visible results and incident alerts. These are future flows, not delivered M1 features.

## Current authorization

M1 covers local monorepo, application/worker foundation, PostgreSQL, initial schema, migrations, quality gates and documentation. No user registration, invitation handling, monitor CRUD, recurring checks, incident logic, email sending or billing is implemented.

## Requirements and assumptions

- Server authorization and PostgreSQL RLS protect tenant-owned data.
- Workers will use persistent scheduling, leases and idempotent effects.
- SSRF protection must be proven on the selected deployment environment before invitations.
- Simultaneous failures and worker saturation require explicit load tests in M3/M5.
- Operational and usage measurements must support real cost analysis; local process/database measurements start in M1.
- Proposed 60-second checks, 30-day result retention and 90-day closed-incident retention remain configurable and subject to capacity/cost validation.
- Hosting region, initial quotas, provider account costs and deployment authorization remain open.

## M1 acceptance

Web and worker build/run locally with pinned dependencies. Unit, lint, types and builds do not require database credentials. Explicit local migrations and tests prove database role/RLS boundaries. Documentation distinguishes observed checks from future functionality and deployment proof. Subsequent milestones require new authorization.
