"use client";
import { useState } from "react";
import { AppTopBar, Badge, BarChart, Button, Card, CodeWindow, CommandPalette, DataTable, Dialog, DonutChart, Input, LineChart, SegmentGauge, Sidebar, StatCard, Toast, UptimeBar } from "@design-system";

export function ShowcaseFeedback() {
  const [dialog, setDialog] = useState(false); const [toast, setToast] = useState(false);
  return <div className="ds-stack"><div className="ds-row"><Button variant="secondary" onClick={() => setDialog(true)}>Open dialog</Button><Button variant="outline" onClick={() => setToast(true)}>Show toast</Button></div>
    <Dialog open={dialog} onClose={() => setDialog(false)} title="Inspect dialog" description="A local demonstration. Nothing will be saved." actions={<Button onClick={() => setDialog(false)}>Close example</Button>}><Input label="Example name" placeholder="Workspace name" /></Dialog>
    {toast && <Toast title="Example complete" tone="up" onDismiss={() => setToast(false)}>Local interaction only. No changes were saved.</Toast>}
  </div>;
}
const rows = [{ id: "api-example", host: "api.example.com", status: "Operational", tone: "up" as const, latency: "142ms" }, { id: "web-example", host: "www.example.com", status: "Degraded", tone: "degraded" as const, latency: "481ms" }];
export function ShowcaseData() {
  const [palette, setPalette] = useState(false); const [selected, setSelected] = useState<string>();
  const [message, setMessage] = useState("Choose a local action.");
  return <div className="ds-stack">
    <AppTopBar title="Workspace preview · Synthetic data" onSearch={() => setPalette(true)} />
    <CommandPalette open={palette} onClose={() => setPalette(false)} items={[{ id: "inspect", label: "Inspect tokens", hint: "Local example", onSelect: () => setMessage("Token inspection selected.") }, { id: "preview", label: "Preview components", onSelect: () => setMessage("Component preview selected.") }]} />
    <p className="wt-caption" role="status">{message}</p>
    <Sidebar items={[{ label: "Overview", href: "#composition" }, { label: "Controls", href: "#forms" }, { label: "Materials", href: "#materials" }]} active="#composition" label="Demo navigation" />
    <div className="ds-grid"><StatCard label="Sample uptime" value="99.98%" caption="Synthetic · last 24 hours" featured /><StatCard label="Sample latency" value="142" unit="ms" caption="Synthetic · p95" /><StatCard label="Sample checks" value="1,204" caption="Synthetic · no checks executed" /></div>
    <div className="ds-grid-two"><Card material="solid"><LineChart label="Response time · synthetic" labels={["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"]} series={[{ name: "Current", data: [82, 110, 94, null, 142, 120], primary: true, area: true }, { name: "Previous", data: [98, 130, 112, 160, 122, 151], dashed: true }]} format={value => `${Math.round(value)}ms`} /></Card><Card material="solid"><BarChart label="Checks · synthetic" data={[18, 25, 13, null, 29]} comparison={[12, 20, 15, 21, 23, 18]} labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]} /></Card></div>
    <div className="ds-grid"><Card material="solid"><DonutChart label="Protocol mix · synthetic" segments={[{ label: "HTTPS", value: 72 }, { label: "TCP", value: 18 }, { label: "Heartbeat", value: 10 }, { label: "Unknown", value: Number.NaN }]} /></Card><Card material="solid" title="Capacity examples"><SegmentGauge value={64} label="Sample utilization" /><SegmentGauge value={Number.NaN} label="Unavailable utilization" /><UptimeBar label="Sample status history" values={["up", "up", "up", "degraded", "down", null, "up", "up", "up"]} /></Card><CodeWindow title="Illustrative config · not executed" code={'name: Example API\nurl: https://example.com/health\ninterval: 60s\n\n# Synthetic showcase only'} /></div>
    <Card material="solid"><DataTable caption="Example endpoints · synthetic data" rows={rows} columns={[{ key: "host", label: "Endpoint", mono: true, render: row => row.host }, { key: "status", label: "Status", render: row => <Badge tone={row.tone} dot>{row.status}</Badge> }, { key: "latency", label: "Latency", render: row => row.latency }]} selectedKey={selected} onRowClick={row => setSelected(row.id)} /></Card>
    <div className="ds-grid"><LineChart label="Empty chart" labels={[]} series={[]} /><LineChart label="Loading chart" labels={[]} series={[]} loading /><LineChart label="Failed chart" labels={[]} series={[]} error="Synthetic error state." /></div>
  </div>;
}
