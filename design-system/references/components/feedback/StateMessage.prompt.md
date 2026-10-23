One component for every non-data state. Pick the kind that tells the truth: `empty` (nothing yet), `unavailable` (doesn't apply / not collected), `partial` (some data missing), `error` (fetch failed), `success`.
```jsx
<StateMessage kind="empty" title="No monitors yet" description="Add a URL and Watchtower starts checking it from 5 regions." action={<Button icon="plus">Add monitor</Button>} />
<StateMessage kind="error" title="Couldn't load incidents" description="The request timed out." action={<Button variant="secondary" icon="rotate-cw">Retry</Button>} />
<StateMessage compact kind="partial" title="2 of 5 regions reporting" />
```
Never render unavailable data as 0. Errors announce via role="alert".
