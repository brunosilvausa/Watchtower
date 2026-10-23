function OverviewScreen({ openMonitor, setView, loading }) {
  const D = window.WT_DATA;
  const [range, setRange] = React.useState('7d');
  const counts = { up: D.monitors.filter(m => m.status === 'up').length, degraded: D.monitors.filter(m => m.status === 'degraded').length, down: D.monitors.filter(m => m.status === 'down').length, paused: D.monitors.filter(m => m.status === 'paused').length };
  const row = { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid var(--border-subtle)' };
  return <>
    <PageHeader title="Good morning, Maya" sub="Acme Ops · 7 monitors across 5 regions">
      <WT.Select icon="calendar" value={range} onChange={setRange} align="right" options={[{ value: '24h', label: 'Last 24 hours' }, { value: '7d', label: 'This week' }, { value: '30d', label: 'Last 30 days' }]} />
      <WT.Button variant="secondary" icon="upload">Export</WT.Button>
    </PageHeader>
    <div className="ov-grid">
      <div className="ov-kpis">
        <WT.StatCard featured highlight loading={loading} icon="activity" label="Uptime" value="99.94" unit="%" delta="0.02%" caption="vs last week" />
        <WT.StatCard emphasis="secondary" loading={loading} icon="timer" label="p95 latency" value="142" unit="ms" delta="4.1%" deltaDirection="down" deltaTone="up" caption="vs last week" trend={D.week.now} trendLabel="p95 latency, last 7 days" />
        <WT.StatCard emphasis="secondary" loading={loading} icon="siren" label="Open incidents" value="2" delta="2" deltaTone="down" caption="since yesterday" />
        <WT.StatCard emphasis="secondary" loading={loading} icon="radar" label="Checks run" value="1.26M" delta="12%" deltaTone="neutral" caption="this month" />
      </div>
      <WT.Card className="ov-monitors" title="Monitors" icon="activity" action={<WT.IconButton icon="arrow-up-right" label="All monitors" size={32} variant="ghost" onClick={() => setView('monitors')} />}>
        {loading ? <div aria-busy="true"><span className="wt-sr-only">Loading monitors</span>{[0, 1, 2, 3, 4].map(i => <div key={i} style={row}><WT.Skeleton variant="circle" width={8} /><WT.Skeleton lines={2} /></div>)}</div> :
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {D.monitors.slice(0, 5).map(m => <li key={m.id}><button type="button" onClick={() => openMonitor(m)} style={{ ...row, width: '100%', border: 0, borderTop: '1px solid var(--border-subtle)', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'inherit', fontFamily: 'inherit' }}>
            <WT.StatusDot status={m.status} pulse={m.status === 'down'} />
            <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', ...WT.Typography.style('label'), fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</span><span style={{ ...WT.Typography.style('caption'), color: 'var(--text-tertiary)' }}>{m.type} · {m.interval} · {m.status === 'up' ? 'Up' : m.status === 'down' ? 'Down' : m.status === 'degraded' ? 'Degraded' : 'Paused'}</span></span>
            <span className="wt-value-sm" title={m.p95 ? undefined : 'Not measured for this monitor type'}>{m.p95 ? m.p95.toLocaleString() + 'ms' : '—'}</span>
          </button></li>)}
        </ul>}
      </WT.Card>
      <WT.Card className="ov-response" title="Response time" action={<WT.Select size="sm" icon="calendar" align="right" options={['Weekly', 'Daily']} />}>
        <WT.LineChart loading={loading} legend ariaLabel="p95 response time this week vs last week" height={210} highlight={3} labels={D.week.labels} format={v => v + 'ms'} min={100} max={240} ticks={5}
          series={[{ name: 'This week', data: D.week.now, color: 'var(--chart-series-1)', area: true }, { name: 'Last week', data: D.week.prev, dashed: true, color: 'var(--chart-series-2)', width: 1.5 }]} />
      </WT.Card>
      <WT.Card className="ov-checks" title="Checks vs. errors" action={<WT.Select size="sm" icon="calendar" align="right" options={['This year', 'Last year']} />}>
        <WT.LineChart loading={loading} legend ariaLabel="Monthly checks and errors, in millions" height={250} labels={D.year.labels} format={v => v + 'M'} min={0} max={5} ticks={6}
          series={[{ name: 'Checks', data: D.year.checks, color: 'var(--chart-series-1)', area: true }, { name: 'Errors', data: D.year.errors, dashed: true, color: 'var(--chart-series-2)' }]} />
      </WT.Card>
      <WT.Card className="ov-mix" title="Status mix" icon="pie-chart">
        <WT.DonutChart ariaLabel="Monitors by status" size={160} thickness={16} value={String(D.monitors.length)} label="Monitors" segments={[{ label: 'Up', value: counts.up, color: 'var(--status-up)' }, { label: 'Degraded', value: counts.degraded, color: 'var(--status-degraded)' }, { label: 'Down', value: counts.down, color: 'var(--status-down)' }, { label: 'Paused', value: counts.paused, color: 'var(--wt-ink-500)' }]} />
      </WT.Card>
      <WT.Card className="ov-alerts" title="Recent alerts" action={<WT.Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => setView('incidents')}>View all</WT.Button>}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{D.alerts.map((a, i) => <li key={i} style={{ ...row, borderTop: i ? row.borderTop : 0 }}>
          <WT.StatusDot status={a.tone} />
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ ...WT.Typography.style('label'), fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.who}</div><div style={{ ...WT.Typography.style('caption'), color: 'var(--text-tertiary)' }}>{a.what}</div></div>
          <span style={{ ...WT.Typography.style('caption'), color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{a.when}</span>
        </li>)}</ul>
      </WT.Card>
      <WT.Card variant="solid" className="ov-incidents" title="Incident history" action={<WT.Select size="sm" icon="calendar" align="right" options={['This month', 'Last 90 days']} />}>
        <IncidentTable rows={D.incidents} loading={loading} />
      </WT.Card>
      <WT.Card className="ov-regions" title="Latency by region" icon="globe">
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{D.regions.map((r, i) => <li key={r.code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i ? '1px solid var(--border-subtle)' : 0 }}>
          <div style={{ flex: 1 }}><div style={{ ...WT.Typography.style('label'), fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</div><div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{r.code}</div></div>
          <span className="wt-value-sm">{r.p95}ms</span>
          <WT.Badge tone={r.tone} shape="square"><span className="wt-sr-only">{r.tone === 'up' ? 'Faster ' : 'Slower '}</span>{r.delta}</WT.Badge>
        </li>)}</ul>
      </WT.Card>
    </div>
  </>;
}
function IncidentTable({ rows, loading }) {
  const label = { down: 'Ongoing', degraded: 'Degraded', up: 'Resolved' };
  return <WT.DataTable caption="Incident history" loading={loading} columns={[
    { key: 'monitor', label: 'Monitor', render: (v, r) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}><WT.Icon name={r.status === 'up' ? 'circle-check' : 'circle-alert'} size={16} color={r.status === 'up' ? 'var(--text-tertiary)' : r.status === 'down' ? 'var(--status-down)' : 'var(--status-degraded)'} /><span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span><span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{r.id}</span></span></span> },
    { key: 'cause', label: 'Cause', muted: true },
    { key: 'started', label: 'Started', muted: true },
    { key: 'duration', label: 'Duration', mono: true, align: 'right' },
    { key: 'status', label: 'Status', render: s => <WT.Badge tone={s} dot>{label[s]}</WT.Badge> },
  ]} rows={rows} />;
}
Object.assign(window, { OverviewScreen, IncidentTable });
