# Frontend implementation report — 2026-10-22

Status: implemented and locally exercised; independent review required. No commits, deployment, live provider calls or remote messages.

## Delivery

New auth routes /login, /signup, /reset-password, /verify, /invite use Better Auth email/password, configured Google/GitHub/SAML, passkey signin, TOTP/recovery challenge and email reset/verification. Invitation login preserves its return token. Split login and responsive dashboard reuse named design-system components, local typography and canonical tokens. Mock example metrics were not imported.

Dashboard includes persisted identity/workspace creation and switching, PT/EN navigation, keyboard command palette, mobile sidebar, real summary/response/state charts and empty/error states. Session lookup failures produce retry feedback instead of silently logging the user out. Membership role affects visible mutation controls; API remains authoritative.

Nine-type monitor configuration, regions/private-probe selection, create/edit/archive/pause/resume/check, history/chart and one-time heartbeat URL are wired to APIs. CSV monitor import and formula-safe CSV exports for monitor/audit/incidents are present. Resource forms cover maintenance, twelve channel types/test, alert policy, team role/removal/invite/cancel, status create/edit/publish/update/domain verification, API keys and webhooks with one-time secrets. Platform supports tenant suspension/restoration, probe draining, feature rollout and audited 15-minute support session creation. Public status supports password, components/updates and subscription confirm/unsubscribe. Settings cover profile/preferences, password/TOTP/passkeys/session revocation, phone verification, private-probe enrollment/revoke and deliberate owner deletion request. Billing supports catalog, actual subscription/usage and checkout/portal links.

## Actual validation

- `pnpm build`: passed after initial SQL trigger fix; later full build temporarily hit concurrent worker export work. Latest standalone `pnpm --filter @watchtower/web build` passed including TypeScript.
- Targeted normal ESLint and typed ESLint: passed.
- `pnpm exec playwright test --config playwright.product.config.ts`: latest run 8/8 passed, desktop and mobile, 13.828 seconds. Real PostgreSQL and local private email spool; no intercepted APIs or auth bypass.
- E2E asserts signup, emailed verification, login, workspace, monitor survives reload, pause survives reload, one-time API key disappears on reload, status page publication/public view, denied plan interval stays an error, dialog restores focus, and viewport does not overflow.
- Structural checks cover translated signup/password length, labelled credentials/reset navigation and unauthenticated dashboard redirect.
- Scoped teardown resolves the exact generated email, checks exclusive membership and deletes only its workspace/identity. Prior four fixtures were individually identified and cleaned; evidence is `browser-fixture-cleanup.json`. Current test teardown attaches exact IDs/results.

Failures found and addressed: initial monitor insert SQL failure was fixed by backend migration; excessive session polling hit authentication rate limits (foundation separated read-session quota); test navigated away before workspace POST completed (test now waits Overview). No failed request was converted into success.

## Reproduce and evidence

Run reviewed migrations on dedicated local PostgreSQL, build, then `pnpm exec playwright test --config playwright.product.config.ts`. The dedicated config owns port 3137, refuses reuse, generates a secret, creates a 0700 temporary local-mail spool and defaults to the documented local test DB. Override DATABASE_TEST_URL and DATABASE_MIGRATION_URL only with dedicated loopback test DBs. MAIL_TRANSPORT=local sends no email. Ordinary browser suite skips the authenticated test unless explicit spool config is present.

Screenshots: `test-results/product/product-auth-real-signup-v-e9dc1-nitor-persist-across-reload-desktop/monitor-persisted.png` and corresponding `-mobile/monitor-persisted.png`. They show a real persisted fixture monitor, not sample production data. Mobile image inspected for overflow and navigation. No full visual pixel-equivalence claim.

Remaining review/operational limits: no live social/SAML/passkey hardware, SMS, billing checkout, DNS, regional or notification provider verification. Global search now includes real monitor names/targets; notification center reads actual delivery records; date/time rendering applies stored timezone and date format, with two unit tests covering date boundaries and missing values. Invitation resend rotates through its explicit backend route. Billing/catalog/invoices and actual probe capabilities use labelled cards. Auth provider capabilities show explicit setup prerequisites. These final additions require the controller final build/review gate. Browser checks are not WCAG certification.

Final additions: `formatProductDate` unit tests passed 2/2; private-probe selection/enrollment, authenticated phone verification, owner deletion request, reason-labelled platform support dialog, status updates/DNS and public subscriptions are wired. Files are ready for the controller five final review cycles.

Final handoff: global monitor search, delivery notification center, timezone/date preference formatting, invitation resend, tailored billing/invoice/probe cards and provider capability hints completed. Targeted typed lint passed after these additions; final web build passed at 22:05 UTC. A later browser rerun did not start any tests because the concurrently added custom-domain proxy returned404 on the canonical loopback root, causing webServer readiness timeout. Controller notified to fix proxy, rebuild and run final gate; prior8/8 remains dated evidence, not proof for the proxy change. Diagnostic owned port3137 server stopped. No other user server was reused/stopped.

## Review cycle 1 frontend corrections

Protected API workflow edits now omit `config.steps` by default when `stepsProtected=true`. Replacement requires a labelled explicit checkbox and valid one-to-five-step JSON, with no example workflow inserted. Focused unit regressions passed2/2. Browser integration now asserts a rename PATCH omits steps and survives reload; it also repairs/disables/re-enables a real channel while preserving provider credentials. Those extended browser assertions await the controller's rebuilt test gate.

Status public rendering respects hideBranding/showResponseTime with actual nullable duration_ms. Authenticated draft preview uses scoped status-pages/:id/preview. Channels and maintenance have populated edit forms; channels expose enable/disable. Secondary workspace creation is available on desktop/mobile. Platform flags can be created and targeted by validated IDs; MRR, churn and queue cards distinguish unconfigured/history-limited values. Dashboard shows expiry observations and regional coverage denominator, explicitly labelled as a current-configuration estimate. Existing paid subscription buttons use the portal. Direct TypeScript and typed lint passed; no build was run during the controller full-check lock.

## Review cycle 4 frontend corrections

The active workspace is now a per-identity browser preference validated against the fresh authorized workspace list before use. Workspace switches clear search/notifications/errors and reject late notification responses from the prior workspace. Repeated dashboard-range selections no longer enter a loading state without a fetch. Mobile and desktop use the same error-aware sign-out path. Saved language/timezone/date format immediately update shell and presentation context. Incident rows link to timelines; revoked/expired API keys have explicit states.

Added a real browser regression that creates two workspaces, follows native sidebar navigation, reloads, verifies selected ID and actual monitor POST destination, then tests live preferences and keyboard sign-out. Exact fixture teardown handles both workspace IDs. Added authorized-selection unit regression:1PASS, including removed/foreign remembered IDs and identity-scoped storage keys. Extended browser test timeout is60seconds for its additional real flows; no mocked APIs. Direct TypeScript and typed ESLint were run; integrated browser awaits controller rebuild. No build/server was started during this correction package.
