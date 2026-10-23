"use client";
import { useState, useEffect, type FormEvent } from "react";
import { Button, Checkbox, Dialog, Input, Select } from "@design-system";
import { productRequest, workspacePath, type ProductRow } from "@/lib/product-client";
import type { Translate } from "./product-shell";
import { monitorStepsPatch } from "./monitor-steps";
import styles from "./product.module.css";
const types = ["http", "keyword", "ping", "port", "heartbeat", "ssl", "domain", "dns", "api"];
export function MonitorForm({ workspaceId, row, onSaved, onClose, t }: { workspaceId: string; row: ProductRow | null; onSaved: (token?: string) => void; onClose: () => void; t: Translate }) {
  const [replaceSteps, setReplaceSteps] = useState(false);
  const [probes, setProbes] = useState<ProductRow[]>([]);
  useEffect(() => { let active = true; void productRequest<ProductRow[]>(workspacePath(workspaceId, "probes")).then(value => { if (active) setProbes(value); }).catch(() => {}); return () => { active = false; }; }, [workspaceId]);
  const [type, setType] = useState(String(row?.type ?? "http")); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const config = row?.config && typeof row.config === "object" ? row.config as Record<string, unknown> : {};
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget);
    try {
      const nextConfig: Record<string, unknown> = { timeoutMs: Number(form.get("timeoutMs")) };
      const regions = String(form.get("regions") ?? "").split(",").map(value => value.trim()).filter(Boolean); if (regions.length) nextConfig.regions = regions;
      if (form.get("privateProbeId")) nextConfig.privateProbeId = String(form.get("privateProbeId"));
      if (["http", "keyword"].includes(type)) nextConfig.expectedStatus = Number(form.get("expectedStatus"));
      if (type === "keyword") { nextConfig.keyword = String(form.get("keyword")); nextConfig.keywordAbsent = form.get("keywordAbsent") === "on"; }
      if (type === "port") nextConfig.port = Number(form.get("port"));
      if (["ssl", "domain"].includes(type)) nextConfig.expiryWarningDays = Number(form.get("expiryWarningDays"));
      if (type === "heartbeat") nextConfig.heartbeatGraceSeconds = Number(form.get("heartbeatGraceSeconds"));
      if (type === "dns") { nextConfig.dnsRecord = String(form.get("dnsRecord")); nextConfig.expectedValue = String(form.get("expectedValue")); }
      if (type === "api") Object.assign(nextConfig, monitorStepsPatch(config.stepsProtected === true, replaceSteps, String(form.get("steps") ?? "")));
      const body = { name: String(form.get("name")), type, target: String(form.get("target")), intervalSeconds: Number(form.get("intervalSeconds")), config: nextConfig };
      const result = await productRequest<{ heartbeatToken?: string }>(workspacePath(workspaceId, `monitors${row ? `/${row.id}` : ""}`), row ? "PATCH" : "POST", body); onSaved(result.heartbeatToken);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Request failed"); } finally { setBusy(false); }
  }
  return <Dialog open onClose={onClose} title={row ? t("Editar monitor", "Edit monitor") : t("Novo monitor", "New monitor")}><form className={styles.form} onSubmit={event => { void submit(event); }}>
    <Input label={t("Nome", "Name")} name="name" required maxLength={100} defaultValue={String(row?.name ?? "")} /><Select label={t("Tipo", "Type")} options={types.map(value => ({ value, label: value.toUpperCase() }))} value={type} onChange={event => setType(event.target.value)} />
    <Input label={t("Destino (URL ou host)", "Target (URL or host)")} name="target" required maxLength={2048} defaultValue={String(row?.target ?? "")} hint={t("Probes públicos bloqueiam redes privadas e locais.", "Public probes block private and local networks.")} />
    <Select label={t("Probe de execução", "Execution probe")} name="privateProbeId" defaultValue={String(config.privateProbeId ?? "")} options={[{ value: "", label: t("Probes públicos", "Public probes") }, ...probes.map(probe => ({ value: probe.id, label: `${probe.id} · ${String(probe.region)}` }))]} />
    <Input label={t("Regiões, separadas por vírgula", "Regions, comma separated")} name="regions" defaultValue={Array.isArray(config.regions) ? config.regions.join(",") : ""} hint={t("Somente probes realmente registrados fornecem cobertura.", "Only actually registered probes provide coverage.")} />
    <Input label={t("Intervalo em segundos", "Interval in seconds")} name="intervalSeconds" type="number" required min={30} max={604800} defaultValue={Number(row?.interval_seconds ?? 300)} />
    <Input label="Timeout (ms)" name="timeoutMs" type="number" required min={100} max={10000} defaultValue={Number(config.timeoutMs ?? 10000)} />
    {["http", "keyword"].includes(type) && <Input label={t("Status HTTP esperado", "Expected HTTP status")} name="expectedStatus" type="number" min={100} max={599} defaultValue={Number(config.expectedStatus ?? 200)} required />}
    {type === "keyword" && <><Input label={t("Palavra-chave", "Keyword")} name="keyword" required defaultValue={String(config.keyword ?? "")} /><Checkbox label={t("Alertar se a palavra estiver presente", "Alert if keyword is present")} name="keywordAbsent" defaultChecked={Boolean(config.keywordAbsent)} /></>}
    {type === "port" && <Input label={t("Porta TCP", "TCP port")} name="port" type="number" min={1} max={65535} required defaultValue={Number(config.port ?? 443)} />}
    {["ssl", "domain"].includes(type) && <Input label={t("Avisar dias antes do vencimento", "Warn days before expiry")} name="expiryWarningDays" type="number" min={0} max={365} required defaultValue={Number(config.expiryWarningDays ?? 30)} />}
    {type === "heartbeat" && <Input label={t("Tolerância em segundos", "Grace period in seconds")} name="heartbeatGraceSeconds" type="number" min={0} max={86400} required defaultValue={Number(config.heartbeatGraceSeconds ?? 300)} />}
    {type === "dns" && <><Select label={t("Registro DNS", "DNS record")} name="dnsRecord" defaultValue={String(config.dnsRecord ?? "A")} options={["A", "AAAA", "MX", "TXT"].map(value => ({ value, label: value }))} /><Input label={t("Valor esperado", "Expected value")} name="expectedValue" defaultValue={String(config.expectedValue ?? "")} /></>}
    {type === "api" && config.stepsProtected === true && <><p>{t("Fluxo protegido armazenado. Alterar outros campos preserva suas etapas e segredos.", "A protected workflow is stored. Editing other fields preserves its steps and secrets.")}</p><Checkbox label={t("Substituir o fluxo protegido", "Replace protected workflow")} checked={replaceSteps} onChange={event => setReplaceSteps(event.target.checked)} /></>}
    {type === "api" && (config.stepsProtected !== true || replaceSteps) && <label>{t("Etapas JSON (máximo 5)", "JSON steps (maximum 5)")}<textarea name="steps" className="ds-input" required defaultValue={config.steps ? JSON.stringify(config.steps, null, 2) : ""} /></label>}
    {error && <p className="ds-error" role="alert">{error}</p>}<div className={styles.row}><Button type="submit" loading={busy}>{t("Salvar monitor", "Save monitor")}</Button><Button variant="secondary" onClick={onClose}>{t("Cancelar", "Cancel")}</Button></div>
  </form></Dialog>;
}
