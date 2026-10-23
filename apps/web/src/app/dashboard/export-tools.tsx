"use client";
import { downloadCsv } from "@/lib/csv-download";
import { useState } from "react";
import { Button, Dialog } from "@design-system";
import { productRequest, workspacePath, type ProductRow } from "@/lib/product-client";
import type { Translate } from "./product-shell";
import styles from "./product.module.css";
export function ExportTools({ rows, section, workspaceId, canWrite, reload, t }: { rows: ProductRow[]; section: string; workspaceId: string; canWrite: boolean; reload: () => void; t: Translate }) {
  const [open, setOpen] = useState(false); const [csv, setCsv] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  function download() { downloadCsv(`${section}.csv`, rows, section === "monitors" ? ["name", "type", "target", "interval_seconds"] : undefined); }
  async function upload() { setBusy(true); setError(""); try { await productRequest(workspacePath(workspaceId, "monitors/import"), "POST", { csv }); setOpen(false); reload(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Request failed"); } finally { setBusy(false); } }
  return <div className={styles.row}><Button variant="secondary" onClick={download} disabled={!rows.length}>{t("Exportar CSV", "Export CSV")}</Button>{section === "monitors" && canWrite && <Button variant="secondary" onClick={() => setOpen(true)}>{t("Importar CSV", "Import CSV")}</Button>}<Dialog open={open} onClose={() => setOpen(false)} title={t("Importar monitores", "Import monitors")}><div className={styles.form}><label>{t("CSV: name,type,target,interval_seconds", "CSV: name,type,target,interval_seconds")}<textarea className="ds-input" value={csv} onChange={event => setCsv(event.target.value)} /></label>{error && <p role="alert" className="ds-error">{error}</p>}<Button disabled={!csv} loading={busy} onClick={() => { void upload(); }}>{t("Importar", "Import")}</Button></div></Dialog></div>;
}
