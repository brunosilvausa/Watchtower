function SettingsScreen({ workspace, onToast }) {
  const members = [{ id: 1, name: 'Maya Ortiz', email: 'maya@acme.dev', role: 'Owner' }, { id: 2, name: 'Dev Patel', email: 'dev@acme.dev', role: 'Editor' }, { id: 3, name: 'Lena Brandt', email: 'lena@acme.dev', role: 'Viewer' }];
  return <>
    <PageHeader title="Members & settings" sub={workspace.name + ' · ' + workspace.plan} />
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr)', gap: 16, alignItems: 'start' }}>
      <WT.Card title="Members" action={<WT.Button size="sm" icon="user-plus">Invite</WT.Button>}>
        <WT.DataTable columns={[{ key: 'name', label: 'Name', render: (v, r) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><WT.Avatar name={v} size={28} /><span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: 600, color: 'var(--on-dark)' }}>{v}</span><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.email}</span></span></span> }, { key: 'role', label: 'Role', render: v => <WT.Badge tone={v === 'Owner' ? 'yellow' : 'neutral'} uppercase={false}>{v}</WT.Badge> }]} rows={members} />
      </WT.Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <WT.Card title="Alert channels" icon="bell-ring">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <WT.Switch defaultChecked label="Email" description="Owners and editors" onChange={v => onToast('Email alerts ' + (v ? 'on' : 'off'), 'neutral')} />
            <WT.Switch defaultChecked label="Slack · #ops-alerts" description="Down and recovered events" />
            <WT.Switch label="Webhook" description="POST to an endpoint you control" />
          </div>
        </WT.Card>
        <WT.Card title="Data & privacy" icon="shield-check">
          <div style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.55, marginBottom: 14 }}>Check results are stored in this workspace only and kept for 90 days.</div>
          <WT.Checkbox defaultChecked label="Redact response bodies in check logs" />
        </WT.Card>
      </div>
    </div>
  </>;
}
Object.assign(window, { SettingsScreen });
