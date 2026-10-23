# Landing review — 2026-10-22

Fresh-context read-only reviewer `landing_review` inspected the approved spec, implementation, config and tests. One material accessibility finding: vertical incident tabs inherited horizontal keyboard handling. Added optional `orientation` to the existing shared Tabs API (default horizontal), applied vertical ARIA and Up/Down keys to the landing. Searched both callers; showcase keeps horizontal behavior. Regression first failed against the previous production build (`vertical-tabs-red.txt`). Final check results are recorded in setup.md.

Visual inspection also found width:fit-content inherited by the tab list and an unintended status background on the timestamp. The page now makes the tab list fill its column and uses a page-specific data-phase attribute instead of the shared badge data-tone attribute.

Scope: no code injection/iframe/Babel; no live requests from entered URLs; no signup/auth/backend; every CTA targets an existing section. All examples are labelled; claims about future capabilities were adapted to the approved M1 scope.

Configuration adjustment: the existing generic *.css Tailwind loader produced 13 build warnings when fed CSS Module :global selectors. Applying that loader to globals.css only preserves the Tailwind entry and lets native Next CSS Modules own the landing stylesheet. No dependency or compiler swap.
