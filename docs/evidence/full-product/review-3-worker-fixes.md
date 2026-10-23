# Review 3 worker remediation

2026-10-22. Applied0020_worker_review_three and0021_check_now_lock_order; earlier migrations unchanged.

1. Invitation events now enter the system-email dispatcher, decrypt encrypted message, and remain subject to current invitation acceptance/cancellation/expiry. Root's resend/cancel changes terminalize obsolete invitation jobs. Regression creates invitation through teamRequest, claims decoded email from PostgreSQL, resends/cancels, and verifies stale jobs cannot be claimed. Transactional system messages are no longer blocked by incident quiet periods.
2. Check completion acquires monitor then region-schedule locks; request_monitor_check itself now guarantees the same order even without an already-locked caller. Regression holds monitor from one connection, observes the second connection blocked via pg_blocking_pids, acquires the schedule with check-now, commits, and verifies successful completion. No Promise.all-only concurrency claim.
3. Claiming cancels pending incident jobs for paused/archived monitors or administratively resolved incidents. Reminder generation and delivery selection independently require an active monitor. Recovery jobs remain eligible only for active monitors. Root owns lifecycle closure/cancellation in monitor mutations. Regression directly stops a monitor with an existing incident/job and verifies no delivery plus MONITOR_STOPPED terminal reason.
4. Latest private enrollment function preserves name while retaining0015 read permissions. Existing private token test now asserts exact name list round trip.

Validation: jobs15/15 + reporting5/5 PASS together at18:22:42. Focused normal and typed lint PASS. The two-connection lock test, actual persisted invitation mapping, lifecycle guard and private display regression are included in the15jobs tests.

Deletion compatibility inspected: checkout_intents and subscription_state_history cascade from workspace; monitor_region_schedules cascades from monitor. Global reporting epoch contains no tenant payload and does not block deletion. No remote provider request, deployment or real email was executed.
