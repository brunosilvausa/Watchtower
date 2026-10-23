KPI tile: label → value → comparison → trend. Give ONE card per row `featured` (+ `highlight` for neon value); the rest `emphasis="secondary"`.
```jsx
<StatCard featured highlight icon="activity" label="Uptime" value="99.94" unit="%" delta="0.02%" caption="vs last week" />
<StatCard emphasis="secondary" icon="timer" label="p95" value="142" unit="ms" delta="4.1%" deltaDirection="down" deltaTone="up" caption="vs last week" trend={[148,156,151,212,166,139,142]} />
<StatCard emphasis="secondary" label="Heartbeat latency" value={null} unavailable="Not measured for heartbeat monitors" />
<StatCard loading label="Checks run" />
```
Delta shows arrow + sign + screen-reader direction, so colour is never the only cue. Set `deltaTone` when "up" is bad.
