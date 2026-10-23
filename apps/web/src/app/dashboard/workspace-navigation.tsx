"use client";
import Link from "next/link";
import { Button, Icon, Select, SegmentGauge, Sidebar, Wordmark } from "@design-system";
import type { NavItem } from "@design-system";
import type { DashboardData, Workspace } from "@/lib/product-client";
import type { Translate } from "./product-shell";
import styles from "./shell.module.css";
export const navigationItems: [string, string, string, NavItem["icon"]][] = [["", "Visão geral", "Overview", "dashboard"], ["monitors", "Monitores", "Monitors", "activity"], ["incidents", "Incidentes", "Incidents", "bell"], ["status-pages", "Status pages", "Status pages", "globe"], ["maintenance", "Manutenção", "Maintenance", "calendar"], ["channels", "Integrações", "Integrations", "layers"], ["team", "Equipe", "Team", "users"], ["billing", "Cobrança", "Billing", "credit"], ["api-keys", "API", "API", "code"], ["audit", "Auditoria", "Audit", "history"], ["settings", "Configurações", "Settings", "settings"]];
export function workspaceItems(t: Translate, data: DashboardData | null): NavItem[] {
  return navigationItems.map(([id, pt, en, icon], index) => ({ href: `/dashboard${id ? `/${id}` : ""}`, label: t(pt, en), icon, group: index < 6 ? "Workspace" : t("Conta", "Account"), badge: id === "incidents" ? data?.summary.openIncidents : id === "monitors" ? data?.monitors.filter(row => !row.paused && row.state === "down").length : undefined }));
}
type Props = { workspaces: Workspace[]; workspaceId: string; onSelect: (id: string) => void; onCreate: () => void; onSignOut: () => void; busy: boolean; collapsed?: boolean; onCollapse?: () => void; items: NavItem[]; active: string; data: DashboardData | null; t: Translate };
export function WorkspaceNavigation({ workspaces, workspaceId, onSelect, onCreate, onSignOut, busy, collapsed = false, onCollapse, items, active, data, t }: Props) {
  const workspace = workspaces.find(row => row.id === workspaceId);
  const usage = data?.usage as { monitors?: number; limit?: number } | undefined;
  return <>
    <Link href="/dashboard" className={styles.brand} aria-label="Watchtower">{collapsed ? <span>W<span>.</span></span> : <Wordmark />}</Link>
    <div className={styles.workspace} data-collapsed={collapsed || undefined}><span className={styles.workspaceMark} aria-hidden="true">{workspace?.name.slice(0, 1).toUpperCase() ?? "W"}</span><div className={collapsed ? "wt-sr-only" : styles.workspaceSelect}><Select label="Workspace" disabled={collapsed} value={workspaceId} onChange={event => onSelect(event.target.value)} options={workspaces.map(row => ({ value: row.id, label: row.name }))} /><span>{data?.workspace?.plan ? `Plano ${data.workspace.plan}` : t("Workspace de monitoramento", "Monitoring workspace")}</span></div></div>
    <Sidebar items={items} active={active} label={t("Navegação principal", "Main navigation")} collapsed={collapsed} variant="product" />
    <div className={styles.navFooter}>{!collapsed && usage && typeof usage.monitors === "number" && typeof usage.limit === "number" && usage.limit > 0 && <div className={styles.usage}><SegmentGauge value={usage.monitors / usage.limit * 100} label={t("Cota de monitores", "Monitor allowance")} /><span>{usage.monitors} / {usage.limit} {t("monitores usados", "monitors used")}</span></div>}
      <Button variant="ghost" icon="plus" aria-label={t("Novo workspace", "New workspace")} onClick={onCreate}>{!collapsed && t("Novo workspace", "New workspace")}</Button>
      <Button variant="ghost" icon="logOut" disabled={busy} aria-label={t("Sair", "Sign out")} onClick={onSignOut}>{!collapsed && t("Sair", "Sign out")}</Button>
      {onCollapse && <button type="button" className={styles.collapse} onClick={onCollapse} aria-label={collapsed ? t("Expandir navegação", "Expand navigation") : t("Recolher navegação", "Collapse navigation")} aria-expanded={!collapsed}><Icon name="collapse" size="sm" />{!collapsed && t("Recolher", "Collapse")}</button>}
    </div>
  </>;
}
