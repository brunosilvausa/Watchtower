import { Icon } from "@design-system";
import styles from "./auth.module.css";
export function AuthPreview({ english }: { english: boolean }) {
  const t = (pt: string, en: string) => english ? en : pt;
  const code = ["monitors:", "  - name: api.example.com.br", "    url: https://api.example.com.br/health", "    interval: 30s", "    regions: [sa-east, us-east, eu-central]", "    alerts: [slack:#ops, sms:on-call]", "  - name: nightly-backup", "    type: heartbeat", '    expect: "every 24h"', "    grace: 5m"];
  return <aside className={styles.aside}><div className={styles.preview}>
    <div><p className="wt-eyebrow">{t("MONITORAMENTO DE UPTIME", "UPTIME MONITORING")}</p><h2>{t("Saiba quando seu sistema cai antes dos seus usuários.", "Know when your system goes down before your users do.")}</h2></div>
    <figure className={styles.uptime}><figcaption><span><i />api.example.com.br</span><span className="wt-caption">{t("Exemplo ilustrativo", "Illustrative example")}</span></figcaption><div className={styles.history} aria-hidden="true">{Array.from({ length: 90 }, (_, i) => <span key={i} data-warning={i === 43 || i === 76 || undefined} />)}</div><div className={styles.timeline}><span>{t("90 dias atrás", "90 days ago")}</span><span>{t("Histórico de disponibilidade", "Availability history")}</span><span>{t("Hoje", "Today")}</span></div></figure>
    <figure className={styles.code}><figcaption><Icon name="code" size="sm" />watchtower.yml <span>{t("Exemplo de configuração", "Configuration example")}</span></figcaption><pre tabIndex={0}>{code.map((line, i) => <span key={line}><i>{i + 1}</i><code data-heading={i === 0 || undefined}>{line}</code>{"\n"}</span>)}</pre></figure>
    <div className={styles.facts}><div><strong>9</strong><span>{t("tipos de monitor", "monitor types")}</span></div><div><strong>{t("Multi-região", "Multi-region")}</strong><span>{t("probes configuráveis", "configurable probes")}</span></div><div><strong>12</strong><span>{t("canais de alerta", "alert channels")}</span></div></div>
  </div></aside>;
}
