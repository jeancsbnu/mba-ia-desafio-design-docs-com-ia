# Tracker de Rastreabilidade

Este tracker liga cada item registrado nos documentos do pacote à sua origem: uma fala da reunião (`TRANSCRICAO.md`) ou um arquivo do código. Ele serve para conferir que nada foi inventado. Um item sem linha aqui, ou com localização que não se sustenta, deve ser corrigido ou removido.

**Colunas**

- **ID**: identificador que aparece no próprio documento. As convenções estão abaixo.
- **Documento**: arquivo onde o item está.
- **Tipo**: categoria do item. Valores usados: Requisito Funcional, Requisito Não Funcional, Decisão, Restrição, Alternativa Descartada, Trade-off, Risco, Interpretação, Dependência, Limitação, Fora de Escopo, Questão em Aberto, Métrica, Padrão Existente, Problema, Suposição, Invariante, Plano, Proposta.
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
| `FDD-SUP-NN` | Suposição do FDD |
| `FDD-RST-NN` | Restrição do FDD |
| `FDD-INV-NN` | Invariante do FDD |
| `FDD-PLAN-NN` | Bloco do plano de implementação do FDD |
| `FDD-PROP-NN` | Proposta além da reunião (FDD) |
| `FDD-FALL-NN` | Política de fallback do FDD |
| `PRD-FR-NN` | Requisito funcional do PRD |
| `PRD-NFR-NN` | Requisito não funcional do PRD |
| `PRD-MET-NN` | Métrica do PRD |
| `PRD-OOS-NN` | Item fora de escopo do PRD |
| `PRD-RISK-NN` | Risco do PRD |
| `PRD-PROB-NN` | Problema priorizado do PRD |
| `PRD-DEC-NN` | Decisão e trade-off do PRD |
| `PRD-DEP-NN` | Dependência do PRD |
| `PRD-IMP-NN` | Onde a feature será implantada (PRD) |
| `PRD-ARQ-NN` | Arquitetura e abordagem do PRD |

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
| RFC-CTX-01 | `docs/RFC.md` | Restrição | Nenhum mecanismo de notificação, eventos ou filas; módulos registrados: auth, users, customers, products, orders | CODIGO | `src/routes/index.ts` |
| RFC-CTX-02 | `docs/RFC.md` | Requisito Não Funcional | Clientes B2B fazem polling em `GET /orders`; "tempo real" é abaixo de 10s | TRANSCRICAO | [09:00] Marcos; [09:02] Marcos |
| RFC-PROP-01 | `docs/RFC.md` | Decisão | `publishWebhookEvent(tx, …)` grava um evento por webhook ativo, não removido e inscrito, com payload snapshot; falha desfaz o status | TRANSCRICAO | [09:06] Diego; [09:34] Bruno; [09:41] Bruno; [09:52] Larissa |
| RFC-PROP-02 | `docs/RFC.md` | Decisão | Worker em processo separado, polling a cada 2s, seleção justa por endpoint, instância única garantida por lease | TRANSCRICAO | [09:09] Diego; [09:11] Larissa; [09:12] Diego |
| RFC-PROP-03 | `docs/RFC.md` | Decisão | Backoff exponencial por ~15h, depois movido para DLQ; replay manual ADMIN, auditado | TRANSCRICAO | [09:17] Larissa; [09:18] Diego; [09:36] Sofia |
| RFC-PROP-04 | `docs/RFC.md` | Decisão | HMAC-SHA256 do corpo em `X-Signature`; secret por endpoint, rotacionável com 24h de carência | TRANSCRICAO | [09:22] Sofia; [09:44] Diego |
| RFC-PROP-05 | `docs/RFC.md` | Decisão | At-least-once; o cliente deduplica pelo `X-Event-Id` | TRANSCRICAO | [09:25] Diego; [09:26] Larissa |
| RFC-PROP-06 | `docs/RFC.md` | Requisito Funcional | CRUD (incluindo desativar e reativar), filtro de status, histórico, rotação de secret, consulta e replay administrativos da DLQ | TRANSCRICAO | [09:21] Sofia; [09:31] Marcos; [09:33] Bruno; [09:34] Marcos; [09:36] Larissa |
| RFC-PROP-07 | `docs/RFC.md` | Decisão | Módulo `src/modules/webhooks` (novo) no padrão do projeto; erros com prefixo `WEBHOOK_`; Pino; `requireRole`; PrismaClient próprio no worker | TRANSCRICAO | [09:27] Bruno; [09:29] Larissa; [09:30] Larissa; [09:30] Bruno |
| RFC-ALT-01 | `docs/RFC.md` | Alternativa Descartada | Disparo síncrono no `changeStatus`: acopla a mudança de status ao cliente | TRANSCRICAO | [09:03] Larissa; [09:04] Bruno; [09:06] Diego |
| RFC-ALT-02 | `docs/RFC.md` | Alternativa Descartada | Redis Streams: "subir mais infra", overengineering para um time pequeno | TRANSCRICAO | [09:07] Larissa; [09:07] Diego |
| RFC-ALT-03 | `docs/RFC.md` | Alternativa Descartada | Trigger no banco: MySQL não notifica processo externo; polling de 2s já atende | TRANSCRICAO | [09:09] Bruno; [09:09] Diego |
| RFC-ALT-04 | `docs/RFC.md` | Alternativa Descartada | Retry indefinido (posição de terceiros citada) ou 3 tentativas | TRANSCRICAO | [09:15] Diego; [09:16] Bruno; [09:16] Diego |
| RFC-ALT-05 | `docs/RFC.md` | Alternativa Descartada | Exactly-once: exige coordenação dos dois lados | TRANSCRICAO | [09:25] Diego |
| RFC-ALT-06 | `docs/RFC.md` | Alternativa Descartada | Secret global: "se vaza uma, vaza tudo" | TRANSCRICAO | [09:21] Sofia |
| RFC-OQ-01 | `docs/RFC.md` | Questão em Aberto | Rate limiting: observar e implementar "se virar problema" | TRANSCRICAO | [09:38] Diego; [09:39] Diego; [09:39] Larissa |
| RFC-OQ-02 | `docs/RFC.md` | Questão em Aberto | Escala do worker: particionar por `order_id` ou lock pessimista | TRANSCRICAO | [09:13] Bruno; [09:13] Diego |
| RFC-OQ-03 | `docs/RFC.md` | Questão em Aberto | Endurecer as permissões do CRUD; `customerId` no body ou no path | TRANSCRICAO | [09:32] Larissa; [09:37] Sofia |
| RFC-OQ-04 | `docs/RFC.md` | Questão em Aberto | Itens derivados para a revisão de segurança (HMAC e geração de secret), incluindo SSRF (e) e rotação de emergência (f) | TRANSCRICAO | [09:46] Sofia |
| RFC-OQ-05 | `docs/RFC.md` | Questão em Aberto | E-mail fora desta fase; próxima fase condicionada à medição de impacto | TRANSCRICAO | [09:37] Marcos; [09:37] Larissa; [09:38] Marcos |
| RFC-OQ-06 | `docs/RFC.md` | Questão em Aberto | Arquivamento das linhas entregues da outbox (~30 dias), fora desta feature | TRANSCRICAO | [09:08] Diego |
| RFC-IMP-01 | `docs/RFC.md` | Restrição | Nova chamada em `changeStatus`, novas tabelas por migration; `PATCH /orders/:id/status` falha se a outbox falhar | CODIGO | `src/modules/orders/order.service.ts` |
| RFC-IMP-02 | `docs/RFC.md` | Restrição | Novo processo iniciado pelo novo script `worker` | CODIGO | `package.json` |
| RFC-IMP-03 | `docs/RFC.md` | Dependência | Clientes expõem https, validam a assinatura e deduplicam; documentação no portal | TRANSCRICAO | [09:26] Marcos; [09:40] Marcos |
| RFC-IMP-04 | `docs/RFC.md` | Restrição | 3 sprints com revisão de segurança; Atlas quer até o fim de novembro | TRANSCRICAO | [09:45] Marcos; [09:46] Larissa; [09:47] Larissa |
| RFC-RISK-01 | `docs/RFC.md` | Risco | Transação de status mais pesada | TRANSCRICAO | [09:04] Bruno; [09:08] Diego; [09:43] Diego |
| RFC-RISK-02 | `docs/RFC.md` | Risco | Cliente lento atrasa a fila de todos; os 10s valem só até o primeiro envio | TRANSCRICAO | [09:02] Marcos; [09:42] Diego |
| RFC-RISK-03 | `docs/RFC.md` | Risco | Worker único parado acumula eventos; segunda instância quebra a ordenação | TRANSCRICAO | [09:12] Diego; [09:13] Diego |
| RFC-RISK-04 | `docs/RFC.md` | Limitação | Ordem garantida só por pedido, com um worker e no primeiro envio | TRANSCRICAO | [09:13] Larissa; [09:17] Diego |
| RFC-RISK-05 | `docs/RFC.md` | Risco | Outbox cresce sem arquivamento | TRANSCRICAO | [09:07] Bruno; [09:08] Diego |
| RFC-RISK-06 | `docs/RFC.md` | Risco | Vazamento de secret | TRANSCRICAO | [09:21] Sofia; [09:22] Diego |
| FDD-OBJ-01 | `docs/FDD.md` | Requisito Não Funcional | Atomicidade entre a mudança de status e o evento | TRANSCRICAO | [09:40] Bruno; [09:41] Diego |
| FDD-OBJ-02 | `docs/FDD.md` | Requisito Não Funcional | Do commit ao início do 1º envio: p95 ≤ 10s; atraso do polling ≤ ~2s (AMB-21) | TRANSCRICAO | [09:02] Marcos; [09:10] Larissa |
| FDD-OBJ-03 | `docs/FDD.md` | Requisito Não Funcional | Mudança de status não depende do cliente nem de dados enviados por ele | TRANSCRICAO | [09:04] Bruno |
| FDD-OBJ-04 | `docs/FDD.md` | Requisito Não Funcional | 5 tentativas em ~15h (AMB-02), depois DLQ com replay manual | TRANSCRICAO | [09:17] Larissa; [09:18] Diego |
| FDD-OBJ-05 | `docs/FDD.md` | Requisito Não Funcional | HMAC-SHA256 com secret por endpoint | TRANSCRICAO | [09:22] Sofia |
| FDD-OBJ-06 | `docs/FDD.md` | Restrição | Nenhuma infraestrutura ou dependência nova | TRANSCRICAO | [09:07] Diego; [09:30] Larissa |
| FDD-MOD-01 | `docs/FDD.md` | Decisão | `webhook_endpoints` com url, secret, customer, estado ativo e secret anterior para a carência | TRANSCRICAO | [09:21] Bruno; [09:21] Sofia |
| FDD-MOD-02 | `docs/FDD.md` | Decisão | `webhook_outbox`: uma linha por webhook, payload snapshot em MediumText, índices de status e created_at, guarda `lockedBy` + `claimId` | TRANSCRICAO | [09:06] Diego; [09:08] Diego; [09:52] Larissa |
| FDD-MOD-03 | `docs/FDD.md` | Decisão | `webhook_dead_letter` com payload, motivo e timestamp; registro do replay | TRANSCRICAO | [09:18] Diego; [09:36] Sofia |
| FDD-MOD-04 | `docs/FDD.md` | Interpretação | `webhook_deliveries`: uma linha por tentativa, com `startedAt` e `dispatchDelayMs` (AMB-05) | TRANSCRICAO | [09:34] Marcos |
| FDD-MOD-05 | `docs/FDD.md` | Restrição | `webhook_worker_lease`: linha única que garante instância única (proposta) | TRANSCRICAO | [09:12] Diego |
| FDD-FLUXO-01 | `docs/FDD.md` | Decisão | `publishWebhookEvent(tx, …)` na transação; filtro na inserção; falha desfaz tudo; correlationId saneado | TRANSCRICAO | [09:40] Bruno; [09:41] Bruno; [09:34] Bruno |
| FDD-FLUXO-02 | `docs/FDD.md` | Decisão | Lease com heartbeat e expiração local; poll não reentrante a cada 2s; seleção justa em duas etapas; ocupado no banco e em memória; claimId por lote; drenagem com teto | TRANSCRICAO | [09:08] Diego; [09:09] Diego; [09:12] Diego |
| FDD-FLUXO-03 | `docs/FDD.md` | Decisão | Entrega: assinatura no envio, https.request com IP fixado e prazo único, 2xx = sucesso (AMB-17), limite de 64KB, saídas terminais registradas, guarda de lock | TRANSCRICAO | [09:22] Sofia; [09:24] Larissa; [09:42] Diego |
| FDD-FLUXO-04 | `docs/FDD.md` | Decisão | Retentativas 1m/5m/30m/2h/12h; até 6 envios (AMB-02) | TRANSCRICAO | [09:17] Diego; [09:17] Larissa |
| FDD-FLUXO-05 | `docs/FDD.md` | Interpretação | Evento movido para a DLQ: DELETE condicionado antes do INSERT (AMB-13) | TRANSCRICAO | [09:15] Diego; [09:18] Diego |
| FDD-FLUXO-06 | `docs/FDD.md` | Requisito Funcional | Replay ADMIN atômico, mesmo eventId, cycle + 1; exige cadastro ativo; registro de quem fez | TRANSCRICAO | [09:18] Diego; [09:36] Sofia; [09:36] Larissa |
| FDD-FLUXO-07 | `docs/FDD.md` | Requisito Funcional | Rotação com carência de 24h; 409 durante a carência; revokePrevious para emergência; UPDATE atômico | TRANSCRICAO | [09:21] Sofia |
| FDD-FLUXO-08 | `docs/FDD.md` | Requisito Funcional | CRUD: secret gerada pela plataforma; customerId no body ou na query; qualquer role; url e active lidos no envio; pausa de até 24h | TRANSCRICAO | [09:31] Marcos; [09:32] Larissa; [09:37] Sofia |
| FDD-CONTRATO-01 | `docs/FDD.md` | Requisito Funcional | `POST /api/v1/webhooks` com url https e statuses; devolve a secret | TRANSCRICAO | [09:31] Marcos; [09:33] Marcos; [09:23] Sofia |
| FDD-CONTRATO-02 | `docs/FDD.md` | Requisito Funcional | `GET /api/v1/webhooks?customerId=` lista os webhooks do customer | TRANSCRICAO | [09:33] Bruno |
| FDD-CONTRATO-03 | `docs/FDD.md` | Requisito Funcional | `PATCH /api/v1/webhooks/:id` edita url, statuses e active | TRANSCRICAO | [09:33] Bruno; [09:21] Bruno |
| FDD-CONTRATO-04 | `docs/FDD.md` | Requisito Funcional | `DELETE /api/v1/webhooks/:id` remove o cadastro | TRANSCRICAO | [09:33] Bruno |
| FDD-CONTRATO-05 | `docs/FDD.md` | Requisito Funcional | `POST /api/v1/webhooks/:id/rotate-secret` (path AMB-06) | TRANSCRICAO | [09:21] Sofia |
| FDD-CONTRATO-06 | `docs/FDD.md` | Requisito Funcional | `GET /api/v1/webhooks/:id/deliveries`: últimos 100 envios | TRANSCRICAO | [09:34] Marcos |
| FDD-CONTRATO-07 | `docs/FDD.md` | Requisito Funcional | `POST /api/v1/admin/webhooks/dead-letter/:id/replay`, somente ADMIN | TRANSCRICAO | [09:18] Diego; [09:35] Diego; [09:36] Larissa |
| FDD-CONTRATO-08 | `docs/FDD.md` | Requisito Funcional | Listagem ADMIN da DLQ (proposta, ADR-003-CON-03) | TRANSCRICAO | [09:18] Diego |
| FDD-CONTRATO-09 | `docs/FDD.md` | Requisito Funcional | Contrato de saída: payload enxuto, 5 headers, assinatura dupla na carência | TRANSCRICAO | [09:43] Diego; [09:44] Diego; [09:44] Sofia |
| FDD-ERR-01 | `docs/FDD.md` | Restrição | `WEBHOOK_NOT_FOUND` (404, AppError direto) | TRANSCRICAO | [09:28] Bruno |
| FDD-ERR-02 | `docs/FDD.md` | Restrição | `WEBHOOK_CUSTOMER_NOT_FOUND` (404) | TRANSCRICAO | [09:29] Larissa; [09:32] Larissa |
| FDD-ERR-03 | `docs/FDD.md` | Restrição | `WEBHOOK_DEAD_LETTER_NOT_FOUND` (404) | TRANSCRICAO | [09:29] Larissa; [09:18] Diego |
| FDD-ERR-04 | `docs/FDD.md` | Restrição | `WEBHOOK_DEAD_LETTER_ALREADY_REPLAYED` (409) | TRANSCRICAO | [09:29] Larissa; [09:18] Diego |
| FDD-ERR-05 | `docs/FDD.md` | Restrição | `WEBHOOK_ENDPOINT_UNAVAILABLE` (422) no replay para cadastro removido, inexistente ou inativo | TRANSCRICAO | [09:29] Larissa; [09:21] Bruno |
| FDD-ERR-06 | `docs/FDD.md` | Restrição | Replay recusado (422) só para item com payload acima de 64KB; destino bloqueado é reavaliado | TRANSCRICAO | [09:24] Larissa |
| FDD-ERR-07 | `docs/FDD.md` | Restrição | `WEBHOOK_SECRET_ROTATION_IN_PROGRESS` (409) preserva a carência de 24h, salvo revokePrevious | TRANSCRICAO | [09:21] Sofia |
| FDD-ERR-08 | `docs/FDD.md` | Interpretação | URL http → `VALIDATION_ERROR` do `validate()`; o exemplo `WEBHOOK_INVALID_URL` é absorvido (AMB-26) | CODIGO | `src/middlewares/validate.middleware.ts` |
| FDD-ERR-09 | `docs/FDD.md` | Restrição | 401/403 dos middlewares existentes; rotas admin exigem ADMIN | TRANSCRICAO | [09:36] Larissa |
| FDD-ERR-10 | `docs/FDD.md` | Restrição | `WEBHOOK_PUBLISH_FAILED` (500) desfaz a transação; a causa vai para o log | TRANSCRICAO | [09:40] Bruno |
| FDD-ERR-11 | `docs/FDD.md` | Restrição | `WEBHOOK_DELIVERY_TIMEOUT`: tempo limite estourado, identificado por `signal.reason` TimeoutError | TRANSCRICAO | [09:42] Diego |
| FDD-ERR-12 | `docs/FDD.md` | Interpretação | `WEBHOOK_DELIVERY_HTTP_ERROR`: resposta fora de 2xx (AMB-17) | TRANSCRICAO | [09:42] Diego |
| FDD-ERR-13 | `docs/FDD.md` | Restrição | `WEBHOOK_DELIVERY_NETWORK_ERROR`: DNS, conexão ou TLS | TRANSCRICAO | [09:14] Larissa |
| FDD-ERR-14 | `docs/FDD.md` | Restrição | `WEBHOOK_RETRIES_EXHAUSTED`: falha na 5ª retentativa (AMB-02) | TRANSCRICAO | [09:17] Larissa |
| FDD-ERR-15 | `docs/FDD.md` | Restrição | `WEBHOOK_PAYLOAD_TOO_LARGE`: corpo acima de 65.536 bytes | TRANSCRICAO | [09:23] Sofia; [09:24] Larissa |
| FDD-ERR-16 | `docs/FDD.md` | Restrição | `WEBHOOK_ENDPOINT_UNAVAILABLE`: cadastro removido ou inexistente, ou pausa acima de 24h | TRANSCRICAO | [09:21] Bruno |
| FDD-ERR-17 | `docs/FDD.md` | Risco | `WEBHOOK_DESTINATION_BLOCKED`: destino privado ou de metadata (proposta, segurança) | TRANSCRICAO | [09:37] Sofia |
| FDD-RES-01 | `docs/FDD.md` | Restrição | Envio fora da transação de status | TRANSCRICAO | [09:04] Bruno |
| FDD-RES-02 | `docs/FDD.md` | Restrição | Timeout de 10s por envio | TRANSCRICAO | [09:42] Diego |
| FDD-RES-03 | `docs/FDD.md` | Decisão | Backoff exponencial com teto | TRANSCRICAO | [09:17] Larissa |
| FDD-RES-04 | `docs/FDD.md` | Decisão | DLQ e replay manual atômico | TRANSCRICAO | [09:18] Diego |
| FDD-RES-05 | `docs/FDD.md` | Restrição | Sem canal alternativo nesta fase; fallback = DLQ e histórico | TRANSCRICAO | [09:37] Larissa |
| FDD-RES-06 | `docs/FDD.md` | Trade-off | Seleção justa em duas etapas, rodízio, claimId, vagas limitadas, drenagem encerra na 1ª falha ou no tempo máximo (proposta) | TRANSCRICAO | [09:12] Diego; [09:04] Bruno |
| FDD-RES-07 | `docs/FDD.md` | Trade-off | Linhas presas voltam à fila; no teto de reclaims vão para a DLQ; duplicata aceita (proposta) | TRANSCRICAO | [09:24] Diego |
| FDD-RES-08 | `docs/FDD.md` | Restrição | Lease: heartbeat independente, expiração local, standby, holderId aleatório (proposta) | TRANSCRICAO | [09:12] Diego; [09:13] Larissa |
| FDD-RES-09 | `docs/FDD.md` | Padrão Existente | Encerramento: flag stopping, espera só do envio em curso, devolução de linhas e liberação do lease, no padrão de `src/server.ts` | CODIGO | `src/server.ts` |
| FDD-RES-10 | `docs/FDD.md` | Restrição | Acima de 64KB → DLQ sem tentativa; a coluna não impõe o limite (AMB-03) | TRANSCRICAO | [09:23] Sofia; [09:24] Larissa |
| FDD-RES-11 | `docs/FDD.md` | Restrição | Worker parado não perde eventos | TRANSCRICAO | [09:06] Diego |
| FDD-RES-12 | `docs/FDD.md` | Interpretação | Endpoint inativo pausa os pendentes por até 24h, depois DLQ (proposta) | TRANSCRICAO | [09:21] Bruno |
| FDD-RES-13 | `docs/FDD.md` | Restrição | Leitura da resposta limitada a 2KB (proposta) | TRANSCRICAO | [09:34] Marcos |
| FDD-OBS-01 | `docs/FDD.md` | Requisito Não Funcional | Logs estruturados no Pino; replay auditado com userId | TRANSCRICAO | [09:29] Bruno; [09:36] Sofia |
| FDD-OBS-02 | `docs/FDD.md` | Restrição | Redact de secret na raiz e aninhada | TRANSCRICAO | [09:22] Diego |
| FDD-OBS-03 | `docs/FDD.md` | Métrica | Métricas derivadas; p95 de `dispatchDelayMs` ≤ 10s (proposta) | TRANSCRICAO | [09:02] Marcos; [09:30] Larissa |
| FDD-OBS-04 | `docs/FDD.md` | Padrão Existente | Tracing por correlação X-Request-Id → correlationId → eventId | CODIGO | `src/middlewares/request-logger.middleware.ts` |
| FDD-INT-01 | `docs/FDD.md` | Padrão Existente | `changeStatus`: chamada entre linhas 159–167 e 169; `TxClient`; 5º argumento opcional proposto | CODIGO | `src/modules/orders/order.service.ts` |
| FDD-INT-02 | `docs/FDD.md` | Padrão Existente | Controller repassa `req.id` como argumento opcional (proposta) | CODIGO | `src/modules/orders/order.controller.ts` |
| FDD-INT-03 | `docs/FDD.md` | Padrão Existente | `buildControllers` instancia repository → service → controller de webhooks | CODIGO | `src/app.ts` |
| FDD-INT-04 | `docs/FDD.md` | Padrão Existente | `Controllers` + `router.use('/webhooks')` e `'/admin/webhooks'` | CODIGO | `src/routes/index.ts` |
| FDD-INT-05 | `docs/FDD.md` | Padrão Existente | `authenticate` em todas as rotas; `requireRole('ADMIN')` nas admin | CODIGO | `src/middlewares/auth.middleware.ts` |
| FDD-INT-06 | `docs/FDD.md` | Padrão Existente | Schemas Zod com `validate()`; https no schema | CODIGO | `src/middlewares/validate.middleware.ts` |
| FDD-INT-07 | `docs/FDD.md` | Padrão Existente | Classes 409/422 por herança; 404 e 500 estendem `AppError` direto | CODIGO | `src/shared/errors/http-errors.ts` |
| FDD-INT-08 | `docs/FDD.md` | Padrão Existente | Error middleware sem alteração; o ramo `AppError` não loga; P2003 cai em 500 | CODIGO | `src/middlewares/error.middleware.ts` |
| FDD-INT-09 | `docs/FDD.md` | Padrão Existente | `redactPaths` ganha secret na raiz e aninhada; logger filho no worker | CODIGO | `src/shared/logger/index.ts` |
| FDD-INT-10 | `docs/FDD.md` | Padrão Existente | `paginated()` nas listagens | CODIGO | `src/shared/http/response.ts` |
| FDD-INT-11 | `docs/FDD.md` | Padrão Existente | `src/worker.ts` (novo) segue o bootstrap/shutdown existente; prisma próprio; connection_limit ≥ concorrência + 4 | CODIGO | `src/config/database.ts` |
| FDD-INT-12 | `docs/FDD.md` | Padrão Existente | Variáveis `WEBHOOK_*` (inclui TASK_MAX_MS e ALLOW_PRIVATE_DESTINATIONS, proibida em produção) e invariantes via superRefine | CODIGO | `src/config/env.ts` |
| FDD-INT-13 | `docs/FDD.md` | Padrão Existente | Scripts `worker` e `worker:start`; https, dns e crypto nativos, sem dependência nova | CODIGO | `package.json` |
| FDD-INT-14 | `docs/FDD.md` | Padrão Existente | Novos modelos (com o lease), enum, relação em `Customer`, migration aditiva | CODIGO | `prisma/schema.prisma` |
| FDD-INT-15 | `docs/FDD.md` | Padrão Existente | Limpeza das tabelas novas e do lease; factory; servidor HTTPS de teste com CA injetada; runPollOnce e drain | CODIGO | `tests/setup.ts` |
| FDD-INT-16 | `docs/FDD.md` | Padrão Existente | `delete` físico de customer; cascata para os endpoints; eventos sobrevivem | CODIGO | `src/modules/customers/customer.service.ts` |
| FDD-INT-17 | `docs/FDD.md` | Padrão Existente | `X-Request-Id` vem do cliente sem validação; é saneado antes de gravar | CODIGO | `src/middlewares/request-logger.middleware.ts` |
| FDD-DEP-01 | `docs/FDD.md` | Dependência | Node ≥ 20: https.request com lookup, dns, net, AbortSignal.timeout, crypto | CODIGO | `package.json` |
| FDD-DEP-02 | `docs/FDD.md` | Dependência | MySQL 8 (UTC_TIMESTAMP, MediumText, INSERT IGNORE) e Prisma 5; nenhum serviço novo | CODIGO | `docker-compose.yml` |
| FDD-DEP-03 | `docs/FDD.md` | Dependência | Revisão de segurança ≥ 2 dias úteis; pauta do RFC-OQ-04 (e) mais a rotação de emergência | TRANSCRICAO | [09:46] Sofia |
| FDD-DEP-04 | `docs/FDD.md` | Dependência | Clientes: https, validação da assinatura, deduplicação; portal | TRANSCRICAO | [09:26] Marcos; [09:40] Marcos |
| FDD-DEP-05 | `docs/FDD.md` | Restrição | Contratos existentes inalterados; PATCH de status pode retornar `WEBHOOK_PUBLISH_FAILED` | TRANSCRICAO | [09:40] Bruno |
| FDD-DEP-06 | `docs/FDD.md` | Restrição | Migration aditiva; uma instância ativa do worker, as demais em standby | TRANSCRICAO | [09:11] Diego; [09:12] Diego |
| FDD-AC-01 | `docs/FDD.md` | Requisito Funcional | N webhooks inscritos → N linhas PENDING | TRANSCRICAO | [09:34] Bruno |
| FDD-AC-02 | `docs/FDD.md` | Requisito Funcional | Status não assinado ou webhook inativo → nenhuma linha | TRANSCRICAO | [09:34] Bruno |
| FDD-AC-03 | `docs/FDD.md` | Requisito Não Funcional | Falha na outbox → status, histórico e estoque inalterados; causa registrada no log | TRANSCRICAO | [09:40] Bruno |
| FDD-AC-04 | `docs/FDD.md` | Requisito Não Funcional | Endpoint lento não atrasa o 1º envio de outro endpoint | TRANSCRICAO | [09:02] Marcos; [09:10] Larissa |
| FDD-AC-05 | `docs/FDD.md` | Requisito Funcional | 5 headers e HMAC conferível | TRANSCRICAO | [09:44] Diego; [09:22] Sofia |
| FDD-AC-06 | `docs/FDD.md` | Requisito Funcional | Duas assinaturas na carência; rotação durante a carência dá 409; revokePrevious dá 200 | TRANSCRICAO | [09:21] Sofia |
| FDD-AC-07 | `docs/FDD.md` | Requisito Não Funcional | Timeout → tentativa com falha e retentativa em +1 min | TRANSCRICAO | [09:42] Diego; [09:17] Diego |
| FDD-AC-08 | `docs/FDD.md` | Requisito Funcional | 6 falhas → DLQ com payload, motivo e timestamp | TRANSCRICAO | [09:18] Diego |
| FDD-AC-09 | `docs/FDD.md` | Requisito Funcional | Replay: OPERATOR recebe 403; ADMIN recebe 202 com cycle 2; replay concorrente recebe 409 | TRANSCRICAO | [09:36] Sofia |
| FDD-AC-10 | `docs/FDD.md` | Requisito Funcional | URL http, localhost ou IP privado literal dão 400 | TRANSCRICAO | [09:23] Sofia |
| FDD-AC-11 | `docs/FDD.md` | Requisito Não Funcional | Secret só na criação e na rotação; nunca em listagens ou logs | TRANSCRICAO | [09:22] Diego |
| FDD-AC-12 | `docs/FDD.md` | Requisito Não Funcional | 65.537 bytes vai para a DLQ com delivery attempt 0; 65.536 bytes é enviado | TRANSCRICAO | [09:24] Larissa |
| FDD-AC-13 | `docs/FDD.md` | Requisito Funcional | Deliveries: até 100 itens, mais recentes primeiro, também para cadastro removido | TRANSCRICAO | [09:34] Marcos |
| FDD-AC-14 | `docs/FDD.md` | Requisito Não Funcional | Segunda instância fica em standby e assume em até TTL + heartbeat | TRANSCRICAO | [09:12] Diego |
| FDD-AC-15 | `docs/FDD.md` | Restrição | Testes existentes continuam passando | CODIGO | `tests/orders.test.ts` |
| FDD-AC-16 | `docs/FDD.md` | Requisito Não Funcional | Eventos do mesmo pedido para o mesmo endpoint saem em ordem no primeiro envio | TRANSCRICAO | [09:12] Diego |
| FDD-AC-17 | `docs/FDD.md` | Requisito Não Funcional | Linha presa volta à fila; no teto de reclaims vai para a DLQ | TRANSCRICAO | [09:24] Diego |
| FDD-AC-18 | `docs/FDD.md` | Requisito Funcional | Pedido apagado ainda tem o evento entregue com o payload original | TRANSCRICAO | [09:52] Larissa |
| FDD-AC-19 | `docs/FDD.md` | Requisito Não Funcional | SIGTERM: nenhum lote novo; linhas reservadas e não iniciadas são devolvidas; lease liberado | TRANSCRICAO | [09:11] Diego |
| FDD-AC-20 | `docs/FDD.md` | Requisito Não Funcional | X-Request-Id gigante não impede a mudança de status | TRANSCRICAO | [09:04] Bruno |
| FDD-RISK-01 | `docs/FDD.md` | Risco | Transação de status mais lenta | TRANSCRICAO | [09:04] Bruno; [09:43] Diego |
| FDD-RISK-02 | `docs/FDD.md` | Risco | Clientes lentos ocupam todas as vagas; drenagem encerra na 1ª falha e há rodízio | TRANSCRICAO | [09:42] Diego |
| FDD-RISK-03 | `docs/FDD.md` | Risco | Linha presa ou duplicata na recuperação | TRANSCRICAO | [09:25] Diego |
| FDD-RISK-04 | `docs/FDD.md` | Risco | Duas instâncias ativas ou troca de instância quebram a ordem | TRANSCRICAO | [09:13] Larissa |
| FDD-RISK-05 | `docs/FDD.md` | Risco | Secret recuperável no banco ou vazada em log; rotação de emergência | TRANSCRICAO | [09:21] Sofia; [09:22] Diego; [09:46] Sofia |
| FDD-RISK-06 | `docs/FDD.md` | Risco | X-Timestamp fora da assinatura | TRANSCRICAO | [09:22] Sofia; [09:44] Diego |
| FDD-RISK-07 | `docs/FDD.md` | Risco | Bytes do payload alterados ou sem espaço na coluna | TRANSCRICAO | [09:52] Larissa |
| FDD-RISK-08 | `docs/FDD.md` | Risco | FKs novas quebram `DELETE /customers` ou apagam eventos | CODIGO | `src/modules/customers/customer.service.ts` |
| FDD-RISK-09 | `docs/FDD.md` | Risco | Tabelas crescem sem arquivamento | TRANSCRICAO | [09:08] Diego |
| FDD-RISK-10 | `docs/FDD.md` | Limitação | Ordem por pedido invertida durante o backoff | TRANSCRICAO | [09:13] Larissa; [09:14] Marcos |
| FDD-RISK-11 | `docs/FDD.md` | Risco | SSRF via URL cadastrada; IP fixado contra DNS rebinding | TRANSCRICAO | [09:37] Sofia; [09:34] Marcos |
| FDD-RISK-12 | `docs/FDD.md` | Risco | X-Request-Id do cliente quebra a mudança de status | CODIGO | `src/middlewares/request-logger.middleware.ts` |
| FDD-ERR-18 | `docs/FDD.md` | Restrição | `WEBHOOK_DELIVERY_INTERNAL_ERROR`: exceção inesperada consome tentativa; no teto de reclaims vai para a DLQ (proposta) | TRANSCRICAO | [09:24] Diego |
| FDD-RES-14 | `docs/FDD.md` | Restrição | try/catch total por evento; nenhuma linha fica sem tratamento (AMB-20) | TRANSCRICAO | [09:29] Bruno; [09:11] Diego |
| FDD-AC-21 | `docs/FDD.md` | Requisito Não Funcional | Justiça: backlog de A não atrasa o evento novo de B | TRANSCRICAO | [09:38] Diego |
| FDD-AC-22 | `docs/FDD.md` | Requisito Funcional | Pausa: inativo retém sem consumir tentativa; reativar retoma; 24h → DLQ; replay com cadastro inativo → 422 | TRANSCRICAO | [09:21] Bruno |
| FDD-AC-23 | `docs/FDD.md` | Requisito Funcional | Endpoint inexistente leva o evento à DLQ com WEBHOOK_ENDPOINT_UNAVAILABLE | TRANSCRICAO | [09:21] Bruno |
| FDD-AC-24 | `docs/FDD.md` | Requisito Não Funcional | Destino 127.0.0.1 é bloqueado; replay após PATCH da URL é aceito | TRANSCRICAO | [09:37] Sofia |
| FDD-AC-25 | `docs/FDD.md` | Requisito Não Funcional | Resposta de 1MB é registrada com até 2KB | TRANSCRICAO | [09:34] Marcos |
| FDD-AC-26 | `docs/FDD.md` | Requisito Não Funcional | Lock perdido: a tarefa antiga não grava estado e registra webhook_lock_lost | TRANSCRICAO | [09:12] Diego |
| FDD-AC-27 | `docs/FDD.md` | Requisito Não Funcional | Na troca de instância, endpoint com PROCESSING da anterior não é reservado | TRANSCRICAO | [09:12] Diego |
| FDD-RISK-13 | `docs/FDD.md` | Risco | Eventos de um período inativo não são gerados; orientação é não desativar em manutenção curta | TRANSCRICAO | [09:16] Diego; [09:34] Bruno |
| FDD-AC-28 | `docs/FDD.md` | Requisito Não Funcional | Poll na fronteira da drenagem não reserva duas vezes o mesmo endpoint (busyEndpoints + claimId) | TRANSCRICAO | [09:12] Diego |
| FDD-AC-29 | `docs/FDD.md` | Requisito Não Funcional | Bloqueio de IP literal, IPv6 e resolução múltipla; timeout classificado via signal.reason | TRANSCRICAO | [09:37] Sofia; [09:42] Diego |
| FDD-AC-30 | `docs/FDD.md` | Requisito Não Funcional | Endpoint sem resposta libera a vaga na 1ª falha; os outros endpoints seguem atendidos | TRANSCRICAO | [09:38] Diego; [09:42] Diego |
| FDD-RISK-14 | `docs/FDD.md` | Risco | Pool de conexões do worker esgotado faz o lease se perder | CODIGO | `src/config/database.ts` |
| FDD-RISK-15 | `docs/FDD.md` | Risco | Custo da seleção cresce com o backlog; seleção em duas etapas usando só índice | TRANSCRICAO | [09:08] Diego |
| FDD-SUP-01 | `docs/FDD.md` | Suposição | Um único worker ativo atende o volume atual (hipótese: volume não discutido); escalar é "problema do futuro" | TRANSCRICAO | [09:13] Diego |
| FDD-SUP-02 | `docs/FDD.md` | Suposição | O volume lido por poll cabe num "batch pequeno" | TRANSCRICAO | [09:08] Diego |
| FDD-SUP-03 | `docs/FDD.md` | Suposição | O cliente tem endpoint https e responde dentro de 10s | TRANSCRICAO | [09:23] Sofia; [09:42] Diego |
| FDD-RST-01 | `docs/FDD.md` | Restrição | Nenhuma infraestrutura nova; nenhuma dependência npm nova é interpretação do "reuso máximo" | TRANSCRICAO | [09:29] Bruno; [09:30] Larissa |
| FDD-RST-02 | `docs/FDD.md` | Restrição | Integração por função que recebe o `tx`, sem repository injetado; construtor do `OrderService` intacto; `requestId` opcional é proposta (INT-02) | TRANSCRICAO | [09:41] Bruno; [09:41] Diego |
| FDD-RST-03 | `docs/FDD.md` | Restrição | Payload de até 64KB, tempo limite de 10s e URL https | TRANSCRICAO | [09:23] Sofia; [09:24] Larissa; [09:42] Diego |
| FDD-RST-04 | `docs/FDD.md` | Restrição | Ids em UUID, como no resto do projeto | TRANSCRICAO | [09:51] Larissa |
| FDD-RST-05 | `docs/FDD.md` | Restrição | Prazo de 3 sprints com a revisão de segurança no fim | TRANSCRICAO | [09:47] Larissa |
| FDD-CONTRATO-10 | `docs/FDD.md` | Decisão | Função `publishWebhookEvent(tx, order, fromStatus, toStatus)`, que grava na outbox pelo `tx`, sem HTTP; falha desfaz a mudança de status. O 5º argumento `opts` é proposta. | TRANSCRICAO | [09:41] Bruno; [09:41] Diego; [09:40] Bruno |
| FDD-INV-01 | `docs/FDD.md` | Invariante | Nenhum status alterado sem evento para endpoint ativo inscrito, e nenhum evento sem status alterado | TRANSCRICAO | [09:40] Bruno; [09:41] Diego |
| FDD-INV-02 | `docs/FDD.md` | Invariante | `eventId` igual em todas as tentativas e no replay (AMB-19) | TRANSCRICAO | [09:25] Diego |
| FDD-INV-03 | `docs/FDD.md` | Invariante | Em cada ciclo, evento na outbox ou na DLQ, nunca nos dois; no replay, a linha da DLQ fica marcada (AMB-13) | TRANSCRICAO | [09:15] Diego; [09:18] Diego |
| FDD-INV-04 | `docs/FDD.md` | Invariante | No máximo uma instância do worker reserva linhas | TRANSCRICAO | [09:12] Diego |
| FDD-INV-05 | `docs/FDD.md` | Invariante | No máximo um envio em curso por endpoint, preservando a ordem por pedido (proposta) | TRANSCRICAO | [09:12] Diego |
| FDD-INV-06 | `docs/FDD.md` | Invariante | Payload imutável depois da inserção | TRANSCRICAO | [09:52] Diego |
| FDD-INV-07 | `docs/FDD.md` | Invariante | Todo evento termina entregue ou na DLQ; nenhum fica pendente para sempre | TRANSCRICAO | [09:15] Diego |
| FDD-INV-08 | `docs/FDD.md` | Invariante | Secret fora de logs e de respostas, exceto criação e rotação (proposta) | TRANSCRICAO | [09:22] Diego |
| FDD-OBS-05 | `docs/FDD.md` | Proposta | Alertas e consultas de acompanhamento a partir da OBS-03 e dos logs; sem painel novo; ferramenta para a revisão técnica | TRANSCRICAO | [09:02] Marcos; [09:36] Sofia; [09:50] Larissa |
| FDD-INT-18 | `docs/FDD.md` | Padrão Existente | Máquina de estados: `changeStatus` chama `canTransition` antes da publicação; nenhuma transição tem `PENDING` como destino | CODIGO | `src/modules/orders/order.status.ts`; `src/modules/orders/order.service.ts` |
| FDD-DEP-07 | `docs/FDD.md` | Padrão Existente | Express 4.21.1, Zod 3.23.8 e Pino 9.5.0 reutilizados sem atualização | CODIGO | `package.json` |
| FDD-PLAN-01 | `docs/FDD.md` | Plano | Bloco "modelagem de outbox e DLQ": 1 sprint | TRANSCRICAO | [09:46] Larissa |
| FDD-PLAN-02 | `docs/FDD.md` | Plano | Bloco "worker e retry": 1 sprint | TRANSCRICAO | [09:46] Larissa |
| FDD-PLAN-03 | `docs/FDD.md` | Plano | Bloco "CRUD de configuração e deliveries": meio sprint; replay e listagem da DLQ encaixados aqui (proposta) | TRANSCRICAO | [09:46] Larissa |
| FDD-PLAN-04 | `docs/FDD.md` | Plano | Bloco "integração no order.service e testes ponta a ponta": meio sprint | TRANSCRICAO | [09:46] Larissa |
| FDD-PLAN-05 | `docs/FDD.md` | Plano | Bloco "HMAC, schemas, validações": "mais um pouco" | TRANSCRICAO | [09:46] Larissa |
| FDD-PLAN-06 | `docs/FDD.md` | Plano | Revisão de segurança de pelo menos 2 dias úteis no fim; total de três sprints | TRANSCRICAO | [09:46] Sofia; [09:47] Larissa |
| FDD-PROP-01 | `docs/FDD.md` | Proposta | Bloqueio de destinos privados (SSRF) no cadastro e no envio | TRANSCRICAO | [09:37] Sofia; [09:46] Sofia |
| FDD-PROP-02 | `docs/FDD.md` | Proposta | Rotação de emergência (`revokePrevious`) | TRANSCRICAO | [09:22] Diego |
| FDD-PROP-03 | `docs/FDD.md` | Proposta | Recusar com 409 uma nova rotação durante a carência | TRANSCRICAO | [09:21] Sofia |
| FDD-PROP-04 | `docs/FDD.md` | Proposta | Pausa de até 24h para cadastro inativo, depois DLQ | TRANSCRICAO | [09:21] Bruno |
| FDD-PROP-05 | `docs/FDD.md` | Proposta | Listagem da DLQ para ADMIN | TRANSCRICAO | [09:18] Diego; [09:36] Sofia |
| FDD-PROP-06 | `docs/FDD.md` | Proposta | Recusar `PENDING` em `statuses`, porque nunca é destino de transição | CODIGO | `src/modules/orders/order.status.ts` |
| FDD-PROP-07 | `docs/FDD.md` | Proposta | Lease de instância única e `claimId` por reserva | TRANSCRICAO | [09:12] Diego |
| FDD-PROP-08 | `docs/FDD.md` | Proposta | Seleção justa e uma tarefa por endpoint: um cliente lento não atrasa os outros | TRANSCRICAO | [09:04] Bruno; [09:12] Diego; [09:38] Diego |
| FDD-PROP-09 | `docs/FDD.md` | Proposta | Recuperação de linhas presas, com teto de `reclaims` | TRANSCRICAO | [09:24] Diego |
| FDD-PROP-10 | `docs/FDD.md` | Proposta | Resposta do cliente lida até 2KB | TRANSCRICAO | [09:34] Marcos |
| FDD-PROP-11 | `docs/FDD.md` | Proposta | `X-Request-Id` saneado como `correlationId` | TRANSCRICAO | [09:04] Bruno |
| FDD-PROP-12 | `docs/FDD.md` | Proposta | Redact de `secret` e `previousSecret` nos logs, prevenção inspirada no vazamento em log de um cliente | TRANSCRICAO | [09:22] Diego |
| FDD-PROP-13 | `docs/FDD.md` | Proposta | Métricas, consultas de acompanhamento e alertas a partir de logs e SQL | TRANSCRICAO | [09:29] Bruno |
| FDD-PROP-14 | `docs/FDD.md` | Proposta | Nomes completos dos códigos `WEBHOOK_*`, exceto `WEBHOOK_NOT_FOUND` | TRANSCRICAO | [09:28] Bruno; [09:29] Larissa |
| FDD-FALL-01 | `docs/FDD.md` | Decisão | Cliente fora do ar: retentativas e, esgotadas, DLQ com replay por ADMIN | TRANSCRICAO | [09:15] Diego; [09:18] Diego |
| FDD-FALL-02 | `docs/FDD.md` | Decisão | Worker parado: eventos se acumulam na outbox e saem quando ele volta | TRANSCRICAO | [09:06] Diego |
| FDD-FALL-03 | `docs/FDD.md` | Restrição | Falha ao registrar o evento faz a mudança de status falhar (fail-closed) | TRANSCRICAO | [09:40] Bruno |
| FDD-FALL-04 | `docs/FDD.md` | Interpretação | Cadastro inativo: pendentes pausados por até 24h e depois DLQ (proposta) | TRANSCRICAO | [09:21] Bruno |
| FDD-PROP-15 | `docs/FDD.md` | Interpretação | Duas assinaturas durante a carência da rotação (AMB-15) | TRANSCRICAO | [09:21] Sofia |
| FDD-PROP-16 | `docs/FDD.md` | Interpretação | Tabela `webhook_deliveries`, uma linha por tentativa (AMB-05) | TRANSCRICAO | [09:34] Marcos |
| FDD-PROP-17 | `docs/FDD.md` | Proposta | Remoção lógica do cadastro, para manter o histórico consultável | TRANSCRICAO | [09:33] Bruno |
| FDD-PROP-18 | `docs/FDD.md` | Proposta | Recusar o replay de evento acima de 64KB | TRANSCRICAO | [09:24] Larissa |
| PRD-CEN-01 | `docs/PRD.md` | Requisito Funcional | Cliente assina só "enviado" e "entregue" e recebe aviso nessas mudanças | TRANSCRICAO | [09:33] Marcos |
| PRD-CEN-02 | `docs/PRD.md` | Requisito Não Funcional | Cliente fora por 2h recebe os avisos na próxima tentativa agendada (retentativas por ~15h) | TRANSCRICAO | [09:16] Diego; [09:17] Diego |
| PRD-CEN-03 | `docs/PRD.md` | Requisito Funcional | Troca planejada de secret com 24h para migrar | TRANSCRICAO | [09:21] Sofia |
| PRD-CEN-04 | `docs/PRD.md` | Interpretação | Suspeita de vazamento: revogação imediata (proposta do FDD, pendente de avaliação de segurança) | TRANSCRICAO | [09:22] Diego |
| PRD-CEN-05 | `docs/PRD.md` | Requisito Funcional | Cliente descarta duplicata pelo identificador único | TRANSCRICAO | [09:25] Diego |
| PRD-CEN-06 | `docs/PRD.md` | Requisito Funcional | Cliente investiga pelo histórico dos últimos 100 envios | TRANSCRICAO | [09:34] Marcos |
| PRD-CEN-07 | `docs/PRD.md` | Requisito Funcional | Administrador reprocessa aviso esgotado, com registro de autoria | TRANSCRICAO | [09:18] Diego; [09:36] Sofia |
| PRD-CEN-08 | `docs/PRD.md` | Requisito Funcional | Cliente com vários cadastros identifica a origem de cada aviso | TRANSCRICAO | [09:44] Sofia |
| PRD-CEN-09 | `docs/PRD.md` | Interpretação | Desativar: sem avisos novos; pendentes retidos até 24h e depois DLQ | TRANSCRICAO | [09:21] Bruno |
| PRD-CEN-10 | `docs/PRD.md` | Dependência | Integração pelo portal, com "ao menos uma vez" e a limitação de ordem documentadas | TRANSCRICAO | [09:26] Marcos; [09:13] Larissa; [09:40] Marcos |
| PRD-MET-01 | `docs/PRD.md` | Métrica | Início do 1º envio em menos de 10s (AMB-21); acompanhamento por p95 (proposta) | TRANSCRICAO | [09:02] Marcos; [09:10] Larissa |
| PRD-MET-02 | `docs/PRD.md` | Métrica | Em produção até o fim de novembro (pedido da Atlas); 3 clientes integrados como proposta | TRANSCRICAO | [09:45] Marcos |
| PRD-MET-03 | `docs/PRD.md` | Métrica | 0 mudanças sem o aviso devido (endereço ativo e inscrito) | TRANSCRICAO | [09:40] Bruno; [09:41] Diego |
| PRD-MET-04 | `docs/PRD.md` | Métrica | Janela de retentativas de ~15h (AMB-02) | TRANSCRICAO | [09:17] Diego; [09:17] Larissa |
| PRD-MET-05 | `docs/PRD.md` | Métrica | Polling em GET /orders medido nos logs de requisição, com linha de base antes do lançamento | TRANSCRICAO | [09:00] Marcos |
| PRD-MET-06 | `docs/PRD.md` | Métrica | Avisos na DLQ por cliente; uso como insumo é proposta | TRANSCRICAO | [09:37] Larissa |
| PRD-OOS-01 | `docs/PRD.md` | Fora de Escopo | E-mail: talvez na próxima fase, depois de medir o impacto | TRANSCRICAO | [09:37] Marcos; [09:37] Larissa; [09:38] Marcos |
| PRD-OOS-02 | `docs/PRD.md` | Fora de Escopo | Painel visual (projeto do frontend) | TRANSCRICAO | [09:39] Marcos; [09:40] Larissa |
| PRD-OOS-03 | `docs/PRD.md` | Fora de Escopo | Webhooks de entrada | TRANSCRICAO | [09:02] Sofia; [09:02] Marcos |
| PRD-OOS-04 | `docs/PRD.md` | Fora de Escopo | Arquivamento das linhas entregues da fila interna | TRANSCRICAO | [09:08] Diego |
| PRD-OOS-05 | `docs/PRD.md` | Fora de Escopo | Itens do pedido no aviso | TRANSCRICAO | [09:43] Diego |
| PRD-OOS-06 | `docs/PRD.md` | Fora de Escopo | Ordem global e entrega exatamente uma vez | TRANSCRICAO | [09:13] Larissa; [09:14] Marcos; [09:25] Diego |
| PRD-OOS-07 | `docs/PRD.md` | Fora de Escopo | Várias instâncias em paralelo | TRANSCRICAO | [09:13] Diego |
| PRD-FR-01 | `docs/PRD.md` | Requisito Funcional | Aviso de saída a cada mudança de status | TRANSCRICAO | [09:00] Marcos; [09:02] Marcos |
| PRD-FR-02 | `docs/PRD.md` | Requisito Funcional | Cadastro com endereço e status de interesse; secret gerada pela plataforma | TRANSCRICAO | [09:31] Marcos |
| PRD-FR-03 | `docs/PRD.md` | Requisito Funcional | Editar, remover e listar; desativar e reativar (interpretação de "estado ativo") | TRANSCRICAO | [09:33] Bruno; [09:21] Bruno |
| PRD-FR-04 | `docs/PRD.md` | Requisito Funcional | Somente os status escolhidos | TRANSCRICAO | [09:33] Marcos; [09:34] Bruno |
| PRD-FR-05 | `docs/PRD.md` | Requisito Funcional | Somente https | TRANSCRICAO | [09:23] Sofia |
| PRD-FR-06 | `docs/PRD.md` | Requisito Funcional | Aviso assinado com a secret do endereço | TRANSCRICAO | [09:19] Sofia; [09:20] Sofia |
| PRD-FR-07 | `docs/PRD.md` | Requisito Funcional | Troca de secret com carência de 24h; nova troca bloqueada durante a carência (proposta) | TRANSCRICAO | [09:21] Sofia |
| PRD-FR-08 | `docs/PRD.md` | Requisito Funcional | Identificador único estável e cadastro de origem | TRANSCRICAO | [09:25] Diego; [09:44] Sofia |
| PRD-FR-09 | `docs/PRD.md` | Requisito Funcional | Dados essenciais da mudança, sem itens | TRANSCRICAO | [09:43] Diego |
| PRD-FR-10 | `docs/PRD.md` | Requisito Funcional | Resposta em até 10s; retentativas por ~15h; sucesso = 2xx (AMB-17) | TRANSCRICAO | [09:15] Diego; [09:17] Diego; [09:42] Diego |
| PRD-FR-11 | `docs/PRD.md` | Requisito Funcional | Fila de falhas com consulta (proposta) e reprocessamento por ADMIN, auditado; exceto acima de 64KB e endereço removido ou inativo | TRANSCRICAO | [09:18] Diego; [09:36] Sofia |
| PRD-FR-12 | `docs/PRD.md` | Requisito Funcional | Últimos 100 envios por endereço (AMB-24, AMB-05) | TRANSCRICAO | [09:34] Marcos |
| PRD-NFR-01 | `docs/PRD.md` | Requisito Não Funcional | Primeiro envio em menos de 10s | TRANSCRICAO | [09:02] Marcos; [09:10] Larissa |
| PRD-NFR-02 | `docs/PRD.md` | Requisito Não Funcional | Cliente nunca trava nem desfaz mudança de status | TRANSCRICAO | [09:04] Bruno |
| PRD-NFR-03 | `docs/PRD.md` | Requisito Não Funcional | Status e aviso juntos para endereço ativo e inscrito; falha no registro desfaz a mudança | TRANSCRICAO | [09:40] Bruno; [09:41] Diego |
| PRD-NFR-04 | `docs/PRD.md` | Requisito Não Funcional | Entrega ao menos uma vez (duplicatas) e ordem por pedido com uma instância; retentativas podem inverter (AMB-09) | TRANSCRICAO | [09:24] Diego; [09:25] Sofia; [09:12] Diego; [09:13] Larissa |
| PRD-NFR-05 | `docs/PRD.md` | Requisito Não Funcional | https, secret por endereço, HMAC-SHA256 | TRANSCRICAO | [09:20] Sofia; [09:21] Sofia; [09:23] Sofia |
| PRD-NFR-06 | `docs/PRD.md` | Restrição | Acima de 64KB é erro, não envio | TRANSCRICAO | [09:23] Sofia; [09:24] Larissa |
| PRD-NFR-07 | `docs/PRD.md` | Restrição | Sem infraestrutura nova; só um processo de envio novo | TRANSCRICAO | [09:07] Diego; [09:11] Diego; [09:30] Larissa |
| PRD-RISK-01 | `docs/PRD.md` | Risco | Atlas migra por atraso; estimativa baseada no escopo da reunião | TRANSCRICAO | [09:00] Marcos; [09:45] Marcos; [09:46] Larissa |
| PRD-RISK-02 | `docs/PRD.md` | Risco | Impacto no cliente: assinatura não validada, duplicatas ou rajadas sem controle de volume | TRANSCRICAO | [09:25] Sofia; [09:26] Marcos; [09:38] Diego; [09:39] Larissa |
| PRD-RISK-03 | `docs/PRD.md` | Risco | Vazamento de secret; carência para troca planejada; revogação imediata proposta | TRANSCRICAO | [09:21] Sofia; [09:22] Diego; [09:46] Sofia |
| PRD-RISK-04 | `docs/PRD.md` | Risco | Cliente sem visibilidade de falhas e sem avisos durante a desativação | TRANSCRICAO | [09:37] Larissa; [09:21] Bruno; [09:16] Diego |
| PRD-RISK-05 | `docs/PRD.md` | Risco | Permissões amplas expõem dados entre clientes; aceito "por enquanto" | TRANSCRICAO | [09:32] Larissa; [09:37] Sofia |
| PRD-AC-01 | `docs/PRD.md` | Requisito Funcional | Aviso de "enviado" com horário de envio a menos de 10s da mudança | TRANSCRICAO | [09:02] Marcos; [09:33] Marcos |
| PRD-AC-02 | `docs/PRD.md` | Requisito Funcional | Sem avisos de status não escolhidos nem de endereço desativado | TRANSCRICAO | [09:34] Bruno |
| PRD-AC-03 | `docs/PRD.md` | Requisito Não Funcional | Cliente fora por 2h recebe nas tentativas seguintes, sem intervenção | TRANSCRICAO | [09:16] Diego |
| PRD-AC-04 | `docs/PRD.md` | Requisito Não Funcional | Mudança de status conclui com cliente fora do ar ou lento | TRANSCRICAO | [09:04] Bruno |
| PRD-AC-05 | `docs/PRD.md` | Requisito Funcional | Assinatura validável; secret anterior aceita por 24h | TRANSCRICAO | [09:20] Sofia; [09:21] Sofia |
| PRD-AC-06 | `docs/PRD.md` | Requisito Funcional | Endereço sem https é recusado | TRANSCRICAO | [09:23] Sofia |
| PRD-AC-07 | `docs/PRD.md` | Requisito Funcional | Duplicata identificável e origem do cadastro visível | TRANSCRICAO | [09:25] Diego; [09:44] Sofia |
| PRD-AC-08 | `docs/PRD.md` | Requisito Funcional | Últimos 100 envios visíveis | TRANSCRICAO | [09:34] Marcos |
| PRD-AC-09 | `docs/PRD.md` | Requisito Funcional | Reprocessamento só por ADMIN, com registro de autoria | TRANSCRICAO | [09:36] Sofia |
| PRD-AC-10 | `docs/PRD.md` | Requisito Funcional | Conteúdo essencial, sem itens | TRANSCRICAO | [09:43] Diego |
| PRD-AC-11 | `docs/PRD.md` | Requisito Funcional | Intervalos crescentes; após ~15h vai para a fila de falhas | TRANSCRICAO | [09:17] Diego; [09:18] Diego |
| PRD-AC-12 | `docs/PRD.md` | Requisito Não Funcional | Falha no registro do aviso impede a mudança de status | TRANSCRICAO | [09:40] Bruno |
| PRD-AC-13 | `docs/PRD.md` | Requisito Não Funcional | Mudanças seguidas chegam em ordem no primeiro envio | TRANSCRICAO | [09:12] Diego |
| PRD-AC-14 | `docs/PRD.md` | Restrição | Acima de 64KB não é enviado e aparece como erro no histórico | TRANSCRICAO | [09:24] Larissa |
| PRD-PROB-01 | `docs/PRD.md` | Problema | Clientes só descobrem mudanças de status por polling, de forma lenta e cara; prioridade alta (avaliação do autor) | TRANSCRICAO | [09:00] Marcos |
| PRD-PROB-02 | `docs/PRD.md` | Problema | Risco de a Atlas migrar para um concorrente se a entrega atrasar; prioridade alta (avaliação do autor) | TRANSCRICAO | [09:00] Marcos; [09:45] Marcos |
| PRD-DEC-01 | `docs/PRD.md` | Decisão | Registrar o aviso junto com a mudança de status e enviar em segundo plano (ADR-001, ADR-002) | TRANSCRICAO | [09:04] Bruno; [09:06] Diego; [09:40] Bruno |
| PRD-DEC-02 | `docs/PRD.md` | Decisão | Retentar por ~15h e depois fila de falhas, com reenvio manual (ADR-003) | TRANSCRICAO | [09:16] Diego; [09:37] Larissa |
| PRD-DEC-03 | `docs/PRD.md` | Decisão | Secret por endereço; o cliente implementa a verificação (ADR-004) | TRANSCRICAO | [09:21] Sofia; [09:20] Sofia |
| PRD-DEC-04 | `docs/PRD.md` | Decisão | Entrega ao menos uma vez; o cliente descarta duplicatas (ADR-005) | TRANSCRICAO | [09:25] Diego; [09:25] Sofia |
| PRD-DEC-05 | `docs/PRD.md` | Decisão | Padrões e infraestrutura atuais, com limitações herdadas (ADR-006) | TRANSCRICAO | [09:30] Larissa |
| PRD-DEC-06 | `docs/PRD.md` | Decisão | Aviso reflete o pedido no momento da mudança; sem arquivamento nesta fase (ADR-007) | TRANSCRICAO | [09:52] Larissa; [09:08] Diego |
| PRD-DEP-01 | `docs/PRD.md` | Dependência | Produto: portal com "ao menos uma vez", integração via API e limitação de ordem (Marcos) | TRANSCRICAO | [09:26] Marcos; [09:40] Marcos; [09:13] Larissa |
| PRD-DEP-02 | `docs/PRD.md` | Dependência | Segurança: revisão de HMAC e geração de secret, pelo menos 2 dias úteis antes do deploy (Sofia) | TRANSCRICAO | [09:46] Sofia; [09:49] Sofia |
| PRD-DEP-03 | `docs/PRD.md` | Dependência | Comercial: confirmar o prazo com a Atlas e atualizar os clientes (Marcos) | TRANSCRICAO | [09:47] Marcos; [09:49] Marcos |
| PRD-DEP-04 | `docs/PRD.md` | Dependência | Engenharia: sessão de revisão técnica antes de codar (Larissa, Bruno, Diego) | TRANSCRICAO | [09:50] Larissa |
| PRD-DEP-05 | `docs/PRD.md` | Dependência | Cliente externo: https, resposta em até 10s, validação da assinatura e descarte de duplicatas | TRANSCRICAO | [09:23] Sofia; [09:42] Diego; [09:20] Sofia; [09:25] Diego |
| PRD-IMP-01 | `docs/PRD.md` | Restrição | Mesma API, com o JWT do sistema, e mesmo banco de dados | TRANSCRICAO | [09:32] Marcos; [09:07] Diego |
| PRD-IMP-02 | `docs/PRD.md` | Decisão | Único componente novo: processo de envio separado, na mesma base de código | TRANSCRICAO | [09:11] Diego; [09:30] Larissa |
| PRD-IMP-03 | `docs/PRD.md` | Restrição | Destino: endereços https dos clientes, fora da infraestrutura da plataforma | TRANSCRICAO | [09:19] Sofia; [09:23] Sofia |
| PRD-ARQ-01 | `docs/PRD.md` | Decisão | Aviso registrado com a mudança de status e enviado em segundo plano | TRANSCRICAO | [09:06] Diego; [09:40] Bruno |
| PRD-ARQ-02 | `docs/PRD.md` | Decisão | Processo de envio busca pendentes em intervalos curtos, dentro de 10s | TRANSCRICAO | [09:09] Diego; [09:10] Larissa |
| PRD-ARQ-03 | `docs/PRD.md` | Decisão | Módulo novo na API para gestão de endereços, histórico e reprocessamento | TRANSCRICAO | [09:27] Bruno |
| PRD-ARQ-04 | `docs/PRD.md` | Decisão | Banco atual com cadastros, avisos pendentes e fila de falhas | TRANSCRICAO | [09:07] Diego; [09:17] Larissa; [09:21] Bruno |
| PRD-ARQ-05 | `docs/PRD.md` | Decisão | Processo de envio novo e separado da API | TRANSCRICAO | [09:11] Diego |
| PRD-ARQ-06 | `docs/PRD.md` | Decisão | O aviso nasce na mudança de status de pedido | TRANSCRICAO | [09:40] Bruno |
| PRD-ARQ-07 | `docs/PRD.md` | Dependência | Sistemas dos clientes recebem por https e verificam a assinatura | TRANSCRICAO | [09:20] Sofia; [09:23] Sofia |
| PRD-ARQ-08 | `docs/PRD.md` | Dependência | Portal de desenvolvedor documenta a integração | TRANSCRICAO | [09:26] Marcos; [09:40] Marcos |
| PRD-NFR-08 | `docs/PRD.md` | Interpretação | Sem meta de disponibilidade na reunião (hipótese); parada do processo de envio atrasa sem perder avisos (inferência) | TRANSCRICAO | [09:06] Diego; [09:11] Diego |
| PRD-NFR-09 | `docs/PRD.md` | Restrição | Gestão de endereços para qualquer autenticado, "por enquanto"; reprocessamento só por ADMIN | TRANSCRICAO | [09:37] Sofia; [09:36] Sofia |
| PRD-NFR-10 | `docs/PRD.md` | Requisito Não Funcional | Histórico para o cliente; métricas pelos logs existentes e por consultas ao banco (proposta) | TRANSCRICAO | [09:34] Marcos; [09:29] Bruno |
| PRD-NFR-11 | `docs/PRD.md` | Requisito Não Funcional | Registro de quem fez cada reprocessamento (auditoria) | TRANSCRICAO | [09:36] Sofia |
| RFC-RISK-07 | `docs/RFC.md` | Risco | Cadastro inativo não gera evento; pendentes pausados por até 24h (proposta do FDD) | TRANSCRICAO | [09:21] Bruno; [09:16] Diego |
| PRD-OOS-08 | `docs/PRD.md` | Fora de Escopo | Outros tipos de evento além de `order.status_changed` (AMB-11) | TRANSCRICAO | [09:43] Diego |
