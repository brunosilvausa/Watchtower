function IncidentsScreen() {
  const D = window.WT_DATA;
  const [sel, setSel] = React.useState(D.incidents[0]);
  const tl = [
    { t: '03:15', s: 'down', txt: 'Heartbeat expected by 03:10 was not received.' },
    { t: '03:15', s: 'info', txt: 'Alert sent to #ops-alerts (Slack) and maya@acme.dev.' },
    { t: '03:32', s: 'info', txt: 'Maya Ortiz acknowledged.' },
  ];
  return <>
    <PageHeader title="Incidents" sub="2 open · 14 resolved in the last 90 days"><WT.Select icon="calendar" align="right" options={['Last 90 days', 'Last 30 days']} /></PageHeader>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
      <WT.Card title="All incidents"><div onClickCapture={() => {}}><WT.DataTable onRowClick={setSel} columns={[
        { key: 'id', label: 'ID', mono: true, muted: true },
        { key: 'monitor', label: 'Monitor', render: (v, r) => <span style={{ fontWeight: r.id === sel.id ? 700 : 600, color: r.id === sel.id ? 'var(--primary)' : 'var(--on-dark)' }}>{v}</span> },
        { key: 'cause', label: 'Cause', muted: true },
        { key: 'duration', label: 'Duration', mono: true },
        { key: 'status', label: 'Status', render: s => <WT.Badge tone={s} dot>{s === 'up' ? 'Resolved' : s === 'down' ? 'Ongoing' : 'Degraded'}</WT.Badge> },
      ]} rows={D.incidents} /></div></WT.Card>
      <WT.Card eyebrow={sel.id} title={sel.monitor} action={<WT.Badge tone={sel.status} dot>{sel.status === 'up' ? 'Resolved' : 'Ongoing'}</WT.Badge>}>
        <div style={{ fontSize: 14, color: 'var(--text-body)', marginBottom: 16 }}>{sel.cause} · started {sel.started}</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tl.map((e, i) => <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 16, position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><WT.StatusDot status={e.s} style={{ marginTop: 6 }} />{i < tl.length - 1 && <span style={{ flex: 1, width: 1, background: 'var(--hairline-strong)', marginTop: 6 }} />}</div>
            <div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{e.t} UTC</div><div style={{ fontSize: 14, color: 'var(--text-body-strong)', lineHeight: 1.5 }}>{e.txt}</div></div>
          </div>)}
        </div>
        <div style={{ display: 'flex', gap: 8 }}><WT.Button size="sm" icon="check">Resolve</WT.Button><WT.Button size="sm" variant="secondary" icon="message-square">Add note</WT.Button></div>
      </WT.Card>
    </div>
  </>;
}
Object.assign(window, { IncidentsScreen });
