function PgSlider({ label, value, min, max, step, unit, onChange }) {
  return <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 150, flex: 1 }}>
    <span style={{ display: 'flex', justifyContent: 'space-between', ...window.WatchtowerDesignSystem_54a35d.Typography.style('label'), color: 'var(--text-strong)' }}><span>{label}</span><span className="wt-num" style={{ color: 'var(--text-tertiary)' }}>{value}{unit}</span></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} style={{ accentColor: 'var(--primary)' }} />
  </label>;
}
function SpringRow({ label, cfg, go, note }) {
  const { SpatialMotion } = window.WatchtowerDesignSystem_54a35d;
  const dot = React.useRef(null), sp = React.useRef(null);
  React.useEffect(() => { sp.current = SpatialMotion.createSpring([0], cfg, v => { if (dot.current) dot.current.style.transform = 'translateX(' + v[0].toFixed(1) + 'px)'; }); return () => sp.current.stop(); }, []);
  React.useEffect(() => { sp.current && sp.current.config(cfg); }, [cfg.stiffness, cfg.damping]);
  React.useEffect(() => { if (!dot.current || !sp.current) return; const w = dot.current.parentElement.clientWidth - 30; sp.current.set([go ? w : 0], SpatialMotion.prefersReducedMotion()); }, [go]);
  const z = (cfg.damping / (2 * Math.sqrt(cfg.stiffness))).toFixed(2);
  return <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 16, alignItems: 'center' }}>
    <div><div style={{ ...window.WatchtowerDesignSystem_54a35d.Typography.style('label'), color: 'var(--text-primary)' }}>{label}</div><div className="k">k {cfg.stiffness} · c {cfg.damping} · ζ {z}{note ? ' · ' + note : ''}</div></div>
    <div style={{ position: 'relative', height: 30, borderRadius: 999, background: 'var(--surface-inset)', boxShadow: 'var(--inset-well)', border: '1px solid var(--border-subtle)' }}>
      <span ref={dot} style={{ position: 'absolute', top: 3, left: 3, width: 22, height: 22, borderRadius: 999, background: 'var(--material-neon-bg)', boxShadow: 'var(--material-neon-edge), var(--glow-primary)' }} />
    </div>
  </div>;
}
function SpatialSection() {
  const WT = window.WatchtowerDesignSystem_54a35d || {};
  const { Tilt, Card, StatCard, Button, IconButton, Magnetic, Dialog, Select, Tooltip, Tabs, Sidebar, Switch, Input, Badge, SpatialMotion } = WT;
  const [c, setC] = React.useState({ tilt: 6, perspective: 1200, lift: 20, stiffness: 200, damping: 24, reflection: 1, duration: 1 });
  const set = k => v => setC(p => ({ ...p, [k]: v }));
  const [reduced, setReduced] = React.useState(document.documentElement.dataset.motion === 'reduce');
  const [go, setGo] = React.useState(false);
  const [dlg, setDlg] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [nav, setNav] = React.useState('overview');
  const [range, setRange] = React.useState('24h');
  if (!Tilt || !SpatialMotion) return <p className="sub">Spatial components not in the compiled bundle yet — reload once it rebuilds.</p>;
  const toggleReduced = v => { setReduced(v); SpatialMotion.setMotionPreference(v ? 'reduce' : 'system'); };
  const d = c.duration;
  const scope = reduced ? { '--spatial-perspective': c.perspective + 'px' } : {
    '--spatial-perspective': c.perspective + 'px', '--motion-fast': Math.round(160 * d) + 'ms', '--motion-normal': Math.round(240 * d) + 'ms', '--motion-slow': Math.round(360 * d) + 'ms',
    '--spring-spatial-duration': Math.round(681 * d) + 'ms', '--spring-responsive-duration': Math.round(431 * d) + 'ms', '--spring-expressive-duration': Math.round(631 * d) + 'ms', '--spring-gentle-duration': Math.round(685 * d) + 'ms' };
  const custom = { stiffness: c.stiffness, damping: c.damping, mass: 1 };
  const sub = { ...window.WatchtowerDesignSystem_54a35d.Typography.style('card-title'), color: 'var(--text-primary)', margin: '0 0 12px' };
  const block = { display: 'flex', flexDirection: 'column', gap: 12 };
  return <div style={{ ...scope, display: 'flex', flexDirection: 'column', gap: 36 }}>
    <div className="wt-mat-frosted" style={{ borderRadius: 12, padding: 20, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end' }}>
      <PgSlider label="Tilt" value={c.tilt} min={0} max={8} step={0.5} unit="°" onChange={set('tilt')} />
      <PgSlider label="Perspective" value={c.perspective} min={600} max={2400} step={50} unit="px" onChange={set('perspective')} />
      <PgSlider label="Elevation" value={c.lift} min={0} max={20} step={1} unit="px" onChange={set('lift')} />
      <PgSlider label="Stiffness" value={c.stiffness} min={60} max={600} step={10} unit="" onChange={set('stiffness')} />
      <PgSlider label="Damping" value={c.damping} min={6} max={60} step={1} unit="" onChange={set('damping')} />
      <PgSlider label="Reflection" value={c.reflection} min={0} max={1.5} step={0.05} unit="×" onChange={set('reflection')} />
      <PgSlider label="Duration" value={d} min={0.5} max={2} step={0.1} unit="×" onChange={set('duration')} />
      <Switch checked={reduced} onChange={toggleReduced} label="Simulate reduced motion" description="Sets html[data-motion=reduce]" />
    </div>

    <div><h3 style={sub}>3D tilt</h3>
      <div className="grid" style={{ '--min': '220px' }}>
        {[['subtle', 'Subtle · 3°'], ['medium', 'Medium · 6°'], ['maximum', 'Maximum · 8°']].map(([m, l]) =>
          <Card key={m} tilt={m} title={l} icon="move-3d"><span className="k">Featured summary widget</span><div className="wt-value-lg" style={{ marginTop: 10 }}>99.98%</div></Card>)}
        <Tilt max={c.tilt} lift={c.lift} reflection={c.reflection} spring={custom}><div className="tile wt-mat-frosted" style={{ minHeight: 170 }}><span className="k">Custom · sliders</span><span className="wt-value-lg">{c.tilt}° · {c.lift}px</span></div></Tilt>
        <Card variant="yellow" tilt title="Neon featured" eyebrow="Reflection 0.6×"><span style={{ fontSize: 14 }}>Lower specular on the lit material.</span></Card>
        <StatCard featured highlight icon="activity" label="Uptime" value="99.98" unit="%" delta="0.02%" caption="StatCard featured" />
      </div>
    </div>

    <div><h3 style={sub}>Spring presets</h3>
      <div className="wt-mat-frosted" style={{ borderRadius: 12, padding: 20, ...block, gap: 14 }}>
        {Object.entries(SpatialMotion.SPRINGS).map(([n, s]) => <SpringRow key={n} label={n[0].toUpperCase() + n.slice(1)} cfg={s} go={go} />)}
        <SpringRow label="Custom" cfg={custom} go={go} note="sliders" />
        <div><Button size="sm" icon="play" onClick={() => setGo(!go)}>{go ? 'Return' : 'Play'}</Button></div>
      </div>
    </div>

    <div className="grid" style={{ '--min': '320px', alignItems: 'start' }}>
      <div><h3 style={sub}>Spatial buttons</h3>
        <div className="wt-mat-frosted" style={{ borderRadius: 12, padding: 20, ...block }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}><Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}><Button loading={loading} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1600); }}>{loading ? 'Checking…' : 'Run check'}</Button><Button disabled>Disabled</Button><Button variant="secondary" disabled>Disabled</Button></div>
          <span className="k">Hover: lift −1.5px + neon glow · Press: +1px, scale .985, shadow compresses · Disabled: no lift, no glow</span>
        </div>
      </div>
      <div><h3 style={sub}>Magnetic controls</h3>
        <div className="wt-mat-frosted" style={{ borderRadius: 12, padding: 20, ...block }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <IconButton icon="plus" label="Add (magnetic)" variant="primary" size={44} magnetic />
            <IconButton icon="bell" label="Alerts (magnetic)" dot magnetic />
            <Button magnetic icon="plus">Add monitor</Button>
            <span className="k">vs</span>
            <IconButton icon="bell" label="Alerts (static)" />
            <Button variant="danger" icon="trash-2">Delete · never magnetic</Button>
          </div>
          <span className="k">≤ 4px pull, CSS translate property, mouse only</span>
        </div>
      </div>
    </div>

    <div><h3 style={sub}>Reactive glass reflection</h3>
      <div className="grid" style={{ '--min': '200px' }}>
        {[0, 0.5, 1, c.reflection].map((r, i) => <Tilt key={i} max={0} lift={0} reflection={r}><div className="tile wt-mat-frosted" style={{ minHeight: 140 }}><span className="k">{i === 3 ? 'Custom' : 'Intensity'}</span><span className="wt-value-md">{r}×</span></div></Tilt>)}
      </div>
    </div>

    <div className="grid" style={{ '--min': '320px', alignItems: 'start' }}>
      <div><h3 style={sub}>Floating panels & modals</h3>
        <div className="wt-mat-frosted" style={{ borderRadius: 12, padding: 20, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          <Button onClick={() => setDlg(true)}>Open dialog</Button>
          <Select icon="calendar" value={range} onChange={setRange} options={[{ value: '1h', label: 'Last hour' }, { value: '24h', label: 'Last 24 hours' }, { value: '7d', label: 'Last 7 days' }]} />
          <Tooltip content="Checked from 5 regions"><IconButton icon="globe" label="Regions" /></Tooltip>
        </div>
      </div>
      <div><h3 style={sub}>Navigation</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Sidebar active={nav} onSelect={setNav} style={{ height: 300 }} sections={[{ items: [{ id: 'overview', label: 'Overview', icon: 'layout-dashboard' }, { id: 'monitors', label: 'Monitors', icon: 'activity', badge: 24 }, { id: 'incidents', label: 'Incidents', icon: 'siren', badge: 1, badgeTone: 'down' }, { id: 'settings', label: 'Settings', icon: 'settings' }] }]} />
          <Tabs value={range} onChange={setRange} items={['1h', '24h', '7d']} />
        </div>
      </div>
    </div>

    <div><h3 style={sub}>Reduced motion</h3>
      <div className="wt-mat-frosted" style={{ borderRadius: 12, padding: 8, overflowX: 'auto' }}>
        <table className="c"><thead><tr><th>Interaction</th><th>Full motion</th><th>Reduced motion</th></tr></thead><tbody>
          {[['Card tilt / reflection', 'Pointer tilt ≤ 8°, lift ≤ 20px, specular follows cursor', 'Static — no tracking'],
            ['Background parallax', 'Two light layers drift with pointer (gentle spring)', 'Static'],
            ['Magnetic controls', '≤ 4px pull', 'Off'],
            ['Buttons', 'Spring lift −1.5px, press +1px / .985', 'Colour + shadow change only'],
            ['Dialog', 'Forward 14px + scale .96 → 1 on spatial spring', 'Opacity fade (160ms)'],
            ['Menus / tooltips', 'Drop 4px + scale .98 → 1', 'Opacity fade'],
            ['Tabs / sidebar indicator', 'Slides on spatial spring', 'Jumps instantly'],
            ['Switch / checkbox', 'Thumb + check on expressive spring', 'Instant, colour transition kept'],
            ['Spinner', 'Rotates', 'Rotates (functional feedback)']].map(r => <tr key={r[0]}><td style={{ color: 'var(--text-strong)' }}>{r[0]}</td><td style={{ color: 'var(--text-secondary)' }}>{r[1]}</td><td style={{ color: 'var(--text-secondary)' }}>{r[2]}</td></tr>)}
        </tbody></table>
      </div>
    </div>

    <Dialog open={dlg} onClose={() => setDlg(false)} title="Add monitor" description="Spatial entry: forward + scale on the spatial spring. Exit is faster and shorter. Focus is trapped and restored; Esc closes."
      actions={<><Button variant="ghost" onClick={() => setDlg(false)}>Cancel</Button><Button onClick={() => setDlg(false)}>Create</Button></>}>
      <Input label="URL" mono placeholder="https://api.example.com/health" />
    </Dialog>
  </div>;
}
window.SpatialSection = SpatialSection;
