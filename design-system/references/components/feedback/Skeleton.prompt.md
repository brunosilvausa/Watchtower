Placeholder that mirrors the final layout while data loads. Gentle opacity pulse (no shimmer), static under reduced motion.
```jsx
<div aria-busy="true"><span className="wt-sr-only">Loading monitors</span><Skeleton lines={3} /></div>
<Skeleton variant="block" height={220} />
```
Never show a skeleton for data that failed or does not exist — use StateMessage. StatCard, DataTable, LineChart and BarChart have a built-in `loading` prop.
