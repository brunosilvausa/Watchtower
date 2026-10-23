import { Badge, Button, Card, CodeWindow, Icon, Wordmark } from "@design-system";
import { DemoCheck, HistoryDemo, IncidentDemo, Lighthouse } from "@/app/_components/landing-demos";
import styles from "@/app/_components/landing.module.css";

const features = [
  { title: "Sites e APIs", icon: "activity", text: "Status HTTP e tempo de resposta em uma só visão. Parte da proposta de monitoramento da beta.", label: "Em desenvolvimento" },
  { title: "SSL e domínio", icon: "search", text: "Uma visão dos vencimentos antes que virem surpresa. Conceito para uma etapa futura.", label: "Conceito futuro" },
  { title: "Status page", icon: "layers", text: "Uma página para comunicar a saúde dos seus serviços. Fora do escopo da beta inicial.", label: "Conceito futuro" },
  { title: "Workspaces privados", icon: "layers", text: "Um espaço para organizar seus sistemas. O acesso da beta será individual e por convite.", label: "Em desenvolvimento" },
] as const;
const faqs = [
  ["Já posso criar uma conta?", "Ainda não. O Watchtower está em desenvolvimento e a beta será privada, por convite. Esta página apresenta a experiência; não há cadastro público ou ativação de monitores disponível."],
  ["A demonstração verifica meu site de verdade?", "Não. Os resultados, incidentes e históricos são exemplos fictícios. O endereço digitado não é acessado, enviado ou salvo. Nenhum alerta é disparado."],
  ["Preciso cadastrar cartão de crédito?", "Esta página não pede cartão e não realiza cobranças. Planos, preços e limites comerciais ainda não foram definidos."],
  ["O que será possível monitorar?", "A proposta da beta inicial é acompanhar sites e APIs HTTP/HTTPS, com histórico e alertas por e-mail. Heartbeats, integrações de mensagens, domínios e status pages são conceitos de evolução, não recursos já disponíveis."],
  ["Onde ficam meus dados?", "A proposta é manter os dados organizados em workspaces privados. Esta demonstração não cria contas, não salva endereços e não guarda resultados reais. A operação hospedada ainda não foi disponibilizada."],
];

export default function Home() {
  return <div className={styles.landing} id="topo">
    <a className="wt-skip-link" href="#conteudo">Pular para o conteúdo</a>
    <header className={styles.header}><div className={styles.headerInner}>
      <a href="#topo" aria-label="Watchtower, início" className={styles.brand}><svg width="20" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <polygon points="11,9 13,9 15,22 9,22" fill="var(--text-tertiary)" />
        <rect x="10" y="4" width="4" height="5" fill="currentColor" />
        <path d="M5.5 3.5a8 8 0 0 0 0 7M18.5 3.5a8 8 0 0 1 0 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg><Wordmark /></a>
      <nav aria-label="Seções" className={styles.nav}><a href="#incidente">Como funciona</a><a href="#recursos">Recursos</a><a href="#comecar">Começar</a><a href="#perguntas">Perguntas</a></nav>
      <Button href="/login" size="sm">Entrar</Button>
    </div></header>
    <main id="conteudo">
      <section className={styles.hero} aria-labelledby="hero-title">
        <Lighthouse />
        <div className={styles.heroCopy}><p className="wt-eyebrow">MONITORAMENTO DE UPTIME · PRIVATE BETA</p>
          <h1 id="hero-title">Seu site caiu às 03:12.<br /><span>Você soube às 03:12.</span></h1>
          <p className={styles.subtitle}>Menos tempo no escuro. Mais contexto quando algo para.<br className={styles.desktopBreak} /> Conheça a proposta do Watchtower para seus sites e APIs.</p>
          <p className={styles.caption}>Cenário ilustrativo. Produto em desenvolvimento.</p>
        </div>
        <div className={styles.heroDemo}><DemoCheck /></div>
        <ul className={styles.trust}><li><Icon name="check" size="sm" />Sem cartão nesta página</li><li><Icon name="check" size="sm" />Sem dados enviados</li><li><Icon name="check" size="sm" />Beta por convite</li></ul>
      </section>
      <section id="incidente" className={styles.section} aria-labelledby="incident-title">
        <p className="wt-eyebrow">COMO FUNCIONA UM INCIDENTE</p><h2 id="incident-title">Detectar, avisar,<br />registrar a volta.</h2><p className={styles.sectionLead}>Exemplo ilustrativo de uma API que ficou fora do ar de madrugada.</p>
        <IncidentDemo />
      </section>
      <section id="recursos" className={styles.section} aria-labelledby="features-title">
        <p className="wt-eyebrow">RECURSOS · VISÃO DO PRODUTO</p><h2 id="features-title">O que o Watchtower<br />pretende acompanhar por você.</h2><p className={styles.sectionLead}>Uma prévia da experiência. Os recursos abaixo ainda não estão disponíveis.</p>
        <div className={styles.featureGrid}>
          <Card className={styles.featureLarge} material="frosted"><div className={styles.featureHeading}><Icon name="activity" /><h3>Heartbeat pra cron jobs</h3></div><p>Um ping no fim do script pode mostrar que o trabalho terminou. Conceito futuro, fora da beta inicial.</p><CodeWindow title="backup.sh · exemplo" code={'# última linha do seu cron\n/usr/local/bin/backup && \\\n  curl -fsS "$WATCHTOWER_HEARTBEAT_URL"'} /><Badge tone="outline">Conceito futuro</Badge></Card>
          <Card className={styles.featureLarge} material="frosted"><div className={styles.featureHeading}><Icon name="bell" /><h3>Alertas com contexto</h3></div><p>Entenda o que falhou e quando. E-mail faz parte da proposta inicial; outros canais são conceitos futuros.</p><div className={styles.notification}><Badge tone="down" dot>Down</Badge><div><strong>api.exemplo.com.br está fora do ar</strong><code>GET /health · 503</code></div><small>Exemplo</small></div><div className={styles.notification}><Badge tone="up" dot>Resolved</Badge><div><strong>api.exemplo.com.br voltou</strong><code>fora do ar por 4m 17s</code></div><small>Exemplo</small></div><p className={styles.caption}>Mensagens ilustrativas. Nenhum envio é realizado.</p></Card>
          {features.map(feature => <Card key={feature.title} material="frosted" className={styles.featureSmall}><span className={styles.featureIcon}><Icon name={feature.icon} /></span><h3>{feature.title}</h3><p>{feature.text}</p><small>{feature.label}</small></Card>)}
        </div>
        <HistoryDemo />
      </section>
      <section id="comecar" className={`${styles.section} ${styles.start}`} aria-labelledby="start-title">
        <div><p className="wt-eyebrow">COMEÇAR</p><h2 id="start-title">Três passos.<br />Uma visão do que vem.</h2><p className={styles.sectionLead}>Crie sua conta, configure um monitor e acompanhe as observações.</p><Button href="/signup">Criar conta</Button></div>
        <ol className={styles.steps}>{[
          ["Informe o endereço", "Depois de receber acesso, a proposta é adicionar o site ou a API que você quer acompanhar."],
          ["Configure seus alertas", "O e-mail verificado da conta será o canal inicial. Nenhuma mensagem é enviada por esta demonstração."],
          ["Acompanhe pelo workspace", "As checagens e o histórico farão parte do monitoramento. Essa etapa ainda está em desenvolvimento."],
        ].map(([title, text], index) => <li key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
      </section>
      <section id="perguntas" className={`${styles.section} ${styles.faq}`} aria-labelledby="faq-title"><h2 id="faq-title">Perguntas frequentes</h2><div>{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
      <section id="beta" className={`${styles.section} ${styles.beta}`} aria-labelledby="beta-title"><Badge tone="yellow" dot>Private beta</Badge><h2 id="beta-title">Crie seu workspace</h2><p className={styles.sectionLead}>Crie sua conta para configurar monitores, acompanhar incidentes e gerenciar seu workspace.</p><p className={styles.caption}>A cobertura depende dos probes e canais configurados no seu ambiente.</p><div className={styles.closingDemo}><Button href="/signup">Criar conta</Button><Button href="/login" variant="secondary">Entrar</Button></div><a className={styles.textLink} href="#incidente">Enquanto isso, explore um incidente de exemplo <span aria-hidden="true">↗</span></a></section>
    </main>
    <footer className={styles.footer}><div className={styles.footerTop}><div><a href="#topo" aria-label="Watchtower, voltar ao início"><Wordmark /></a><p>Seus sistemas.<br />Um só ponto de vista.</p></div><nav aria-label="Rodapé"><div><strong>PRODUTO</strong><a href="#incidente">Como funciona</a><a href="#recursos">Recursos</a></div><div><strong>CONHEÇA</strong><a href="#comecar">Primeiros passos</a><a href="#perguntas">Perguntas frequentes</a></div><div><strong>ACESSO</strong><a href="/login">Entrar</a><a href="#topo">Voltar ao início</a></div></nav></div><div className={styles.footerBottom}><span>© 2026 Watchtower.</span><span>Prévia do produto · Dados ilustrativos</span></div></footer>
  </div>;
}
