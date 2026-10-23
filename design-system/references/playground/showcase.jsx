const SC = () => window.WatchtowerDesignSystem_54a35d || {};
const scCard = { borderRadius: 12, padding: 20 };
const scH = { ...window.WatchtowerDesignSystem_54a35d.Typography.style('card-title'), color: 'var(--text-primary)', margin: '0 0 12px' };
function ScBlock({ title, children, style }) { return <div style={style}><h3 style={scH}>{title}</h3>{children}</div>; }

function ShowcaseNav() {
  const groups = [['Foundations', ['color', 'typography', 'spacing-radius-shadows', 'elevation', 'borders-edges']], ['Materials', ['materials']], ['Lighting', ['ambient-lighting']],
    ['Spatial', ['spatial-interactions']], ['Components', ['components', 'more-components']], ['Data viz', ['data-visualization']], ['Accessibility', ['accessibility', 'contrast-audit']], ['Responsive', ['responsive-preview']]];
  return <nav aria-label="Showcase sections" className="wt-mat-frosted" style={{ borderRadius: 12, padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: '6px 18px', alignItems: 'center' }}>
    {groups.map(([g, ids]) => <a key={g} href={'#' + ids[0]} style={{ ...window.WatchtowerDesignSystem_54a35d.Typography.style('label'), color: 'var(--text-secondary)', textDecoration: 'none', minHeight: 'max(28px, var(--touch-min))', display: 'inline-flex', alignItems: 'center' }}>{g}</a>)}
  </nav>;
}

function FoundationsExtra() {
  const sp = [['xxs', 4], ['xs', 8], ['sm', 12], ['md', 16], ['lg', 24], ['xl', 32], ['xxl', 48], ['band', 64], ['section', 96]];
  const sem = ['--space-card', '--space-card-lg', '--space-grid', '--space-page-x', '--control-height', '--icon-button-size', '--touch-min'];
  const tok = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  return <div className="grid" style={{ '--min': '300px', alignItems: 'start' }}>
    <ScBlock title="Spacing scale"><div className="wt-mat-frosted" style={{ ...scCard, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {sp.map(([n, v]) => <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span className="k" style={{ width: 120 }}>--space-{n} · {v}</span><span style={{ height: 10, width: v * 2, borderRadius: 2, background: 'var(--primary)' }} /></div>)}
      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 0' }} />
      {sem.map(n => <div key={n} className="k">{n} → {tok(n)}</div>)}
    </div></ScBlock>
    <ScBlock title="Border radius"><div className="wt-mat-frosted" style={{ ...scCard, display: 'flex', flexWrap: 'wrap', gap: 14 }}>
      {[['xs', '4px'], ['sm', '6px'], ['md', '8px'], ['lg', '12px'], ['pill', '9999px'], ['full', '50%']].map(([n, v]) => <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <span style={{ width: n === 'full' ? 52 : 64, height: 52, borderRadius: 'var(--radius-' + n + ')', background: 'var(--surface-nested-strong)', border: '1px solid var(--border-strong)' }} /><span className="k">{n} · {v}</span></div>)}
    </div></ScBlock>
    <ScBlock title="Shadows"><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 14 }}>
      {['--elev-1-shadow', '--elev-2-shadow', '--elev-3-shadow', '--elev-4-shadow', '--glow-primary', '--glow-focus'].map(t => <div key={t} style={{ height: 72, borderRadius: 12, background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(' + t + ')', display: 'flex', alignItems: 'flex-end', padding: 10 }}><span className="k">{t}</span></div>)}
    </div></ScBlock>
  </div>;
}

function MoreComponents() {
  const { DataTable, StatusDot, Badge, Sidebar, AppTopBar, CommandPalette, Select, Tooltip, IconButton, Input, Button, Dialog } = SC();
  const [cmd, setCmd] = React.useState(false);
  const [nav, setNav] = React.useState('monitors');
  const [col, setCol] = React.useState(false);
  const [sel, setSel] = React.useState('m2');
  const rows = [{ id: 'm1', name: 'api.acme.dev', type: 'HTTPS', p95: 142, uptime: '99.98%', status: 'up' }, { id: 'm2', name: 'checkout.acme.dev', type: 'HTTPS', p95: 1204, uptime: '99.71%', status: 'degraded' }, { id: 'm3', name: 'Nightly DB backup', type: 'Heartbeat', p95: null, uptime: '96.67%', status: 'down' }];
  const cols = [{ key: 'name', label: 'Monitor', render: (v, r) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><StatusDot status={r.status} />{v}</span> }, { key: 'type', label: 'Type', muted: true },
    { key: 'p95', label: 'p95', align: 'right', mono: true, render: v => v == null ? <span style={{ color: 'var(--text-disabled)' }} title="Not measured for heartbeats">—</span> : v.toLocaleString() + 'ms' }, { key: 'uptime', label: 'Uptime', align: 'right', mono: true },
    { key: 'status', label: 'Status', render: s => <Badge tone={s} dot>{s === 'up' ? 'Up' : s === 'down' ? 'Down' : 'Degraded'}</Badge> }];
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
    <ScBlock title="Tables — default · selected · loading · empty · error">
      <div className="grid" style={{ '--min': '420px' }}>
        <div className="wt-mat-frosted" style={scCard}><DataTable caption="Monitors" rows={rows} columns={cols} selectedKey={sel} onRowClick={r => setSel(r.id)} /></div>
        <div className="wt-mat-frosted" style={scCard}><DataTable caption="Monitors loading" loading loadingRows={3} rows={[]} columns={cols} /></div>
        <div className="wt-mat-frosted" style={scCard}><DataTable caption="Filtered monitors" rows={[]} columns={cols} emptyText="No monitors match this filter" /></div>
        <div className="wt-mat-frosted" style={scCard}><DataTable caption="Incidents" rows={[]} columns={cols} error="Couldn’t load incidents — request timed out" onRetry={() => {}} /></div>
      </div>
    </ScBlock>
    <ScBlock title="Navigation — header, breadcrumbs, sidebar rail, command palette">
      <div className="wt-mat-frosted" style={{ ...scCard, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AppTopBar breadcrumbs={[{ label: 'Acme Ops', onClick: () => {} }, { label: 'Monitors', onClick: () => {} }, { label: 'api.acme.dev' }]} user={{ name: 'Maya Ortiz', role: 'Owner' }} onCommand={() => setCmd(true)} actions={<IconButton icon="bell" label="Notifications" dot />} />
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Sidebar active={nav} onSelect={setNav} collapsed={col} onCollapsedChange={setCol} style={{ height: 320 }} workspace={{ name: 'Acme Ops', plan: 'Team plan' }}
            sections={[{ items: [{ id: 'overview', label: 'Overview', icon: 'layout-dashboard' }, { id: 'monitors', label: 'Monitors', icon: 'activity', badge: 24 }, { id: 'incidents', label: 'Incidents', icon: 'siren', badge: 1, badgeTone: 'down' }] }]} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
            <Button variant="secondary" icon="command" onClick={() => setCmd(true)}>Open command palette</Button>
            <span className="k">⌘K / Ctrl+K in the app kit. ↑↓ navigate · ↵ open · esc close. Only existing pages and actions.</span>
          </div>
        </div>
      </div>
      <CommandPalette open={cmd} onClose={() => setCmd(false)} items={[{ id: 'o', group: 'Pages', label: 'Overview', icon: 'layout-dashboard' }, { id: 'm', group: 'Pages', label: 'Monitors', icon: 'activity' }, { id: 'i', group: 'Pages', label: 'Incidents', icon: 'siren' }, { id: 'a', group: 'Monitors', label: 'api.acme.dev', icon: 'globe', hint: 'HTTPS' }, { id: 'add', group: 'Actions', label: 'Add monitor', icon: 'plus' }]} />
    </ScBlock>
    <ScBlock title="Forms — default · focus · required · valid · error · read-only · disabled">
      <div className="wt-mat-frosted" style={{ ...scCard, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <Input label="Name" placeholder="Production API" hint="Shown in alerts" />
        <Input label="URL" required mono placeholder="https://" />
        <Input label="Expected status" mono defaultValue="200" valid />
        <Input label="Timeout" defaultValue="abc" suffix="ms" error="Enter a number of milliseconds" />
        <Input label="Monitor ID" mono defaultValue="mon_8f2a1c" readOnly />
        <Input label="Region" defaultValue="eu-central" disabled />
        <Select label="Interval" options={['30 seconds', '1 minute', '5 minutes']} value="30 seconds" />
        <Select label="Disabled" options={['Weekly']} disabled />
      </div>
    </ScBlock>
  </div>;
}

function DataVizSection() {
  const { LineChart, BarChart, DonutChart, StatCard, Sparkline, Tabs, Button, StateMessage, Card } = SC();
  const [range, setRange] = React.useState('7d');
  const [load, setLoad] = React.useState(false);
  const R = { '24h': { l: ['00', '03', '06', '09', '12', '15', '18', '21'], a: [140, 152, 138, 190, 226, 146, 142, 139], b: [138, 147, 142, 160, 170, 150, 144, 141] },
    '7d': { l: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], a: [148, 156, null, 212, 166, 139, 142], b: [150, 158, 149, 160, 152, 146, 147] },
    '30d': { l: Array.from({ length: 30 }, (_, i) => String(i + 1)), a: Array.from({ length: 30 }, (_, i) => Math.round(150 + 25 * Math.sin(i / 3) + (i % 7 === 3 ? 40 : 0))), b: Array.from({ length: 30 }, (_, i) => Math.round(155 + 12 * Math.sin(i / 4))) } }[range];
  const reload = () => { setLoad(true); setTimeout(() => setLoad(false), 1200); };
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}><Tabs value={range} onChange={setRange} items={['24h', '7d', '30d']} /><Button size="sm" variant="secondary" icon="rotate-cw" onClick={reload}>Simulate loading</Button>
      <span className="k">Sample data, for illustration only. Wed in 7d is missing (null) → drawn as a gap, not 0.</span></div>
    <ScBlock title="Metric cards — featured · secondary · trend · unavailable · loading">
      <div className="grid" style={{ '--min': '220px' }}>
        <StatCard featured highlight loading={load} icon="activity" label="Uptime" value="99.94" unit="%" delta="0.02%" caption="vs last week" />
        <StatCard emphasis="secondary" loading={load} icon="timer" label="p95 latency" value="142" unit="ms" delta="4.1%" deltaDirection="down" deltaTone="up" caption="vs last week" trend={R.a} />
        <StatCard emphasis="secondary" loading={load} icon="wallet" label="Monthly spend" value="$1,284.50" delta="$96.20" deltaDirection="up" deltaTone="down" caption="vs September" />
        <StatCard emphasis="secondary" loading={load} icon="heart-pulse" label="Heartbeat latency" value={null} unavailable="Not measured for heartbeat monitors" />
      </div>
    </ScBlock>
    <div className="grid" style={{ '--min': '420px', alignItems: 'start' }}>
      <ScBlock title="Line + area — primary series in neon, comparison muted"><div className="wt-mat-frosted" style={scCard}>
        <LineChart loading={load} legend ariaLabel={'p95 latency, ' + range} height={220} labels={R.l} format={v => v + 'ms'} series={[{ name: 'p95', data: R.a, color: 'var(--chart-series-primary)', area: true }, { name: 'Previous period', data: R.b, dashed: true, color: 'var(--chart-series-2)' }]} />
      </div></ScBlock>
      <ScBlock title="Bar — negatives below zero, missing as dashed placeholder"><div className="wt-mat-frosted" style={scCard}>
        <BarChart loading={load} ariaLabel="Net change in monitors per week" labels={['W36', 'W37', 'W38', 'W39', 'W40', 'W41', 'W42']} data={[3, 1, -2, null, 4, 0, 2]} comparison={[2, 2, 1, 1, 2, 1, 2]} name="Net change" comparisonName="Quarter average" format={v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v)} />
      </div></ScBlock>
      <ScBlock title="Monochrome line, single series"><div className="wt-mat-frosted" style={scCard}>
        <LineChart loading={load} ariaLabel="Checks per month in millions" height={180} labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']} format={v => v + 'M'} min={0} series={[{ name: 'Checks', data: [2.1, 2.4, 2.9, 2.7, 3.0, 3.3, 3.1, 3.6, 3.9, 4.2, 4.4, 4.6], color: 'var(--chart-series-1)', area: true }]} />
      </div></ScBlock>
      <ScBlock title="Donut + sparklines"><div className="wt-mat-frosted" style={{ ...scCard, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <DonutChart ariaLabel="Monitors by status" size={150} thickness={14} value="24" label="Monitors" segments={[{ label: 'Up', value: 21, color: 'var(--status-up)' }, { label: 'Degraded', value: 2, color: 'var(--status-degraded)' }, { label: 'Down', value: 1, color: 'var(--status-down)' }]} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><span className="k" style={{ width: 90 }}>default</span><Sparkline data={R.a} ariaLabel="p95 trend" /></div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><span className="k" style={{ width: 90 }}>primary</span><Sparkline data={R.b} color="var(--chart-series-primary)" ariaLabel="uptime trend" /></div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><span className="k" style={{ width: 90 }}>gap (null)</span><Sparkline data={[4, 6, null, null, 5, 7, 6]} ariaLabel="partial trend" /></div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><span className="k" style={{ width: 90 }}>&lt; 2 points</span><Sparkline data={[5]} ariaLabel="new monitor" /></div>
        </div>
      </div></ScBlock>
    </div>
    <ScBlock title="Chart states — empty · error · partial">
      <div className="grid" style={{ '--min': '280px' }}>
        <div className="wt-mat-frosted" style={scCard}><LineChart ariaLabel="Empty chart" height={140} labels={[]} series={[{ name: 'p95', data: [null, null, null] }]} emptyText="No checks in this range yet" /></div>
        <div className="wt-mat-frosted" style={scCard}><BarChart ariaLabel="Failed chart" height={140} data={[]} error="Couldn’t load check history" /></div>
        <div className="wt-mat-frosted" style={{ ...scCard, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <StateMessage compact kind="partial" title="2 of 5 regions reporting" description="Values below exclude Singapore, São Paulo and Oregon." />
          <LineChart ariaLabel="Partial chart" height={110} labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']} format={v => v + 'ms'} series={[{ name: 'p95', data: [140, 150, null, null, 146], color: 'var(--chart-series-1)' }]} />
        </div>
      </div>
    </ScBlock>
    <ScBlock title="Product states">
      <div className="grid" style={{ '--min': '260px' }}>
        <Card><StateMessage kind="empty" title="No monitors yet" description="Add a URL and Watchtower starts checking it from five regions." action={<Button icon="plus" size="sm">Add monitor</Button>} /></Card>
        <Card><StateMessage kind="error" title="Couldn’t load incidents" description="The request timed out. Your monitors are still running." action={<Button variant="secondary" size="sm" icon="rotate-cw">Retry</Button>} /></Card>
        <Card><StateMessage kind="unavailable" title="Not available on the Free plan" description="Status pages are part of Team." /></Card>
        <Card><StateMessage kind="success" title="Monitor created" description="First check results arrive within 30 seconds." /></Card>
      </div>
    </ScBlock>
  </div>;
}

function A11ySection() {
  const { Button, IconButton, Input, Switch, Checkbox, Tabs, Badge, SpatialMotion } = SC();
  const [t, setT] = React.useState('a');
  return <div className="grid" style={{ '--min': '320px', alignItems: 'start' }}>
    <ScBlock title="Keyboard focus"><div className="wt-mat-frosted" style={{ ...scCard, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <span className="k">Press Tab through these. Every control shows a 2px neon outline (offset 2px), plus a glow on inputs.</span>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}><Button>Primary</Button><Button variant="secondary">Secondary</Button><IconButton icon="settings" label="Settings" /><Checkbox label="Checkbox" /><Switch label="Switch" /></div>
      <Tabs value={t} onChange={setT} items={[{ value: 'a', label: 'Arrow keys' }, { value: 'b', label: 'move' }, { value: 'c', label: 'selection' }]} />
      <Input label="Input" placeholder="Focus me" />
    </div></ScBlock>
    <ScBlock title="Disabled states"><div className="wt-mat-frosted" style={{ ...scCard, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><Button disabled>Primary</Button><Button variant="secondary" disabled>Secondary</Button><Button variant="outline" disabled>Outline</Button></div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}><Switch disabled label="Disabled switch" /><Checkbox disabled label="Disabled checkbox" /></div>
      <Input label="Disabled input" disabled defaultValue="Can’t edit" />
      <span className="k">Disabled = no lift, no glow, 40–50% emphasis, not-allowed cursor; primary uses --primary-disabled.</span>
    </div></ScBlock>
    <ScBlock title="Meaning without colour"><div className="wt-mat-frosted" style={{ ...scCard, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Badge tone="up" dot>Operational</Badge><Badge tone="degraded" dot>Degraded</Badge><Badge tone="down" dot>Down</Badge></div>
      <span className="k">Status always pairs colour with a word. Deltas pair colour with an arrow, a +/− sign and screen-reader direction text. Bars encode sign by position relative to zero.</span>
      <div style={{ filter: 'grayscale(1)', display: 'flex', gap: 8, flexWrap: 'wrap' }}><Badge tone="up" dot>Operational</Badge><Badge tone="degraded" dot>Degraded</Badge><Badge tone="down" dot>Down</Badge><span className="k">← greyscale check</span></div>
    </div></ScBlock>
    <ScBlock title="Reduced motion · touch targets"><div className="wt-mat-frosted" style={{ ...scCard, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span className="k">Toggle "Simulate reduced motion" in the Spatial section (sets html[data-motion=reduce]). Tilt, parallax, magnetic, springs and chart reveals stop; short fades remain.</span>
      <span className="k">Coarse pointers: --touch-min = 44px raises Buttons, IconButtons, Tabs, Select options, Sidebar items, table rows and legend toggles to ≥ 44px.</span>
      <div style={{ display: 'flex', gap: 10 }}><Button size="sm" variant="secondary" onClick={() => SpatialMotion && SpatialMotion.setMotionPreference('reduce')}>Reduce motion</Button><Button size="sm" variant="ghost" onClick={() => SpatialMotion && SpatialMotion.setMotionPreference('system')}>Follow system</Button></div>
    </div></ScBlock>
  </div>;
}

function ResponsivePreview() {
  const frames = [['Mobile', 375, 760], ['Tablet', 768, 900], ['Desktop', 1440, 900]];
  const [src, setSrc] = React.useState('../ui_kits/app/index.html');
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div style={{ display: 'flex', gap: 8 }}>{[['App', '../ui_kits/app/index.html'], ['Website', '../ui_kits/website/index.html']].map(([l, s]) => <button key={l} type="button" aria-pressed={src === s} onClick={() => setSrc(s)} style={{ minHeight: 'max(32px, var(--touch-min))', padding: '0 14px', borderRadius: 8, border: '1px solid var(--border-default)', background: src === s ? 'var(--surface-nested-hover)' : 'transparent', color: 'var(--text-primary)', ...window.WatchtowerDesignSystem_54a35d.Typography.style('label'), cursor: 'pointer' }}>{l}</button>)}</div>
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
      {frames.map(([n, w, h]) => { const s = n === 'Desktop' ? 0.42 : n === 'Tablet' ? 0.46 : 0.62; return <div key={n} style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="k">{n} · {w}px</span>
        <div style={{ width: w * s, height: h * s, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-default)', boxShadow: 'var(--elev-2-shadow)', background: 'var(--background-base)' }}>
          <iframe title={n + ' preview'} src={src} loading="lazy" style={{ width: w, height: h, border: 0, transform: 'scale(' + s + ')', transformOrigin: '0 0' }} />
        </div></div>; })}
    </div>
    <span className="k">Live kits in iframes; each frame lays out at its true width (media queries respond to the iframe).</span>
  </div>;
}
Object.assign(window, { ShowcaseNav, FoundationsExtra, MoreComponents, DataVizSection, A11ySection, ResponsivePreview });
