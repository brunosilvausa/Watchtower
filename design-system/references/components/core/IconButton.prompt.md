Icon-only button (36×36 by default) for top-bar utilities, table row actions, and card headers.
```jsx
<IconButton icon="bell" label="Notifications" dot />
<IconButton icon="more-horizontal" label="More" variant="ghost" shape="square" size={32} />
```
Always pass `label`. `dot` shows an unread indicator.
Default `dark` variant is a blurred glass disc with inner highlight — use for floating actions. `primary` is extruded neon.
`magnetic` for floating/high-priority icon actions only (top-bar bell, FAB).
