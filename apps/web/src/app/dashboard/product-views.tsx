"use client";
import { useEffect, useState } from "react";
import { Button, Card, Input } from "@design-system";
import { productRequest, workspacePath, rowText, type ProductRow, type DashboardData } from "@/lib/product-client";
import type { Translate } from "./product-shell";
import { MonitorForm } from "./monitor-form";
import { ResourceForm } from "./resource-form";
import { StatusView } from "../status/[slug]/status-view";
import { MonitorList } from "./monitor-list";
import { Overview } from "./overview";
import { useProductDate } from "./date-preferences";
import { StatusActions } from "./status-actions";
import { PlatformView } from "./platform-view";
import { ExportTools } from "./export-tools";
import { DetailView } from "./detail-view";
import { BillingView } from "./billing-view";
import { SettingsView } from "./settings-view";
import styles from "./product.module.css";
export type ViewProps = { workspaceId: string; path: string; t: Translate; role: string; userName?: string; workspaceName?: string };
export function ProductViews(props: ViewProps) {
  const formatDate = useProductDate(); const { workspaceId, path, t, role } = props; const section = path.split("/")[0];
  const [loadedAt, setLoadedAt] = useState(0);
  const [data, setData] = useState<unknown>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [revision, setRevision] = useState(0);
  const [range, setRange] = useState("7d"); const [query, setQuery] = useState(""); const [editing, setEditing] = useState<ProductRow | null | undefined>(undefined); const [busy, setBusy] = useState(false); const [secret, setSecret] = useState("");
  const reload = () => { setLoading(true); setError(""); setRevision(value => value + 1); setEditing(undefined); };
  useEffect(() => { if (section === "settings" || path.endsWith("/preview")) return; let active = true;
    void productRequest<unknown>(section === "platform" ? "/api/platform" : workspacePath(workspaceId, section ? path : `dashboard?range=${range}`)).then(value => { if (active) { setData(value); setLoadedAt(Date.now()); } }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Connection failed"); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; };
  }, [workspaceId, path, range, revision, section]);
  async function act(resource: string, method: string, body?: unknown) {
    setBusy(true); setError("");
    try { const result = await productRequest<unknown>(workspacePath(workspaceId, resource), method, body); if (result && typeof result === "object" && "token" in result) setSecret(String(result.token).startsWith("invite_") ? `${window.location.origin}/invite?token=${encodeURIComponent(String(result.token))}` : String(result.token)); reload(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Request failed"); } finally { setBusy(false); }
  }
  if (section === "settings") return <SettingsView {...props} />;
  if (section === "status-pages" && path.endsWith("/preview")) return <StatusView slug="" endpoint={workspacePath(workspaceId, path)} preview />;
  const names: Record<string, string> = { monitors: t("Monitores", "Monitors"), incidents: t("Incidentes", "Incidents"), "status-pages": "Status pages", maintenance: t("Manutenção", "Maintenance"), channels: t("Integrações", "Integrations"), team: t("Equipe", "Team"), billing: t("Cobrança", "Billing"), invitations: t("Convites", "Invitations"), policies: t("Políticas de alerta", "Alert policies"), webhooks: "Webhooks", "api-keys": "API", audit: t("Auditoria", "Audit"), platform: t("Plataforma", "Platform") };
  const canWrite = ["owner", "admin", "editor"].includes(role); const canAdmin = ["owner", "admin"].includes(role);
  const creatable = ["monitors", "maintenance"].includes(section) ? canWrite : ["channels", "status-pages", "team", "api-keys", "webhooks", "invitations", "policies"].includes(section) && canAdmin;
  const rows: ProductRow[] = Array.isArray(data) ? data.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object")).map(row => ({ ...row, id: String(row.id ?? row.user_id ?? "") })) : [];
  const filtered = rows.filter(row => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  return <section className={styles.stack}>{section && <div className={styles.between}><div><h1 className="wt-page-heading">{names[section] ?? t("Visão geral", "Overview")}</h1><p className={styles.muted}>{t("Dados persistidos do workspace", "Persisted workspace data")} · {role}</p></div><div className={styles.row}><Button variant="secondary" disabled={loading} onClick={reload}>{t("Atualizar", "Refresh")}</Button>{creatable && <Button onClick={() => setEditing(null)}>{t("Adicionar", "Add")}</Button>}</div></div>}
    {section === "channels" && <Button href="/dashboard/policies" variant="secondary">{t("Políticas de alerta", "Alert policies")}</Button>}
    {section === "team" && <Button href="/dashboard/invitations" variant="secondary">{t("Convites pendentes", "Pending invitations")}</Button>}
    {section === "api-keys" && <Button href="/dashboard/webhooks" variant="secondary">Webhooks</Button>}
    {error && <p role="alert" className="ds-error">{error}</p>}{loading && <p role="status">{t("Carregando…", "Loading…")}</p>}
    {secret && <Card title={t("Copie agora: exibido somente uma vez", "Copy now: shown only once")}><code className={styles.secret}>{secret}</code><Button variant="secondary" onClick={() => setSecret("")}>{t("Fechar", "Close")}</Button></Card>}
    {editing !== undefined && (section === "monitors" ? <MonitorForm workspaceId={workspaceId} row={editing} onSaved={token => { if (token) setSecret(`${window.location.origin}/api/heartbeat/${token}`); reload(); }} onClose={() => setEditing(undefined)} t={t} /> : <ResourceForm workspaceId={workspaceId} section={section === "invitations" ? "team" : section} row={editing} onSaved={value => { if (value) setSecret(value.startsWith("invite_") ? `${window.location.origin}/invite?token=${encodeURIComponent(value)}` : value); reload(); }} onClose={() => setEditing(undefined)} t={t} />)}
    {!loading && !error && !section && Boolean(data) && <Overview userName={props.userName ?? ""} workspaceName={props.workspaceName ?? "Workspace"} data={data as DashboardData} range={range} setRange={value => { if (value === range) return; setLoading(true); setError(""); setRange(value); }} t={t} />}
    {!loading && section === "monitors" && Array.isArray(data) && <><ExportTools rows={rows} section={section} workspaceId={workspaceId} canWrite={canWrite} reload={reload} t={t} /><MonitorList rows={rows} canWrite={canWrite} canAdmin={canAdmin} busy={busy} onEdit={setEditing} onAction={act} t={t} /></>}
    {!loading && section && section !== "monitors" && Array.isArray(data) && <>{["monitors", "incidents", "audit"].includes(section) && <ExportTools rows={rows} section={section} workspaceId={workspaceId} canWrite={canWrite} reload={reload} t={t} />}<Input label={t("Filtrar resultados", "Filter results")} value={query} onChange={event => setQuery(event.target.value)} /><Card><div className={styles.table} role="region" aria-label={names[section]} tabIndex={0}><table><thead><tr><th>{t("Nome / evento", "Name / event")}</th><th>{t("Estado", "State")}</th><th>{t("Detalhes", "Details")}</th><th>{t("Ações", "Actions")}</th></tr></thead><tbody>{filtered.map(row => <tr key={row.id}><td>{rowText(row, row.name ? "name" : row.email ? "email" : row.action ? "action" : "id")}</td><td>{section === "api-keys" ? row.revoked_at ? t("Revogada", "Revoked") : row.expires_at && Date.parse(String(row.expires_at)) <= loadedAt ? t("Expirada", "Expired") : t("Ativa", "Active") : rowText(row, row.status ? "status" : "state")}</td><td>{row.target ? rowText(row, "target") : row.role ? rowText(row, "role") : row.type ? rowText(row, "type") : formatDate(row.created_at)}</td><td><div className={styles.row}>
      {section === "monitors" && <Button size="sm" variant="ghost" href={`/dashboard/monitors/${row.id}`}>{t("Detalhes", "Details")}</Button>}
      {section === "invitations" && canAdmin && !row.accepted_at && !row.cancelled_at && <Button size="sm" variant="secondary" disabled={busy} onClick={() => { void act(`invitations/${row.id}/resend`, "POST"); }}>{t("Reenviar convite", "Resend invitation")}</Button>}
      {section === "team" && canAdmin && <><Button size="sm" variant="secondary" disabled={busy} onClick={() => { const next = window.prompt(t("Permissão: owner, admin, editor ou viewer", "Role: owner, admin, editor or viewer"), String(row.role)); if (next) void act(`team/${String(row.user_id ?? row.id)}`, "PATCH", { role: next }); }}>{t("Alterar permissão", "Change role")}</Button><Button size="sm" variant="danger" disabled={busy} onClick={() => { if (window.confirm(t("Remover membro?", "Remove member?"))) void act(`team/${String(row.user_id ?? row.id)}`, "DELETE"); }}>{t("Remover membro", "Remove member")}</Button></>}
      {section === "monitors" && canWrite && <><Button size="sm" variant="secondary" onClick={() => setEditing(row)}>{t("Editar", "Edit")}</Button><Button size="sm" variant="secondary" disabled={busy} onClick={() => { void act(`monitors/${row.id}`, "PATCH", { status: row.paused === true ? "active" : "paused" }); }}>{row.paused === true ? t("Retomar", "Resume") : t("Pausar", "Pause")}</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => { void act(`monitors/${row.id}/check`, "POST"); }}>{t("Verificar agora", "Check now")}</Button></>}
      {section === "incidents" && <Button size="sm" variant="ghost" href={`/dashboard/incidents/${row.id}`}>{t("Linha do tempo", "Timeline")}</Button>}
      {section === "incidents" && canWrite && <><Button size="sm" variant="secondary" disabled={busy} onClick={() => { void act(`incidents/${row.id}/acknowledge`, "POST"); }}>{t("Reconhecer", "Acknowledge")}</Button><Button size="sm" variant="secondary" disabled={busy} onClick={() => { void act(`incidents/${row.id}/resolve`, "POST", { resolution: t("Resolvido pelo operador", "Resolved by operator") }); }}>{t("Resolver", "Resolve")}</Button></>}
      {section === "maintenance" && canWrite && <Button size="sm" variant="secondary" onClick={() => setEditing(row)}>{t("Editar", "Edit")}</Button>}
      {section === "channels" && canAdmin && <><Button size="sm" variant="secondary" onClick={() => setEditing(row)}>{t("Editar", "Edit")}</Button><Button size="sm" variant="secondary" disabled={busy} onClick={() => { void act(`channels/${row.id}`, "PATCH", { name: row.name, type: row.type, destination: row.destination, credentials: {}, enabled: !row.enabled }); }}>{row.enabled ? t("Desativar", "Disable") : t("Ativar", "Enable")}</Button><Button size="sm" variant="secondary" disabled={busy} onClick={() => { void act(`channels/${row.id}/test`, "POST"); }}>{t("Testar entrega", "Test delivery")}</Button></>}
      {section === "status-pages" && canAdmin && <><StatusActions row={row} workspaceId={workspaceId} t={t} /><Button size="sm" variant="ghost" href={`/dashboard/status-pages/${row.id}/preview`}>{t("Prévia", "Preview")}</Button><Button size="sm" variant="secondary" onClick={() => setEditing(row)}>{t("Editar", "Edit")}</Button><Button size="sm" variant="secondary" disabled={busy} onClick={() => { void act(`status-pages/${row.id}`, "PATCH", { published: !row.published }); }}>{row.published ? t("Despublicar", "Unpublish") : t("Publicar", "Publish")}</Button><Button size="sm" variant="ghost" href={`/status/${encodeURIComponent(String(row.slug))}`}>{t("Abrir página", "Open page")}</Button></>}
      {["monitors", "maintenance", "channels", "status-pages", "api-keys", "invitations", "webhooks"].includes(section) && canAdmin && <Button size="sm" variant="danger" disabled={busy} onClick={() => { if (window.confirm(t("Confirmar remoção deste registro?", "Confirm removal of this record?"))) void act(`${section}/${row.id}`, "DELETE"); }}>{section === "monitors" ? t("Arquivar", "Archive") : t("Remover", "Remove")}</Button>}
    </div></td></tr>)}</tbody></table>{!filtered.length && <p>{t("Nenhum registro encontrado. Os dados aparecerão após configuração e observações reais.", "No records found. Data appears after configuration and real observations.")}</p>}</div></Card></>}
    {!loading && path.includes("/") && Boolean(data) && <DetailView data={data} t={t} />}
    {!loading && section === "platform" && Boolean(data) && <PlatformView data={data} t={t} reload={reload} />}
    {!loading && section === "billing" && <BillingView workspaceId={workspaceId} data={data} t={t} />}
    {!loading && section && section !== "billing" && section !== "platform" && !path.includes("/") && Boolean(data) && !Array.isArray(data) && <Card><pre className={styles.secret}>{JSON.stringify(data, null, 2)}</pre></Card>}
  </section>;
}
