## Full product — local implementation (2026-10-22)

The full product extends the earlier M1 foundation. Current design and execution scope: [full product design](docs/superpowers/specs/2026-10-22-full-product-design.md) and [implementation plan](docs/superpowers/plans/2026-10-22-full-product.md). Dated evidence is in [full product validation](docs/evidence/full-product/validation.md).

```sh
pnpm install --frozen-lockfile
pnpm setup:product
pnpm db:up
pnpm db:migrate
pnpm dev:product
# Separate terminal, when ready to execute configured monitors:
pnpm dev:monitoring
```

Open http://127.0.0.1:3000/login. Create an account; local verification/reset messages are private JSON files under `.local/mail` (open the verification URL from the file). Local mail is restricted to a loopback application URL and sends nothing externally. No default user or administrator is created. `setup:product` fills missing local configuration, preserves existing values and creates private random secrets. Back up the encryption key: rotating it requires re-encrypting saved integration/API-step secrets.

The worker is a separate opt-in process. Regional workers advertise their configured region; only actual registered probes appear as available. Private probes require one-time workspace enrollment and an explicit network allowlist. OAuth/SAML/passkeys, billing and notification providers require operator configuration and provider-level testing; no accounts, DNS, payments or deployments are provisioned by these commands.

Quality gates: `pnpm check`, `pnpm test:db`, `pnpm test:browser`, `pnpm test:product`, `pnpm test:design-system`, and `node --test scripts/setup-product-local.test.mjs`. Browser suites own dedicated ports and must run sequentially. Production build precedes production browser tests.

Platform administration uses a verified MFA-enabled existing identity and the local-only `packages/database/src/bootstrap-admin-cli.ts` procedure; there is no email/domain auto-elevation. SAML provisioning is operator-only through `packages/database/src/provision-sso-cli.ts` with domain proof. See the foundation report for exact operator prerequisites.

The earlier foundation documentation below remains historical context, not a claim that authentication/monitoring is still absent.

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
- [Design system contract](DESIGN.md), [component selection](design-system/README.md).
- [Onboarding](docs/onboarding.md), [database](docs/database.md), [quality](docs/quality.md).
- [Setup and evidence](docs/setup.md), [M1 execution plan](docs/superpowers/plans/2026-10-21-m1-bootstrap.md).

Do not proceed to M2 without explicit user approval. No deployment, external service or production database is configured.
