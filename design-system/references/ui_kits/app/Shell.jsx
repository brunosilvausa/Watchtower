function useViewport() {
  const [w, setW] = React.useState(window.innerWidth);
  React.useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return w;
}
const VIEW_LABEL = { overview: 'Overview', monitors: 'Monitors', detail: 'Monitors', incidents: 'Incidents', status: 'Status pages', alerts: 'Alert channels', settings: 'Members & settings' };
function AppShell({ view, setView, workspace, setWorkspace, children, onAdd, onCommand, monitor }) {
  const D = window.WT_DATA;
  const vw = useViewport();
  const mobile = vw < 1024, rail = vw >= 1024 && vw < 1280;
  const [wsOpen, setWsOpen] = React.useState(false);
  const [drawer, setDrawer] = React.useState(false);
  const [userCollapsed, setUserCollapsed] = React.useState(null);
  const collapsed = mobile ? false : userCollapsed ?? rail;
  React.useEffect(() => { if (!mobile) setDrawer(false); }, [mobile]);
  React.useEffect(() => { if (!drawer) return; const k = e => e.key === 'Escape' && setDrawer(false); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [drawer]);
  const down = D.monitors.filter(m => m.status === 'down').length;
  const go = id => { setView(id); setDrawer(false); };
  const crumbs = [{ label: workspace.name, onClick: () => go('overview') }, { label: VIEW_LABEL[view] || 'Overview', onClick: view === 'detail' ? () => go('monitors') : undefined }];
  if (view === 'detail' && monitor) crumbs.push({ label: monitor.name });
  const sidebar = (
    <div style={{ position: 'relative', zIndex: 5, display: 'flex', height: '100%' }}>
      <WT.Sidebar active={view === 'detail' ? 'monitors' : view} onSelect={go} collapsed={collapsed} onCollapsedChange={mobile ? undefined : setUserCollapsed}
        workspace={{ ...workspace, onClick: () => setWsOpen(!wsOpen) }}
        sections={[
          { items: [
            { id: 'overview', label: 'Overview', icon: 'layout-dashboard' },
            { id: 'monitors', label: 'Monitors', icon: 'activity', badge: D.monitors.length },
            { id: 'incidents', label: 'Incidents', icon: 'siren', badge: down || null, badgeTone: 'down' },
            { id: 'status', label: 'Status pages', icon: 'radio-tower' },
          ] },
          { label: 'Workspace', items: [
            { id: 'alerts', label: 'Alert channels', icon: 'bell-ring' },
            { id: 'settings', label: 'Members & settings', icon: 'users' },
          ] },
        ]}
        footer={<div style={{ padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--surface-inset)', boxShadow: 'var(--inset-well)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ ...WT.Typography.style('caption'), color: 'var(--text-tertiary)' }}>Check quota</span>
          <WT.SegmentGauge value={63} segments={14} height={14} scale={false} />
          <span style={{ ...WT.Typography.style('caption'), color: 'var(--text-secondary)', marginTop: 4 }}>63% of 2M checks used</span>
        </div>} />
      {wsOpen && <div role="menu" aria-label="Switch workspace" style={{ position: 'absolute', top: collapsed ? 80 : 120, left: 16, width: 232, zIndex: 30, padding: 4, borderRadius: 'var(--radius-md)' }} className="wt-mat-overlay wt-pop-in">
        <div style={{ padding: '8px 10px 6px', ...WT.Typography.style('overline'), letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Your workspaces</div>
        {D.workspaces.map(w => <button key={w.id} role="menuitemradio" aria-checked={w.id === workspace.id} type="button" onClick={() => { setWorkspace(w); setWsOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', minHeight: 'max(0px, var(--touch-min))', border: 0, borderRadius: 'var(--radius-sm)', cursor: 'pointer', ...WT.Typography.style('body-sm'), color: w.id === workspace.id ? 'var(--text-primary)' : 'var(--text-secondary)', background: w.id === workspace.id ? 'var(--surface-nested-hover)' : 'transparent', textAlign: 'left' }}>
          {w.name}{w.id === workspace.id && <WT.Icon name="check" size={14} color="var(--primary)" />}</button>)}
      </div>}
    </div>
  );
  return (
    <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 20, padding: 'var(--space-page-y) var(--space-page-x)', height: '100vh', boxSizing: 'border-box' }}>
      {!mobile && sidebar}
      {mobile && drawer && <div onClick={() => setDrawer(false)} style={{ position: 'fixed', inset: 0, zIndex: 'var(--layer-4)', background: 'var(--scrim)', padding: 12 }} className="wt-pop-in">
        <div role="dialog" aria-modal="true" aria-label="Navigation" onClick={e => e.stopPropagation()} style={{ height: '100%', width: 'min(280px, 86vw)' }}>{sidebar}</div>
      </div>}
      <main id="main" tabIndex={-1} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', paddingRight: 4, outline: 'none' }}>
        <WT.AppTopBar user={D.user} breadcrumbs={crumbs} onCommand={onCommand} onMenu={mobile ? () => setDrawer(true) : undefined} searchPlaceholder="Search pages, monitors, actions…" actions={<>
          <WT.IconButton icon="bell" label={'Notifications, ' + down + ' unresolved'} dot magnetic onClick={() => setView('incidents')} />
          {vw >= 600 ? <WT.Button icon="plus" magnetic onClick={onAdd}>Add monitor</WT.Button> : <WT.IconButton icon="plus" label="Add monitor" variant="primary" onClick={onAdd} />}
        </>} />
        <div style={{ paddingTop: 16, paddingBottom: 24 }}>{children}</div>
      </main>
    </div>
  );
}
function PageHeader({ title, sub, children }) {
  return <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
    <div style={{ minWidth: 0 }}><h1 className="wt-page-heading" style={{ margin: 0 }}>{title}</h1>
      {sub && <p style={{ margin: '6px 0 0', ...WT.Typography.style('body-sm'), color: 'var(--text-tertiary)' }}>{sub}</p>}</div>
    {children && <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>}
  </div>;
}
Object.assign(window, { AppShell, PageHeader, useViewport });
