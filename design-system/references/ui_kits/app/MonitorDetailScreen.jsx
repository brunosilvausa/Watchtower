function MonitorDetailScreen({ monitor: m, back, onToast }) {
  const [range, setRange] = React.useState('24h');
  const [paused, setPaused] = React.useState(m.status === 'paused');
  const days90 = Array.from({ length: 90 }, (_, i) => i < 60 ? (i === 17 ? 'degraded' : 'up') : m.days[i - 60]);
  const series = { '1h': [132, 140, 138, 151, 146, 142, 139, 144], '24h': [140, 152, 138, 190, 226, 146, 142, 139], '7d': [148, 156, 151, 212, 166, 139, 142, 140] }[range];
  const labels = { '1h': ['−60', '−50', '−40', '−30', '−20', '−10', '−5', 'now'], '24h': ['00', '03', '06', '09', '12', '15', '18', '21'], '7d': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Now'] }[range];
  const L = { up: 'Operational', down: 'Down', degraded: 'Degraded', paused: 'Paused' };
  const st = paused ? 'paused' : m.status;
  return <>
    <button onClick={back} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 12, fontFamily: 'var(--font-sans)' }}><WT.Icon name="arrow-left" size={14} />Monitors</button>
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
      <div><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: '-1px', color: 'var(--on-dark)' }}>{m.name}</h1><WT.Badge tone={st === 'paused' ? 'neutral' : st} dot>{L[st]}</WT.Badge></div>
        <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>{m.url} · every {m.interval} · {m.regions || 'no'} regions</div></div>
      <div style={{ display: 'flex', gap: 10 }}>
        <WT.Button variant="secondary" icon={paused ? 'play' : 'pause'} onClick={() => { setPaused(!paused); onToast(paused ? 'Monitor resumed' : 'Monitor paused', 'neutral'); }}>{paused ? 'Resume' : 'Pause'}</WT.Button>
        <WT.Button variant="secondary" icon="pencil">Edit</WT.Button>
        <WT.Button icon="zap" onClick={() => onToast('Check passed · 200 OK in 138ms', 'up')}>Run check</WT.Button>
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 16 }}>
      <WT.StatCard featured icon="activity" label="Uptime · 30d" value={m.uptime} highlight />
      <WT.StatCard icon="timer" label="p95" value={m.p95 ? m.p95.toLocaleString() : '—'} unit={m.p95 ? 'ms' : ''} delta="4.1%" deltaDirection="down" deltaTone="up" caption="vs last week" />
      <WT.StatCard icon="lock" label="Certificate" value="68" unit="days" caption="Let’s Encrypt · renews Dec 29" />
      <WT.StatCard icon="siren" label="Incidents · 30d" value={m.status === 'up' ? '1' : '2'} caption="MTTR 4m 12s" />
      <WT.Card title="Response time" style={{ gridColumn: 'span 4' }} action={<WT.Tabs size="sm" value={range} onChange={setRange} items={['1h', '24h', '7d']} />}>
        <WT.LineChart height={240} labels={labels} format={v => v + 'ms'} min={100} max={240} highlight={4}
          series={[{ name: 'p95', data: series, color: 'var(--primary)', area: true }, { name: 'p50', data: series.map(v => Math.round(v * 0.62)), color: 'var(--text-muted)', dashed: true }]} />
      </WT.Card>
      <WT.Card title="90-day history" style={{ gridColumn: 'span 4' }}><WT.UptimeBar days={days90} uptime={m.uptime} height={36} /></WT.Card>
      <WT.Card title="Latest check" style={{ gridColumn: 'span 2' }} padding="lg">
        <WT.CodeWindow title={'GET ' + m.url.replace(/^https?:\/\/[^/]+/, '') } status="200 OK · 138ms · eu-central" lineNumbers={false}
          code={"HTTP/2 200\ncontent-type: application/json\nx-region: 'eu-central-1'\n\n{ \"status\": \"ok\", \"db\": \"ok\", \"queue\": 12 }"} />
      </WT.Card>
      <WT.Card title="Regions" style={{ gridColumn: 'span 2' }}>
        <WT.DataTable dense columns={[{ key: 'name', label: 'Region' }, { key: 'code', label: 'Code', mono: true, muted: true }, { key: 'p95', label: 'p95', align: 'right', mono: true, render: v => v + 'ms' }, { key: 'delta', label: 'Δ week', align: 'right', render: (v, r) => <WT.Badge tone={r.tone} shape="square">{v}</WT.Badge> }]} rows={window.WT_DATA.regions.map(r => ({ ...r, id: r.code }))} />
      </WT.Card>
    </div>
  </>;
}
Object.assign(window, { MonitorDetailScreen });
