"use client";

import { useEffect, useId, useState } from "react";
import { Badge, Button, Card, Icon, Input, Tabs, useReducedMotion } from "@design-system";
import styles from "./landing.module.css";

export function Lighthouse() {
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const id = useId();
  return <div className={styles.lighthouse}>
    <div className={styles.signal} aria-hidden="true" data-paused={paused || reduced}>
      <div className={styles.beam} />
      <svg viewBox="0 0 1200 620" preserveAspectRatio="xMidYMin slice">
        <defs>
          <linearGradient id={`${id}-shaft`}><stop stopColor="var(--surface-tertiary)" /><stop offset=".5" stopColor="var(--surface-primary)" /><stop offset="1" stopColor="var(--background-base)" /></linearGradient>
          <radialGradient id={`${id}-glow`}><stop stopColor="var(--primary)" stopOpacity=".32" /><stop offset="1" stopColor="var(--primary)" stopOpacity="0" /></radialGradient>
        </defs>
        {[110, 200, 300, 410].map(radius => <circle key={radius} cx="600" cy="62" r={radius} fill="none" stroke="var(--border-subtle)" strokeDasharray="2 6" />)}
        {[0, 1, 2].map(index => <circle key={index} className={styles.pulseRing} cx="600" cy="62" r="420" fill="none" stroke="var(--primary)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" style={{ animationDelay: `${index * 2.2}s` }} />)}
        <polygon points="595,74 605,74 612,142 588,142" fill={`url(#${id}-shaft)`} />
        <path d="M587.5 98H612.5M585 122H615" stroke="var(--border-strong)" />
        <circle cx="600" cy="62" r="48" fill={`url(#${id}-glow)`} />
        <path d="M584 47H616" stroke="var(--text-tertiary)" strokeWidth="3" />
        <rect x="592" y="52" width="16" height="20" fill="var(--primary)" />
        <path d="M510 142H690" stroke="var(--border-default)" />
      </svg>
    </div>
    <button className={styles.motionControl} type="button" onClick={() => setPaused(!paused)} disabled={reduced}>
      {reduced ? "Movimento reduzido" : paused ? "Animar farol" : "Pausar farol"}
    </button>
  </div>;
}

export function DemoCheck({ compact = false }: { compact?: boolean }) {
  const [shown, setShown] = useState(false);
  const id = useId();
  return <Card className={styles.demo} material="frosted">
    <div className={styles.addressRow}>
      <Input label="Endereço do site ou API" placeholder="https://seusite.com.br" maxLength={2048} autoComplete="off" spellCheck={false}
        hint="Demonstração local. O endereço não é acessado nem salvo." />
      <Button size="lg" onClick={() => setShown(true)} aria-controls={id}>Ver demonstração</Button>
    </div>
    <div id={id} role="status" className={styles.demoResult}>
      <p className="wt-eyebrow">{shown ? "EXEMPLO ILUSTRATIVO" : "PRÉVIA DO MONITOR"}</p>
      <p>{shown ? "api.exemplo.com.br · HTTP 503 · Incidente de exemplo" : "Como seria acompanhar seu próximo incidente?"}</p>
      <p className={styles.muted}>{shown ? "Esse resultado é fictício e não corresponde ao endereço digitado. Nenhuma conexão foi feita." : "Explore um cenário fictício. Esta página ainda não realiza verificações de disponibilidade."}</p>
    </div>
    {!compact && <><div className={styles.comparison}>
      <div><h3>NESTA DEMONSTRAÇÃO</h3><p>Dados ilustrativos</p><p>Sem conexão com seu site</p><p>Nenhum alerta enviado</p></div>
      <div><h3>NA PROPOSTA DA BETA</h3><p>Checagens recorrentes</p><p>Histórico no workspace</p><p>Alertas por e-mail</p></div>
    </div><div className={styles.demoFooter}><p>Conheça a experiência. O monitoramento real virá em uma próxima etapa.</p><Button href="#beta" variant="secondary">Sobre a beta por convite</Button></div></>}
  </Card>;
}

const stages = [
  { value: "detection", name: "Detecção", icon: "activity", time: "03:12:04", title: "A checagem falha", tone: "down", status: "Down", text: "Neste exemplo, GET /health responde 503. A falha aparece no histórico para ajudar a entender o início do incidente." },
  { value: "notification", name: "Notificação", icon: "bell", time: "03:12:09", title: "Seu time é avisado", tone: "degraded", status: "Alerta", text: "Uma mensagem reúne o endereço, a falha e o horário. Aqui ela é apenas ilustrativa: nenhum alerta é enviado." },
  { value: "recovery", name: "Recuperação", icon: "check", time: "03:16:21", title: "O serviço volta", tone: "up", status: "Resolved", text: "As checagens voltam a passar. O exemplo registra a recuperação e mantém a duração do incidente no histórico." },
] as const;

export function IncidentDemo() {
  const [selected, setSelected] = useState<string>(stages[0].value);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (paused || reduced) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setSelected(current => stages[(stages.findIndex(stage => stage.value === current) + 1) % stages.length].value);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [paused, reduced]);
  return <div className={styles.incident}>
    <Tabs orientation="vertical" label="Fases do incidente" value={selected} onChange={value => { setSelected(value); setPaused(true); }} items={stages.map(stage => ({
      value: stage.value, label: <span className={styles.stageLabel} data-phase={stage.tone}>
        <span className={styles.stageIcon}><Icon name={stage.icon} size="sm" /></span>
        <span className={styles.stageCopy}><span>{stage.name}</span><strong>{stage.title}</strong></span>
        <span className={styles.stageTime}>{stage.time}</span>
      </span>, content: <Card material="frosted" className={styles.incidentPanel}>
        <div className={styles.panelTop}><code>api.exemplo.com.br/health</code><Badge tone={stage.tone} dot>{stage.status}</Badge></div>
        <p className={styles.incidentTime} data-phase={stage.tone}>{stage.time}</p><h3>{stage.title}</h3><p>{stage.text}</p>
        <div className={styles.incidentBars} aria-hidden="true">{Array.from({ length: 30 }, (_, i) => <span key={i} data-down={i >= 16 && (stage.value !== "recovery" || i < 20)} />)}</div>
        <div className={styles.panelTop}><small>03:08</small><small>{stage.value === "recovery" ? "fora do ar por 4m 17s" : "falha às 03:12"}</small></div>
      </Card>,
    }))} />
    <div className={styles.incidentFoot}><p>Endereço, horários e mensagens são exemplos, não uma garantia de tempo de detecção.</p><Button variant="ghost" size="sm" disabled={reduced} onClick={() => setPaused(!paused)}>{reduced ? "Movimento reduzido" : paused ? "Reproduzir etapas" : "Pausar etapas"}</Button></div>
  </div>;
}

const history = Array.from({ length: 90 }, (_, i) => i < 6 ? "Sem dados" : i === 61 || i === 62 ? "Down" : i === 30 || i === 63 ? "Degraded" : "Up");
export function HistoryDemo() {
  const [day, setDay] = useState(62);
  const id = useId();
  const status = history[day];
  return <Card material="frosted" className={styles.history}>
    <div className={styles.panelTop}><h3>Histórico de 90 dias</h3><Badge tone="outline">Dados de exemplo</Badge></div>
    <p>Cada dia conta uma parte da história. Explore a visualização com o controle abaixo ou as setas do teclado.</p>
    <div className={styles.legend}>{["Up", "Degraded", "Down", "Sem dados"].map(label => <span key={label}><i data-status={label} />{label}</span>)}</div>
    <div className={styles.panelTop}><code>checkout.exemplo.com.br</code><small>VISUALIZAÇÃO ILUSTRATIVA</small></div>
    <div className={styles.historyBars} aria-hidden="true">{history.map((value, index) => <span key={index} data-status={value} data-selected={day === index} />)}</div>
    <label className="wt-sr-only" htmlFor={id}>Dia do histórico</label>
    <input id={id} className={styles.historyRange} type="range" min={0} max={89} value={day} aria-valuetext={`Dia ${day + 1} de 90: ${status}`} onChange={event => setDay(Number(event.target.value))} />
    <div className={styles.panelTop}><small>90 dias atrás</small><small>Hoje</small></div>
    <p className={styles.historyReadout}><strong>Dia {day + 1} de 90 · {status}</strong><span>{status === "Down" ? "Fora do ar por 4m 17s" : status === "Degraded" ? "Resposta lenta neste exemplo" : status === "Sem dados" ? "Nenhuma observação neste exemplo" : "Disponível neste exemplo"}</span></p>
  </Card>;
}
