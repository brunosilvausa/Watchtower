function MonitorsScreen({ openMonitor, monitors, onAdd, loading }) {
  const [f, setF] = React.useState('all');
  const [q, setQ] = React.useState('');
  const c = s => monitors.filter(m => m.status === s).length;
  const rows = monitors.filter(m => (f === 'all' || m.status === f) && m.name.toLowerCase().includes(q.toLowerCase()));
  const L = { up: 'Up', down: 'Down', degraded: 'Degraded', paused: 'Paused' };
  return <>
    <PageHeader title="Monitors" sub={monitors.length + ' monitors in Acme Ops'}><WT.Button variant="secondary" icon="file-code-2">Import YAML</WT.Button><WT.Button icon="plus" onClick={onAdd}>Add monitor</WT.Button></PageHeader>
    <WT.Card padding="lg">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <WT.Tabs value={f} onChange={setF} items={[{ value: 'all', label: 'All', count: monitors.length }, { value: 'up', label: 'Up', count: c('up') }, { value: 'degraded', label: 'Degraded', count: c('degraded') }, { value: 'down', label: 'Down', count: c('down') }, { value: 'paused', label: 'Paused', count: c('paused') }]} />
        <WT.Input icon="search" aria-label="Filter monitors by name" placeholder="Filter by name" value={q} onChange={e => setQ(e.target.value)} style={{ width: 'min(260px, 100%)' }} />
      </div>
      <WT.DataTable caption="Monitors" loading={loading} onRowClick={openMonitor} emptyState={<WT.StateMessage compact kind="empty" title={q ? 'No monitors match “' + q + '”' : 'No monitors in this state'} description="Try another filter or clear the search." />} columns={[
        { key: 'name', label: 'Monitor', render: (v, r) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}><WT.StatusDot status={r.status} pulse={r.status === 'down'} /><span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: 600, color: 'var(--on-dark)' }}>{v}</span><span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{r.url}</span></span></span> },
        { key: 'type', label: 'Type', muted: true },
        { key: 'days', label: 'Last 30 days', width: 220, render: d => <WT.UptimeBar days={d} height={20} startLabel=" " endLabel=" " style={{ gap: 0 }} /> },
        { key: 'uptime', label: 'Uptime', align: 'right', mono: true, render: v => v === '—' ? <span style={{ color: 'var(--text-disabled)' }} title="Paused — no checks this period">—</span> : v },
        { key: 'p95', label: 'p95', align: 'right', mono: true, render: v => v ? v.toLocaleString() + 'ms' : '—' },
        { key: 'status', label: 'Status', render: s => <WT.Badge tone={s === 'paused' ? 'neutral' : s} dot>{L[s]}</WT.Badge> },
      ]} rows={rows} />
    </WT.Card>
  </>;
}
Object.assign(window, { MonitorsScreen });
