function Container({ children, style }) { return <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px)', ...style }}>{children}</div>; }
const H = {
  xl: { margin: 0, fontSize: 'clamp(38px, 6.4vw, 72px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: 'clamp(-2.5px, -0.035em, -1px)', textWrap: 'balance', color: 'var(--on-dark)' },
  lg: { margin: 0, fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: 'clamp(-2px, -0.035em, -1px)', textWrap: 'balance', color: 'var(--on-dark)' },
  md: { margin: 0, fontSize: 'clamp(28px, 3.6vw, 40px)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-1px', textWrap: 'balance', color: 'var(--on-dark)' },
  eyebrow: { fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' },
};
const YAML = "# watchtower.yml\nworkspace: 'acme-ops'\nmonitors:\n  - url: 'https://api.acme.dev/health'\n    interval: 30\n    regions: 5\n    expect: 200\n  - heartbeat: 'nightly-db-backup'\n    every: 24h\nalerts:\n  - slack: '#ops-alerts'";
const CURL = "curl -X POST https://api.watchtower.dev/v1/monitors \\\n  -H 'Authorization: Bearer wt_live_…' \\\n  -d url='https://api.acme.dev/health' \\\n  -d interval=30";
function Hero({ onCta }) {
  const [tab, setTab] = React.useState('YAML');
  return <section style={{ padding: 'var(--space-section) 0' }}><Container style={{ display: 'grid', gap: 48, alignItems: 'center' }} className="site-split-7-5">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div><WT.Badge tone="yellow">New</WT.Badge> <span style={{ fontSize: 13, color: 'var(--text-body)', marginLeft: 8 }}>Heartbeat monitors for cron jobs</span></div>
      <h1 style={H.xl}>Know when your stack breaks before your users do.</h1>
      <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: 'var(--text-body)', maxWidth: 560 }}>Watchtower checks your sites, APIs and scheduled jobs from five regions and alerts you in seconds. Every workspace is private to you and your team.</p>
      <div style={{ display: 'flex', gap: 12 }}><WT.Button size="lg" magnetic onClick={onCta}>Start free</WT.Button><WT.Button size="lg" variant="secondary" iconRight="arrow-right">Read the docs</WT.Button></div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Free for 10 monitors. No card required.</div>
    </div>
    <WT.CodeWindow title={tab === 'YAML' ? 'watchtower.yml' : 'terminal'} tabs={['YAML', 'cURL']} activeTab={tab} onTab={setTab} code={tab === 'YAML' ? YAML : CURL} status={tab === 'YAML' ? 'Synced · 2 monitors · 1 alert channel' : '201 Created · mon_8f2a1c'} />
  </Container></section>;
}
function Stats() {
  return <section style={{ padding: '0 0 var(--space-section)' }}><Container className="site-stats" style={{ display: 'grid', gap: 32, borderTop: '1px solid var(--hairline)', paddingTop: 48 }}>
    <WT.StatCallout value="30s" label="Shortest check interval on every paid plan" />
    <WT.StatCallout value="5" label="Check regions across three continents" />
    <WT.StatCallout value="2.8k+" label="Workspaces monitoring production" />
    <WT.StatCallout value="< 10s" label="From failed check to alert in your inbox" />
  </Container></section>;
}
function Features() {
  const F = [
    { icon: 'globe', t: 'HTTP, TCP and DNS checks', d: 'Status codes, response bodies, TLS expiry and latency budgets from up to five regions.' },
    { icon: 'clock', t: 'Heartbeats for cron jobs', d: 'Give each job a URL to ping. Missed pings open an incident automatically.' },
    { icon: 'bell-ring', t: 'Alerts where you work', d: 'Email, Slack, Discord or any webhook. Route by monitor and severity.' },
    { icon: 'radio-tower', t: 'Public status pages', d: 'Publish the monitors you choose on your own domain. Everything else stays private.' },
    { icon: 'lock', t: 'Private workspaces', d: 'Separate workspaces for personal projects, your team and each client. Data never crosses between them.' },
  ];
  return <section style={{ padding: 'var(--space-section) 0', background: 'linear-gradient(180deg, var(--surface-nested), rgba(255,255,255,0))', borderTop: '1px solid var(--hairline)', borderBottom: '1px solid var(--hairline)' }}><Container>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48, maxWidth: 720 }}><span style={H.eyebrow}>Product</span><h2 style={H.lg}>Monitoring sized for one person or a small team.</h2></div>
    <div className="site-features" style={{ display: 'grid', gap: 16 }}>
      <WT.Card variant="yellow" padding="xl" tilt style={{ gridRow: 'span 2', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><span style={{ ...H.eyebrow, color: 'rgba(16,18,0,.66)' }}>Setup</span><h3 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: '-1px', lineHeight: 1.2 }}>First monitor running in under five minutes.</h3><p style={{ margin: 0, fontSize: 16, lineHeight: 1.55 }}>Paste a URL or commit a watchtower.yml. Watchtower picks it up and starts checking.</p></div>
        <div><WT.Button variant="inverse" iconRight="arrow-right">See the quickstart</WT.Button></div>
      </WT.Card>
      {F.map(f => <WT.Card key={f.t} padding="xl"><div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><WT.Icon name={f.icon} size={22} color="var(--on-dark)" /><h3 style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 600, color: 'var(--on-dark)' }}>{f.t}</h3><p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--text-body)' }}>{f.d}</p></div></WT.Card>)}
    </div>
  </Container></section>;
}
function ProductShot() {
  const days = Array.from({ length: 90 }, (_, i) => i === 61 ? 'down' : i === 30 || i === 77 ? 'degraded' : 'up');
  return <section style={{ padding: 'var(--space-section) 0' }}><Container className="site-split-5-7" style={{ display: 'grid', gap: 48, alignItems: 'center' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><span style={H.eyebrow}>History</span><h2 style={H.md}>Ninety days of uptime, one glance.</h2><p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: 'var(--text-body)' }}>Every check is kept in your workspace. Hover a day to see the incidents and response times behind it.</p></div>
    <WT.Card title="api.acme.dev" icon="globe" action={<WT.Badge tone="up" dot>Operational</WT.Badge>}>
      <WT.UptimeBar days={days} uptime="99.97%" height={40} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 20 }}>
        {[['p95', '142ms'], ['Incidents', '3'], ['MTTR', '4m 12s']].map(([k, v]) => <div key={k} style={{ background: 'var(--surface-nested-strong)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 16 }}><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k}</div><div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--on-dark)', marginTop: 4 }}>{v}</div></div>)}
      </div>
    </WT.Card>
  </Container></section>;
}
function CtaBand({ onCta }) {
  return <section style={{ padding: '0 0 var(--space-section)' }}><Container>
    <div className="wt-mat-neon" style={{ borderRadius: 'var(--radius-lg)', padding: 'clamp(28px, 6vw, 64px)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><h2 style={{ ...H.md, color: 'var(--on-yellow)' }}>Start watching in five minutes.</h2><p style={{ margin: 0, fontSize: 16 }}>Free for 10 monitors. Upgrade when your team grows.</p></div>
      <div style={{ display: 'flex', gap: 12 }}><WT.Button size="lg" variant="inverse" onClick={onCta}>Create a workspace</WT.Button></div>
    </div>
  </Container></section>;
}
Object.assign(window, { Container, H, Hero, Stats, Features, ProductShot, CtaBand });
