Rounded-12 panel in one of the Neon Spatial Glass materials — frosted glass (Z1) by default — with optional icon/title/action header.
```jsx
<Card title="Response time" icon="timer" action={<Select size="sm" options={['24h','7d']} />}>…</Card>
<Card tilt title="Status mix">…</Card>            {/* featured: 3D tilt */}
<Card variant="yellow" padding="xl" tilt>…</Card>  {/* one per screen */}
<Card variant="flat">…</Card>                     {/* nested inside another glass surface */}
```
Use `tilt` only on featured, non-interactive-content cards. Never nest glass in glass — use `flat` inside. Materials: `smoked` for structural panels, `liquid` for a floating/selected panel, `metal` for control trays.
`tilt` accepts true | "subtle" | "medium" | "maximum". `interactive` gives clickable cards an 8px hover lift + reactive light without rotation.
