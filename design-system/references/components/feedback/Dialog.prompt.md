Modal for create/confirm flows (add monitor, delete workspace).
```jsx
<Dialog open={open} onClose={close} title="Add monitor" description="We'll check it every 30 seconds."
  actions={<><Button variant="ghost" onClick={close}>Cancel</Button><Button>Create</Button></>}>
  <Input label="URL" mono />
</Dialog>
```
Opens with a depth transition (from translateZ(-80px)); scrim blurs 6px. Dark glass menu surface.
Phase 2: enters forward on the spatial spring, exits faster; traps Tab, focuses the first field (or `autofocus`), restores focus on close. Reduced motion → opacity only.
