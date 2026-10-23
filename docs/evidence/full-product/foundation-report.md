# Identity and persistence foundation

Implemented locally on 2026-10-22; no publication, remote provisioning or real messages.

## Contracts

`@watchtower/database` exports `Actor`, `WorkspaceRole`, `Permission`, `AccessError(status,message)`, `getProductPool()`, `hasPermission(role,permission)`, `requireWorkspace(actor,id,permission,pool?)`, `withWorkspace(actor,id,permission,async(client,role)=>value,pool?)`, `listWorkspaces(actor,pool?)`, `createWorkspace(actor,name,pool?)`.

`withWorkspace` checks membership/suspension under a workspace row lock before setting transaction-local RLS context; lock remains until commit. Quota and role updates must use this transaction. Never use caller-supplied actor fields without `requireActor` from `apps/web/src/lib/access.ts`. Platform authorization additionally requires `platformAdmin && mfaVerified`; MFA proof is session-specific and written only following successful TOTP/recovery verification. MFA enabled alone is insufficient.

`apps/web/src/lib/auth.ts` exports `auth`; `auth-client.ts` exports `authClient` with TOTP, passkey and SSO clients. Catch-all `/api/auth/*` uses Better Auth Next adapter. Auth uses separate tables, verified-email/password (10 minimum), 30-day remember sessions, 30-minute resets with session revocation, database rate limits and configured Google/GitHub. No cookie cache.

Migration 0002 supplies normalized product tables; inspect SQL for exact columns. Migration 0003 supplies installed plugin schemas plus `accept_invitation(hash,actor)->uuid`, single-use verified-email matching under workspace lock. 0005 adds session MFA proof and Enterprise SCIM projection (active viewer membership, inactive session revoke/nonowner membership removal). Worker has no auth-table grants.

SCIM credentials are configured explicitly with `SCIM_WORKSPACE_ID` and `SCIM_BEARER_TOKEN`; the workspace must be Enterprise. SSO public provider registration is disabled; an authorized provisioning control must create verified provider records before SAML can be activated. Passkey browser/device enrollment and real IdP integrations remain unverified.

## Email configuration

Production transport needs `RESEND_API_KEY` and `EMAIL_FROM`. Missing configuration throws explicit unavailable error. Local transport requires `MAIL_TRANSPORT=local`, loopback `BETTER_AUTH_URL`, and absolute `AUTH_MAIL_DIRECTORY` with directory permissions 0700. Files contain verification/reset URLs and are created 0600 with exclusive creation. They are sensitive local test artifacts, not delivered mail. No environment defaults bypass verification.

## Evidence

- `pnpm test:db`: 3 files, 9 tests PASS. Real local PostgreSQL, existing RLS tests plus membership/suspension/one-consumer invite and Better Auth signup/verify/login/reset/session/TOTP tests.
- Auth tests replace only outgoing mail fetch with a local response; credentials, password hashing, token verification, session persistence and MFA run through installed Better Auth against PostgreSQL.
- `pnpm exec vitest run packages/database/src/product.test.ts`: 3 permission tests PASS.
- Focused ESLint passed before final MFA/mail additions; overall checks owned by controller.
- Web typecheck found only concurrent frontend WIP errors at that time; not recorded as global PASS.

Remaining checks: real passkey authenticator, OAuth/SAML IdP, SCIM client and outbound mail provider. No claim of hosted identity readiness.

## Follow-up public and administrative controls

Final local foundation evidence at 18:03 America/New_York: `pnpm test:db` passed 6 files / 35 tests across the combined implementation. Foundation coverage includes real SCIM HTTP bearer provisioning/deactivation projected transactionally into an Enterprise viewer membership; rejected unauthenticated SCIM; per-session TOTP proof; SMS HMAC expiry/attempt controls; password-protected public pages; subscriber verification/replay/unsubscribe and encrypted durable messages; real view counts; support MFA/expiry/read-only/audit; deletion confirmation/recent login/cancel and isolated 30-day purge preserving global identity. Database build and web typecheck passed before the final SCIM-only test addition. Permission and SAML input validation unit suites passed 5 tests.

Public exports in `product-public.ts`: `consumeRateLimit(key,maximum,windowSeconds,pool?)`, `handlePublicStatus(slug,{action,password?,email?,token?},pool?)`, `resolveStatusDomain(hostname,pool?)`, `statusDomain(actor,workspaceId,pageId,action,pool?)`, `publishStatusUpdate(actor,workspaceId,pageId,input,pool?)`, `deleteWorkspace(actor,workspaceId,confirmation,pool?)`.

Lifecycle exports: `requestPhoneVerification(actor,workspaceId,phone,pool?)`, `verifyPhone(actor,code,pool?)`, `cancelWorkspaceDeletion(actor,workspaceId,pool?)`, `purgeDeletedWorkspaces(pool,workspaceId?)`. Omit workspaceId only in the authorized worker sweep; tests pass their own target explicitly. Paid active subscriptions must be canceled before deletion; deletion immediately suspends access and queues retention for 30 days, cancellation restores only monitors that were active before the request, and the worker removes expired requested tenants. Authentication identities remain global and are not deleted with a workspace.

`startSupportSession(actor,workspaceId,reason,durationMinutes,pool?)` permits 1–30 minutes following real recent MFA. Support is explicitly read-only, workspace-scoped and audited under the actual administrator ID; it does not impersonate another identity or acquire mutation permissions.

Routes added: `/api/auth-capabilities`, `/api/settings/phone` (POST request/PATCH verify), `/api/status/[slug]` (GET/read or POST/password), `/subscribe`, `/verify`, `/unsubscribe`, `/api/status/domain?hostname=...`, `/api/workspaces/[workspaceId]/status-domain`, `/status-updates`, and `/api/workspaces/[workspaceId]` (DELETE confirmed request/POST cancel). All mutating browser routes require the expected Origin except public status password read. All responses use `{data}` or the shared sanitized `{error}` shape.

### Operator commands and prerequisites

Run these only when intentionally administering the dedicated local database, from `packages/database` with the repository environment file:

- `node --env-file=../../.env --import tsx src/bootstrap-admin-cli.ts existing@example.com --confirm-local-admin`: requires an existing verified identity with enrolled verified TOTP; creates no account or credentials.
- `node --env-file=../../.env --import tsx src/provision-sso-cli.ts /absolute/provider.json --confirm-local-sso`: configuration fields are `providerId`, `domain`, `ownerEmail`, `issuer`, `entryPoint` (HTTPS), `idpEntityId`, `certificate` (valid PEM certificate). Requires TXT `_watchtower-sso.<domain>` equal to `watchtower-sso-verification=<providerId>` and an existing verified MFA platform-admin owner. Public SSO registration/update/delete endpoints are disabled; changes go through this checked operator path.
- Phone verification requires `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`, and `PRODUCT_ENCRYPTION_KEY`. Unconfigured returns 503, configured requests enter the durable encrypted SMS queue. Tests use fake credentials and inspect only local encrypted outbox rows; no SMS was sent.
- Public subscription links require `BETTER_AUTH_URL` and `PRODUCT_ENCRYPTION_KEY`; production delivery additionally needs the worker email provider settings. Domain verification resolves a real TXT challenge; verification alone does not provision hosting, TLS or DNS routing.

SAML validation tests cover rejected remote administrator targets/invalid configuration before DNS or database access. No live SAML/OAuth login, real passkey authenticator, Twilio/Resend delivery, hosted custom-domain routing or actual IdP client was exercised. SCIM HTTP behavior was exercised locally with a configured test bearer token and Enterprise test workspace.
