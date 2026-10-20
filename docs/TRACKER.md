# Tracker de Rastreabilidade

Este tracker liga cada item registrado nos documentos do pacote à sua origem: uma fala da reunião (`TRANSCRICAO.md`) ou um arquivo do código. Ele serve para conferir que nada foi inventado. Um item sem linha aqui, ou com localização que não se sustenta, deve ser corrigido ou removido.

**Colunas**

- **ID**: identificador que aparece no próprio documento. As convenções estão abaixo.
- **Documento**: arquivo onde o item está.
- **Tipo**: categoria do item. Valores usados: Requisito Funcional, Requisito Não Funcional, Decisão, Restrição, Alternativa Descartada, Trade-off, Risco, Interpretação, Dependência, Limitação, Fora de Escopo, Questão em Aberto, Métrica, Padrão Existente.
- **Fonte**: `TRANSCRICAO` ou `CODIGO`.
- **Localização**:
  - Para `TRANSCRICAO`: `[hh:mm] Nome`. Pode haver várias falas, separadas por `;`.
  - Para `CODIGO`: o caminho do arquivo.

**Convenção de IDs**

| Prefixo | Significado |
|---|---|
| `ADR-NNN` | Decisão principal do ADR |
| `ADR-NNN-DEC-NN` | Subdecisão |
| `ADR-NNN-ALT-NN` | Alternativa |
| `ADR-NNN-CON-NN` | Consequência ou trade-off |
| `ADR-NNN-COD-NN` | Referência ao código |
| `RFC-ALT-NN` | Alternativa do RFC |
| `RFC-OQ-NN` | Questão em aberto do RFC |
| `RFC-RISK-NN` | Risco do RFC |
| `FDD-FLUXO-NN` | Fluxo do FDD |
| `FDD-CONTRATO-NN` | Contrato público do FDD |
| `FDD-ERR-NN` | Erro da matriz do FDD |
| `FDD-INT-NN` | Ponto de integração do FDD |
| `FDD-RES-NN` | Estratégia de resiliência do FDD |
| `FDD-OBS-NN` | Item de observabilidade do FDD |
| `FDD-RISK-NN` | Risco do FDD |
| `PRD-FR-NN` | Requisito funcional do PRD |
| `PRD-NFR-NN` | Requisito não funcional do PRD |
| `PRD-MET-NN` | Métrica do PRD |
| `PRD-OOS-NN` | Item fora de escopo do PRD |
| `PRD-RISK-NN` | Risco do PRD |

**Verificação automática:** `node docs/processo/validar-entrega.mjs` confere quatro coisas. Cada `[hh:mm] Nome` existe literalmente na transcrição. Cada caminho de código existe no repositório. Os percentuais por fonte batem com o exigido. E a cobertura de IDs dos documentos chega a pelo menos 80%.

| ID | Documento | Tipo | Conteúdo (resumo) | Fonte | Localização |
| --- | --- | --- | --- | --- | --- |
| ADR-001 | `docs/adrs/ADR-001-outbox-no-mysql.md` | Decisão | Outbox `webhook_outbox` no MySQL existente, gravado na mesma transação que atualiza `orders` e `order_status_history` | TRANSCRICAO | [09:06] Diego; [09:08] Larissa |
| ADR-001-DEC-01 | `docs/adrs/ADR-001-outbox-no-mysql.md` | Restrição | Se a gravação na outbox falhar, a transação inteira é desfeita: não pode haver status sem evento | TRANSCRICAO | [09:40] Bruno; [09:41] Diego |
| ADR-001-DEC-02 | `docs/adrs/ADR-001-outbox-no-mysql.md` | Decisão | Filtro de status aplicado na inserção; uma linha por webhook inscrito (AMB-04) | TRANSCRICAO | [09:34] Bruno; [09:34] Diego |
| ADR-001-DEC-03 | `docs/adrs/ADR-001-outbox-no-mysql.md` | Requisito Não Funcional | Outbox indexada por status e data de criação para leitura eficiente dos pendentes | TRANSCRICAO | [09:08] Diego |
| ADR-001-ALT-01 | `docs/adrs/ADR-001-outbox-no-mysql.md` | Alternativa Descartada | Disparo síncrono no `changeStatus`: cliente lento trava a mudança de status, e não dá para fazer rollback | TRANSCRICAO | [09:03] Larissa; [09:04] Bruno; [09:04] Larissa; [09:06] Diego |
| ADR-001-ALT-02 | `docs/adrs/ADR-001-outbox-no-mysql.md` | Alternativa Descartada | Redis Streams: exige mais infraestrutura; overengineering para um time pequeno | TRANSCRICAO | [09:07] Larissa; [09:07] Diego |
| ADR-001-ALT-03 | `docs/adrs/ADR-001-outbox-no-mysql.md` | Alternativa Descartada | Filtrar no envio: filtrar na inserção economiza linhas | TRANSCRICAO | [09:34] Diego; [09:34] Bruno |
| ADR-001-CON-01 | `docs/adrs/ADR-001-outbox-no-mysql.md` | Trade-off | Tabela cresce sem arquivamento (fora de escopo); preocupação com performance mitigada por índices | TRANSCRICAO | [09:07] Bruno; [09:08] Diego |
| ADR-001-COD-01 | `docs/adrs/ADR-001-outbox-no-mysql.md` | Padrão Existente | `changeStatus` é uma transação interativa do Prisma: é o ponto de inserção do evento | CODIGO | `src/modules/orders/order.service.ts` |
| ADR-002 | `docs/adrs/ADR-002-worker-separado-em-polling.md` | Decisão | Worker lê a outbox por polling a cada 2s, pegando os pendentes mais antigos em lote pequeno | TRANSCRICAO | [09:08] Diego; [09:09] Diego; [09:10] Larissa |
| ADR-002-DEC-01 | `docs/adrs/ADR-002-worker-separado-em-polling.md` | Decisão | Processo separado: `src/worker.ts` (novo) e `npm run worker`; mesmo banco e mesma stack | TRANSCRICAO | [09:11] Diego; [09:11] Larissa; [09:11] Bruno |
| ADR-002-DEC-02 | `docs/adrs/ADR-002-worker-separado-em-polling.md` | Interpretação | Lógica em `webhook.worker.ts` dentro do módulo (AMB-12: foram citadas duas opções) | TRANSCRICAO | [09:28] Bruno |
| ADR-002-DEC-03 | `docs/adrs/ADR-002-worker-separado-em-polling.md` | Limitação | Instância única; ordenação garantida só por pedido; clientes não pediram ordenação global | TRANSCRICAO | [09:12] Diego; [09:13] Larissa; [09:14] Marcos |
| ADR-002-ALT-01 | `docs/adrs/ADR-002-worker-separado-em-polling.md` | Alternativa Descartada | Trigger no banco: MySQL não tem listener nativo; polling de 2s já atende | TRANSCRICAO | [09:09] Bruno; [09:09] Diego |
| ADR-002-ALT-02 | `docs/adrs/ADR-002-worker-separado-em-polling.md` | Alternativa Descartada | Worker dentro da API: se a API reinicia, perde o worker | TRANSCRICAO | [09:11] Diego |
| ADR-002-ALT-03 | `docs/adrs/ADR-002-worker-separado-em-polling.md` | Questão em Aberto | Vários workers perdem a ordenação; no futuro, partição por `order_id` ou lock pessimista | TRANSCRICAO | [09:13] Bruno; [09:13] Diego |
| ADR-002-CON-01 | `docs/adrs/ADR-002-worker-separado-em-polling.md` | Trade-off | Atraso de até ~2s no pior caso aceito ("latência mínima… no pior caso") | TRANSCRICAO | [09:10] Larissa |
| ADR-002-CON-02 | `docs/adrs/ADR-002-worker-separado-em-polling.md` | Risco | Head-of-line blocking: cliente lento (até 10s por tentativa) atrasa a fila de todos | TRANSCRICAO | [09:04] Bruno; [09:42] Diego |
| ADR-002-COD-01 | `docs/adrs/ADR-002-worker-separado-em-polling.md` | Padrão Existente | Entry-point da API usado como modelo para `src/worker.ts` | CODIGO | `src/server.ts` |
| ADR-003 | `docs/adrs/ADR-003-retry-backoff-e-dlq.md` | Decisão | Backoff exponencial 1m/5m/30m/2h/12h, 5 tentativas | TRANSCRICAO | [09:15] Diego; [09:17] Diego; [09:17] Larissa |
| ADR-003-PRE-01 | `docs/adrs/ADR-003-retry-backoff-e-dlq.md` | Restrição | Sem resposta em 10s conta como falha e vai para retry; não-2xx também (AMB-17) | TRANSCRICAO | [09:42] Diego |
| ADR-003-DEC-01 | `docs/adrs/ADR-003-retry-backoff-e-dlq.md` | Interpretação | "5 tentativas" = 5 retentativas após o envio inicial (AMB-02); soma de ~15h | TRANSCRICAO | [09:16] Diego; [09:17] Diego |
| ADR-003-DEC-02 | `docs/adrs/ADR-003-retry-backoff-e-dlq.md` | Decisão | Esgotado, o evento é movido para `webhook_dead_letter` com payload, motivo e timestamp (AMB-13) | TRANSCRICAO | [09:15] Diego; [09:18] Diego |
| ADR-003-DEC-03 | `docs/adrs/ADR-003-retry-backoff-e-dlq.md` | Requisito Funcional | Replay manual `POST /admin/webhooks/dead-letter/:id/replay` recoloca o evento na outbox como pendente | TRANSCRICAO | [09:18] Diego; [09:19] Larissa; [09:35] Diego |
| ADR-003-DEC-04 | `docs/adrs/ADR-003-retry-backoff-e-dlq.md` | Restrição | Replay exige ADMIN (`requireRole`) e registra quem executou | TRANSCRICAO | [09:36] Sofia; [09:36] Larissa |
| ADR-003-ALT-01 | `docs/adrs/ADR-003-retry-backoff-e-dlq.md` | Alternativa Descartada | Retry indefinido: evento pendurado para sempre se o cliente sumir | TRANSCRICAO | [09:15] Diego |
| ADR-003-ALT-02 | `docs/adrs/ADR-003-retry-backoff-e-dlq.md` | Alternativa Descartada | 3 tentativas esgotam em cerca de meia hora; não cobrem manutenção de 2h | TRANSCRICAO | [09:16] Bruno; [09:16] Diego; [09:16] Larissa |
| ADR-003-ALT-03 | `docs/adrs/ADR-003-retry-backoff-e-dlq.md` | Alternativa Descartada | "Failed" na própria outbox: tabela separada deixa a leitura limpa e guarda evidência | TRANSCRICAO | [09:17] Larissa; [09:18] Diego |
| ADR-003-CON-01 | `docs/adrs/ADR-003-retry-backoff-e-dlq.md` | Trade-off | Indisponibilidade acima de ~15h depende de replay manual; aceito pelo PM | TRANSCRICAO | [09:17] Marcos |
| ADR-003-CON-02 | `docs/adrs/ADR-003-retry-backoff-e-dlq.md` | Limitação | Cliente não é avisado das falhas; e-mail fora desta fase | TRANSCRICAO | [09:37] Marcos; [09:37] Larissa |
| ADR-003-CON-03 | `docs/adrs/ADR-003-retry-backoff-e-dlq.md` | Limitação | Reunião definiu só o replay por `:id`; não há como localizar eventos na DLQ (listagem proposta no FDD) | TRANSCRICAO | [09:18] Diego; [09:35] Diego |
| ADR-003-COD-01 | `docs/adrs/ADR-003-retry-backoff-e-dlq.md` | Padrão Existente | `requireRole` existente reutilizado no replay | CODIGO | `src/middlewares/auth.middleware.ts` |
| ADR-004 | `docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md` | Decisão | HMAC-SHA256 sobre o corpo do request, enviado em `X-Signature` | TRANSCRICAO | [09:20] Sofia; [09:22] Sofia; [09:44] Diego |
| ADR-004-PRE-01 | `docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md` | Restrição | URL https obrigatória, validada no schema Zod (não é decisão arquitetural) | TRANSCRICAO | [09:23] Sofia |
| ADR-004-DEC-01 | `docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md` | Decisão | Secret única por endpoint, gerada pela plataforma e devolvida na criação | TRANSCRICAO | [09:21] Sofia; [09:31] Marcos |
| ADR-004-DEC-02 | `docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md` | Requisito Funcional | Rotação pela API; a secret antiga continua válida por 24h em paralelo | TRANSCRICAO | [09:21] Sofia |
| ADR-004-DEC-03 | `docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md` | Interpretação | Durante a carência, `X-Signature` leva as duas assinaturas (AMB-15) | TRANSCRICAO | [09:21] Sofia; [09:44] Diego |
| ADR-004-DEC-04 | `docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md` | Decisão | Cadastro guarda url, secret, customer e estado ativo | TRANSCRICAO | [09:21] Bruno; [09:21] Sofia |
| ADR-004-ALT-01 | `docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md` | Alternativa Descartada | Secret global: "se vaza uma, vaza tudo" | TRANSCRICAO | [09:21] Sofia |
| ADR-004-ALT-02 | `docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md` | Alternativa Descartada | Assinatura assimétrica (plausível, não discutida): HMAC preferido por ser padrão com biblioteca em todo cliente | TRANSCRICAO | [09:20] Sofia |
| ADR-004-CON-01 | `docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md` | Risco | Vazamento de secret já aconteceu em log de cliente | TRANSCRICAO | [09:22] Diego |
| ADR-004-CON-02 | `docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md` | Dependência | Revisão de segurança de pelo menos 2 dias úteis antes do deploy (HMAC e geração de secret) | TRANSCRICAO | [09:46] Sofia |
| ADR-004-CON-03 | `docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md` | Risco | `X-Timestamp` fora da assinatura não protege contra replay; decisão pendente para a revisão | TRANSCRICAO | [09:22] Sofia; [09:44] Diego |
| ADR-004-COD-01 | `docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md` | Padrão Existente | `engines.node >= 20` permite `node:crypto`; `bcrypt` e `jsonwebtoken` atendem senha e JWT | CODIGO | `package.json` |
| ADR-005 | `docs/adrs/ADR-005-at-least-once-com-x-event-id.md` | Decisão | Entrega at-least-once; `X-Event-Id` (UUID gerado na inserção) para deduplicação pelo cliente | TRANSCRICAO | [09:24] Diego; [09:25] Diego; [09:26] Larissa |
| ADR-005-DEC-01 | `docs/adrs/ADR-005-at-least-once-com-x-event-id.md` | Interpretação | `event_id` igual no payload e no header; um por linha de outbox; reutilizado em retry e replay (AMB-23, AMB-04, AMB-19) | TRANSCRICAO | [09:25] Diego; [09:43] Diego; [09:18] Diego |
| ADR-005-DEC-02 | `docs/adrs/ADR-005-at-least-once-com-x-event-id.md` | Dependência | Semântica documentada em destaque no portal de desenvolvedor | TRANSCRICAO | [09:26] Marcos |
| ADR-005-DEC-03 | `docs/adrs/ADR-005-at-least-once-com-x-event-id.md` | Interpretação | "Idempotência" do resumo tratada como deduplicação pelo cliente (AMB-16) | TRANSCRICAO | [09:48] Larissa; [09:25] Sofia |
| ADR-005-ALT-01 | `docs/adrs/ADR-005-at-least-once-com-x-event-id.md` | Alternativa Descartada | Exactly-once exige coordenação dos dois lados; muito mais complexo | TRANSCRICAO | [09:25] Diego |
| ADR-005-ALT-02 | `docs/adrs/ADR-005-at-least-once-com-x-event-id.md` | Alternativa Descartada | At-most-once (referência, não discutida) contradiz a política de retry | TRANSCRICAO | [09:15] Diego; [09:16] Diego |
| ADR-005-CON-01 | `docs/adrs/ADR-005-at-least-once-com-x-event-id.md` | Trade-off | Responsabilidade de deduplicar transferida ao cliente | TRANSCRICAO | [09:25] Sofia |
| ADR-005-CON-02 | `docs/adrs/ADR-005-at-least-once-com-x-event-id.md` | Trade-off | Cliente precisa reter os `event_id` ao menos pela janela de ~15h | TRANSCRICAO | [09:17] Diego |
| ADR-006 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Decisão | Reuso máximo: `AppError`, Pino, error middleware, padrão de módulos, schemas Zod, códigos de erro | TRANSCRICAO | [09:30] Larissa |
| ADR-006-DEC-01 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Decisão | Módulo `src/modules/webhooks` (novo) com controller, service, repository, routes e schemas | TRANSCRICAO | [09:27] Bruno |
| ADR-006-DEC-02 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Decisão | Erros `AppError` com prefixo `WEBHOOK_` | TRANSCRICAO | [09:28] Bruno; [09:29] Larissa |
| ADR-006-DEC-03 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Decisão | Pino e error middleware reaproveitados sem mudança | TRANSCRICAO | [09:29] Bruno |
| ADR-006-DEC-04 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Decisão | Nova função `publishWebhookEvent(tx, order, fromStatus, toStatus)` chamada pelo `order.service`, sem injetar repository | TRANSCRICAO | [09:41] Bruno; [09:41] Diego |
| ADR-006-DEC-05 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Decisão | Worker com instância própria de PrismaClient e a mesma `DATABASE_URL` | TRANSCRICAO | [09:29] Diego; [09:30] Bruno |
| ADR-006-DEC-06 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Decisão | CRUD aberto a qualquer role autenticada; replay só ADMIN via `requireRole` | TRANSCRICAO | [09:36] Larissa; [09:37] Sofia |
| ADR-006-DEC-07 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Decisão | Ids UUID, seguindo o padrão do projeto | TRANSCRICAO | [09:51] Larissa |
| ADR-006-ALT-01 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Alternativa Descartada | Injetar o repository inteiro no `OrderService` | TRANSCRICAO | [09:41] Bruno; [09:41] Diego |
| ADR-006-ALT-02 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Alternativa Descartada | Compartilhar PrismaClient: ele é por processo | TRANSCRICAO | [09:11] Bruno; [09:29] Diego; [09:30] Bruno |
| ADR-006-ALT-03 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Alternativa Descartada | Id auto-incremental: o projeto usa UUID em tudo | TRANSCRICAO | [09:51] Diego; [09:51] Larissa |
| ADR-006-CON-01 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Risco | Com `customerId` no body/path e CRUD aberto, qualquer usuário autenticado gere webhooks de qualquer customer | TRANSCRICAO | [09:32] Larissa; [09:37] Sofia |
| ADR-006-CON-02 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Restrição | `NotFoundError` fixa `NOT_FOUND`; `WEBHOOK_NOT_FOUND` exige estender `AppError` diretamente | CODIGO | `src/shared/errors/http-errors.ts` |
| ADR-006-COD-01 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Padrão Existente | `AppError(message, statusCode, errorCode, details?)` | CODIGO | `src/shared/errors/app-error.ts` |
| ADR-006-COD-02 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Padrão Existente | Erros específicos via `ConflictError`/`UnprocessableEntityError`, que aceitam código | CODIGO | `src/shared/errors/http-errors.ts` |
| ADR-006-COD-03 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Padrão Existente | Error middleware centralizado trata `AppError`, Zod e Prisma | CODIGO | `src/middlewares/error.middleware.ts` |
| ADR-006-COD-04 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Padrão Existente | `requireRole('ADMIN')` já aplicado em rota de usuários | CODIGO | `src/modules/users/user.routes.ts` |
| ADR-006-COD-05 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Padrão Existente | Logger Pino singleton com `redact` que não cobre secret | CODIGO | `src/shared/logger/index.ts` |
| ADR-006-COD-06 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Padrão Existente | Fábrica `createPrismaClient` reutilizável pelo worker | CODIGO | `src/config/database.ts` |
| ADR-006-COD-07 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Padrão Existente | Ids UUID `@db.Char(36)` e tabelas snake_case via `@@map` | CODIGO | `prisma/schema.prisma` |
| ADR-006-COD-08 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Padrão Existente | DI manual em `buildControllers` e prefixo `/api/v1` | CODIGO | `src/app.ts` |
| ADR-006-COD-09 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Padrão Existente | Validação Zod pelo middleware `validate()` | CODIGO | `src/middlewares/validate.middleware.ts` |
| ADR-006-COD-10 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Padrão Existente | Módulo por domínio: controller, service, repository, routes, schemas | CODIGO | `src/modules/orders/order.controller.ts` |
| ADR-006-COD-11 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Padrão Existente | Registro dos routers de domínio em `buildApiRouter` | CODIGO | `src/routes/index.ts` |
| ADR-006-COD-12 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Padrão Existente | `authenticate` e `requireRole` com roles `ADMIN`/`OPERATOR`, sem escopo por cliente | CODIGO | `src/middlewares/auth.middleware.ts` |
| ADR-006-COD-13 | `docs/adrs/ADR-006-reuso-dos-padroes-do-projeto.md` | Padrão Existente | Transação interativa `$transaction(async (tx) => …)` em `changeStatus` | CODIGO | `src/modules/orders/order.service.ts` |
| ADR-007 | `docs/adrs/ADR-007-payload-snapshot-na-insercao.md` | Decisão | Payload renderizado e gravado na inserção da outbox (snapshot) | TRANSCRICAO | [09:52] Larissa; [09:52] Diego; [09:52] Bruno |
| ADR-007-DEC-01 | `docs/adrs/ADR-007-payload-snapshot-na-insercao.md` | Interpretação | Worker envia o corpo gravado; retentativas e replay reutilizam o mesmo corpo (AMB-19) | TRANSCRICAO | [09:18] Diego; [09:52] Larissa |
| ADR-007-DEC-02 | `docs/adrs/ADR-007-payload-snapshot-na-insercao.md` | Interpretação | HMAC calculado no envio com as secrets válidas no momento (AMB-25) | TRANSCRICAO | [09:21] Sofia; [09:22] Sofia |
| ADR-007-ALT-01 | `docs/adrs/ADR-007-payload-snapshot-na-insercao.md` | Alternativa Descartada | Guardar só o `order_id` e renderizar no envio: evento deixaria de refletir o momento da mudança | TRANSCRICAO | [09:51] Bruno; [09:52] Larissa |
| ADR-007-CON-01 | `docs/adrs/ADR-007-payload-snapshot-na-insercao.md` | Risco | Dados do pedido em repouso na outbox/DLQ, decidido sem Segurança; recomenda-se incluir na revisão | TRANSCRICAO | [09:46] Sofia; [09:52] Bruno |
| ADR-007-COD-01 | `docs/adrs/ADR-007-payload-snapshot-na-insercao.md` | Padrão Existente | `Order` tem `orderNumber`, `customerId`, `totalCents`; `OrderStatusHistory` com cascata para `Order` | CODIGO | `prisma/schema.prisma` |
| ADR-007-COD-02 | `docs/adrs/ADR-007-payload-snapshot-na-insercao.md` | Restrição | Após a criação, o pedido só muda de status ou é removido (`delete` em `PENDING`/`CANCELLED`) | CODIGO | `src/modules/orders/order.routes.ts` |
