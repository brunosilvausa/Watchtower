Left navigation for the Watchtower app. Shows the active private workspace at top — every view is scoped to one workspace.
```jsx
<Sidebar active={view} onSelect={setView} workspace={{ name: 'Acme Ops', plan: 'Team plan' }}
  sections={[{ items: [{ id: 'overview', label: 'Overview', icon: 'layout-dashboard' }, { id: 'incidents', label: 'Incidents', icon: 'siren', badge: 1, badgeTone: 'down' }] }]} />
```
Active item: surface-card fill, white label, yellow icon.
Sidebar is a floating glass panel; the active item gets a faint yellow-to-glass gradient and a glowing icon.
The active highlight is one indicator that slides between items on the spatial spring; items expose `aria-current="page"`.
