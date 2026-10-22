# Watchtower

Your systems. One command center.

Private-beta SaaS foundation. **Current implementation: M1 only.** The local web page is a static introduction; the worker reports its own process resources. Authentication, invitations, monitoring, incidents and notifications are not implemented or activated.

## Local development

Requirements: Node 24.22.0, pnpm 12.11.2 and Docker Compose. Versions are pinned; use the existing runtime or your normal version manager.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm db:up
pnpm db:migrate
pnpm dev
```

Open http://127.0.0.1:3000. In a separate terminal, run `pnpm dev:worker`. Shared packages compile before either command; restart these commands after editing shared package source.

```sh
pnpm check
pnpm test:db
pnpm test:browser
pnpm db:usage
pnpm db:stop
```

`check` does not connect to PostgreSQL or migrate. `test:db` uses the dedicated local database and removes only its own synthetic fixtures. `test:browser` requires the completed build and Playwright Chromium, and owns port 3137. The database volume persists after stop. Never reuse the example credentials outside local development.

## Project map

| Path | Responsibility |
|---|---|
| `apps/web` | Next.js application, Tailwind/shadcn configuration, static beta introduction |
| `apps/worker` | Separate Node executable; process lifecycle and metrics only |
| `packages/runtime` | Safe environment validation, redacted logging, process measurements |
| `packages/database` | Lazy pool, initial tenancy schema, SQL migrations, database checks |
| `infra/postgres` | Local database role initialization |
| `scripts`, `tests` | Quality self-check, worker and browser smoke checks |

## Canonical references

- [Approved architecture and roadmap](docs/superpowers/specs/2026-10-21-watchtower-private-beta-design.md): primary product reference; includes M1 authorization and the three added requirements.
- [Product](PRODUCT.md), [implemented architecture](docs/architecture.md), [design](docs/design.md).
- [Onboarding](docs/onboarding.md), [database](docs/database.md), [quality](docs/quality.md).
- [Setup and evidence](docs/setup.md), [M1 execution plan](docs/superpowers/plans/2026-10-21-m1-bootstrap.md).

Do not proceed to M2 without explicit user approval. No deployment, external service or production database is configured.
