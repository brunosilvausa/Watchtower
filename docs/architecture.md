# Implemented architecture — M1

The [approved design](superpowers/specs/2026-10-21-watchtower-private-beta-design.md) remains the primary architectural reference. This file records only the implemented foundation.

pnpm monorepo: `apps/web` (Next.js/React), `apps/worker` (Node TypeScript), `packages/runtime` (logging/configuration/resource metrics), `packages/database` (PostgreSQL/Drizzle). Workspace exports point to compiled ESM and declarations. Runtime/database have browser-rejection entry points; web instrumentation additionally uses `server-only`.

The web route is static, with no forms or authentication routes. Better Auth is pinned but not initialized. Tailwind and shadcn tokens/configuration are initialized; the unused generated button and its dependencies were removed. System fonts keep builds independent of a font network request.

The worker starts, emits structured resource samples every 60 seconds and stops on SIGTERM/SIGINT. It does not connect to the database, claim jobs, probe endpoints or send emails. No pretend monitoring data is displayed.

Database storage is minimal: identity key, workspaces and memberships. Generated SQL and explicit RLS migration are separate and immutable after application. See [database](database.md) for roles, local-target checks and tested invariants. The full Better Auth schema is deliberately deferred to the selected M2 configuration.

`check` stays offline with respect to external services and the database. Explicit database commands are constrained to the dedicated loopback development target. The Compose volume persists; unrelated projects remain untouched.

CPU counters, RSS and uptime are sampled in both processes. Database usage command reports actual bytes and approximate rows. These measurements neither estimate paid-provider charges nor imply check-volume metrics. Later metric contracts and deployment/load gates are in the approved design addendum.
