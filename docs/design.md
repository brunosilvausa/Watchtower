# Design foundation

Direction: premium, restrained, dark-first operational SaaS. The only current screen is a static private-beta introduction. Dashboard and interaction design belong to later milestones.

Tailwind v4 and shadcn `base-nova` neutral tokens are configured in `apps/web/components.json` and `src/app/globals.css`. No component catalog is prebuilt. The CLI's generated unused button and runtime dependencies were removed; retain tokens and `cn` based on the existing clsx/tailwind-merge stack.

Use semantic HTML, meaningful page title, one primary heading, responsive sizing, readable contrast and system fonts. New controls must provide keyboard access, visible focus and labels. Monitoring status must include text/icon rather than color alone. Avoid unnecessary motion and honor reduced-motion preferences when motion is introduced.

Browser smoke verifies the current page at desktop/mobile sizes without horizontal overflow or JavaScript errors. This is not an accessibility certification or approval of a future dashboard.

## 2026-10-22 integration update

The initial foundation above is historical. [Root DESIGN.md](../DESIGN.md) now defines Neon Spatial Glass, canonical tokens, local Inter/JetBrains Mono, 36 adapted component purposes and the development-only showcase. The homepage retains its static private-beta meaning with the new identity. No dashboard or product interaction workflow has been activated; showcase data and archival kits are synthetic.
