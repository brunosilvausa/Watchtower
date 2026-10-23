# Final review cycle 2 — security, identity and provider boundaries

Date: 2026-10-22. Independent source review; **CHANGES REQUIRED pending checkout lifecycle regression**. No application code modified by this reviewer.

## Findings

1. **P1 — Multiple payable Checkout sessions can create duplicate subscriptions for one workspace.** `packages/database/src/product-billing.ts:35–49` originally accepted checkout for already subscribed tenants. The controller added the nonterminal-subscription guard during review; the remaining reproducible case is a Free workspace requesting Solo and Team before either webhook arrives. The idempotency key includes plan and clock hour, so Stripe receives two different session creations. Both URLs can be paid. `packages/database/migrations/0014_product_metrics_billing.sql:9` rejects the second active subscription, leaving an additional provider charge with no corresponding application entitlement. A new same-plan session after an hour has the same problem. Persist a workspace checkout intent/session and its expiry, reuse the one existing payable session, and reject competing plans while it remains payable. Recovery after network uncertainty must reuse the persisted idempotency identity. Validate two-plan requests, expired sessions, retry after lost provider response, and delayed subscription webhooks with a fake provider; no real payments are needed.

2. **P2 — Unauthenticated webhook request could buffer an unbounded chunked body.** Original `apps/web/src/app/api/billing/webhook/route.ts:7` called `request.text()` before measuring body size or validating the signature. Omitting Content-Length allowed arbitrary memory allocation before rejection. The controller replaced it with shared `requestText()` during this review and reports exact-byte and overflow-cancellation regressions. Source now uses the bounded reader; final controller regression evidence must confirm closure.

## Checks and observations

Ran `pnpm exec vitest run packages/database/src/product.test.ts packages/runtime/src/probes/network.test.ts packages/runtime/src/providers.test.ts apps/web/src/lib/auth.test.ts`: **38 passed, 0 failed**. Parsed `.vitest/json/output.json` to confirm the result because RTK suppressed the human reporter. These tests precede final controller fixes and do not alone close the findings above.

Reviewed authenticated session construction, per-session MFA elevation, platform/support guards, workspace membership authorization before RLS context, current-role API-key authorization, invitation ownership restrictions, private-agent capability boundaries, public status password/domain checks, notification redaction, safe outbound HTTP pinning and Stripe signature verification. No additional concrete exploitable bypass was established within this pass. Signature verification uses HMAC with timing-safe comparison and timestamp tolerance; provider POST redirects are rejected and destinations resolve through the public-address policy.

This is not a blanket security certification. Hosted egress, real OAuth/SAML/SCIM identity-provider interoperability, hardware passkeys, real Stripe charges and actual notification delivery were not exercised. Review 3 should independently examine transactional/concurrency behavior after the billing correction.
