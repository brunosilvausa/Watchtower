Thin vertical bars, one per day, colored by worst status that day — the monitor-detail and status-page signature.
```jsx
<UptimeBar uptime="99.98%" days={[...Array(87).fill('up'), 'degraded', 'up', 'down']} />
```
Use 90 days on detail pages, 30 in compact rows (height 20).
