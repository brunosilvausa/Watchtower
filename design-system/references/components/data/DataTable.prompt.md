Tabular list for monitors, incidents, members. Header is a rounded surface-elevated strip; rows separated by hairlines.
```jsx
<DataTable onRowClick={open} columns={[
  { key: 'name', label: 'Monitor', render: (v, r) => <><StatusDot status={r.status} /> {v}</> },
  { key: 'latency', label: 'p95', align: 'right', mono: true },
  { key: 'status', label: 'Status', render: s => <Badge tone={s} dot>{s}</Badge> }]} rows={rows} />
```
Place inside a Card with padding="md" or "lg".
Phase 3: flat (no blur, no tilt) by design. Rows are keyboard-navigable when `onRowClick` is set (↑/↓/Home/End, Enter). `selectedKey` marks the active row. `loading`, `error` (+`onRetry`), and `emptyState` cover every non-data state. `null` cells render "—", never 0. Pass `caption` so the scroll region is named.
