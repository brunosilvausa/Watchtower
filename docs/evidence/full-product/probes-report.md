# Probe and provider implementation report

2026-10-22. Implementer scope: runtime probes, provider adapters and shared monitor types.

## Contracts

`monitor-types.ts` exports `MonitorType`, `MonitorConfig`, `ApiStep`, `ProbeResult`, `ChannelType`, `DeliveryJob`. `probes.ts` exports `executeProbe(config, signal)`. `providers.ts` exports `deliverNotification(job): Promise<DeliveryResult>` with accepted/unconfigured/retry/failed states. `accepted` describes provider HTTP acceptance, never recipient delivery.

API steps: URL, GET/POST method, string headers/body, expected status, text assertion, JSON path extractions `{name,path:string[]}`; `{{name}}` substitutes values into subsequent headers/body only. At most five steps, eight extractions per step, eight path keys, 8 KiB variable/header and 64 KiB body. Same origin throughout; authenticated/body-bearing requests require HTTPS and never follow redirects. No scripts/eval/cookies or token output.

Nine monitor types implemented. HTTP follows up to three individually revalidated redirects, bounded 1 MiB response and 30-second maximum configured deadline. Every DNS answer must be public. Socket lookup uses the validated numeric address; TCP/TLS/ICMP share this policy. IPv6 allows global unicast only and excludes all IANA special-purpose assignments; IPv4 special ranges, multicast and reserved ranges are excluded. TLS verifies certificate and server name. RDAP bootstraps through IANA, then queries validated HTTPS registry endpoint. Missing ICMP capability is unknown; enable explicitly with WATCHTOWER_ICMP_ENABLED=true on supported Linux/macOS with ping installed. Heartbeat without history remains unknown.

Twelve adapters implemented: Resend email; Twilio SMS/voice/WhatsApp; Slack, Teams Adaptive Cards, Discord mention suppression, Telegram; PagerDuty dedup/resolve, Opsgenie alias/close; HMAC webhook; encrypted RFC Web Push with VAPID. All traffic uses the same pinned destination transport. Provider credentials are input only, never logged or stored by runtime. Root/foundation owns encryption and durable outbox.

Required channel credentials: email `apiKey,from`; Twilio `accountSid,authToken,from`; collaboration `webhookUrl`; Telegram `botToken`; PagerDuty `routingKey`; Opsgenie `apiKey`; webhook `signingSecret`; push `p256dh,auth,vapidSubject,vapidPublicKey,vapidPrivateKey`. Destination carries recipient or push/webhook URL. Missing credential returns unconfigured before network I/O.

## Validation

- `pnpm --filter @watchtower/runtime typecheck`: PASS.
- Focused normal and typed ESLint: PASS.
- `pnpm exec vitest run packages/runtime/src/probes.test.ts packages/runtime/src/providers.test.ts packages/runtime/src/probes/network.test.ts`: 64 PASS (17:45 local execution output).
- Covers all monitor/channel kinds, absent configuration, XML injection, webhook signature, encrypted push, API token isolation, mixed DNS, pinned socket lookup, redirect SSRF and rebinding. Controlled transports only, no external messages or customer probes.

Primary references checked: [IANA IPv4 registry](https://www.iana.org/assignments/iana-ipv4-special-registry), [IANA IPv6 registry](https://www.iana.org/assignments/iana-ipv6-special-registry), [web-push API](https://github.com/web-push-libs/web-push/blob/master/README.md) via Context7. `web-push@3.6.7`, `@types/web-push@3.6.4` coordinated with foundation dependency owner.

## Limits

No live provider credentials, host ICMP permissions, real regional probes or hosted egress controls validated. DNS OS resolver operations cannot be forcibly cancelled but their awaited result is deadline bounded; HTTP/TCP/TLS sockets and child process are cancelled. Private addresses are deliberately rejected by this public runtime: private probe enrollment/execution must remain workspace-scoped in the scheduler/agent layer. Provider APIs without native idempotency cannot promise exactly-once recipient effects after an ambiguous transport failure. Durable job processing must preserve those semantics rather than label retries as exactly-once delivery. Billing adapter and database scheduling are separate work owners/tasks.

## Durable worker extension and final scoped checks

Implemented narrow SECURITY DEFINER registration, tenant-fair short-transaction claim, configuration/lease fencing, atomic observations + two-failure/two-success incidents + outbox, maintenance exclusion and weekly timezone calculation, escalation cancellation, capped retries and stable keys. Worker role has no direct auth/monitor table access. Local schema USAGE grant was repaired in dedicated PostgreSQL as owner; bootstrap now includes worker USAGE. Applied incremental migrations 0006, 0008, 0009, 0011 and 0013 preserve prior applied bytes. Migration0008 also carries controller's corrected public-index trigger ambiguity.

Outbound configured webhooks participate in incident outbox and decrypt reusable signing secret only in worker memory. Public status/phone email/SMS events share the outbox with explicit system provider configuration. Weekly reports use verified user preference and local Monday after09:00, one per ISO week; report contains observed current counts. Audit retention removes only rows older365days. Workspace deletion sweeper is foundation-owned and is invoked through its narrow worker function.

Private probe enrollment returns a one-time hashed token, restricts broker claims to its workspace and explicitly assigned monitor, supports revocation/drain and heartbeat. `apps/worker/src/private.ts` is a separate manual agent executable requiring HTTPS control endpoint, enrollment token and explicit RFC1918/ULA CIDRs. Private policy never allows loopback/link-local/metadata. Default public runtime remains unchanged. Agent executes at most three concurrent30second checks per45second lease. No private agent was remotely installed or executed against customer targets.

Encrypted API configuration is hydrated in worker/private broker only; absent encryption key yields unknown/CREDENTIALS_UNCONFIGURED without HTTP. Built Node execution exposed the CommonJS web-push named-export incompatibility missed by Vitest; fixed using default import and verified actual worker startup/SIGTERM.

Latest scoped evidence:
- Runtime/protocol/provider/private/encryption:66 PASS,0FAIL (five files; Vitest JSON success inspected after RTK condensed output).
- PostgreSQL jobs:10 PASS at18:01:33 local, including real held transaction/advisory lock exclusion, direct privilege denial, stale config/lease and duplicate completion, incident transitions, acknowledgment escalation cancellation, maintenance, private token scope/revocation, durable signed webhook data, weekly timezone/idempotency and tenant-scoped365day retention.
- Focused normal and typed ESLint:PASS.
- `pnpm build:packages`, worker build and `pnpm test:worker`:PASS after final imports.
- Cleanup recovered one explicitly identified failed-test fixture after private-probe FK cleanup ordering was corrected; subsequent tests clean up their own rows. DB remains running for controller regression.

Remaining review focus: a final-attempt delivery lease expiring after a worker crash currently needs terminalization rather than remaining unclaimable pending. Multi-region scheduling currently uses one monitor lease and does not yet ensure per-region fanout; it conservatively reports quorum unavailable when distinct recent observations are missing. These are implementation followups, not merely live-host validation limits, and were sent to controller before final review.

## Followup closure — 18:06 local

Both preceding implementation followups are now fixed in applied0016_worker_final_delivery:

- `monitor_region_schedules` owns one fenced lease per monitor/region. Every requested region has its own due schedule; a fast worker cannot repeatedly consume another region's slot. Shared tenant concurrency still caps simultaneous work. Configuration changes reset per-region history/fences, and check-now uses `request_monitor_check(uuid)` to make all slots due. Public default region is explicitly local. Regional incident confirmation/recovery requires two consecutive observations in each region of the configured quorum; freshness and active probe heartbeats constrain aggregation.
- An expired fifth delivery claim is marked failed/DELIVERY_ATTEMPTS_EXHAUSTED before further claims.

Latest PostgreSQL jobs suite:12 PASS,0FAIL at18:06:33. The added real database test executes two distinct registered regions over two failure and two recovery rounds, checks independent lease tokens, rejects a region-swapped fence, verifies no early incident/recovery, and records observations from both regions. The crash test confirms an expired final attempt is terminal and never reclaimed.

These are local controlled probe results, not deployed geographical or provider evidence. No unresolved material finding is knowingly parked in this implementer's scope; independent controller reviews remain required.
