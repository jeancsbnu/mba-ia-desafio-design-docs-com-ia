# Architectural Decision Records

Este diretório guarda os ADRs do Sistema de Webhooks de Notificação de Pedidos. Cada arquivo registra **uma** decisão arquitetural fechada na reunião técnica (`TRANSCRICAO.md`), com contexto, alternativas descartadas e consequências.

## Índice

| ADR | Decisão | Status | Fechada em |
|---|---|---|---|
| [ADR-001](ADR-001-outbox-no-mysql.md) | Padrão outbox no MySQL, na mesma transação do `changeStatus` | Aceito | [09:08] Larissa |
| [ADR-002](ADR-002-worker-separado-em-polling.md) | Worker em processo separado, polling de 2s, instância única | Aceito | [09:10] Larissa |
| [ADR-003](ADR-003-retry-backoff-e-dlq.md) | Retry com backoff 1m/5m/30m/2h/12h e DLQ em `webhook_dead_letter` com replay ADMIN | Aceito | [09:17] Larissa |
| [ADR-004](ADR-004-hmac-sha256-secret-por-endpoint.md) | HMAC-SHA256 com secret por endpoint e rotação com carência de 24h | Aceito | [09:22] Sofia |
| [ADR-005](ADR-005-at-least-once-com-x-event-id.md) | Entrega at-least-once com deduplicação pelo cliente via `X-Event-Id` | Aceito | [09:26] Larissa |
| [ADR-006](ADR-006-reuso-dos-padroes-do-projeto.md) | Reuso dos padrões do projeto (módulo, `AppError`, `WEBHOOK_*`, Pino, `requireRole`, `publishWebhookEvent(tx, …)`) | Aceito | [09:30] Larissa |
| [ADR-007](ADR-007-payload-snapshot-na-insercao.md) | Payload renderizado (snapshot) na inserção da outbox | Aceito | [09:52] Bruno |

## Convenções

- **Nome do arquivo:** `ADR-NNN-titulo-em-kebab-case.md`, numerado em sequência.
- **Formato:** variante do MADR em português, alinhada ao formato do plugin `adrs-management` usado no curso, com as seções:
  - Status
  - Contexto
  - Fatores de decisão (o que pesou na escolha, com a fala de origem)
  - Decisão
  - Alternativas Consideradas (cada uma com o rótulo `ADR-NNN-ALT-NN` e o motivo do descarte)
  - Prós e contras das opções (da opção escolhida e de cada alternativa)
  - Consequências (Positivas, Negativas e Trade-off)
  - Referências
- **Rastreabilidade:** toda afirmação cita a fala de origem no formato `[hh:mm] Nome` ou o caminho do arquivo no código. As linhas correspondentes estão em [`docs/TRACKER.md`](../TRACKER.md).
- **Interpretações:** quando a reunião não fechou um detalhe, o ADR diz "interpretação adotada (AMB-xx)" e aponta para [`docs/processo/inventario.md`](../processo/inventario.md#8-ambiguidades-e-interpretações-adotadas).
- **Altura:** o ADR explica **por que** a decisão foi tomada assim. O **como construir** (contratos, modelo de dados, algoritmos) fica no [FDD](../FDD.md). A proposta consolidada para revisão do time fica no [RFC](../RFC.md).

## Decisões que não viraram ADR

Estas decisões ficaram registradas como requisitos ou detalhes de implementação, e não como ADR. Em alguns casos a própria reunião disse que não eram arquiteturais.

| Decisão | Por que não virou ADR | Fonte |
|---|---|---|
| URL obrigatoriamente https | "nem é decisão arquitetural, é só uma validação no schema Zod" | [09:23] Sofia |
| Limite de payload de 64KB | "não vejo como decisão arquitetural separada, é só requisito não funcional" | [09:24] Larissa |
| Timeout HTTP de 10s | Parâmetro de resiliência, detalhado no FDD | [09:42] Diego |
| Headers de envio e formato do payload | Contrato público, detalhado no FDD | [09:43] Diego, [09:44] Diego, [09:44] Sofia |
| Filtro de status aplicado na inserção | Parte da decisão do outbox ([ADR-001](ADR-001-outbox-no-mysql.md)) | [09:34] Bruno |
