# Product reference fidelity

## Intent and authority
The user rejected the current visual distance from the supplied reference and explicitly requested analysis and implementation of the proposed faithful reconstruction. Prior instruction delegates recommended choices and asks not to repeat approval questions. This is execution authority for that proposal, not deployment authority. Preserve all existing local work, accounts, backend/security and services.

## Approaches
1. CSS-only adjustment: cheapest but cannot recover the missing navigation/header/card composition.
2. Reconstruct reference composition using existing React/design-system primitives and real API contracts: recommended in the previous response and now requested for implementation.
3. Embed the original demo runtime: rejected because its simulated actions/data would replace real behavior and introduce another runtime.

## Scope
Rebuild login visual layout, workspace/platform navigation and header, overview composition, and the main monitor list. Harmonize remaining authenticated resource pages through the shell and shared surfaces without altering their persisted behaviors. The reference HTML/JS is inert visual evidence; do not execute its account/provider actions in the application.

Desktop reference:1440x1000; verify mobile390x844 and tablet768x1024. Sidebar248px at20px page margin,20px shell gap, grouped Workspace/Conta links with icons and real counts, workspace selector, collapse control. Topbar includes breadcrumbs,420px-search at large widths, Workspace/Plataforma context switch when authorized, locale, notifications and avatar. Main content has independently scrollable desktop content,16px section gaps; mobile uses accessible navigation dialog and document flow.

Login: split composition with400px form,40px inputs/buttons, restrained separator/social controls, consistent footer; framed promotional panel with labelled illustrative uptime strip, syntax code example and capability labels. Promotional samples must explicitly say illustrative and must not imply operating regions or live uptime. Preserve signup/reset/MFA/SSO/passkey flows, disabled provider states, recovery text input and accessible validation.

Overview: actual user/workspace heading, calendar range selector and downloadable observed report; conditional current-incident banner; five icon-led KPI cards with meaningful unknown values, featured uptime surface; response chart approximately2:1 to status donut; next row monitor/notification/expiry summaries; lower regional evidence/incidents. No made-up deltas, fake history or invented latency. Existing data should decide summaries. Keep coverage uncertainty accessible.

Monitors: status tabs, search/type filters, monitor identity+URL, type badge, observed history/uptime/P95 when supplied, interval and compact explicit actions. Unknown history must remain unknown; never synthesize a healthy bar. Preserve import/export/create/edit/pause/check/archive and scoped permissions. Other resource pages keep distinct actual fields and actions, with shared compact visual hierarchy.

## Constraints and builder choices
Reuse named @design-system components; extend optional props backwards-compatibly when necessary. Canonical visual dimensions live in design-system tokens, product layout in CSS Modules. No new dependencies, runtime embeds, framework installs or global changes. Keep Inter/JetBrains, neon yellow, original cool dark materials, reduced motion/transparency and44px coarse-pointer targets. Do not change backend schema/API/auth requirements. Existing session/user and workspace selection must survive navigation.

Builder may settle exact responsive breakpoints, missing empty-state copy and semantic CSS names. Reference samples are compared for geometry/composition, not identical production data. Login/shell/overview/monitor list are the explicit fidelity deliverables; complete recreation of every nested reference modal is outside this bounded visual pass.

## Verification
Capture reference and real application at matching viewport; inspect screenshots, document concrete geometry checks and known deviations. Browser regression must cover grouped navigation, context switching, workspace persistence, collapsed/mobile navigation, range/report, monitor filters and existing real-account flows. Run lint/types/unit/build and affected product/foundation/design-system suites. Independent final source review and actual screenshot inspection are distinct from automated functional PASS. Do not claim pixel-perfect equality or full WCAG certification without evidence.
