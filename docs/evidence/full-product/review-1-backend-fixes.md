# Review 1 backend remediation

2026-10-22. Applied new migrations0017_review_one_reporting and0019_reporting_cohort; no applied migration edited.

- Finding3: public status components now return actual latest duration_ms/observed_at; showResponseTime=false suppresses duration in the read DTO. Frontend owns hideBranding/render changes.
- Finding4: unresolved incidents count independent of selected time range; MTTR uses worker's observed_recovery resolution and resolved_at range.
- Finding6: fresh feature flag upsert supports workspaceIds, validates keys/rollout/booleans/UUIDs/existing tenant targets; old implementation entry points revoked from app role.
- Finding7: platform MRR uses persisted provider monthly amounts, separates currencies and excludes nonactive subscriptions. Known currencies with no active paid contracts return observed zero; unknown financial fields remain partial/unconfigured. Queue state counts and oldest pending time come from persisted outbox. Churn captures subscription state history, uses the active-at-start cohort and current cancellation state, excludes new subscribers and reactivations; until30days of history exists, rate/denominator/cancelled are null with insufficient_history.
- Finding8: dashboard returns latest observed TLS/domain expiry, actual regional results, requested-but-unobserved regions, and observed/expected coverage denominator. Historical interval/pause changes were not versioned; coverageBasis is explicitly current_configuration_estimate, with maintenance observation slots excluded and repeated checks in one schedule bucket deduplicated. Current registered capabilities remain a separate field.

Validation: reporting.integration.test.ts5/5 PASS18:19:07. Tests cover old ongoing incident, 100% observed-sample uptime alongside<1% coverage, missing region zero observations, real expiry, response-time setting, grouped currency amounts, queue count, history-unavailable churn, validated targeting, start-cohort exclusion and reactivation. Database typecheck and focused normal/typed lint passed before final cohort extension; controller regression remains required.

No provider billing or external regional observations were generated; all fixture rows are test-owned and cleaned.
