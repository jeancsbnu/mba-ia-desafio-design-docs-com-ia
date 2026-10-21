# PRD: Sistema de Webhooks de Notificação de Pedidos

| Campo | Valor |
|---|---|
| **Produto** | Order Management System (OMS) |
| **Responsável de produto** | Marcos (PM) |
| **Liderança técnica** | Larissa (Tech Lead) |
| **Autoria do documento** | @jeancsbnu, com apoio de IA |
| **Status** | Em revisão |
| **Data** | 20/10/2026. A transcrição registra a reunião de origem como "quinta-feira", sem data. |
| **Documentos ligados** | [RFC](RFC.md), [ADRs](adrs/README.md), [FDD](FDD.md), [Tracker](TRACKER.md) |

**Notação.** Cada item cita sua origem: a fala na [`TRANSCRICAO.md`](../TRANSCRICAO.md), no formato `[hh:mm] Nome`, ou um documento do pacote. Duas marcas indicam o que não veio pronto da reunião:

- *(interpretação, AMB-xx)*: leitura de um ponto ambíguo, registrada no [inventário](processo/inventario.md#8-ambiguidades-e-interpretações-adotadas).
- *(proposta)*: algo que a reunião não definiu.

---

## 1. Resumo e contexto

A plataforma vai **avisar os clientes B2B, em tempo quase real, quando o status de um pedido deles mudar**. O aviso é uma chamada HTTP para um endereço cadastrado pelo cliente (webhook de saída). Assim o cliente não precisa mais consultar a API repetidamente.

A funcionalidade nasceu de um pedido formal de três clientes ([09:00] Marcos). Escopo, garantias e restrições foram definidos numa reunião técnica com produto (Marcos), liderança técnica (Larissa), pedidos (Bruno), plataforma (Diego) e segurança (Sofia).

Este PRD trata do **porquê** e do **quê**. O **como** está no [RFC](RFC.md) e no [FDD](FDD.md).

## 2. Problema e motivação

- **Polling lento e caro.** Atlas Comercial, MaxDistribuição e Nova Cargo consultam `GET /orders` "de tempos em tempos" para descobrir mudanças, o que deixa a integração "lenta e cara pra eles" ([09:00] Marcos).
- **O que conta como tempo real.** Para eles, "qualquer coisa abaixo de 10 segundos já é tempo real" ([09:02] Marcos).
- **Risco comercial.** A reunião cita dois marcos e não os reconcilia *(interpretação, AMB-22)*:
  - a Atlas pode migrar para um concorrente se a funcionalidade não sair "até fim do trimestre" ([09:00] Marcos);
  - Marcos também diz que "a Atlas quer pra fim de novembro" ([09:45] Marcos).
- **Nenhum aviso hoje.** A plataforma não tem mecanismo de notificação externa: o cliente precisa perguntar para saber.

## 3. Público-alvo e cenários de uso

| Público | Interesse | Origem |
|---|---|---|
| Clientes B2B integradores (Atlas Comercial, MaxDistribuição, Nova Cargo) | Receber as mudanças de status sem polling | [09:00] Marcos |
| Usuários da plataforma que representam o cliente | Cadastrar e gerenciar endereços pela API, com o JWT do sistema | [09:32] Marcos |
| Administradores (papel ADMIN) | Reprocessar avisos que falharam de forma definitiva | [09:36] Sofia, [09:36] Larissa |
| Produto e portal de desenvolvedor | Documentar integração, garantia de entrega e limitações | [09:26] Marcos, [09:40] Marcos |

| ID | Cenário | Origem |
|---|---|---|
| PRD-CEN-01 | O cliente quer saber só quando os pedidos são enviados ou entregues. Ele cadastra um endereço com esses dois status e recebe um aviso a cada mudança para um deles. | [09:33] Marcos |
| PRD-CEN-02 | O sistema do cliente fica fora do ar por 2h numa manutenção planejada. A plataforma continua tentando em intervalos crescentes por cerca de 15h, e os avisos chegam na próxima tentativa agendada depois que o sistema volta. | [09:16] Diego, [09:17] Diego |
| PRD-CEN-03 | **Troca planejada de secret:** o cliente pede uma nova secret pela API e tem 24h para migrar antes de a antiga deixar de valer. | [09:21] Sofia |
| PRD-CEN-04 | **Suspeita de vazamento:** o cliente precisa invalidar a secret antiga na hora, sem as 24h. A revogação imediata é *(proposta)* do [FDD](FDD.md#fdd-fluxo-07-rotação-de-secret) e depende da avaliação de segurança. | [09:22] Diego |
| PRD-CEN-05 | O cliente recebe o mesmo aviso duas vezes e descarta a duplicata pelo identificador único. | [09:25] Diego |
| PRD-CEN-06 | O cliente investiga um aviso que não chegou consultando os últimos 100 envios, com resultado, resposta e tempo de cada um. | [09:34] Marcos |
| PRD-CEN-07 | Um aviso esgotou as tentativas. Um administrador o reprocessa, e a plataforma registra quem fez isso. | [09:18] Diego, [09:36] Sofia |
| PRD-CEN-08 | O cliente tem vários endereços cadastrados, e cada aviso informa de qual cadastro veio. | [09:44] Sofia |
| PRD-CEN-09 | O cliente desativa um endereço *(interpretação de "estado ativo", [09:21] Bruno)*. Enquanto o endereço está inativo, as mudanças de status não geram avisos para ele. Os avisos que já estavam pendentes ficam retidos por até 24h *(prazo proposto no FDD)* e depois vão para a fila de falhas. | [09:21] Bruno, [FDD FLUXO-08](FDD.md#fdd-fluxo-08-crud-de-cadastro) |
| PRD-CEN-10 | Um desenvolvedor do cliente integra seguindo o portal, que explica a garantia de "ao menos uma vez" e a limitação de ordem. | [09:26] Marcos, [09:13] Larissa |

## 4. Objetivos e métricas de sucesso

| ID | Objetivo | Métrica | Meta | Origem |
|---|---|---|---|---|
| PRD-MET-01 | Aviso em "tempo real" | Atraso entre a mudança de status e o **início** do 1º envio. É visível ao cliente pelos dois horários informados no aviso. | **Abaixo de 10s.** Medir até o início do envio é *(interpretação, AMB-21)*. Acompanhar pelo p95, excluindo endereços pausados, é *(proposta)* ([FDD-OBS-03](FDD.md#fdd-obs-03-métricas-derivadas-proposta)). | [09:02] Marcos, [09:10] Larissa |
| PRD-MET-02 | Entregar no prazo pedido | Funcionalidade disponível em produção | **Até o fim de novembro** (pedido da Atlas). Ter os 3 clientes solicitantes integrados é *(proposta de meta complementar)*: depende de trabalho deles. | [09:45] Marcos |
| PRD-MET-03 | Consistência entre pedido e aviso | Mudanças de status com endereço **ativo** inscrito que não geraram aviso | **0** | [09:40] Bruno, [09:41] Diego |
| PRD-MET-04 | Tolerar indisponibilidade do cliente | Janela em que a plataforma continua tentando | **~15h**: 5 tentativas lidas como 5 retentativas depois do envio inicial *(interpretação, AMB-02)* | [09:17] Diego, [09:17] Larissa |
| PRD-MET-05 | Reduzir o polling | Chamadas a `GET /orders` dos usuários dos 3 clientes, medidas nos logs de requisição existentes (`http_request`) | *Indicador de acompanhamento*, sem meta numérica definida na reunião. Medir a linha de base antes do lançamento. | [09:00] Marcos |
| PRD-MET-06 | Saúde das entregas | Avisos que chegam à fila de falhas (DLQ), por cliente | *Indicador de acompanhamento.* Usá-lo como insumo para decidir sobre o e-mail é *(proposta)* ([RFC-OQ-05](RFC.md#questões-em-aberto)). | [09:37] Larissa |

**Premissa a confirmar.** A reunião não cruzou a estimativa de 3 sprints ([09:47] Larissa) com o marco de fim de novembro, porque não informou o início nem a duração dos sprints. Marcos ficou de confirmar o prazo com a Atlas ([09:47] Marcos).

## 5. Escopo

**Incluso:** as capacidades descritas nos requisitos funcionais da [seção 6](#6-requisitos-funcionais).

### Fora de escopo

| ID | Item | Situação na reunião | Origem |
|---|---|---|---|
| PRD-OOS-01 | Aviso por **e-mail** ao cliente quando os webhooks dele falham | Fora desta fase. "Talvez próxima fase, depois que a gente medir o impacto": é adiamento condicional, não compromisso. | [09:37] Marcos, [09:37] Larissa, [09:38] Marcos |
| PRD-OOS-02 | **Painel visual** para o cliente | "Só endpoints". O painel é um projeto separado do time de frontend. | [09:39] Marcos, [09:40] Larissa |
| PRD-OOS-03 | Webhooks de **entrada** | "Só saindo da gente pra eles." | [09:02] Sofia, [09:02] Marcos |
| PRD-OOS-04 | **Arquivamento** das linhas entregues da fila interna (~30 dias) | Fora desta funcionalidade. É interno e não afeta o histórico que o cliente consulta. | [09:08] Diego |
| PRD-OOS-05 | **Itens do pedido** no aviso | Não vão. O cliente consulta o pedido se precisar. | [09:43] Diego |
| PRD-OOS-06 | **Ordem global** e entrega **exatamente uma vez** | Não oferecidas. Ver PRD-NFR-04. | [09:13] Larissa, [09:14] Marcos, [09:25] Diego |
| PRD-OOS-07 | **Várias instâncias** de processamento em paralelo | "Problema do futuro, não agora." | [09:13] Diego |
| PRD-OOS-08 | **Outros tipos de evento** (ex.: criação de pedido) | Só a mudança de status foi discutida (`order.status_changed`) *(interpretação, AMB-11)* | [09:43] Diego |

### Em observação (questão em aberto)

O **controle de volume de envio por cliente** (rate limiting) não é implementado nesta fase, mas também não foi descartado. A decisão foi "observar e decidir depois" ([09:39] Diego, [09:39] Larissa). Ver [RFC-OQ-01](RFC.md#questões-em-aberto).

## 6. Requisitos funcionais

| ID | Requisito | Origem |
|---|---|---|
| PRD-FR-01 | A plataforma **avisa** o cliente quando o status de um pedido dele muda, chamando o endereço cadastrado. O fluxo é só de saída. | [09:00] Marcos, [09:02] Marcos |
| PRD-FR-02 | O cliente **cadastra** um endereço pela API, com os status de interesse. A plataforma gera a secret e a entrega na criação. | [09:31] Marcos |
| PRD-FR-03 | O cliente **edita, remove e lista** os endereços de um cliente. Também pode **desativá-los e reativá-los** *(interpretação de "estado ativo", [09:21] Bruno)* (PRD-CEN-09). | [09:33] Bruno, [09:21] Bruno |
| PRD-FR-04 | Cada endereço recebe **apenas os status escolhidos**. | [09:33] Marcos, [09:34] Bruno |
| PRD-FR-05 | Só são aceitos endereços **https**. Os demais são recusados no cadastro. | [09:23] Sofia |
| PRD-FR-06 | Cada aviso é **assinado** com a secret do endereço, para o cliente confirmar origem e integridade. | [09:19] Sofia, [09:20] Sofia |
| PRD-FR-07 | O cliente **troca a secret** pela API, e a anterior vale por mais 24h. Durante essa carência, uma nova troca pelo fluxo normal é bloqueada *(proposta, [FDD FLUXO-07](FDD.md#fdd-fluxo-07-rotação-de-secret))*. | [09:21] Sofia |
| PRD-FR-08 | Cada aviso traz um **identificador único**, que se repete nos reenvios, e informa **de qual cadastro** veio. | [09:25] Diego, [09:44] Sofia |
| PRD-FR-09 | O aviso traz os **dados essenciais da mudança**: pedido, número, status anterior e novo, cliente, momento e valor total. **Não** traz os itens. | [09:43] Diego |
| PRD-FR-10 | Se o cliente não responder em **até 10s**, ou não responder com sucesso, a plataforma **tenta de novo**, em intervalos crescentes, por ~15h. Considerar sucesso apenas a resposta 2xx é *(interpretação, AMB-17)*. | [09:15] Diego, [09:17] Diego, [09:42] Diego |
| PRD-FR-11 | Avisos que esgotam as tentativas vão para uma **fila de falhas**. Um administrador pode consultá-la *(proposta)* e **reprocessar** os avisos, e a plataforma registra quem fez isso. O reprocessamento não vale para avisos acima de 64KB nem para endereços removidos ou inativos. | [09:18] Diego, [09:36] Sofia |
| PRD-FR-12 | O cliente consulta os **últimos 100 envios** de um endereço, com resultado, conteúdo, resposta e tempo. A contagem por endereço e por tentativa é *(interpretação, AMB-24 e AMB-05)*. | [09:34] Marcos |

## 7. Requisitos não funcionais

| ID | Requisito | Origem |
|---|---|---|
| PRD-NFR-01 | **Latência:** o 1º envio começa em menos de 10s após a mudança (PRD-MET-01). | [09:02] Marcos, [09:10] Larissa |
| PRD-NFR-02 | **Isolamento:** a lentidão ou indisponibilidade do cliente nunca trava nem desfaz uma mudança de status. | [09:04] Bruno |
| PRD-NFR-03 | **Consistência:** para cada endereço ativo inscrito, a mudança de status e o registro do aviso acontecem juntos. Se o aviso não puder ser registrado, a mudança é desfeita. | [09:40] Bruno, [09:41] Diego |
| PRD-NFR-04 | **Garantia de entrega e ordem:** cada aviso é entregue **ao menos uma vez**, então o cliente deve descartar duplicatas. Os avisos de um mesmo pedido saem na ordem em que aconteceram, com uma única instância de processamento, mas não há ordem global. Durante as retentativas, um aviso posterior pode chegar antes *(interpretação, AMB-09)*. | [09:24] Diego, [09:25] Sofia, [09:12] Diego, [09:13] Larissa |
| PRD-NFR-05 | **Segurança:** https obrigatório, secret única por endereço e assinatura HMAC-SHA256. | [09:20] Sofia, [09:21] Sofia, [09:23] Sofia |
| PRD-NFR-06 | **Tamanho:** avisos acima de 64KB não são enviados e contam como erro. | [09:23] Sofia, [09:24] Larissa |
| PRD-NFR-07 | **Sem infraestrutura nova:** mesmo banco e mesma base técnica. O único componente novo é um processo de envio. | [09:07] Diego, [09:11] Diego, [09:30] Larissa |

## 8. Decisões e trade-offs principais

| Decisão | O que ganhamos | O que aceitamos | ADR |
|---|---|---|---|
| Registrar o aviso junto com a mudança de status e enviá-lo em segundo plano | Nenhum aviso registrado se perde, e o cliente nunca trava a plataforma | O envio é quase em tempo real, não instantâneo. Se o aviso não puder ser registrado, a mudança de status é desfeita. | [ADR-001](adrs/ADR-001-outbox-no-mysql.md), [ADR-002](adrs/ADR-002-worker-separado-em-polling.md) |
| Retentar por ~15h e depois mandar para a fila de falhas | Indisponibilidades de horas ficam cobertas | Depois disso, o reenvio é manual e o cliente não recebe alerta | [ADR-003](adrs/ADR-003-retry-backoff-e-dlq.md) |
| Assinar com uma secret por endereço | Origem verificável; um vazamento atinge só um endereço | O cliente precisa implementar a verificação | [ADR-004](adrs/ADR-004-hmac-sha256-secret-por-endpoint.md) |
| Entregar ao menos uma vez | Simplicidade: não exige coordenação entre os dois lados | O cliente precisa descartar duplicatas | [ADR-005](adrs/ADR-005-at-least-once-com-x-event-id.md) |
| Construir com os padrões e a infraestrutura atuais | Consistência com o código existente, sem dependências novas | Limitações herdadas, como permissões sem escopo por cliente (PRD-RISK-05) | [ADR-006](adrs/ADR-006-reuso-dos-padroes-do-projeto.md) |
| O aviso reflete o pedido no momento da mudança | Avisos coerentes e idênticos em todo reenvio | Os dados do pedido ficam guardados sem arquivamento nesta fase | [ADR-007](adrs/ADR-007-payload-snapshot-na-insercao.md) |

## 9. Dependências

As dependências abaixo foram combinadas na reunião.

| Dependência | Responsável | Origem |
|---|---|---|
| Portal de desenvolvedor com documentação em destaque: garantia "ao menos uma vez", como integrar via API e limitação de ordem | Marcos (PM) | [09:26] Marcos, [09:40] Marcos, [09:13] Larissa |
| Revisão de segurança (HMAC e geração de secret) de pelo menos 2 dias úteis antes do deploy | Sofia (Segurança) | [09:46] Sofia, [09:49] Sofia |
| Confirmação do prazo com a Atlas e comunicação aos clientes | Marcos (PM) | [09:47] Marcos, [09:49] Marcos |
| Sessão de revisão técnica antes da implementação | Larissa, Bruno, Diego | [09:50] Larissa |
| Do lado do cliente: endereço https, resposta em até 10s, validação da assinatura e descarte de duplicatas | Clientes B2B | [09:23] Sofia, [09:42] Diego, [09:20] Sofia, [09:25] Diego |

## 10. Riscos e mitigação

Probabilidade e impacto são **avaliação do autor**. A reunião não os quantificou.

| ID | Risco | Probabilidade | Impacto | Mitigação | Origem |
|---|---|---|---|---|---|
| PRD-RISK-01 | **A Atlas migra para o concorrente por atraso na entrega** | Média | Alto | Antecipar a revisão de segurança ([09:46] Sofia) e acompanhar o prazo com a Atlas ([09:47] Marcos). A estimativa de 3 sprints considerou o escopo da reunião. Os acréscimos *(propostos)* do FDD precisam ser validados contra o prazo na revisão técnica. | [09:00] Marcos, [09:45] Marcos, [09:46] Larissa |
| PRD-RISK-02 | **O sistema do cliente é impactado:** não valida a assinatura, não descarta duplicatas ou recebe rajadas de avisos sem controle de volume | Média | Médio | Destacar no portal a garantia "ao menos uma vez" e o passo a passo da validação. Observar os envios por cliente para decidir sobre o controle de volume ([RFC-OQ-01](RFC.md#questões-em-aberto)). | [09:25] Sofia, [09:26] Marcos, [09:38] Diego, [09:39] Larissa |
| PRD-RISK-03 | **Vazamento de secret**, como já aconteceu com um cliente | Média | Alto | Secret única por endereço. Troca planejada com carência de 24h. Revogação imediata para vazamento *(proposta do FDD, a avaliar na revisão de segurança)*. | [09:21] Sofia, [09:22] Diego, [09:46] Sofia |
| PRD-RISK-04 | **O cliente não percebe as falhas:** não recebe alerta quando os avisos falham, e as mudanças ocorridas com o endereço desativado não geram aviso | Média | Médio | Histórico de entregas e reprocessamento manual. Orientação *(proposta)* de não desativar o endereço durante manutenção curta, porque as retentativas de ~15h já cobrem esse caso ([FDD-RISK-13](FDD.md#13-riscos-e-mitigação)). O e-mail é item adiado (PRD-OOS-01), não mitigação. | [09:37] Larissa, [09:21] Bruno, [09:16] Diego |
| PRD-RISK-05 | **Permissões amplas:** qualquer usuário autenticado gerencia endereços de qualquer cliente e pode passar a receber os dados de pedidos de outro cliente *(interpretação, ADR-006-CON-01)* | Média | Alto | Aceito "por enquanto" ([09:37] Sofia). O endurecimento está em aberto e sem data ([RFC-OQ-03](RFC.md#questões-em-aberto)). Levar o tema à revisão de segurança é *(proposta)*: o escopo declarado dela é HMAC e secret. | [09:32] Larissa, [09:37] Sofia |

## 11. Critérios de aceitação

São comportamentos observáveis pelo cliente ou pelo administrador.

| ID | Critério | Origem |
|---|---|---|
| PRD-AC-01 | Um cliente inscrito em "enviado" recebe o aviso quando um pedido passa para "enviado", e o horário de envio informado no aviso fica a menos de 10s do horário da mudança. | [09:02] Marcos, [09:33] Marcos |
| PRD-AC-02 | O cliente não recebe avisos de status que não escolheu nem de endereços desativados. | [09:34] Bruno |
| PRD-AC-03 | Um cliente fora do ar por 2h recebe os avisos do período nas tentativas seguintes, sem intervenção manual. | [09:16] Diego |
| PRD-AC-04 | A mudança de status conclui com sucesso mesmo com o endereço do cliente fora do ar ou lento. | [09:04] Bruno |
| PRD-AC-05 | O cliente valida a assinatura com a sua secret. Depois de uma troca planejada, a secret anterior continua aceita por 24h. | [09:20] Sofia, [09:21] Sofia |
| PRD-AC-06 | Um endereço sem https é recusado. | [09:23] Sofia |
| PRD-AC-07 | O cliente reconhece um aviso repetido pelo identificador e sabe de qual cadastro ele veio. | [09:25] Diego, [09:44] Sofia |
| PRD-AC-08 | O cliente vê os últimos 100 envios de um endereço, com resultado, resposta e tempo. | [09:34] Marcos |
| PRD-AC-09 | Só um administrador reprocessa a fila de falhas, e a plataforma registra quem o fez. | [09:36] Sofia |
| PRD-AC-10 | O aviso traz os dados essenciais da mudança e não traz os itens do pedido. | [09:43] Diego |
| PRD-AC-11 | Um aviso que continua falhando é reenviado em intervalos crescentes e, depois de ~15h, aparece na fila de falhas. | [09:17] Diego, [09:18] Diego |
| PRD-AC-12 | Se o aviso de um endereço ativo inscrito não puder ser registrado, a mudança de status não acontece. | [09:40] Bruno |
| PRD-AC-13 | Duas mudanças seguidas do mesmo pedido chegam na ordem em que aconteceram, quando entregues de primeira. | [09:12] Diego |
| PRD-AC-14 | Um aviso acima de 64KB não é enviado e aparece como erro no histórico do endereço. | [09:24] Larissa |

Os critérios técnicos, verificáveis por teste automatizado, estão em [FDD §12](FDD.md#12-critérios-de-aceite-técnicos).

## 12. Estratégia de testes e validação

1. **Testes automatizados.** Cobrem os critérios técnicos do [FDD §12](FDD.md#12-critérios-de-aceite-técnicos), com banco real e um servidor de teste no papel do cliente. Os testes existentes de pedidos e autenticação continuam passando.
2. **Revisão de segurança.** Sofia revisa HMAC e geração de secret antes do deploy ([09:46] Sofia), com os itens derivados de [RFC-OQ-04](RFC.md#questões-em-aberto).
3. **Validação com os clientes** *(proposta)*. A validação é feita com os 3 clientes solicitantes, começando pela Atlas por causa do prazo, seguindo o portal ([09:26] Marcos).
4. **Medição antes e depois.**
   - Antes do lançamento, registrar a linha de base da PRD-MET-05.
   - Depois, acompanhar três indicadores:
     - PRD-MET-01, pelas métricas de entrega do [FDD §9](FDD.md#9-observabilidade);
     - PRD-MET-05, pelos logs de requisição;
     - PRD-MET-06, pela fila de falhas.
   - Esses dados alimentam as decisões adiadas, cujo critério ainda está em aberto ([RFC-OQ-01](RFC.md#questões-em-aberto), [RFC-OQ-05](RFC.md#questões-em-aberto)).
