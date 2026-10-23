Standard action button; the yellow `primary` variant marks the one most important action on a view.
```jsx
<Button icon="plus">Add monitor</Button>
<Button variant="secondary" icon="download">Export</Button>
<Button variant="inverse">Start free</Button>  {/* on a yellow band */}
```
Variants: primary · secondary (dark surface) · outline · ghost · inverse · danger. Sizes sm/md/lg. Radius 8px (6px at sm). Never pill-shaped.
Material: primary is extruded neon (top highlight, bottom lip, drop shadow; neon glow on hover). Secondary is glass. Hover lifts 1px with a spring; press sinks 1px and scales .985.
`loading` shows a spinner and blocks clicks. `magnetic` adds a ≤4px pointer pull — only for the single high-priority CTA (e.g. "Add monitor"), never on danger or financial confirmation. Hover lift uses the responsive spring; press is instant.
