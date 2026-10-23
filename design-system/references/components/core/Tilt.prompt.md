Wrap ONE featured surface to give it pointer-responsive perspective tilt, spring lift, and an integrated reflection that follows the cursor.
```jsx
<Tilt><PricingTier featured … /></Tilt>
<Tilt max="subtle" lift={8} reflection={0.6}>…</Tilt>
<Tilt max={0} lift={0}>…</Tilt>   {/* reactive light only */}
```
Never wrap tables, charts with crosshairs, code, forms or financial confirmation UI. Updates run through CSS variables + rAF spring (no re-renders). Mouse only; static for touch and reduced motion. Prefer `<Card tilt>` when the surface is a Card.
