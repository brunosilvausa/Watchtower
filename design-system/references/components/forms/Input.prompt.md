Text input on surface-card; yellow border on focus, rose on error.
```jsx
<Input label="URL" mono placeholder="https://api.example.com/health" />
<Input icon="search" placeholder="Search monitors" kbd="⌘K" />
<Input label="Timeout" suffix="ms" defaultValue="5000" />
```
`valid` shows an emerald border + check. Errors set `aria-invalid` and announce via `role="alert"`.
