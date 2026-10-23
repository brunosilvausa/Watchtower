Segmented category tabs for filtering lists and switching chart ranges.
```jsx
<Tabs value={f} onChange={setF} items={[{value:'all',label:'All',count:24},{value:'down',label:'Down',count:1}]} />
<Tabs size="sm" items={['1h','24h','7d','30d']} value="24h" />
```
The active pill is a single liquid-glass indicator that slides on the spatial spring. ←/→ move selection (roving tabindex).
