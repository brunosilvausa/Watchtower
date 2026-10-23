function PricingTier({ name, price, per, desc, features, featured, cta }) {
  const fg = featured ? 'var(--on-yellow)' : 'var(--on-dark)';
  const sub = featured ? 'rgba(16,18,0,.74)' : 'var(--text-secondary)';
  return <div className={featured ? 'wt-mat-neon' : 'wt-mat-frosted'} style={{ height: '100%', boxSizing: 'border-box', borderRadius: 'var(--radius-lg)', padding: 32, display: 'flex', flexDirection: 'column', gap: 24, color: fg }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.3px' }}>{name}</span>{featured && <WT.Badge style={{ background: 'var(--canvas)', color: 'var(--primary)' }} uppercase>Most popular</WT.Badge>}</div>
      <span style={{ fontSize: 14, lineHeight: 1.55, color: sub }}>{desc}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}><span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-1px' }}>{price}</span><span style={{ fontSize: 14, color: sub }}>{per}</span></div>
    <WT.Button variant={featured ? 'inverse' : 'secondary'} fullWidth>{cta}</WT.Button>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {features.map(f => <div key={f} style={{ display: 'flex', gap: 10, fontSize: 14, color: featured ? 'var(--on-yellow)' : 'var(--text-body-strong)' }}><WT.Icon name="check" size={16} color={featured ? 'var(--on-yellow)' : 'var(--primary)'} style={{ marginTop: 2 }} />{f}</div>)}
    </div>
  </div>;
}
function PricingPage() {
  const [cycle, setCycle] = React.useState('yearly');
  const y = cycle === 'yearly';
  return <section style={{ padding: '96px 0' }}><Container>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', marginBottom: 48 }}>
      <span style={H.eyebrow}>Pricing</span><h1 style={H.lg}>Pay per workspace, not per seat.</h1>
      <WT.Tabs value={cycle} onChange={setCycle} items={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly · 2 months free' }]} />
    </div>
    <div className="site-pricing" style={{ display: 'grid', gap: 16, alignItems: 'stretch' }}>
      <PricingTier name="Free" price="$0" per="forever" desc="For side projects and homelabs." cta="Start free" features={['10 monitors', '3-minute checks', '1 region', 'Email alerts', '7-day history']} />
      <WT.Tilt><PricingTier featured name="Team" price={y ? '$12' : '$15'} per="/ workspace / month" desc="For small teams running production." cta="Start 14-day trial" features={['100 monitors', '30-second checks', '5 regions', 'Slack, Discord, webhooks', '90-day history', 'Unlimited members']} /></WT.Tilt>
      <PricingTier name="Agency" price={y ? '$39' : '$49'} per="/ month" desc="For consultants managing client workspaces." cta="Talk to us" features={['10 Team workspaces', 'Custom status page domains', 'Per-client alert routing', 'Audit log', '1-year history']} />
    </div>
  </Container></section>;
}
Object.assign(window, { PricingTier, PricingPage });
