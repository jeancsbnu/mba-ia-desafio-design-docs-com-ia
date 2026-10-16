# Inventário: fonte da verdade do pacote de design docs

Este arquivo é a base de todos os documentos em `docs/`. Nenhum item entra no PRD, RFC, ADRs ou FDD sem antes estar aqui, com origem `[hh:mm] Nome` (transcrição) ou caminho de arquivo (código).

**Como foi produzido:**

1. A sessão principal leu `TRANSCRICAO.md` e montou a extração.
2. Um subagente mapeou o código ([P-01](prompts.md#p-01-mapeamento-do-código-existente)).
3. Outro subagente, com modelo diferente, fez uma extração cega da transcrição ([P-02](prompts.md#p-02-extração-cega-da-transcrição)).
4. As duas extrações foram comparadas; as divergências estão em [iteracoes.md](iteracoes.md).

---

## 1. Decisões fechadas

| ID | Decisão | Origem | ADR |
|---|---|---|---|
| D-01 | Padrão outbox no MySQL existente: o evento é gravado em `webhook_outbox` **na mesma transação** que atualiza `orders` e `order_status_history`. | [09:06] Diego, [09:08] Larissa, [09:40] Bruno, [09:41] Diego | ADR-001 |
| D-02 | Se a inserção na outbox falhar, a transação inteira dá rollback; não pode haver mudança de status sem evento. | [09:40] Bruno, [09:41] Diego | ADR-001 |
| D-03 | Worker lê a outbox por **polling a cada 2 segundos**, buscando os pendentes mais antigos em batch pequeno. | [09:09] Diego, [09:08] Diego, [09:10] Larissa | ADR-002 |
| D-04 | Worker roda em **processo separado** da API: nova entry-point `src/worker.ts` e script `npm run worker`, mesmo banco e mesma stack. | [09:11] Diego, [09:11] Larissa, [09:11] Bruno, [09:28] Bruno | ADR-002 |
| D-05 | A lógica de processamento fica num arquivo **dentro do módulo**, e `src/worker.ts` é só a entry-point. O nome do arquivo (`webhook.worker.ts` ou `webhook.processor.ts`) não foi escolhido; ver AMB-12. | [09:28] Bruno, [09:28] Diego | ADR-002 / ADR-006 |
| D-06 | O worker usa um **PrismaClient próprio** (outro processo), com a mesma `DATABASE_URL`. Isso corrige a fala anterior de "usar o mesmo Prisma client" ([09:11] Bruno). | [09:29] Diego, [09:30] Bruno | ADR-006 |
| D-07 | Retry com **backoff exponencial**: 5 tentativas, intervalos 1m / 5m / 30m / 2h / 12h (quase 15h no total). | [09:15] Diego, [09:17] Diego, [09:17] Larissa | ADR-003 |
| D-08 | Esgotadas as tentativas, o evento vai para a **DLQ em tabela separada** `webhook_dead_letter`, com payload, motivo da falha e timestamp. | [09:15] Diego, [09:18] Diego | ADR-003 |
| D-09 | Reprocessamento da DLQ é **manual**, via `POST /admin/webhooks/dead-letter/:id/replay`, que recoloca o evento na outbox como pendente. | [09:18] Diego, [09:35] Diego | ADR-003 |
| D-10 | O replay exige **role ADMIN**, reaproveitando o `requireRole` existente, e **registra em log quem fez** (auditoria). | [09:36] Sofia, [09:36] Larissa | ADR-003 / ADR-006 |
| D-11 | Assinatura **HMAC-SHA256 sobre o corpo do request**, enviada no header `X-Signature`. | [09:20] Sofia, [09:22] Sofia | ADR-004 |
| D-12 | **Secret única por endpoint** de webhook; não existe secret global. | [09:21] Sofia, [09:22] Sofia | ADR-004 |
| D-13 | Secret **rotacionável pela API**; a antiga continua válida por **24h** em paralelo e depois deixa de valer. | [09:21] Sofia, [09:22] Sofia | ADR-004 |
| D-14 | Garantia de entrega **at-least-once**; o cliente deduplica pelo header `X-Event-Id` (UUID gerado quando o evento entra na outbox). | [09:24] Diego, [09:25] Diego, [09:26] Larissa | ADR-005 |
| D-15 | **Reuso máximo dos padrões do projeto**: módulo `src/modules/webhooks` (controller, service, repository, routes, schemas), `AppError`, Pino, error middleware, schemas Zod, padrão de códigos de erro. | [09:27] Bruno, [09:29] Bruno, [09:30] Larissa | ADR-006 |
| D-16 | Códigos de erro do módulo com **prefixo `WEBHOOK_`**, por exemplo `WEBHOOK_NOT_FOUND` e `WEBHOOK_INVALID_URL`. | [09:28] Bruno, [09:29] Larissa | ADR-006 |
| D-17 | Integração via função `publishWebhookEvent(tx, order, fromStatus, toStatus)`, que recebe o client da transação atual e é chamada pelo `order.service`; não se injeta um repository inteiro. | [09:41] Bruno, [09:41] Diego | ADR-006 |
| D-18 | O payload é **renderizado e gravado (snapshot) na inserção** da outbox, e não na hora do envio. | [09:52] Larissa, [09:52] Diego, [09:52] Bruno | ADR-007 |
| D-19 | Ids da outbox (e das novas tabelas) em **UUID**, seguindo o padrão do projeto. | [09:51] Larissa | ADR-006 |
| D-20 | O **filtro de status é aplicado na inserção** da outbox: se nenhum webhook do customer quer aquele status, nada é inserido. | [09:34] Bruno, [09:34] Diego | ADR-001 |
| D-21 | `customer_id` **não vem do JWT**; os endpoints são autenticados normalmente e o `customer_id` vai no body ou no path. | [09:32] Larissa | (FDD) |
| D-22 | CRUD de configuração de webhook pode ser feito por **qualquer role autenticada**, "por enquanto". | [09:36] Marcos, [09:37] Sofia | (FDD) |
| D-23 | **Timeout de 10s** na chamada HTTP do worker; sem resposta nesse prazo, conta como falha e vai para retry. | [09:42] Diego | (FDD) |
| D-24 | **Limite de 64KB** de payload; acima disso, erro em vez de truncar. | [09:23] Sofia, [09:24] Diego, [09:24] Larissa | (FDD / NFR) |
| D-25 | URL do webhook **obrigatoriamente https**; `http` é recusado com erro de validação no schema Zod. | [09:23] Sofia | (FDD) |
| D-26 | Prazo de **3 sprints**, com a revisão de segurança da Sofia incluída no fim. | [09:46] Larissa, [09:47] Larissa | (PRD) |
| D-27 | A tabela de configuração guarda **url + secret + customer_id + estado ativo**. | [09:21] Bruno, [09:21] Sofia | (FDD) |

## 2. Alternativas descartadas

| ID | Alternativa | Motivo do descarte | Origem | ADR |
|---|---|---|---|---|
| ALT-01 | Disparar o webhook **sincronamente** dentro do `changeStatus`. | A transação já é pesada; um cliente lento travaria as mudanças de status de outros pedidos; não dá para fazer rollback da mudança de status se o cliente estiver fora do ar. | [09:04] Bruno, [09:06] Diego | ADR-001 |
| ALT-02 | **Redis Streams** / fila externa. | Exige subir mais infraestrutura; para um time pequeno, Redis Cluster é overengineering. | [09:07] Larissa, [09:07] Diego | ADR-001 |
| ALT-03 | **Trigger do banco** para o worker reagir mais rápido. | MySQL não tem listener nativo como o NOTIFY/LISTEN do Postgres; trigger só executa SQL e não notifica processo externo; o polling de 2s já atende o requisito de 10s. | [09:09] Bruno, [09:09] Diego | ADR-002 |
| ALT-04 | Worker **no mesmo processo** da API. | Se a API reinicia, o worker morre junto. | [09:11] Diego | ADR-002 |
| ALT-05 | **Retry indefinido** com backoff. | O evento fica pendurado para sempre se o cliente sumir. | [09:15] Diego | ADR-003 |
| ALT-06 | **3 tentativas**. | É pouco: três retentativas acabam em cerca de 30 minutos, e já houve cliente com 2h de manutenção planejada. | [09:16] Bruno, [09:16] Diego | ADR-003 |
| ALT-07 | Marcar como **"failed" na própria outbox**, em vez de tabela de DLQ. | Tabela separada deixa a leitura da outbox mais limpa e serve de evidência para debug e reprocessamento. | [09:17] Larissa, [09:18] Diego | ADR-003 |
| ALT-08 | **Secret global** da plataforma. | Se vaza uma, vaza tudo. | [09:21] Sofia | ADR-004 |
| ALT-09 | **Exactly-once**. | Exigiria coordenação dos dois lados e é muito mais complexo; at-least-once com event_id resolve a grande maioria dos casos e é o padrão de mercado (Stripe, GitHub). | [09:25] Diego | ADR-005 |
| ALT-10 | **Truncar** payload acima do limite. | Se o payload chegou a esse tamanho, algo está errado; a decisão é dar erro. | [09:23] Sofia | (FDD) |
| ALT-11 | **Filtrar na hora do envio**, em vez de na inserção. | Inserir só o que algum webhook quer economiza linhas na tabela. | [09:34] Diego, [09:34] Bruno | ADR-001 |
| ALT-12 | **Injetar o repository** de webhook inteiro no `OrderService`. | Uma função pura que recebe `tx` basta. | [09:41] Bruno, [09:41] Diego | ADR-006 |
| ALT-13 | **Compartilhar o PrismaClient** entre API e worker. | O PrismaClient é por processo; o worker é outro processo Node. | [09:29] Diego, [09:30] Bruno | ADR-006 |
| ALT-14 | **Renderizar o payload na hora do envio** (guardar só o `order_id`). | Se o pedido mudar depois, o evento deixaria de refletir o estado do momento da mudança de status. | [09:51] Bruno, [09:52] Larissa | ADR-007 |
| ALT-15 | **Id auto-incremental** na outbox. | O projeto usa UUID em tudo. | [09:51] Diego, [09:51] Larissa | ADR-006 |
| ALT-16 | `customer_id` **implícito do JWT**. | O JWT é do usuário operador, não do cliente. | [09:31] Marcos, [09:32] Bruno, [09:32] Larissa | (FDD) |

## 3. Requisitos funcionais

| ID | Requisito | Origem |
|---|---|---|
| FR-01 | Notificar o cliente B2B quando o status de um pedido dele muda (evento `order.status_changed`). | [09:00] Marcos, [09:43] Diego |
| FR-02 | Webhooks apenas **outbound** (da plataforma para o cliente). | [09:02] Marcos, [09:03] Sofia |
| FR-03 | Cadastrar webhook (POST): campos `url` e lista de status desejados; a secret é gerada pela plataforma e devolvida na criação. | [09:31] Marcos |
| FR-04 | Editar (PATCH), remover (DELETE) e listar (GET) os webhooks de um customer. | [09:33] Bruno |
| FR-05 | Cada webhook escolhe quais status quer receber (filtro de eventos). | [09:33] Bruno, [09:33] Marcos |
| FR-06 | Consultar o histórico de entregas de um webhook: últimos 100 envios, com sucesso/falha, payload, response e tempo de resposta (`GET /webhooks/:id/deliveries`). | [09:34] Marcos |
| FR-07 | Rotacionar a secret de um webhook pela API (com 24h de carência para a antiga). | [09:21] Sofia |
| FR-08 | Reprocessar manualmente um evento da DLQ (`POST /admin/webhooks/dead-letter/:id/replay`), só para ADMIN e com registro de quem executou. | [09:18] Diego, [09:35] Diego, [09:36] Sofia |
| FR-09 | Cada envio leva os headers `X-Event-Id`, `X-Signature`, `X-Timestamp`, `X-Webhook-Id` e `Content-Type: application/json`. | [09:44] Diego, [09:44] Sofia, [09:45] Diego |
| FR-10 | Payload JSON com `event_id`, `event_type`, `timestamp` (ISO 8601), `order_id`, `order_number`, `from_status`, `to_status`, `customer_id` e campos básicos do pedido, como `total_cents`; **sem itens**. | [09:43] Diego, [09:44] Bruno |
| FR-11 | Recusar o cadastro de URL `http` com erro de validação. | [09:23] Sofia |
| FR-12 | Retentar automaticamente entregas que falharam e mover para a DLQ quando esgotarem as tentativas. | [09:15] Diego, [09:17] Larissa |

## 4. Requisitos não funcionais e restrições

| ID | Requisito | Origem |
|---|---|---|
| NFR-01 | Latência percebida abaixo de **10 segundos** ("tempo real" para os clientes). | [09:02] Marcos |
| NFR-02 | Polling de 2s, ou seja, atraso de **até cerca de 2s** em condição normal; a latência de 2s no pior caso foi aceita. | [09:09] Diego, [09:10] Larissa |
| NFR-03 | Timeout HTTP de **10s** por tentativa. | [09:42] Diego |
| NFR-04 | Payload de no máximo **64KB**. | [09:24] Diego, [09:24] Larissa |
| NFR-05 | **TLS obrigatório** (https). | [09:23] Sofia |
| NFR-06 | Outbox com índices em `status` e `created_at`; o worker lê só os pendentes, em batch pequeno. | [09:08] Diego |
| NFR-07 | Mudança de status **nunca** depende do cliente: nem bloqueio, nem rollback por indisponibilidade dele. | [09:04] Bruno |
| NFR-08 | Atomicidade entre mudança de status e registro do evento. | [09:06] Diego, [09:40] Bruno |
| NFR-09 | Sem infraestrutura nova: mesmo MySQL, mesmo Prisma, mesmo Pino ("não vamos botar nada novo"). | [09:07] Diego, [09:11] Diego, [09:29] Bruno |
| NFR-10 | Revisão de segurança da Sofia (HMAC e geração de secret) de **pelo menos 2 dias úteis** antes do deploy. | [09:46] Sofia, [09:49] Sofia |
| NFR-11 | Entrega até o **fim de novembro**, pedido da Atlas; a Atlas ameaça migrar para o concorrente se não sair até o fim do trimestre. | [09:00] Marcos, [09:45] Marcos |

## 5. Fora de escopo e adiado

| ID | Item | Situação | Origem |
|---|---|---|---|
| OOS-01 | Notificação por **e-mail** ao cliente quando o webhook falha repetidamente. | Fora desta fase. Ficou como "**talvez** próxima fase, depois que a gente medir o impacto": adiamento condicional, não compromisso. | [09:37] Marcos, [09:37] Larissa, [09:38] Marcos, [09:48] Larissa |
| OOS-02 | **Dashboard / painel visual** para o cliente ver os webhooks. | Fora de escopo; é projeto separado do time de frontend; agora só endpoints. | [09:39] Marcos, [09:40] Larissa |
| OOS-03 | **Webhooks inbound** (cliente enviando para a plataforma). | Fora de escopo; só outbound. | [09:02] Sofia, [09:02] Marcos |
| OOS-04 | **Arquivamento** das linhas entregues após cerca de 30 dias. | Fora do escopo desta feature. | [09:08] Diego |
| OOS-05 | **Itens do pedido** no payload. | Não enviados; o cliente consulta `GET /orders/:id`. | [09:43] Diego |
| OOS-06 | **Múltiplos workers** em paralelo (escala horizontal). | Futuro ("problema do futuro, não agora"); as opções citadas foram partição por `order_id` ou lock pessimista. | [09:13] Bruno, [09:13] Diego |
| OOS-07 | **Garantia de ordenação global** e **exactly-once**. | Não oferecidas; ver LIM-01 e ALT-09. | [09:14] Marcos, [09:25] Diego |

> **Rate limiting não está nesta tabela de propósito.** Diego opinou que não fazia parte ([09:39] Diego), mas Larissa fechou como "observar e decidir depois" ([09:39] Larissa, [09:48] Larissa). É questão em aberto (OQ-01), não exclusão definitiva. Nos documentos aparece como "não implementado nesta fase, em observação".

## 6. Questões em aberto

| ID | Questão | Origem |
|---|---|---|
| OQ-01 | Rate limiting de saída: implementar se virar problema ("observar e decidir depois"). | [09:38] Diego, [09:39] Diego, [09:39] Larissa |
| OQ-02 | Como escalar para vários workers sem perder a ordenação: partição por `order_id` ou lock pessimista. | [09:13] Diego |
| OQ-03 | Endurecer as permissões do CRUD de webhooks ("mais pra frente a gente pode endurecer"). Hoje, como o `customer_id` vem no body ou no path e qualquer role autenticada pode operar o CRUD, um usuário autenticado consegue gerir webhooks de qualquer customer. | [09:32] Larissa, [09:37] Sofia |
| OQ-04 | Fallback por e-mail após falhas consecutivas: "talvez próxima fase, depois que a gente medir o impacto". A métrica de impacto não foi definida. | [09:37] Larissa |
| OQ-05 | Pontos da revisão de segurança ainda por vir: geração de secret e HMAC "com calma". Incluem a secret armazenada de forma recuperável (AMB-07), a assinatura durante a carência de rotação (AMB-15) e o snapshot com dados do pedido em repouso na outbox. O snapshot foi decidido depois que Sofia saiu da call (marcação `*Sofia saiu.*` às 09:50; decisão em [09:52] Bruno). | [09:46] Sofia |

## 7. Limitações conhecidas

| ID | Limitação | Origem |
|---|---|---|
| LIM-01 | Ordenação garantida **só por `order_id`** e **só enquanto houver um único worker**; não há ordenação global. | [09:12] Diego, [09:13] Larissa, [09:14] Marcos |
| LIM-02 | O cliente **pode receber o mesmo evento mais de uma vez** e precisa deduplicar. | [09:24] Diego, [09:25] Sofia |
| LIM-03 | Latência mínima de cerca de 2s por causa do intervalo de polling. | [09:10] Larissa |
| LIM-04 | Janela máxima de retentativa de cerca de 15h; depois disso, só replay manual. | [09:17] Diego, [09:17] Marcos |
| LIM-05 | O cliente **não é avisado** quando o webhook dele está falhando; ele precisa consultar o histórico de entregas. | [09:37] Marcos, [09:37] Larissa |
| LIM-06 | Sem rate limiting: uma rajada de mudanças de status gera uma rajada de chamadas ao cliente. | [09:38] Diego, [09:39] Larissa |
| LIM-07 | A detecção de replay attack via `X-Timestamp` é responsabilidade do cliente ("se quiser"). | [09:44] Diego |

## 8. Ambiguidades e interpretações adotadas

Pontos em que a transcrição é ambígua, se corrige ou não desce ao detalhe necessário. Cada documento que tocar nesses pontos deve usar **esta** interpretação e sinalizar que é interpretação.

| ID | Ponto | Evidência | Interpretação adotada |
|---|---|---|---|
| AMB-01 | Origem do `customer_id`. | Marcos diz "implícito do JWT" em [09:31] Marcos; [09:32] Larissa corrige para "no body ou no path. Não vem do JWT", sem escolher entre os dois. | `customerId` no **body** do `POST /webhooks` e como **query** em `GET /webhooks?customerId=`, mesmo padrão de `createOrderSchema` e `listOrdersQuerySchema` em `src/modules/orders/order.schemas.ts`. |
| AMB-02 | "5 tentativas" contra 5 intervalos. | [09:17] Diego cita 5 intervalos (1m+5m+30m+2h+12h = 14h36min, "quase 15 horas entre primeira falha e última tentativa"). Em [09:16] Diego, "três vezes em 30 minutos" bate com 1m+5m+30m, contando as **retentativas**. | 1 envio inicial + **5 retentativas** (até 6 envios). O evento vai para a DLQ depois que a 5ª retentativa falha. |
| AMB-03 | Onde aplicar o limite de 64KB. | [09:23] Sofia: "a gente não envia... Eu sou a favor de erra". Por outro lado, a mudança de status não pode dar rollback por causa de webhook ([09:04] Bruno). | O limite **não** bloqueia o `changeStatus`. O worker verifica o tamanho antes de enviar e, se passar de 64KB, move o evento direto para a DLQ com motivo `WEBHOOK_PAYLOAD_TOO_LARGE`, sem tentativas. |
| AMB-04 | `event_id` "único por evento" quando há mais de um webhook inscrito. | [09:25] Diego: UUID "gerado quando o evento entra na outbox"; [09:44] Sofia: `X-Webhook-Id` para quem tem vários cadastros. | **Uma linha de outbox por webhook inscrito**. Cada linha recebe o seu `eventId` (UUID) na inserção, reutilizado em todas as retentativas e no replay, para que a dedup funcione. `X-Webhook-Id` identifica o cadastro. |
| AMB-05 | Onde guardar o histórico de entregas (response, tempo). | [09:34] Marcos pede sucesso/falha, payload, response e tempo de resposta dos últimos 100 envios; a reunião não modelou onde isso fica. | **Proposta do FDD**: tabela de tentativas `webhook_deliveries` (uma linha por tentativa). Marcada como detalhe de implementação. |
| AMB-06 | Path do endpoint de rotação de secret. | [09:21] Sofia: "Endpoint pro cliente conseguir pedir nova secret pela API", sem path. | **Proposta do FDD**: `POST /api/v1/webhooks/:id/rotate-secret`, que devolve a nova secret. |
| AMB-07 | A secret precisa estar recuperável para calcular o HMAC. | [09:20] Sofia (HMAC com secret compartilhada) e [09:46] Sofia (quer revisar a geração de secret com calma). | Não inventar requisito de criptografia em repouso. Registrar como **ponto para a revisão de segurança** (questão em aberto no RFC e risco no FDD). |
| AMB-08 | Exemplo `WEBHOOK_SECRET_REQUIRED`. | [09:28] Bruno cita o código como exemplo **antes** de [09:31] Marcos definir que a secret é gerada pela plataforma. | Não usar como erro de validação de entrada, porque o cliente nunca envia secret. O código entra na matriz do FDD só se houver uso real; senão, vale a observação. |
| AMB-09 | Ordenação contra retry. | [09:12] Diego: com um único worker, entrega em ordem de `created_at`. O retry com backoff, porém, faz um evento posterior do mesmo pedido sair antes da retentativa de um anterior. | Registrar no FDD como **consequência** da LIM-01: a ordem só é garantida no primeiro envio. O cliente deve usar `from_status`, `to_status` e `timestamp`. Não é requisito novo; [09:14] Marcos: os clientes nunca pediram ordenação global. |
| AMB-10 | A secret é devolvida "na criação". | [09:31] Marcos. | A secret é devolvida na criação e na rotação. Não aparece em listagens nem em respostas de leitura (proposta de segurança no FDD, ligada a [09:22] Diego e ao vazamento citado ali). |
| AMB-11 | Única fonte de evento. | Só se discute mudança de status ([09:00] Marcos, [09:43] Diego `order.status_changed`). | Não criar `order.created` nem outros tipos. A criação do pedido (`create` em `order.service.ts`) **não** publica evento. |
| AMB-12 | Nome do arquivo de processamento do worker. | [09:28] Bruno: "`webhook.worker.ts` ou `webhook.processor.ts`"; [09:28] Diego: "Beleza", sem escolher. | Adotar `src/modules/webhooks/webhook.worker.ts`, sinalizando que [09:28] Bruno deixou as duas opções. |
| AMB-13 | O que "falhou" significa na outbox, e o que acontece com linhas presas. | [09:08] Diego lista pendente, processando, falhou e entregue, mas a DLQ é tabela separada ([09:18] Diego). Não se fala em agendamento de retry nem em linhas presas em "processando". | `FAILED` é **terminal**: a linha foi para a DLQ. Durante o backoff a linha volta para `PENDING` com `nextAttemptAt` (**proposta**). Linhas em `PROCESSING` além de um tempo limite voltam para `PENDING` quando o worker reinicia (**proposta**). |
| AMB-14 | O `X-Timestamp` fica fora da assinatura e não tem formato definido. | [09:22] Sofia assina "o corpo do request"; [09:44] Diego cria o `X-Timestamp` para detecção de replay "se quiser". | Manter a decisão: o HMAC cobre só o corpo. O `X-Timestamp` usa ISO 8601, igual ao payload (**proposta**). O fato de o timestamp não ser assinado vai como **risco** no FDD, não como requisito novo. |
| AMB-15 | Com qual secret se assina durante as 24h de carência. | [09:21] Sofia: "a antiga fica válida por 24 horas em paralelo"; existe um só `X-Signature` ([09:44] Diego). | Durante a carência, o `X-Signature` leva **as duas assinaturas** (nova e antiga) separadas por vírgula, e o cliente valida com qualquer uma (**proposta**). Marcar como ponto da revisão de segurança (OQ-05). |
| AMB-16 | "Idempotência" no resumo. | [09:48] Larissa fala em "Idempotência por X-Event-Id", mas a decisão é at-least-once com deduplicação **no cliente** ([09:25] Diego, [09:25] Sofia). | Usar sempre "at-least-once com deduplicação pelo cliente via `X-Event-Id`". Não afirmar que a plataforma é idempotente. |
| AMB-17 | Critério de sucesso HTTP. | [09:42] Diego define só o timeout ("não responde em 10s… falha e marca pra retry"). Nada foi dito sobre os códigos de status. | **Proposta**: 2xx é sucesso; qualquer outro status, timeout ou erro de rede é falha retentável. |
| AMB-18 | Mecanismo de auditoria do replay. | [09:36] Sofia exige "logar quem fez o replay"; o resumo ([09:48] Larissa) não repete. | Log estruturado no Pino com o `userId` do ADMIN, mais o registro de quem fez e quando na linha da DLQ (**proposta**). Nenhuma infraestrutura nova (NFR-09). |
| AMB-19 | Semântica do replay. | [09:18] Diego: "Recoloca na outbox como pendente", sem mais detalhes. | Mantém o **mesmo `eventId`** (dedup), zera o contador de tentativas, e a linha da DLQ é marcada como reprocessada, não apagada, preservando a evidência que motivou a DLQ ([09:18] Diego). Tudo **proposta**. |
| AMB-20 | Erros dentro do worker. | [09:29] Bruno: o error middleware "vai pegar nossos erros", mas esse middleware é da API e o worker é outro processo ([09:11] Diego). | O worker trata erros por evento (try/catch) e registra no Pino. A **classe** de erro (`AppError` com códigos `WEBHOOK_*`) é reutilizada; o **middleware** não, porque não existe request HTTP no worker. |
| AMB-21 | O que medir para "< 10s". | [09:02] Marcos: abaixo de 10s é "tempo real"; [09:42] Diego: timeout de 10s, então só a resposta do cliente já pode chegar a 10s. | A métrica de produto mede o tempo entre o **commit da mudança de status** e o **início da primeira tentativa de envio**, que depende de nós; o tempo de resposta do cliente fica fora. |
| AMB-22 | Prazo. | [09:00] Marcos: a Atlas fala em "fim do trimestre"; [09:45] Marcos: "fim de novembro". A reunião não tem data absoluta e a duração da sprint não é informada. | Citar os dois marcos com a fonte e **não** calcular datas absolutas nem a duração das sprints. |
| AMB-23 | `event_id` no payload e no header. | [09:25] Diego (`X-Event-Id`); [09:43] Diego (`event_id` no JSON). | É o mesmo valor nos dois lugares. |
| AMB-24 | Escopo dos "últimos 100". | [09:34] Marcos: "os últimos 100 webhooks que vocês mandaram pra mim", mas a rota é por webhook (`/webhooks/:id/deliveries`). | Os 100 envios mais recentes **daquele webhook** (o que a rota indica). |

## 9. Mapa do código (verificado)

Saída do [P-01](prompts.md#p-01-mapeamento-do-código-existente), conferida na sessão principal nos trechos críticos.

| Arquivo | O que importa para a feature |
|---|---|
| `src/modules/orders/order.service.ts` | `changeStatus` (linhas 126–179): `this.prisma.$transaction(async (tx) => …)`. Dentro: `findUnique`, validação com `canTransition`, `debitStock`/`replenishStock`, `tx.order.update` e `tx.orderStatusHistory.create` (159–167), depois recarrega o pedido. **O ponto de inserção do `publishWebhookEvent(tx, …)` fica entre 167 e 169.** Alias `TxClient = Prisma.TransactionClient` (linha 24). |
| `src/modules/orders/order.status.ts` | Transições: `PENDING→PAID/CANCELLED`, `PAID→PROCESSING/CANCELLED`, `PROCESSING→SHIPPED/CANCELLED`, `SHIPPED→DELIVERED`; terminais `DELIVERED` e `CANCELLED`. Exporta `canTransition`, `allowedTransitions`, `isTerminal`. |
| `src/modules/orders/order.schemas.ts` | `createOrderSchema` (body com `customerId`), `listOrdersQuerySchema` (query com `customerId`, `page`, `pageSize` até 100), `orderIdParamSchema` (`id` uuid). |
| `prisma/schema.prisma` | MySQL. Ids `String @id @default(uuid()) @db.Char(36)`. Tabelas em snake_case via `@@map`, colunas em camelCase. `enum UserRole { ADMIN, OPERATOR }`, `enum OrderStatus`. `Order`: `orderNumber`, `customerId`, `status`, `totalCents`. `OrderStatusHistory`: `fromStatus`, `toStatus`, `changedById`, `reason`. Não há tabelas de webhook. |
| `src/shared/errors/app-error.ts` | `AppError(message, statusCode, errorCode, details?)`. O campo é **`errorCode`**. |
| `src/shared/errors/http-errors.ts` | `BadRequestError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `UnprocessableEntityError`, `InvalidStatusTransitionError` (`INVALID_STATUS_TRANSITION`) e `InsufficientStockError` (`INSUFFICIENT_STOCK`). |
| `src/shared/errors/index.ts` | Re-exporta as classes de erro. |
| `src/middlewares/error.middleware.ts` | Resposta `{ error: { code, message, details? } }`. `AppError` vira `statusCode`; `ZodError` vira 400 `VALIDATION_ERROR`; Prisma `P2002` vira 409 e `P2025` vira 404; o resto vira 500 `INTERNAL_SERVER_ERROR`, com log. |
| `src/middlewares/auth.middleware.ts` | `authenticate` (Bearer JWT, popula `req.user = { id, email, role }`) e `requireRole(...roles)` (401/403). Hoje `requireRole` só é usado em `src/modules/users/user.routes.ts`. |
| `src/middlewares/validate.middleware.ts` | `validate({ body, query, params })` com Zod. |
| `src/middlewares/request-logger.middleware.ts` | Gera ou propaga `X-Request-Id` em `req.id` e loga `http_request`. |
| `src/shared/logger/index.ts` | Pino com `redact` (`authorization`, `cookie`, `*.password`, `*.passwordHash`, `*.token`, `*.accessToken`). **Não cobre `secret`.** Singleton `logger`. |
| `src/shared/http/response.ts` | `paginated(data, page, pageSize, total)`. |
| `src/app.ts` | `buildControllers(prisma)` faz DI manual (repository → service → controller); `buildApp` monta **`/api/v1`**, 404 e `errorMiddleware`. |
| `src/routes/index.ts` | `buildApiRouter` monta `/auth`, `/users`, `/customers`, `/products`, `/orders`. |
| `src/server.ts` | Bootstrap da API e shutdown em SIGINT/SIGTERM com `prisma.$disconnect()`. Serve de modelo para `src/worker.ts`. |
| `src/config/database.ts` | `createPrismaClient()` e singleton `prisma`. |
| `src/config/env.ts` | Env validado por Zod (`DATABASE_URL`, `JWT_SECRET`, `LOG_LEVEL`, …). |
| `package.json` | Scripts `dev`, `build`, `start`, `test`, `db:*`; **não há `worker`**. Sem cliente HTTP (usar `fetch` nativo do Node ≥ 20 e `node:crypto`). Dependência `uuid` disponível. |
| `tests/setup.ts` | `deleteMany` em ordem de FK antes de cada teste (MySQL real). |
| `tests/helpers/factories.ts` | `getTestApp`, `createTestUser`, `createTestCustomer`, `bootstrapAuthenticatedUser`. |
| `tests/orders.test.ts` | Testes de integração com supertest em `/api/v1/orders/:id/status`. |

## 10. Glossário (nomes fixos em todos os documentos)

| Conceito | Nome adotado | Base |
|---|---|---|
| Tabela de configuração | `webhook_endpoints` (model `WebhookEndpoint`) | "tabela de configuração de webhook" [09:21] Bruno; convenção `@@map` de `prisma/schema.prisma` |
| Outbox | `webhook_outbox` (model `WebhookOutbox`) | [09:06] Diego |
| DLQ | `webhook_dead_letter` (model `WebhookDeadLetter`) | [09:18] Diego |
| Tentativas de entrega | `webhook_deliveries` (model `WebhookDelivery`), **proposta** | AMB-05 |
| Status da outbox | `PENDING`, `PROCESSING`, `DELIVERED`, `FAILED` | "pendente, processando, falhou, entregue" [09:08] Diego; caixa alta em inglês como `OrderStatus` |
| Tipo de evento | `order.status_changed` | [09:43] Diego |
| Campo de filtro | `statuses` (lista de `OrderStatus`) | "lista dos status" [09:33] Marcos |
| Função de publicação | `publishWebhookEvent(tx, order, fromStatus, toStatus)` | [09:41] Bruno |
| Worker | entry-point `src/worker.ts`, lógica em `src/modules/webhooks/webhook.worker.ts` (AMB-12), script `npm run worker` | [09:11] Larissa, [09:28] Bruno |
| Estado do cadastro | campo `active` (booleano) em `webhook_endpoints` | "estado ativo" [09:21] Bruno |
| Semântica de entrega | "at-least-once com deduplicação pelo cliente via `X-Event-Id`" (nunca "idempotência da plataforma") | AMB-16 |
| Módulo | `src/modules/webhooks/` com `webhook.controller.ts`, `webhook.service.ts`, `webhook.repository.ts`, `webhook.routes.ts`, `webhook.schemas.ts` | [09:27] Bruno |
| Headers de saída | `X-Event-Id`, `X-Signature`, `X-Timestamp`, `X-Webhook-Id`, `Content-Type: application/json` | [09:44] Diego, [09:44] Sofia |
| Payload de saída | JSON em **snake_case** (`event_id`, `event_type`, …) | nomes ditos em [09:43] Diego |
| API REST de configuração | JSON em **camelCase** (`customerId`, `statuses`, …) | padrão de `src/modules/orders/order.schemas.ts` |
| Prefixo de rotas | `/api/v1/webhooks…` e `/api/v1/admin/webhooks…` | `src/app.ts` monta `/api/v1` |
| Erros | `WEBHOOK_*` | [09:29] Larissa |

## 11. Matriz de fronteira (o que cada documento diz sobre cada tema)

Regra: um tema é **detalhado em um só lugar**; nos demais aparece no nível de altura do documento, com link.

| Tema | PRD (por quê / o quê) | RFC (proposta / aberto) | ADRs (por que assim) | FDD (como construir) |
|---|---|---|---|---|
| Problema, clientes, prazo | **Detalhe**: Atlas, MaxDistribuição, Nova Cargo, polling em `GET /orders`, < 10s, fim de novembro | 1 parágrafo de contexto | não aparece | só a motivação técnica (transação pesada) |
| Outbox | "evento registrado de forma confiável junto com a mudança de status" | componente e justificativa curta → ADR-001 | **ADR-001**: contexto, alternativas, consequências | modelo, índices, ponto exato no `changeStatus` |
| Worker / polling | "notificação em até 10s" | componente e 2s → ADR-002 | **ADR-002** | loop, batch, claim, shutdown, variáveis de env |
| Retry / DLQ | "retentativas por ~15h, reprocessamento manual" | visão → ADR-003 | **ADR-003**: valores e motivos | algoritmo, `nextAttemptAt`, transição para DLQ, replay |
| HMAC / secret | "cliente consegue verificar a autenticidade" | visão → ADR-004 | **ADR-004** | cálculo da assinatura, rotação, carência de 24h |
| At-least-once | "o cliente pode receber duplicado e deve deduplicar" | → ADR-005 | **ADR-005** | reuso do `eventId` em retry e replay |
| Reuso de padrões | não aparece | 1 frase → ADR-006 | **ADR-006**, com arquivos | **seção "Integração com o sistema existente"** |
| Snapshot de payload | não aparece | menção | **ADR-007** | formato completo do payload |
| Endpoints | capacidades em linguagem de produto | lista de capacidades, sem payload | não aparece | **contratos completos** |
| Erros `WEBHOOK_*` | não aparece | não aparece | ADR-006 cita o padrão | **matriz completa** |
| Observabilidade | métricas de sucesso de negócio | não aparece | não aparece | **métricas técnicas, logs, tracing** |
| Fora de escopo | **lista completa** | só o que é questão em aberto | não aparece | exclusões técnicas |
| Alternativas descartadas | não aparece | **as principais, com trade-off** | **cada uma no seu ADR** | não aparece |
| Riscos | produto/negócio, com probabilidade × impacto | arquiteturais | consequências negativas | técnicos e de implementação |
| Testes | estratégia de validação e aceitação | não aparece | não aparece | critérios de aceite técnicos |

## 12. Dependências e ações combinadas na reunião

| ID | Ação / dependência | Responsável | Origem |
|---|---|---|---|
| DEP-01 | Documentar em destaque no portal de desenvolvedor a semântica at-least-once e como integrar via API. | Marcos (PM) | [09:26] Marcos, [09:40] Marcos |
| DEP-02 | Confirmar o prazo com a Atlas e atualizar os clientes. | Marcos (PM) | [09:47] Marcos, [09:49] Marcos |
| DEP-03 | Revisão de segurança (HMAC e geração de secret) de pelo menos 2 dias úteis antes do deploy. | Sofia (Segurança) | [09:46] Sofia, [09:49] Sofia |
| DEP-04 | Abrir o documento de design e agendar uma sessão de revisão com Bruno e Diego antes de começar a codar. | Larissa (Tech Lead) | [09:50] Larissa |
| DEP-05 | Do lado do cliente: endpoint https público, validação do HMAC e deduplicação por `X-Event-Id`. | Clientes B2B | [09:20] Sofia, [09:23] Sofia, [09:25] Diego |
| DEP-06 | Painel visual é projeto separado do time de frontend; não bloqueia esta feature. | Time de frontend | [09:40] Larissa |

## 13. Regras de redação (valem para todos os documentos)

1. **Toda afirmação factual tem ID e linha no tracker.** Se não há `[hh:mm] Nome` nem caminho de arquivo, ou o item sai do documento ou vira "proposta" ancorada numa fonte.
2. **Proposta ≠ decisão.** Detalhes que a reunião não definiu (AMB-xx) aparecem marcados como *interpretação adotada* ou *proposta*, nunca como "decidido na reunião".
3. **Opinião ≠ fato.** Frases como "Stripe faz assim, GitHub faz assim" e "resolve 99% dos casos" ([09:25] Diego) são atribuídas a quem falou e não viram afirmação do documento.
4. **Nada descartado vira requisito.** E-mail, dashboard, inbound, arquivamento, multi-worker, exactly-once e itens no payload só aparecem em fora de escopo, alternativas ou questões em aberto. O rate limiting aparece como "em observação".
5. **Nomes conforme o glossário** (§ 10), sempre.
6. **Arquivos novos são marcados como novos.** `src/worker.ts` e `src/modules/webhooks/*` não existem no repositório. Sempre que citados, vêm marcados como "(novo)" para não parecerem código existente.
7. **Sem datas absolutas inventadas** (AMB-22). A data da reunião é "quinta-feira", sem dia do mês.
8. **`publishWebhookEvent` é "função que recebe o `tx`"**, não "função pura": ela grava no banco.
