"use client";
import { useEffect, useState } from "react";
import { Button, Card } from "@design-system";
import { authClient } from "@/lib/auth-client";
import type { Translate } from "./product-shell";
import styles from "./product.module.css";
export function SecurityDevices({ t }: { t: Translate }) {
  const [sessions, setSessions] = useState<{ token: string; id: string; userAgent?: string | null; createdAt: Date }[]>([]);
  const [keys, setKeys] = useState<{ id: string; name?: string | null }[]>([]); const [error, setError] = useState(""); const [revision, setRevision] = useState(0);
  useEffect(() => { let active = true; void Promise.all([authClient.listSessions(), authClient.passkey.listUserPasskeys()]).then(([sessionResult, keyResult]) => { if (!active) return; if (sessionResult.error || keyResult.error) { setError(sessionResult.error?.message ?? keyResult.error?.message ?? "Request failed"); return; } setSessions(sessionResult.data ?? []); setKeys(keyResult.data ?? []); }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Request failed"); }); return () => { active = false; }; }, [revision]);
  async function revoke(kind: "session" | "passkey", id: string) { setError(""); try { const result = kind === "session" ? await authClient.revokeSession({ token: id }) : await authClient.passkey.deletePasskey({ id }); if (result.error) throw new Error(result.error.message ?? "Request failed"); setRevision(value => value + 1); } catch (cause) { setError(cause instanceof Error ? cause.message : "Request failed"); } }
  return <Card title={t("Dispositivos e sessões", "Devices and sessions")}>{error && <p className="ds-error" role="alert">{error}</p>}<h3>Passkeys</h3>{keys.map(key => <div key={key.id} className={styles.between}><p>{key.name ?? key.id}</p><Button variant="danger" onClick={() => { if (window.confirm(t("Remover passkey?", "Remove passkey?"))) void revoke("passkey", key.id); }}>{t("Remover", "Remove")}</Button></div>)}{!keys.length && <p>{t("Nenhuma passkey cadastrada.", "No registered passkeys.")}</p>}<h3>{t("Sessões", "Sessions")}</h3>{sessions.map(session => <div key={session.id} className={styles.between}><p>{session.userAgent ?? t("Dispositivo desconhecido", "Unknown device")}</p><Button variant="danger" onClick={() => { if (window.confirm(t("Encerrar esta sessão?", "Revoke this session?"))) void revoke("session", session.token); }}>{t("Encerrar", "Revoke")}</Button></div>)}</Card>;
}
