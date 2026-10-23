Ring chart for composition — monitors by status, checks by region.
```jsx
<DonutChart value="24" label="Monitors" segments={[
  {label:'Up',value:21,color:'var(--status-up)'},{label:'Degraded',value:2,color:'var(--status-degraded)'},{label:'Down',value:1,color:'var(--status-down)'}]} />
```
Prefer status colors or a gray ramp + one yellow; avoid rainbow palettes.
