# Independent code review — cycle 3

Date: 2026-10-22. Scope: PostgreSQL scheduling, lease fencing, monitor lifecycle, durable notification dispatch and private-probe registration. Reviewed current source through migrations 0019; 0018/0019 were concurrent work and not treated as final validation. No application files or migrations edited by this reviewer.

## Findings requiring correction

1. **P1 — Invitation emails never leave the queue.** `packages/database/src/product-team.ts:58` inserts `event='invitation'` with no alert channel. The current `worker_claim_deliveries` system-message allowlist in `packages/database/migrations/0016_worker_final_delivery.sql:85` excludes this event. Create/resend returns `delivery:'queued'`, but no worker can claim it. Extend the shared dispatcher and test the complete persisted invitation-to-worker mapping, including encrypted message hydration. Cancelled/resend-old invitations must not retain deliverable jobs.

2. **P2 — Opposite row-lock order deadlocks check-now against completion.** `product-monitors.ts:23,36` acquires monitor then schedule (inside `request_monitor_check`). `0016_worker_final_delivery.sql:40-42` acquires schedule then monitor. Interleaving the two makes one transaction abort, losing a valid observation or failing the user action. Standardize lock ordering; test with separate PostgreSQL connections and observed blocking rather than Promise.all alone.

3. **P1 — Paused or archived monitors keep sending incident reminders.** The pause/archive branches in `product-monitors.ts:25-44` leave open incidents and queued notifications. `0016_worker_final_delivery.sql:83,85` checks maintenance but does not exclude stopped/archived monitors. Once an incident exists, reminders can continue indefinitely after deletion, with no new probe able to recover it. Explicitly terminate/suppress incident notification state for these transitions and guard worker claiming. Regression: open incident, queue escalation/reminder, pause/archive, then claim; no incident alert may be returned and no future reminder generated. Configuration-change termination must distinguish administrative closure from observed recovery.

4. **P2 — Private-probe names are discarded by a later migration.** `0013_worker_maintenance.sql` added `probes.name` and persisted enrollment names; `0015_scoped_deletion_purge.sql` replaces `manage_private_probe` but its INSERT omits name. The UI submits a name and subsequent list returns null. Preserve the already-supported field in the latest function and test enrollment/list round trip.

## Inspection notes

- Completion validates lease token, configuration version, monitor lifecycle and lease expiry. Regional schedule state is versioned and tenant RLS remains enabled/forced.
- Final-attempt expired delivery leases are terminalized by the 0016 dispatcher.
- Scoped deletion locks the workspace and skips active paid subscriptions; no destructive execution was performed for this review.
- No fresh database tests were run by this reviewer; findings above are traced from actual callers and latest function definitions. Root/probe owners were informed while reviewing and are implementing corrections. This report does not claim post-fix PASS.
