Adds a ≤4px magnetic pull to one high-priority control. Prefer the built-in `magnetic` prop on Button / IconButton; use this wrapper for anything else.
```jsx
<Magnetic><FloatingActionThing /></Magnetic>
```
Never on form fields, destructive actions, financial confirmations, or dense nav lists. Uses the CSS `translate` property so it composes with hover/press transforms; off for touch and reduced motion.
