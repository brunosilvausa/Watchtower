# Continuous integration

The `CI` workflow runs on pull requests targeting `main` and pushes to `main`. It has read-only repository permissions, no repository secrets, no deployment steps and no provider configuration. Actions are pinned to immutable upstream SHAs. Node is pinned by `.node-version` (24.22.0); pnpm is pinned to12.11.2 with `pnpm install --frozen-lockfile`.

## Jobs

| Job | Checks | Isolation |
| --- | --- | --- |
| Quality and production build | CI report privacy/local-setup self-checks, `pnpm check` | Fresh Ubuntu24.04 runner; no database configuration |
| PostgreSQL and production browsers | Fresh role bootstrap, migrations, `pnpm test:db`, production web build, `pnpm test:browser`, `pnpm test:product` | Job-owned pinned PostgreSQL18.3 Docker Compose service bound to loopback55432; random ephemeral authentication/encryption configuration and private local mail; dedicated production browser port3137 |
| Development showcase browsers | Package build, `pnpm test:design-system` | Separate fresh runner, no database/provider configuration; development server on3138 |

The production browser suites run sequentially so each exclusively owns port3137. The showcase is tested independently; production tests still assert that `/design-system` and reference archives are unavailable publicly. Workers remain disabled except the credential-free startup smoke in `pnpm check`. Provider requests in integration tests use controlled transports.

Only the integration job runs `pnpm setup:product`; it never uses a developer's environment or account. Its database is stopped even after a failed test and the hosted runner is disposable. Browser fixture cleanup remains part of the product suite. No container or volume on a developer's computer is removed by CI.

## Failure artifacts

Failed jobs upload `ci-reports/summary.json` for seven days. It contains allowlisted step outcomes and, when Playwright produced a report, test file/line, project, outcome and attempt statuses. Missing raw reports are counted rather than treated as passing. Open the failed job's step logs for build, lint or database error details.

The report projection deliberately excludes test titles, error messages, snippets, environment/configuration, attachments, screenshots and traces. Full browser reports are temporarily written under the hosted runner's temporary directory and never uploaded. Neither `.env`, `.local`, database contents nor authentication mail/session payloads are artifacts. A self-check injects a sensitive marker into excluded report fields and proves it cannot reach the artifact.

## Local reproduction

Use the existing commands in `package.json`; PostgreSQL commands are only for the dedicated local database documented in setup. Keep the showcase separate from an existing Next development server. To validate the report projection, run `node --test scripts/ci-report.test.mjs`. Workflow syntax is checked with actionlint before publication.

This workflow provides automated code and local integration evidence on GitHub-hosted Linux. It does not establish hosted application readiness, external provider delivery, real geographic probes or production network isolation. Repository protections and deployment configuration are outside this change.
