# Quality gates

## Local checks

| Command | What it proves |
|---|---|
| `pnpm lint` | Next/TypeScript baseline, 350-line source ceiling, logger and data boundary rules, Drizzle write guards; zero warnings |
| `pnpm typecheck` | Shared declarations, worker TypeScript and Next route-generated types |
| `pnpm lint:typed` | Floating/misused promise checks across application/package TS, including tests |
| `pnpm lint:rules` | Toolkit custom-rule positive/negative fixtures |
| `pnpm test` | Configuration secrecy, redaction, process values, pool lifecycle and local-target validation |
| `pnpm build` | Shared packages, worker executable and Next production build |
| `pnpm test:worker` | Real Node process startup, resource event and graceful termination |
| `pnpm test:db` | Real local PostgreSQL migrations, grants, constraints, RLS and transaction reset |
| `pnpm test:browser` | Built page in Chromium desktop/mobile; title, heading, no forms/errors/overflow |
| `pnpm db:usage` | Local storage measurements; not cloud billing |

`pnpm check` composes the credential-free checks and worker smoke. Database/browser tests are explicit separate commands. Never connect or migrate during build/check. No remote CI run is claimed; local commands are ready for later CI integration.

Typed lint uses a dedicated monorepo TS project; its measured duration is recorded in setup evidence. Package TypeScript builds also validate production source. A lint import guard is not authorization or exhaustive data-flow analysis.

## Required future gates

M3/M5 must test simultaneous timeouts, worker saturation, restarts and overload recovery. M5 must validate actual deployment SSRF/network protections using controlled targets, and correlate usage to real costs. Those tests cannot be completed before the transport/scheduler and deployment exist. No mock PASS substitutes for them.

## Review and harness procedure

Toolkit revision: `790a895304e0c08b70a5b215c9d334f1c86b816c`.

Reusable read-only security review: load [prompt 13 at the fixed revision](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/790a895304e0c08b70a5b215c9d334f1c86b816c/docs/prompts/13-security-review.md), select current repository baseline including untracked files, and write sensitive findings outside the repository. No scanning of third-party systems. The installed differential-review skill is for future precise diffs; this repository initially has no commits.

Harness2 mode is **native method adaptation**, not execution of Google's CLI or benchmark. Reusable invocation: read [prompt 15 at the fixed revision](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/790a895304e0c08b70a5b215c9d334f1c86b816c/docs/prompts/15-harness-improvement.md); verify the canonical instruction index and relevant command discovery in a fresh context. Only an observed failure justifies one bounded disposable candidate comparison. Do not change model, provider, authentication, permissions or billing.

Record observed retrieval and review separately from client restart/plugin discovery. Updating these sources requires reviewing the revision diff and rerunning affected smoke cases. Do not automatically update global skills or install hooks.
