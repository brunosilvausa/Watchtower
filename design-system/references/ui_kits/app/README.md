# Watchtower app UI kit

Click-through recreation of the authenticated Watchtower product: a private workspace dashboard for monitoring endpoints, cron heartbeats and TCP services.

Layout follows the reference dashboard screenshots in `uploads/` (floating sidebar card, 64px top bar with ⌘K search, 4-column card grid, rounded-header tables), re-skinned with Watchtower tokens.

**Screens** (all in `index.html`)
- Overview — KPI StatCards, monitor list, weekly response-time chart, checks vs errors, status donut, recent alerts, incident table, latency by region
- Monitors — filter Tabs, search, DataTable with 30-day UptimeBar per row → click a row
- Monitor detail — stats, range Tabs on LineChart, 90-day UptimeBar, latest check CodeWindow, regions table; Pause / Run check fire Toasts
- Incidents — table + timeline for the selected incident
- Members & settings — members, alert channel Switches, privacy

**Interactions**: sidebar nav · workspace switcher (click the workspace chip) · Add monitor dialog creates a row · toasts.

Files: `data.js` (fake data + `window.WT` alias of the DS namespace), `Shell.jsx`, one `*Screen.jsx` per view.
Status pages are listed in the nav but not built — no reference existed.
