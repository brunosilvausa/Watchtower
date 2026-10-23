# Review 2 checkout lifecycle remediation

2026-10-22, local implementation. No Stripe account requests or real charges were made. Database tests intercept the provider HTTP boundary and use dedicated PostgreSQL fixtures.

Migration `0018_checkout_intents` persists one workspace-scoped generation, plan, idempotency key, complete encoded request and exact expiry under FORCE RLS. The owner authorization/workspace lock commits before Stripe is called. Uncertain network responses retain that generation and request; retries cannot change price, customer, expiry or key even when server configuration changes. Same-plan pending checkouts reuse their session; competing plans are rejected. Elapsed local time does not authorize replacement: Stripe must confirm the previous session is expired. Completed checkouts remain blocked awaiting their signed subscription webhook. Every transition checks for nonterminal existing subscriptions. A completed session belonging to the exact known terminal subscription can be replaced safely.

`handleWorkspaceRequest` dispatches POST checkout before its generic transaction; provider calls therefore do not hold workspace locks. The existing billing read/portal paths are unchanged. Checkout requires POST and server-owned plan/price mapping.

Migration `0022_checkout_closure` records confirmed closure. Deliberate workspace deletion first validates the recent owner session, exact workspace name and subscription status, then reconciles/cancels its unpaid checkout outside the database transaction. An open session is expired using a generation-specific idempotency key. Completed but unconfirmed payment blocks deletion. Only an expired session or a completed session attached to the exact known terminal subscription is marked closed. Final deletion locks and revalidates both actor and closure, so a concurrent new checkout prevents suspension. Explicit new checkout clears closure. This avoids both orphan payable sessions and permanent deletion lockout from old expired sessions.

## Regression evidence

`tests/billing-checkout.integration.test.ts` has 13 passing PostgreSQL/provider-fixture cases: same-plan reuse; concurrent identical requests; concurrent competing plans; lost-response retry preserving body/key/expiry across config changes; local-expiry/provider-open denial; provider-confirmed replacement; completed/delayed webhook denial; nonterminal subscription guard; unauthorized actor rejection; persisted completed response; deletion cancellation; delayed payment deletion denial; terminal-subscription deletion and repurchase. Several related assertions share one test case. Single-request provider fixtures acquire the workspace row lock from a second connection using NOWAIT, proving the service releases it before network I/O. Concurrent tests separately verify one logical provider session and do not confuse another legitimate caller's short transaction with the caller under test.

Focused checkout suite passed 13/13 before the final terminal-subscription cache refinement; final full database suite and typed lint/build are recorded by the controller or follow-up below. A previous full database run passed 50/50 before deletion cases were added.

## Source and limits

Reviewed Stripe's [Checkout Session creation](https://docs.stripe.com/api/checkout/sessions/create) and [session expiration](https://docs.stripe.com/api/checkout/sessions/expire) API contracts. The implementation supplies a fixed one-hour expiration and replaces a generation only after provider-confirmed non-payability. Unknown provider state fails closed; it is never converted into a new checkout automatically. If an old lost response can no longer be recovered by Stripe's idempotency retention, an operator must reconcile it instead of assuming no payment exists. Real Stripe checkout, cancellation, payment and webhook delivery remain unverified.

Final follow-up at 18:25 America/New_York: database build PASS; focused typed ESLint PASS; full `pnpm test:db` PASS **8 files / 58 tests**, including all 13 checkout regressions after the terminal-subscription refinement. No Next build was run by this worker.
