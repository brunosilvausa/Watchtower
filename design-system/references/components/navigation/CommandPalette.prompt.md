Makes the ⌘K hint in AppTopBar real: search existing pages, records and supported actions. The host owns the shortcut listener.
```jsx
<CommandPalette open={cmd} onClose={() => setCmd(false)} items={[
  { id: 'p-overview', group: 'Pages', label: 'Overview', icon: 'layout-dashboard', onSelect: () => go('overview') },
  { id: 'a-add', group: 'Actions', label: 'Add monitor', icon: 'plus', onSelect: openAdd },
]} />
<AppTopBar onCommand={() => setCmd(true)} … />
```
↑/↓ move, Enter runs, Esc closes. Only list commands the product already supports.
