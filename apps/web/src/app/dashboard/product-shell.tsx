"use client";
import Link from "next/link";
import { useEffect, useState, useRef, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Input, Dialog, Wordmark, CommandPalette, MobileNav, Card, Icon, Avatar } from "@design-system";
import { authClient } from "@/lib/auth-client";
import { productRequest, type Workspace, type DashboardData, rowText } from "@/lib/product-client";
import { DatePreferenceContext, PreferencesChangedContext, type DatePreferences } from "./date-preferences";
import { authorizedSelection, workspacePreferenceKey } from "./workspace-selection";
import { ProductViews } from "./product-views";
import { WorkspaceNavigation, workspaceItems, navigationItems } from "./workspace-navigation";
import styles from "./product.module.css";
import shell from "./shell.module.css";
export type Translate = (pt: string, en: string) => string;
export function ProductShell({ platformAllowed = false }: { platformAllowed?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const [identity, setIdentity] = useState<Awaited<ReturnType<typeof authClient.getSession>>["data"]>(null); const session = { data: identity }; const router = useRouter(); const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null); const [workspaceId, setWorkspaceId] = useState("");
  const selectedWorkspace = useRef("");
  const [newWorkspace, setNewWorkspace] = useState(false);
  const [datePreferences, setDatePreferences] = useState<DatePreferences>({ timezone: "UTC", dateFormat: "DD/MM/YYYY" });
  const [searchData, setSearchData] = useState<DashboardData | null>(null); const [notifications, setNotifications] = useState(false); const [noticeError, setNoticeError] = useState("");
  const [english, setEnglish] = useState(false); const [palette, setPalette] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const t: Translate = (pt, en) => english ? en : pt;
  useEffect(() => { let active = true; void authClient.getSession({ query: { disableCookieCache: true } }).then(result => { if (!active) return; if (result.error) setError(result.error.message ?? "Session temporarily unavailable"); else if (result.data) setIdentity(result.data); else router.replace("/login"); }).catch(() => { if (active) setError("Session connection failed"); }); return () => { active = false; }; }, [router]);
  useEffect(() => {
    if (!session.data) return;
    let current = true;
    void productRequest<Workspace[]>("/api/workspaces").then(rows => { if (current) { setWorkspaces(rows); let remembered: string | null = null; try { remembered = localStorage.getItem(workspacePreferenceKey(session.data!.user.id)); } catch { /* Storage may be unavailable in private browsing. */ } const selected = authorizedSelection(rows, remembered); selectedWorkspace.current = selected; setWorkspaceId(selected); } }).catch((cause: unknown) => { if (current) setError(cause instanceof Error ? cause.message : "Connection failed"); });
    return () => { current = false; };
  }, [session.data]);
  useEffect(() => { if (!workspaceId) return; let active = true; void productRequest<{ language?: string; timezone?: string; dateFormat?: string }>(`/api/workspaces/${encodeURIComponent(workspaceId)}/settings`).then(value => { if (active) { setEnglish(value.language === "en"); setDatePreferences({ timezone: value.timezone ?? "UTC", dateFormat: value.dateFormat ?? "DD/MM/YYYY" }); } }).catch(() => {}); return () => { active = false; }; }, [workspaceId]);
  useEffect(() => { if (!workspaceId) return; let active = true; void productRequest<DashboardData>(`/api/workspaces/${encodeURIComponent(workspaceId)}/dashboard`).then(value => { if (active && selectedWorkspace.current === workspaceId) setSearchData(value); }).catch(() => {}); return () => { active = false; }; }, [workspaceId]);
  useEffect(() => { const handle = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key === "k") { event.preventDefault(); setPalette(value => !value); } }; window.addEventListener("keydown", handle); return () => window.removeEventListener("keydown", handle); }, []);
  function selectWorkspace(id: string, rows = workspaces ?? []) {
    const selected = authorizedSelection(rows, id);
    selectedWorkspace.current = selected;
    setSearchData(null); setNotifications(false); setPalette(false); setNoticeError(""); setError("");
    setDatePreferences({ timezone: "UTC", dateFormat: "DD/MM/YYYY" });
    setWorkspaceId(selected);
    if (session.data) { try { localStorage.setItem(workspacePreferenceKey(session.data.user.id), selected); } catch { /* Selection still works without persistent browser storage. */ } }
  }
  async function signOut() {
    setBusy(true); setError("");
    try { const result = await authClient.signOut(); if (result.error) throw new Error(result.error.message ?? "Sign out failed"); setIdentity(null); setSearchData(null); router.replace("/login"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Sign out failed"); }
    finally { setBusy(false); }
  }
  function preferencesChanged(value: DatePreferences & { language: string }) { setEnglish(value.language === "en"); setDatePreferences({ timezone: value.timezone, dateFormat: value.dateFormat }); }
  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const name = String(new FormData(event.currentTarget).get("name"));
    try { const row = await productRequest<{ id: string }>("/api/workspaces", "POST", { name }); const rows = await productRequest<Workspace[]>("/api/workspaces"); setWorkspaces(rows); selectWorkspace(row.id, rows); setNewWorkspace(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Request failed"); } finally { setBusy(false); }
  }
  if (!session.data) return <main className={styles.onboarding}><Wordmark />{error ? <><p role="alert" className="ds-error">{error}</p><Button onClick={() => window.location.reload()}>{t("Tentar novamente", "Try again")}</Button></> : <p role="status">{t("Verificando sessão…", "Checking session…")}</p>}</main>;
  const path = pathname.replace(/^\/dashboard\/?/, "");
  const platform = path.startsWith("platform");
  const items = workspaceItems(t, searchData);
  const sectionTitle = navigationItems.find(([id]) => id === path.split("/")[0]);
  const workspaceName = workspaces?.find(row => row.id === workspaceId)?.name ?? "Workspace";
  const active = `/dashboard${path ? `/${path.split("/")[0]}` : ""}`;
  const navigation = (compact = false, collapsible = false) => <WorkspaceNavigation workspaces={workspaces ?? []} workspaceId={workspaceId} onSelect={selectWorkspace} onCreate={() => setNewWorkspace(true)} onSignOut={() => { void signOut(); }} busy={busy} collapsed={compact} onCollapse={collapsible ? () => setCollapsed(value => !value) : undefined} items={items} active={active} data={searchData} t={t} />;
  if (!workspaceId) return <main className={styles.onboarding}><Wordmark />{error && <p role="alert" className="ds-error">{error}</p>}{workspaces ? <Card title={t("Seu primeiro workspace", "Your first workspace")}><form className={styles.form} onSubmit={event => { void createWorkspace(event); }}><Input label={t("Nome do workspace", "Workspace name")} name="name" required maxLength={100} /><Button type="submit" loading={busy}>{t("Criar workspace", "Create workspace")}</Button></form></Card> : <p role="status">{t("Carregando workspaces…", "Loading workspaces…")}</p>}<Button variant="ghost" disabled={busy} onClick={() => { void signOut(); }}>{t("Sair", "Sign out")}</Button></main>;
  return <div className={shell.shell} data-collapsed={collapsed || undefined}><aside className={`${shell.sidebar} wt-mat-smoked`}>{navigation(collapsed, true)}</aside>
    <main className={shell.main}><header className={shell.topbar}>
      <div className={shell.mobile}><MobileNav>{navigation()}{platformAllowed && <Link href="/dashboard/platform">{t("Plataforma", "Platform")}</Link>}{error && <p role="alert" className="ds-error">{error}</p>}</MobileNav></div>
      <nav aria-label={t("Localização", "Breadcrumb")} className={shell.breadcrumbs}><Link href="/dashboard">{platform ? t("Plataforma", "Platform") : workspaceName}</Link><Icon name="chevron" size="sm" /><span>{platform ? t("Administração", "Administration") : sectionTitle ? t(sectionTitle[1], sectionTitle[2]) : t("Detalhes", "Details")}</span></nav>
      <button type="button" className={shell.search} onClick={() => setPalette(true)}><Icon name="search" /><span>{t("Buscar páginas, monitores, ações…", "Search pages, monitors, actions…")}</span><kbd>⌘K</kbd></button>
      <div className={shell.tools}>{platformAllowed && <nav className={shell.context} aria-label={t("Contexto", "Context")}><Link href="/dashboard" aria-current={!platform ? "page" : undefined}>Workspace</Link><Link href="/dashboard/platform" aria-current={platform ? "page" : undefined}>{t("Plataforma", "Platform")}</Link></nav>}
      <button type="button" className={shell.tool} onClick={() => setEnglish(!english)} aria-label={english ? "Português" : "English"}>{english ? "PT" : "EN"}</button>
      <button type="button" className={shell.tool} aria-label={t("Notificações", "Notifications")} onClick={() => { setNotifications(true); setNoticeError(""); void productRequest<DashboardData>(`/api/workspaces/${encodeURIComponent(workspaceId)}/dashboard`).then(value => { if (selectedWorkspace.current === workspaceId) setSearchData(value); }).catch((cause: unknown) => { if (selectedWorkspace.current === workspaceId) setNoticeError(cause instanceof Error ? cause.message : "Request failed"); }); }}><Icon name="bell" /></button><Link className={shell.avatar} href="/dashboard/settings" aria-label={t("Perfil de", "Profile for") + " " + session.data.user.name}><Avatar name={session.data.user.name} /></Link></div>
    </header><div className={shell.content}>
      {error && !newWorkspace && <p role="alert" className="ds-error">{error}</p>}<PreferencesChangedContext.Provider value={preferencesChanged}><DatePreferenceContext.Provider value={datePreferences}><ProductViews userName={session.data.user.name} workspaceName={workspaceName} key={`${workspaceId}:${path}`} workspaceId={workspaceId} path={path} t={t} role={workspaces?.find(row => row.id === workspaceId)?.role ?? "viewer"} /></DatePreferenceContext.Provider></PreferencesChangedContext.Provider>
    </div></main><CommandPalette open={palette} onClose={() => setPalette(false)} items={[...(platformAllowed ? [{ id: "platform", label: t("Plataforma", "Platform"), onSelect: () => router.push("/dashboard/platform") }] : []), ...items.map(item => ({ id: item.href, label: item.label, onSelect: () => router.push(item.href) })), ...(searchData?.monitors ?? []).map(monitor => ({ id: monitor.id, label: `${String(monitor.name)} · ${String(monitor.target)}`, onSelect: () => router.push(`/dashboard/monitors/${monitor.id}`) }))]} /><Dialog open={newWorkspace} onClose={() => setNewWorkspace(false)} title={t("Novo workspace", "New workspace")}><form className={styles.form} onSubmit={event => { void createWorkspace(event); }}><Input label={t("Nome do workspace", "Workspace name")} name="name" required maxLength={100} />{error && <p role="alert" className="ds-error">{error}</p>}<Button type="submit" loading={busy}>{t("Criar workspace", "Create workspace")}</Button></form></Dialog><Dialog open={notifications} onClose={() => setNotifications(false)} title={t("Notificações", "Notifications")}>{noticeError && <p role="alert" className="ds-error">{noticeError}</p>}{searchData?.deliveries?.length ? searchData.deliveries.map(delivery => <p key={delivery.id}>{rowText(delivery, "event")} · {rowText(delivery, "state")} · {rowText(delivery, "created_at")}</p>) : <p>{t("Nenhuma entrega registrada.", "No recorded deliveries.")}</p>}</Dialog></div>;
}
