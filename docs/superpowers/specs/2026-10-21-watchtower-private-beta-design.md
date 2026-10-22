# Watchtower — arquitetura e roadmap da Private Beta

Data: 21/10/2026. Estado: arquitetura aprovada pelo usuário em 21/10/2026; execução autorizada exclusivamente para M1. Sem autorização de deploy, contratação ou M2–M6.

Base aprovada: monólito modular com worker separado, PostgreSQL, isolamento por workspace e piloto por convites para 10–30 usuários. Estado no momento do planejamento: repositório local sem código ou arquivos versionados. A implementação M1 posterior está descrita em docs/architecture.md e docs/setup.md. A stack e os nove entregáveis foram aprovados. Quotas, região, contratação e parâmetros explicitamente experimentais permanecem sujeitos à validação. Na elaboração deste plano não havia benchmark ou validação prática. Evidências posteriores de M1 estão em docs/setup.md; implantação e capacidade de monitoramento continuam não validadas.

## 1. Arquitetura do produto

Um repositório, uma linguagem principal e dois processos implantáveis: aplicação web/API e worker contínuo. PostgreSQL guarda dados, agenda e entregas pendentes. Não haverá Redis, Kubernetes, microserviços ou event bus no MVP.

Módulos: identidade e admissão; workspaces e autorização; limites; monitores e agenda; resultados e incidentes; notificações; administração e auditoria. Interface, API e worker reutilizam regras de domínio. Nenhum navegador acessa diretamente o banco. O worker não importa componentes de interface.

A aplicação atende dashboard, configuração, autenticação e administração. O worker reivindica trabalhos, consulta endpoints, registra resultados e processa a caixa de saída de emails. São pools de tarefas separados, com capacidade reservada para notificações. A agenda fica no banco, não em temporizadores da aplicação web. Um temporizador apenas desperta o worker para buscar trabalho persistido.

Fluxo: convite → identidade verificada → workspace individual → monitor validado → agenda persistida → verificação → resultado/incidente/outbox em transação → dashboard e email.

Alternativas: serviços separados para frontend/API aumentariam operação sem benefício necessário no piloto; execução dependente de visitas ao dashboard não atende recorrência; fila Redis adicionaria infraestrutura. Reavaliar fila dedicada apenas quando métricas mostrarem contenção relevante ou requisitos novos de distribuição.

## 2. Stack recomendada

| Camada | Proposta | Motivo e limite |
|---|---|---|
| Web/API | Next.js App Router, React, TypeScript | Uma aplicação para UI e operações do servidor; sem API pública para desenvolvedores no MVP |
| Execução | Node.js LTS, worker TypeScript separado | Compartilha modelos e validações, com processo de longa duração |
| Persistência | PostgreSQL gerenciado, Drizzle + pg | Migrações SQL revisáveis; SQL explícito nas operações concorrentes e políticas RLS |
| Autenticação | Better Auth, sessões persistentes, email/senha | Evita criar criptografia e sessões próprias; admissão por convite é regra do Watchtower |
| Interface | Tailwind e componentes acessíveis shadcn/ui | Dark-first, teclado, foco, contraste e estado textual além de cores |
| Validação/logs | Zod, server-only e Pino | Fronteiras validadas e logs estruturados com redação de dados sensíveis |
| Qualidade | Vitest, PostgreSQL real em testes de integração, Playwright | Testar autorização, concorrência e fluxos reais; mocks não validam RLS |
| Email | Resend como candidato | API e chaves de idempotência; domínio e configuração ainda pendentes |

Versões estáveis e compatíveis serão fixadas no bootstrap; nenhuma versão de exemplo será tratada como atual automaticamente. pnpm se disponível, sem alterar instalações globais. Não adicionar SDK de billing.

Context7 foi consultado para Next.js e Better Auth. A documentação de Next recomenda autorização próxima aos dados, inclusive para Actions e Route Handlers [S1]. Better Auth oferece hooks e sessões persistentes; a integração de convite e provisionamento exige testes de corrida e de falhas [S2]. Drizzle é a escolha de acesso a dados, não substitui autorização [S3].

Alternativa de autenticação: serviço gerenciado reduz manutenção de identidade, mas adiciona dependência externa e outra estrutura de custos. Recomendação inicial: Better Auth, com atualizações de segurança e revisão do fluxo como responsabilidade operacional explícita.

## 3. Modelo multi-tenant

Modelo lógico; não é migração pronta.

| Entidade | Dados e invariantes principais |
|---|---|
| users / sessions / accounts / verifications | Identidade global seguindo o schema da biblioteca; estado ativo/suspenso |
| beta_invitations | Email normalizado, hash do token, expiração, emissor, revogação e consumo único |
| workspaces / memberships | Workspace, usuário e papel; apenas um owner/membro no piloto, vínculo preservado para equipes futuras |
| workspace_limits | Máximo de alvos ativos, intervalo mínimo, concorrência, retenções; valores explícitos e auditados |
| monitors | workspace_id, URL, nome, ativo/arquivado, intervalo, timeout, versão da configuração, estado atual |
| monitor_schedule | Próxima execução, execução corrente, lease, token de posse e instante planejado |
| check_results | workspace_id, monitor_id, execution_id, horário previsto/real, duração, status HTTP e classe de erro |
| incidents / incident_events | Abertura, confirmação, recuperação, motivo; no máximo um incidente aberto por monitor |
| notification_outbox | Evento, destinatário, chave idempotente, payload estável, tentativas, próxima tentativa e estado |
| audit_events | Ator, ação, recurso, workspace quando aplicável, horário e alterações permitidas sem segredos |

Todas as tabelas de negócio pertencentes a clientes carregam workspace_id NOT NULL. Referências compostas incluem workspace_id para impedir associações cruzadas. Identidade, admissão e administração são globais e têm políticas específicas; não recebem um workspace fictício.

Índices começam pelos padrões reais: workspace/monitor/data para histórico, próxima execução para agenda, tentativa/data para outbox. Unicidade de execution_id e de evento/destinatário/canal protege os efeitos de reprocessamento. Resultados antigos podem expirar sem apagar incidentes, cuja descrição mínima é autossuficiente.

Não criar tabelas vazias de cobrança. Os limites efetivos do workspace são a fronteira estável. Futuras entidades plans, subscriptions e billing_events atualizarão esses limites por operações idempotentes. Preços, planos e quotas comerciais continuam indefinidos.

Retenção proposta: resultados por 30 dias a partir da observação; incidentes encerrados por 90 dias após encerramento; incidentes abertos nunca expiram automaticamente. Auditoria e entregas encerradas: 90 dias como proposta operacional. Limpeza diária em lotes, com retenção configurável e monitoramento de atraso. Resultados sem corpos HTTP. Começar com tabelas indexadas; decidir particionamento após medir 13 milhões de linhas e custo de limpeza, antes de admitir a carga maior se necessário.

## 4. Execução, agendamento e confiabilidade

Uma execução lógica identifica monitor + horário agendado + versão da configuração. Cada monitor tem no máximo uma execução corrente.

1. Em transação curta, o worker seleciona agendas vencidas com bloqueio e SKIP LOCKED, confere status e reserva capacidade do workspace. A reserva de concorrência do workspace também é serializada no banco, portanto vale entre réplicas.
2. Registra execução, lease e token de posse crescente; confirma a transação antes de acessar a rede. Nenhuma transação fica aberta durante HTTP.
3. Valida DNS/IP e executa GET com timeout total e orçamento de bytes. Reconfere posse/configuração quando necessário.
4. Em nova transação, somente o token vigente e não expirado pode concluir. Resultado, transição de incidente, outbox e avanço da agenda são confirmados juntos. A conclusão verifica também suspensão, pausa ou mudança de versão ocorrida durante a requisição.
5. Em reinicialização, leases expirados são recuperáveis. Um worker antigo não consegue publicar resultado após perder a posse. O relógio de referência é o PostgreSQL.

SKIP LOCKED é documentado para consumidores concorrentes de tabelas semelhantes a filas [S4]. Será usado apenas nessa coordenação, não em consultas normais do dashboard.

Garantia: não haverá dupla reserva válida nem efeitos de negócio duplicados para a mesma execução. Não é possível garantir exatamente um GET externo quando o processo morre depois de enviar e antes de persistir. Reexecução pode repetir a observação; tokens e unicidade impedem duplicar seus efeitos. Usar apenas endpoints GET sem efeitos colaterais, declarados como próprios ou autorizados pelo usuário.

Propostas iniciais para validar:

| Parâmetro | Valor inicial |
|---|---|
| Intervalo padrão/mínimo da beta | 60 segundos |
| Timeout total, incluindo DNS/TLS | 10 segundos |
| Lease | 30 segundos; não iniciar nova requisição perto do vencimento |
| Concorrência por processo | 20 verificações |
| Concorrência por workspace | 5 verificações, configurável pelo administrador |
| Redirecionamentos | Não seguir no MVP; mostrar 3xx e orientar cadastro da URL final |
| Método/portas | GET; HTTP 80 e HTTPS 443 |
| Sucesso | HTTP 200–299 com TLS válido quando HTTPS |
| Leitura | Encerrar após headers; teto de headers e cancelamento do corpo |
| Incidente | Abrir após 2 falhas consecutivas observadas; recuperar após 2 sucessos |

Intervalos distribuídos por uma fase estável para evitar rajadas a cada minuto. Após atraso prolongado, não executar todos os intervalos perdidos: registrar a lacuna e retomar uma observação atual. Falha do próprio worker/banco é ausência de observação, não indisponibilidade comprovada do alvo. Exibir estado unknown/stale após 2 intervalos mais timeout sem observação; pausa tem estado próprio.

Sem retry HTTP imediato em falhas normais do alvo: a próxima verificação confirma a condição. Retomada de execução abandonada reaproveita sua identidade dentro da janela útil; execução velha é marcada perdida. Ordem por monitor impede que resultados atrasados revertam estados recentes. No primeiro estado já indisponível, duas falhas abrem incidente, sem inventar disponibilidade anterior.

Sequências de confirmação só contam em ocorrências adjacentes, sem ocorrência perdida, e com distância entre observações de no máximo 2 intervalos mais timeout. Lacuna reinicia contadores, registra período desconhecido e não fecha um incidente já aberto. Duração cronológica do incidente e indisponibilidade observada são medidas distintas; nunca atribuir automaticamente toda a lacuna ao alvo.

Alterar URL ou critério de sucesso invalida a execução em voo, reinicia contadores e encerra o episódio anterior com motivo configuração alterada, sem registrar recuperação. Alterar apenas o nome preserva estado. Alterar intervalo/timeout reinicia a sequência de confirmação, preservando episódio aberto. Pausar/arquivar encerra acompanhamento com esse motivo, sem email de recuperação; retomar inicia estado desconhecido e nova sequência. Histórico preserva a configuração à qual cada episódio pertence.

Proteção contra concentração de destinos: limite compartilhado inicial proposto de 2 requisições simultâneas e 1 início por segundo por hostname normalizado e por IP público de destino, coordenado entre workers. Quando não houver capacidade, adiar com fairness por workspace e mostrar atraso; nunca contornar limite para cumprir intervalo. É proteção operacional, não garantia contra abuso por domínios/IPs distribuídos. Sua influência em serviços compartilhados será medida antes de definir quotas finais.

Tempo de resposta significa tempo até headers, incluindo DNS/conexão/TLS quando realizados. Não é tempo de renderização de página. Histórico apresenta amostras e cobertura observada; períodos sem dados não contam como uptime. A duração do incidente parte da primeira falha da sequência, distinguindo confirmação e recuperação observadas. Com duas confirmações a 60 segundos, a detecção pode levar aproximadamente 60–120 segundos mais timeout/atraso da fila.

Emails: um evento de abertura e outro de recuperação, sem repetição a cada check. Outbox transacional, backoff com jitter, limite de tentativas/idade e estado de falha visível ao administrador. Preservar ordem abertura/recuperação por monitor; processar eventos antigos como histórico com timestamps explícitos. Um tenant não ocupa toda a capacidade de envio.

Usar chave estável por evento/destinatário e payload imutável. Destinatário é somente o email verificado do owner; troca de email e destinatários alternativos ficam fora da beta. Antes de cada tentativa, revalidar usuário/workspace ativo, email verificado e vínculo; cancelar entregas ainda não enviadas quando essas condições deixarem de valer. Emails já aceitos pelo provedor não podem ser recolhidos. Resend documenta janela de idempotência de 24 horas [S5]. Retries automáticos de resultado ambíguo param antes desse prazo; depois disso ficam para reconciliação manual, sem reenvio cego. Aceitação pelo provedor não prova entrega na caixa postal. Bounces/entregas usam webhook assinado e idempotente quando integrado; validar entrega real nos destinatários de teste antes da beta.

## 5. Segurança e autorização

Autorização obrigatória em cada operação do servidor, baseada na sessão válida, estado do usuário e membership consultada. Nunca confiar em workspace_id recebido do navegador. Negar por padrão; isolamento também em cache, paginação, agregações, logs e erros. Não compartilhar cache de dados privados entre clientes [S1].

RLS como segunda barreira nas tabelas tenant-owned: contexto de workspace definido localmente na transação após autorização. Papel web sem propriedade das tabelas, superuser ou BYPASSRLS; políticas incluem leitura e escrita. Migrações usam credencial separada. O pool não pode conservar contexto de um cliente para outro. PostgreSQL documenta que owners e BYPASSRLS podem contornar políticas, razão para separar esses papéis [S6]. RLS protege contra erros de consulta; não torna um processo comprometido confiável.

Worker: sem acesso às senhas, sessões ou administração. Coordenação transversal limitada a operações SQL específicas para claim/finalização, com privilégios fixos e revisão de SECURITY DEFINER/search_path caso necessário. Leituras/escritas de negócio ficam restritas ao workspace/trabalho reivindicado. O scheduler é um componente de infraestrutura confiável, não uma API disponível aos clientes.

Convites: token aleatório de alta entropia armazenado como hash, vinculado a email, expiração proposta de 7 dias, revogável e uso único. Nenhum caminho alternativo de signup cria acesso sem convite. Resgate/provisionamento idempotente: reservar convite para a identidade verificada, criar workspace/membership e consumir convite atomicamente; usuário incompleto não acessa produto e pode retomar após falha. Verificar os limites transacionais reais do adapter Better Auth antes de escrever esse fluxo. Não depender de um hook isolado que deixa usuário ou workspace órfão.

Administrador da plataforma não equivale ao owner de workspace. MFA obrigatório para administração, concessão inicial por procedimento único auditado, sem autoelevação por email/domínio. Administração pode convidar/revogar, suspender usuários e workspaces e ajustar limites; sem impersonation na beta. Suspensão revoga sessões, bloqueia API e novos jobs. Alvos em voo podem completar o GET já enviado, mas não produzir novas transições após a suspensão.

SSRF: parser de URL robusto; só esquemas/portas permitidos; sem credenciais embutidas, headers arbitrários, cookies, proxies fornecidos pelo usuário ou URLs com segredos. Validar todos os registros A/AAAA a cada conexão e rejeitar qualquer endereço não público, inclusive loopback, privados, link-local, metadata, reservados e IPv4 mapeado em IPv6. Fixar a conexão ao IP validado preservando hostname/SNI e checagem TLS. Não resolver novamente implicitamente no transporte nem reutilizar sockets entre configurações/tenants. Redirects desabilitados. Esses controles seguem o problema de DNS pinning e acesso a redes internas tratado pela OWASP [S7].

Defesa de rede adicional: tráfego de probes deve bloquear destinos internos; acesso ao PostgreSQL deve ser permitido apenas pelo canal de banco necessário. A viabilidade de separar essas permissões no host escolhido é um gate de implantação. Se o PaaS não permitir essa política, avaliar isolamento do transporte em executor/proxy restrito ou host com firewall controlável, com custo explícito. Não declarar firewall existente sem teste.

TLS, cookies Secure/HttpOnly/SameSite, proteção CSRF/origin, rate limiting persistente para login/convites/mutações e limite de tamanho de entrada. Segredos no secret store do host; logs sem tokens, cookies, senhas, query strings ou corpos de resposta. Auditoria append-only para atores de runtime, incluindo ajustes de limite e ações administrativas. Senhas/recuperação/MFA usam biblioteca, sem criptografia própria.

## 6. MVP e exclusões

Incluído: convites administrativos; autenticação e recuperação de conta; um workspace individual por usuário; criar/editar/pausar/arquivar monitores; resultados reais; dashboard responsivo; histórico paginado e gráficos agregados sob demanda; incidentes automáticos; email de abertura/recuperação; configuração administrativa de limites; auditoria e saúde operacional interna.

Dashboard mostra saudável, falhando, indisponível, recuperando, pausado e sem observação recente com texto/ícone. Usa atualização periódica, inicialmente a cada 15 segundos em aba ativa; sem WebSocket. Arquivar interrompe agendamento e preserva histórico até expiração. Não haverá botão de teste sem limite que contorne a agenda.

Limite de quantidade de monitores por workspace é decisão de operação ainda pendente; nenhuma quota comercial foi inventada. Cada convite precisa receber um perfil de limites explícito antes da ativação. Redução de quota não apaga monitores: bloqueia novas ativações e exige seleção auditada de quais pausar; mudança de intervalo/retencão tem efeito e aviso explícitos. Verificação transacional de quota evita corridas de criação.

Excluído: pagamentos, cadastro público, equipes/convidados de workspace, agentes, redes privadas, credenciais de alvos, portas arbitrárias, browser sintético, múltiplas regiões de probe, status pages públicas, SMS/Slack, remediação, IA e SLA comercial. Cadastro público futuro reutiliza provisionamento, mas exige revisão de abuso, verificação de propriedade e capacidade antes de remover o gate de convite.

## 7. Implantação, capacidade, custos e riscos

Candidato: Render para aplicação web, worker always-on e PostgreSQL pago gerenciado na mesma região; Resend para email. Recomendação condicionada a orçamento, região, restauração e política de egress. Alternativa: containers em infraestrutura com controle de rede mais granular, aceitando maior trabalho operacional. Vercel para web com worker em outro host é possível, mas fragmenta a operação sem necessidade no piloto.

Ambientes local e staging isolados da beta, com bancos, segredos, destinos e emails de teste próprios. Builds sem credenciais de produção. Migrações revisadas executadas em etapa única, nunca por cada réplica ao iniciar; mudanças compatíveis com web/worker anterior e novo. Deploy manual inicialmente; rollback da aplicação e migração corretiva segura, sem rollback destrutivo automático do banco.

Backups e recuperação: usar PITR, ensaiar restauração em banco separado e registrar duração e perda observada. Meta proposta RPO até 15 minutos e RTO até 4 horas; só declarar atendida após ensaio. Render documenta PITR para banco pago, janela dependente do plano e restrição de ponto recente inferior a dez minutos [S8]. A retenção de backup não equivale à retenção dos registros do produto. Após restauração, jobs e emails ficam pausados até reconciliar agenda/outbox e evitar reenviar eventos antigos.

Observabilidade: atraso de agenda, leases expirados, backlog/idade do email, taxa de erro interno, conexões, disco e duração de queries. Heartbeat do worker e teste externo da aplicação por mecanismo independente antes do piloto; Watchtower não pode ser seu único detector de falhas. Destino/provedor desse alerta ainda será escolhido, sem contratação neste planejamento.

### Hipóteses quantitativas

Mês de 30 dias; monitores ativos sempre a cada 60 segundos. São cenários de carga, não quotas aprovadas.

| Cenário | Monitores | Checks/dia | Checks/30 dias | Média por segundo |
|---|---:|---:|---:|---:|
| 10 usuários × 5 | 50 | 72.000 | 2.160.000 | 0,83 |
| 30 usuários × 5 | 150 | 216.000 | 6.480.000 | 2,5 |
| 30 usuários × 10 | 300 | 432.000 | 12.960.000 | 5 |

Fórmula: monitores × 86.400 / intervalo em segundos. Retenção e frequência multiplicam armazenamento. A 300 monitores e timeout de 10 segundos, indisponibilidade generalizada demanda cerca de 50 slots simultâneos; um worker com 20 slots não sustenta esse pior caso. Reservar capacidade e testar múltiplas réplicas antes de aumentar admissões. Adicionar workers não reduz custo de banco ou volume de resultados.

Hipótese inicial de 250–600 bytes por resultado incluindo índices: aproximadamente 0,54–1,30 GB, 1,62–3,89 GB e 3,24–7,78 GB nos três cenários. Não inclui WAL, bloat, backups, logs nem folga; medir tamanho real do schema e provisionar margem. Não baixar corpos reduz tráfego, mas não elimina bytes recebidos em buffers, TLS ou tráfego faturável.

### Orçamento mensal estimado em USD

| Item | Reserva de planejamento |
|---|---:|
| Aplicação always-on | US$ 7–25 |
| Um worker | US$ 7–25 |
| PostgreSQL | US$ 19–55 |
| Email | US$ 0–20 |
| Disco, tráfego, logs e monitor externo | US$ 10–30 |
| Subtotal aritmético de uma instância de cada | US$ 43–155 |

Reservar aproximadamente US$ 60–180/mês para beta pequena. Para 300 alvos, múltiplos workers e mais margem de banco: US$ 120–250/mês, condicionado a benchmark. Staging always-on, plano da conta do host, domínio, tributos, HA, suporte e eventual proxy/firewall pago não estão incluídos; estimar separadamente antes da contratação. Não é cotação nem teto garantido.

Referências consultadas em 21/10/2026: artigo oficial Render lista compute de US$ 7 e US$ 25 [S9]; índice de preços oficial mostrou banco de 1 GB a US$ 19, mas a tabela dinâmica não foi totalmente exposta pela leitura automatizada [S10]. Valores superiores de banco são reserva estimada, não SKU confirmado. Resend publica Free com 3.000 emails/mês e 100/dia; Pro com 50.000/mês por US$ 20 [S11]. Revalidar todos os SKUs e taxas da conta no orçamento final.

Um único incidente simultâneo em 150 monitores já pode exceder 100 emails/dia, antes das recuperações. O plano gratuito de email serve a testes, não é base confiável para admitir toda a carga. Configurar limites de gastos e alertas; não habilitar overage automaticamente.

| Risco | Tratamento e limite residual |
|---|---|
| Vazamento entre clientes | Autorização + RLS + FKs compostas + testes adversariais; infraestrutura continua sendo fronteira de confiança |
| SSRF/DNS rebinding | Validação no socket e rede; bloquear lançamento se houver acesso a destinos proibidos |
| Checks duplicados após crash | Lease/fencing e efeitos idempotentes; repetição física de GET pode ocorrer |
| Banco único indisponível | PITR, observabilidade e estado sem dados; não há HA automática presumida |
| Probe regional falha | Mostrar origem da observação e lacunas; beta não prova disponibilidade global |
| Saturação em falha generalizada | Capacidade calculada por timeout, fairness e teste de carga |
| Falso incidente/flapping | Duas confirmações e alertas por transição; ajustar após evidência do piloto |
| Email atrasado/ambíguo | Outbox, backoff e reconciliação; entrega na caixa postal não é garantida |
| Crescimento de histórico | Retenção em lotes, métricas de disco e decisão de partição por benchmark |

## 8. Roadmap e marcos

Estimativa de esforço, não calendário contratado: 5–8 semanas de engenharia focada para entrada controlada, mais 2–4 semanas de observação. Revisões, disponibilidade de contas e falhas encontradas podem ampliar o prazo.

| Marco | Entrega | Gate de saída |
|---|---|---|
| M0 — aprovação | Arquitetura, limites da beta, região, orçamento e comportamento dos checks | Aprovação explícita deste planejamento |
| M1 — fundação (3–5 dias) | Bootstrap toolkit após aprovação, versões fixadas, docs, CI local, banco/migrações e harness | Lint/typecheck/test/build sem credenciais remotas; SQL revisado |
| M2 — acesso (4–6 dias) | Convites, autenticação, MFA admin, workspace, RLS e quotas | Testes entre tenants e resgate concorrente aprovados |
| M3 — monitoramento (6–10 dias) | Transporte seguro, agenda, leases, recuperação e resultados | Testes SSRF, concorrência e crashes aprovados |
| M4 — experiência (5–8 dias) | Dashboard, incidentes, outbox, emails e admin | Fluxo completo, estados sem dados e acessibilidade validados |
| M5 — preparação (5–8 dias) | Staging, carga, retenção, restauração e monitor externo | Critérios abaixo evidenciados; implantação exige autorização separada |
| M6 — piloto (2–4 semanas de observação) | Primeiro 3–5 usuários; depois 10 e até 30 conforme capacidade | Sem falhas críticas abertas; revisar custos, alertas e experiência a cada expansão |

O primeiro bootstrap seguirá o toolkit solicitado com revisão fixada e preservará Ponytail, Caveman, Superpowers, RTK, Context7 e Graphify nativos. Não instalar ferramentas, gerar aplicação, contratar ou publicar como efeito deste documento. Plano detalhado de implementação vem após aprovação.

## 9. Critérios de aceite

1. Convite inválido, expirado, revogado, reutilizado ou destinado a outro email não concede acesso. Corridas e reinicialização no onboarding produzem no máximo um workspace utilizável por usuário, sem privilégio parcial.
2. Usuário A não lê, modifica, agrega nem infere dados de B por API, Actions, URL, cache ou jobs. Testes executados com papéis reais de runtime, sem superuser mascarando RLS.
3. Criar/reativar monitores simultaneamente nunca ultrapassa quota. Redução de limite não apaga histórico. Suspensão bloqueia novos trabalhos e sessões.
4. Casos de SSRF incluem IPv4/IPv6, metadata, DNS misto/rebinding, redirecionamento interno, portas e formatos alternativos. Evidência comprova que nenhum socket proibido foi aberto, além da resposta de erro.
5. Dois ou mais workers não geram resultados/incidentes/outbox duplicados para a mesma execução. Matar processo antes/depois do GET e antes/depois do commit não perde efeitos já confirmados; tokens antigos são recusados.
6. Reiniciar web/worker preserva monitores, resultados e incidentes. Reiniciar worker/banco marca lacunas corretamente, sem imputar indisponibilidade ao cliente ou disparar tempestade de catch-up.
7. Duas falhas/sucessos exercitam abertura/recuperação; resultado atrasado não reverte estado. Lacunas reiniciam sequências, mudança de URL não recupera outro alvo e pausa não fabrica recuperação. Gráficos e uptime exibem cobertura e distinguem unknown de sucesso.
8. Falha e resposta ambígua do email preservam evento para retry/reconciliação. Um evento gera uma entrega lógica por destinatário; teste real verifica chegada, bounce e estado de erro. Suspensão cancela entregas pendentes; destinatário não verificado nunca recebe alerta. Não prometer exactly-once além da janela do provedor.
9. Meta de carga proposta: 300 monitores, por 24 horas, com segmento de timeout generalizado e pelo menos dois workers. Dimensionar slots suficientes. Em regime saudável, p95 do atraso de início ≤10 s; backlog estável; zero perda de resultados confirmados. Painel p95 ≤2 s em cenário documentado com 30 sessões, incluindo histórico representativo de 30 dias.
10. Retenção é validada com datas de fronteira, incidentes abertos e workspace com configuração distinta. Limpeza não trava agenda; utilização de disco tem alerta e margem comprovados.
11. Restaurar backup isolado comprova integridade e mede RPO/RTO. Retomada não reenvia emails históricos automaticamente. Registrar falha se metas de recuperação não forem alcançadas.
12. Navegação por teclado, foco, contraste, labels e estados de erro passam revisão; cores não são o único sinal. Responsividade e fluxos principais passam teste no navegador.
13. Vulnerabilidades críticas/altas relevantes, bypass de convite, falha de isolamento ou SSRF impedem lançamento. Outros achados exigem triagem registrada. Nenhuma afirmação de segurança absoluta.
14. Antes de cada expansão, revisar custo real por monitor, atraso de verificação, taxa de falha de entrega e entendimento dos estados pelos usuários. Não confundir passar testes com validação comercial.

Arquitetura e stack aprovadas. Parâmetros GET/200–299/sem redirects e duas confirmações compõem o planejamento aprovado para validação posterior. Orçamento, quotas iniciais por convite, região e controles reais de egress continuam pendentes de definição operacional. Quotas, região e contratação podem permanecer pendentes durante preparação local, mas bloqueiam admissão em produção. Somente M1 está autorizado. M2 exige nova aprovação explícita.

## Fontes e limites da pesquisa

- [S1 — Next.js: segurança de dados](https://nextjs.org/docs/app/guides/data-security), consultado também via Context7 `/vercel/next.js`.
- [S2 — Better Auth: banco e hooks](https://better-auth.com/docs/concepts/database), consultado também via Context7 `/better-auth/better-auth`.
- [S3 — Drizzle](https://orm.drizzle.team/docs/overview).
- [S4 — PostgreSQL: SELECT / locking](https://www.postgresql.org/docs/current/sql-select.html).
- [S5 — Resend: idempotência](https://resend.com/docs/dashboard/emails/idempotency-keys).
- [S6 — PostgreSQL: RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).
- [S7 — OWASP: SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).
- [S8 — Render: backups](https://render.com/docs/postgresql-backups).
- [S9 — Render: preços de compute no artigo oficial](https://render.com/articles/render-vs-railway). Usado apenas para preços Render, não para alegações sobre concorrentes.
- [S10 — Render: preços](https://render.com/pricing). Tabela dinâmica parcialmente indisponível na leitura; exige confirmação antes de contratar.
- [S11 — Resend: preços](https://www.resend.com/pricing?product=transactional).
- [S12 — Toolkit: bootstrap solicitado](https://raw.githubusercontent.com/soumatheusgomes/vibe-coding-toolkit/main/docs/prompts/11-next-project-bootstrap.md). Execução local limitada ao M1, autorizada posteriormente pelo usuário.

Revisão independente de planejamento realizada por agente separado em 21/10/2026. Foram identificadas e resolvidas ambiguidades sobre mudança/pausa de monitor, sequências através de lacunas e destinatários de emails pendentes. Essa revisão não é auditoria de implementação ou certificação de segurança.

Pesquisa documental não valida instalação, compatibilidade exata das versões, configuração da conta, preços finais, isolamento de rede, desempenho ou entrega de email. O planejamento original não criou serviços nem aplicou migrações. Posteriormente, M1 criou e migrou exclusivamente PostgreSQL local de desenvolvimento; nenhum email ou check contra sistemas de terceiros foi executado.

## Adendo aprovado — autorização exclusiva do M1

O usuário aprovou a arquitetura e autorizou bootstrap, monorepo, aplicação e worker, PostgreSQL local, schema inicial, migrações, documentação e quality gates. Não autorizou funcionalidades de M2–M6, deploy ou contratação. Este documento permanece a referência principal; docs/architecture.md descreve somente o estado implementado.

Requisitos adicionais obrigatórios:

1. **Capacidade sob falhas simultâneas e saturação:** em M3/M5, testar 300 alvos com 100% de timeout, réplicas concorrentes, worker morto, banco lento e fila acima da capacidade. Medir atraso p50/p95/p99, throughput, slots, idade da fila, memória e tempo de recuperação. Sob sobrecarga, respeitar os limites, não crescer memória/fila sem controle e não fabricar disponibilidade. Retomada sem tempestade de catch-up. M1 registra o contrato; não simula motor inexistente.
2. **SSRF no ambiente de implantação:** gate obrigatório antes de convites em M5. Verificar DNS, IPv4/IPv6, metadata, redirects e política real de saída com alvos controlados e evidência do destino do socket. Testes locais nunca substituem a prova no host. Qualquer implantação depende de autorização posterior.
3. **Métricas e consumo:** M1 instrumenta CPU cumulativa, RSS, uptime e tamanho/estimativas do PostgreSQL local, sem exportar dados. M3/M4 adicionarão checks executados, retries, bytes observados, latência, backlog, slots e envios aceitos por provedor. M5 relacionará volume por workspace a faturas/custos reais, sem confundir bytes de aplicação com faturamento de rede. Sem URLs, emails ou workspace_id como labels de alta cardinalidade; contabilidade por tenant usa armazenamento autorizado e separado.

Schema inicial M1: workspaces e memberships e identificação mínima necessária às referências. Schema de autenticação completo será alinhado ao Better Auth fixado em M2; monitoramento, incidentes e outbox serão migrados nos marcos correspondentes. Não criar CRUD ou sessões como efeito da fundação.
