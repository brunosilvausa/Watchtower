# Watchtower agent instructions

## Scope and source of truth

Read `docs/superpowers/specs/2026-10-21-watchtower-private-beta-design.md` first for architecture. Then read `docs/architecture.md` for actual code and `docs/setup.md` for dated evidence. M1 only is authorized. Do not implement M2–M6, deploy, send emails, purchase services or mutate remote systems without explicit authorization. Installing tools is not publication permission.

## Environment preferences

- Ponytail full: smallest complete change; preserve validation, security, accessibility and requested scope.
- Caveman: concise Portuguese conversation; normal code, documentation, commits and PRs. Explain fully when requested.
- Context7: resolve/query current APIs when relevant; no secrets or private code in queries.
- RTK native hook handles supported commands. Never double-wrap `rtk`; use `rtk bypass` only for unusable condensed output. Do not enable inference proxies. Machine guidance: `@/Users/brunosilva/.codex/RTK.md` (not a portable dependency).
- Graphify code extraction may run locally. Semantic extraction must use the native session client, exact model and authentication. No alternative APIs/providers, proxies or added billing. Standalone CLI does not inherit ChatGPT login.
- Preserve project instructions, existing files, user sessions and other projects' containers. No global installations or hooks as a setup side effect.

## Commands and boundaries

- `pnpm check`: lint, types, typed lint, lint-rule self-check, unit tests, builds and worker smoke. No DB connection or migrations.
- `pnpm db:up`, `pnpm db:migrate`, `pnpm test:db`, `pnpm db:usage`, `pnpm db:stop`: dedicated local PostgreSQL only. No volume deletion.
- `pnpm test:browser`: production build smoke on dedicated port 3137. Do not reuse another running server.
- `pnpm db:generate`: offline SQL generation; review SQL before applying. Never run migration from request handling, imports or builds.
- Use `pnpm install --frozen-lockfile` for reproduction. Dependency additions must be pinned; no force/legacy-peer flags.

## Code conventions

Strict TypeScript. Node ESM packages under `packages`, executables under `apps`. Web uses `@/*`; packages use their named exports. No direct DB access in presentation. Server-only boundaries and scoped PostgreSQL roles are mandatory. Validate configuration without echoing values. Logs use structured fields and omit credentials; free-form messages must never contain secrets.

RLS workspace context is not authentication. M2 must authorize user membership before setting transaction-local context. No claim of tenant API security until those APIs exist and are tested.

## Workflow and context retention

Use Superpowers proportionally; existing explicit execution authority overrides repeated approval gates. No default worktree/branch requirements, Git hooks or forced commits. Independent review/delegation is permitted when a selected skill requires it; keep one writer per file and use the session model/authentication. Do not invent model names when the host exposes only inheritance.

Portable context is this index into canonical docs, not copied personal memory. Re-read current code/checks after resumption. Evidence is dated in `docs/setup.md`; invalidate relevant results after dependency, schema, config, host or instruction changes. Never promote local tests into hosted, security or commercial proof.

Project skills are under `.agents/skills`; installation is not client execution. `find-skills` is reused globally. `next-dev-loop` is unavailable until its required agent-browser exists; Playwright evidence is reported separately. Deployment skills are inactive for M1.
