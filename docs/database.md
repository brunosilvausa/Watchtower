# Local PostgreSQL foundation (M1)

The canonical architecture is [the approved design](superpowers/specs/2026-10-21-watchtower-private-beta-design.md). M1 provides persistence infrastructure only. No authentication, provisioning, monitoring or tenant endpoints are enabled.

## Local setup

Run from the repository root:

```sh
cp .env.example .env
docker compose up -d --wait
pnpm db:migrate
pnpm test:db
pnpm db:usage
```

The dedicated Compose project is `watchtower-m1`; PostgreSQL 18.3 is pinned by image digest and exposed **only** at `127.0.0.1:55432`. Data stays in `watchtower-m1_postgres_data`. `docker compose stop` stops this project without deleting data. Never run volume removal as routine cleanup. Other project containers are unrelated.

These credentials are intentionally public **development-only** values:

| Purpose | Role | Password |
| --- | --- | --- |
| Container initialization | postgres | local-bootstrap-only |
| Explicit migrations / local usage measurements | watchtower_migrator | local-migrator-only |
| Application / integration assertions | watchtower_app | local-app-only |
| Worker (connect only in M1) | watchtower_worker | local-worker-only |

All use database `watchtower_dev`. The migration and test runners reject remote hosts, different ports/databases/roles and URL query parameters before connecting. These safeguards are local developer protections, not a production migration mechanism. No hosted database is configured. Never reuse these credentials outside local development.

`DATABASE_URL` configures application runtime. `DATABASE_MIGRATION_URL` configures migrations/usage. `DATABASE_TEST_URL` configures the application-role integration tests. URLs follow `postgresql://ROLE:PASSWORD@127.0.0.1:55432/watchtower_dev`.

## Schema and trust boundaries

- `users`: a text identity key and creation timestamp only. Better Auth identity/account/session/verification tables must be generated from the selected configuration and reviewed in M2; this is deliberately not an invented complete auth schema.
- `workspaces`: UUID, bounded nonempty name and timestamps.
- `memberships`: composite workspace/user key, foreign keys with restrictive deletion, owner role constrained by SQL, user lookup index. Team roles and uniqueness rules for private-beta onboarding are M2 decisions enforced with the provisioning transaction.
- No monitoring, invitation, limits, incident, notification or billing tables are prematurely implemented.

The migrator owns application tables but has no superuser, role-creation or BYPASSRLS privileges. Both tenant tables use **ENABLE and FORCE RLS**, including the owner. The application role can access only tenant tables; identity storage has no runtime grants in M1. The worker can connect, but has no table/schema access until its narrow operations are designed.

RLS compares the row workspace to transaction-local `app.workspace_id`. Missing/cleared context denies reads and writes. Runtime code must first authorize the authenticated user on the server in M2, then set context with `SELECT set_config('app.workspace_id', $1, true)` inside the same transaction/connection. A caller able to issue arbitrary SQL can set this context; RLS is protection against missing query filters, not authentication or protection from a fully compromised server. Never set session-global tenant context.

`getDb()` lazily creates one pool per process, preserved across Next development module reloads (maximum five connections, five-second connection timeout, ten-second statement timeout). Import/build does not require credentials or connect. Invalid URLs are rejected without logging their value. The browser export throws before importing PostgreSQL. Idle connection errors use a fixed redacted stderr message. `closeDatabase()` releases it during shutdown. Account for all web/worker replicas when budgeting database connections. Packages export compiled ESM from `dist` with declarations.

## Migrations and recovery

1. Change `src/schema.ts`, then `pnpm db:generate`. Generation is offline and does not connect.
2. Review generated SQL and metadata. Add explicit reviewed SQL for roles/RLS; the custom `0001_tenant_rls.sql` is versioned beside the generated initial schema.
3. Before schema changes, capture a local snapshot:

```sh
docker compose exec -T postgres pg_dump -U postgres -d watchtower_dev --schema-only > /tmp/watchtower-before-migration.sql
```

4. Apply through `pnpm db:migrate`, never during web/worker startup. One connection holds an advisory lock for migration serialization. Drizzle records hashes/timestamps in its migration journal and applies pending SQL transactionally. Applied files are immutable; changes require a new forward migration.
5. Run integration checks against local PostgreSQL. They use unique fixtures and remove only their own records, without truncate/drop or recreating shared databases.

Initial bootstrap was tested against the empty dedicated database, then applied again with unchanged migration count. A schema-only initial snapshot is retained at ignored `docs/private/baseline-before-m1.sql`. It contains no row data or role passwords. For real data, schema-only snapshots are insufficient: use full backup/PITR and rehearse restore before any production release. No automatic destructive rollback script is provided. For a failed transaction, fix and retry; for a committed change, prefer a reviewed forward correction or separately authorized restore.

Role initialization only runs when the Docker volume is first created. Editing the initialization SQL does not update an existing volume; do not delete persistent data to apply a role change.

## Verification and operational measurements

`pnpm test:db` checks actual PostgreSQL runtime-role behavior: no-context deny, cross-workspace reads/updates/deletes/inserts, tenant-key reassignment, transaction context reset after commit and rollback, uniqueness, foreign keys, names, runtime privileges and idempotent migrations. Unit tests cover local-target rejection and lazy pool lifecycle. These tests are not M2 endpoint/authentication validation.

`pnpm db:usage` uses a bounded read-only transaction and emits JSON: observation time, database bytes, per-table total bytes and approximate live-row counts. PostgreSQL estimates may lag. This is measured local storage, not billable provider usage or per-monitor cost. M3–M5 add real check counts, bytes, latency, queue saturation and cost attribution once those operations exist.

M1 does not validate hosted network controls, SSRF transport, backup recovery objectives or simultaneous monitoring failures. They remain mandatory later gates in the canonical architecture.
