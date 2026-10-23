Time series (response time, checks). Monochrome lines — solid white for current, dashed grey for comparison — and neon only for the one series that matters.
```jsx
<LineChart legend ariaLabel="p95 response time, this week" height={220} labels={['Mon','Tue','Wed','Thu','Fri','Sat','Sun']} format={v => v + 'ms'}
  series={[{ name: 'p95', data: [148,156,null,212,166,139,142], color: 'var(--chart-series-primary)', area: true },
           { name: 'Last week', data: [150,158,149,160,152,146,147], dashed: true, color: 'var(--chart-series-2)' }]} />
```
Missing values are gaps. Tooltip lists every visible series. Keyboard: ←/→/Home/End/Esc. `loading`, `error`, empty states built in. Range changes cross-fade; first render reveals left→right. Never tilt a chart.
