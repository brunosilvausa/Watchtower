# Final independent code review — cycle 5

Date: 2026-10-22. **Source review closed: no remaining concrete P1/P2 finding established in this pass.** Final integrated checks and browser execution remain the controller's separate release gate. This statement is not a claim that those checks have already passed.

Independent read-only review of current implementation after cycles 1–4, including migrations through 0022 and the current frontend workspace/range/mobile remedies. Read the prior independent findings and remediation reports; traced their current callers, service boundaries, SQL implementations and regression cases. No application edits, provider calls, builds, migrations or additional agents were performed. Only this report was written.

## Closure matrix

| Prior finding | Current source disposition | Regression evidence required in final controller run |
|---|---|---|
| 1.1 Protected API workflow overwritten on rename | Explicit `monitorStepsPatch` omission preserves encrypted stored steps; backend hydrates them for validation and compares decrypted configuration before deciding whether to reset state. | Protected edit/helper and persisted monitor regressions. |
| 1.2 Heartbeat conversion unusable | Transition into heartbeat generates and returns a new one-time token; leaving heartbeat clears the stored hash. | Monitor conversion regression. |
| 1.3 Public response time/branding ignored | Current public DTO and `status-view` honor both flags; branding suppression is conditional on saved config. | Reporting and public-page/browser checks. |
| 1.4 Old unresolved incidents absent | Open incident count is independent of selected observation window; MTTR uses observed recovery. | Reporting regression with old ongoing incident. |
| 1.5 Channels cannot be repaired | Editor and enable controls exist; blank submitted secret preserves stored credentials. | Resource/editor regressions. |
| 1.6 Feature creation/targeting absent | Platform creation and validated workspace targeting now have service/SQL/UI paths. | Reporting/platform authorization tests. |
| 1.7 Platform metrics absent | Provider-derived amounts grouped by currency, persisted queue counts and explicit insufficient-history churn are implemented. | Reporting tests; no inference of live revenue. |
| 1.8 Expiry/coverage absent | Observed expiry/region and expected-slot estimates are displayed separately from registered capabilities. | Reporting tests; current-configuration estimate remains explicitly limited. |
| 2.1 Duplicate payable checkouts | Exact provider body and idempotency generation are committed before network I/O; competing live plans are rejected; same-plan requests share generation; provider-confirmed expiry is required before replacement. Existing nonterminal subscriptions prevent creation/reuse. | `billing-checkout.integration.test.ts`, including concurrent requests and lost responses. |
| 2.2 Unbounded webhook body | Shared streamed reader enforces 64 KiB, cancels overflow and releases the reader before signature processing. | Bounded-body/exact-byte unit regressions. |
| 3.1 Invitations stuck in outbox | Latest worker allowlist includes invitations; current invitation state gates claims; resend/cancel invalidates obsolete jobs. | Persisted invitation hydration/claim/cancel regression. |
| 3.2 Check-now/completion lock inversion | Both latest SQL paths lock monitor before regional schedule. | Separate-connection observed-blocking regression. |
| 3.3 Stopped monitor reminders continue | Pause/archive/config changes administratively resolve incidents and cancel pending/retry jobs. Latest claimant independently cancels stopped jobs and excludes stopped monitors from reminders/selection. Closure is not labeled observed recovery. | Lifecycle and worker suppression regressions. |
| 3.4 Private probe name lost | Latest enrollment SQL persists the submitted name. | Enrollment/list round trip. |
| 4.1 Workspace changes on navigation | Per-identity remembered selection is validated against freshly authorized workspaces; switch clears workspace-specific data; late notification responses check selected workspace. | Real two-workspace navigation/reload and request-destination browser assertions. |
| 4.2 Repeated range remains loading | Same selected range returns before setting loading. | Repeated active-period browser assertion. |
| 4.3 Mobile sign-out absent | Mobile navigation now includes shared sign-out action, failure handling and login redirect. | Mobile keyboard sign-out regression. |

## Additional final contract checks

- Public API exposes only monitors/incidents/maintenance, derives required scope from method/resource, then delegates to current membership and role authorization before scoped operations. A retained key does not bypass membership revocation or workspace suspension.
- Checkout deletion reconciles the exact persisted session with the provider, explicitly expires an open session, rejects completed sessions awaiting a subscription webhook, and checks the checkout generation/closed state again inside the final workspace transaction. Reauthentication and exact-name confirmation happen before provider cancellation. A terminal subscription can be repurchased only after its old completed session is reconciled. Provider failure leaves the intent pending rather than silently permitting another payable session.
- Pending/retry jobs already handed to a provider cannot be unsent by a subsequent pause; the implemented guarantee is cancellation/suppression of claimable jobs and future reminders. No source-only review can prove remote delivery cancellation.
- A completed Checkout URL cached before webhook arrival may be returned again while locally unexpired; it refers to the same provider session, so it does not mint another payable subscription. The provider controls that session's completed state.

## Precise limits

This pass inspected source and test cases, but deliberately did not rerun tests while the controller owned final global validation. The final validation report must contain actual current-run outcomes; failed checks would reopen this closure. No full formal proof, hosted load/egress test, real Stripe charge, external notification delivery, OAuth/SAML/SCIM interoperability, physical passkey/screen-reader session, remote geographic execution or restore drill was performed. Existing adapters and local controlled-provider tests must not be represented as evidence of those external operations.

Controller update received after source review: current `pnpm check` passed with 115 unit tests plus lint/types/build/worker smoke (`check.log`); foundation reported 58 database tests passed, with controller's independent database rerun and extended product browser run still underway. These are attributed controller results, not reruns by this reviewer. Final `validation.md` supersedes this in-progress execution snapshot.

### Same-cycle visual correction follow-up

Inspected the final CSS-only change `.table td > .row { flex-wrap: nowrap }` in `product.module.css`. It is scoped to action groups inside table cells; the shared wrapping layout elsewhere remains unchanged. The existing table wrapper retains `overflow:auto`, `max-width:100%`, its accessible region label and `tabIndex={0}`, so compact action rows can scroll horizontally without removing controls or keyboard access. No new source-level blocker found. Controller owns the affected rebuild/browser rerun and visual verification; this assessment does not substitute for the screenshot check. Before this CSS edit the controller reported 115 unit, 58 database, 8 product-browser, 10 landing-browser and 3 design-system checks passed.
