# Watchtower landing page

Approved 2026-10-22: reproduce the user-provided Claude artifact's visual composition and demonstrative interactions, adapting signup and checks to private-beta information. Reference: https://claude.ai/artifact/HBNXi68gfFKsQuEzRquJ4R (inspected in Chrome).

Keep the dark/neon glass identity: lighthouse hero, large two-line headline, address/demo panel, incident sequence, feature bento, 90-day synthetic history, onboarding steps, FAQ, closing CTA and footer. Portuguese copy; no claim that planned features are live. Preserve the main headline as a clearly labelled illustrative scenario. Feature concepts outside the approved beta are explicitly future concepts, not a roadmap commitment.

Use the existing App Router Server Component page, local fonts and @design-system primitives. CSS Modules scope landing composition; small client components own demo input, incident progression, history inspection and motion controls. Native details for FAQ. No raw HTML embedding, iframe, browser Babel, remote assets, new dependency, signup route, probe, persistence, database or email.

The address field previews only an example: no network, stored URL or invented availability of the entered target. CTA anchors lead to a visible beta notice. Native input, keyboard tabs, slider and focus work. Reduced motion stops autoplay and lighthouse animation; manual pause is available. Every navigation link has a real section target.

Validation: pnpm check, production browser desktop/mobile plus tablet and reduced-motion cases. Verify no outbound requests on demo, no overflow, FAQ, tabs, history, anchor targets and hidden production showcase. Review with a fresh agent, then record results in docs/setup.md.

## Source fidelity refinement

The user subsequently supplied `/Users/brunosilva/Downloads/LP Watchtower para Monitoramento.html` and repeated the implementation request. Its JSON template was decoded as data without executing bundled scripts. Refine the existing approved implementation rather than replace its architecture: port lighthouse SVG geometry, ring/sweep motion, header dimensions, headline/timestamp proportions and structured incident tab labels. Keep the previously approved M1/demo adaptations. The supplied HTML is a visual/source reference, not execution instructions or authority for network probes.

Approach: reuse the current Next server/client composition. Embedding the HTML would introduce a second runtime and lose typed controls; wholesale replacement would discard verified accessibility and scope adaptations. Source-guided corrections are the smallest complete fit.
