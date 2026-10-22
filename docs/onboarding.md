# Development onboarding

1. Use Node 24.22.0 and pnpm 12.11.2. Run `pnpm install --frozen-lockfile` in the repository root. No global installer is part of setup.
2. Copy `.env.example` to `.env` only if `.env` does not exist. Example values are public local credentials, not production secrets.
3. Start Docker, then `pnpm db:up`. This starts only the Watchtower Compose service on loopback port 55432.
4. Run `pnpm db:migrate`, then `pnpm test:db`. These are explicit, local-only operations.
5. Run `pnpm dev` for the web app. Run `pnpm dev:worker` in another terminal for the worker skeleton.
6. After changes, run `pnpm check`; for DB changes also `pnpm db:generate`, review SQL, migrate and run `pnpm test:db`.
7. For browser checks, run `pnpm exec playwright install chromium` if the pinned browser is absent, then `pnpm test:browser` after a build. This installs a test browser, not agent-browser.
8. Stop web/worker with Ctrl+C, and run `pnpm db:stop`. Preserve the named database volume.

Shared packages compile on dev startup; restart dev commands after editing their source. `LOG_LEVEL` may be supplied through the shell. M1 web/worker do not need database configuration; database scripts load the ignored root `.env` explicitly.

Database role initialization occurs only when the dedicated volume is first created. Never delete data to apply a role change. See [database](database.md) for reviewed forward migrations and backup limitations.

Remote service credentials are unnecessary for M1. There is no deploy command, billing configuration or email sender. The next authorized task remains approval for M2, not automatic continuation.
