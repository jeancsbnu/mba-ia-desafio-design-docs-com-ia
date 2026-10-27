# ADR-006: Reuso dos padrões existentes do projeto no módulo de webhooks

- **Data:** reunião técnica de quinta-feira, 09:00–09:53
- **Decisores:** Larissa (Tech Lead), Bruno (Pedidos), Diego (Plataforma)
- **Consultados:** Sofia (Segurança)
- **Relacionados:** [ADR-001](ADR-001-outbox-no-mysql.md), [ADR-002](ADR-002-worker-separado-em-polling.md), [ADR-003](ADR-003-retry-backoff-e-dlq.md)

## Status

**Aceito.** Larissa fechou a decisão em [09:30]: "Decisão: reuso máximo do que já existe. AppError, Pino, error middleware, padrão de módulos, padrão de schemas Zod, padrão de códigos de erro. Webhook fica como módulo igual aos outros." A decisão foi repetida no resumo de [09:48].

## Contexto

O projeto já tem convenções claras e aplicadas de forma consistente ([09:27] Bruno):

| ID | Padrão existente | Onde está no código |
|---|---|---|
| `ADR-006-COD-10` | Um módulo por domínio, com controller, service, repository, routes e schemas | `src/modules/orders/order.controller.ts`, `order.service.ts`, `order.repository.ts`, `order.routes.ts`, `order.schemas.ts` (e equivalentes em `customers`, `products`, `users`) |
| `ADR-006-COD-08` | Injeção de dependência manual (repository → service → controller) e montagem das rotas sob `/api/v1` | `src/app.ts` (`buildControllers`, `buildApp`) |
| `ADR-006-COD-11` | Registro dos routers de cada domínio | `src/routes/index.ts` (`buildApiRouter`) |
| `ADR-006-COD-01` | Classe base de erro `AppError(message, statusCode, errorCode, details?)` | `src/shared/errors/app-error.ts` |
| `ADR-006-COD-02` | Erros específicos com código em caixa alta, como `InvalidStatusTransitionError` (`INVALID_STATUS_TRANSITION`, via `ConflictError`) e `InsufficientStockError` (`INSUFFICIENT_STOCK`, via `UnprocessableEntityError`) | `src/shared/errors/http-errors.ts`, re-exportados em `src/shared/errors/index.ts` |
| `ADR-006-COD-03` | Error middleware centralizado que traduz `AppError`, `ZodError` e erros do Prisma para `{ error: { code, message, details } }` | `src/middlewares/error.middleware.ts` |
| `ADR-006-COD-09` | Validação Zod por middleware (`validate({ body, query, params })`) | `src/middlewares/validate.middleware.ts` |
| `ADR-006-COD-12` | Autenticação JWT (`authenticate`) e autorização por role (`requireRole`), com roles `ADMIN` e `OPERATOR` | `src/middlewares/auth.middleware.ts` |
| `ADR-006-COD-04` | `requireRole('ADMIN')` já aplicado em rota | `src/modules/users/user.routes.ts` |
| `ADR-006-COD-05` | Logger Pino singleton, com `redact` de senhas e tokens | `src/shared/logger/index.ts` |
| `ADR-006-COD-06` | Fábrica do PrismaClient (`createPrismaClient`) | `src/config/database.ts` |
| `ADR-006-COD-07` | Ids UUID (`@db.Char(36)`) e tabelas em snake_case via `@@map` | `prisma/schema.prisma` |
| `ADR-006-COD-13` | Transação interativa `this.prisma.$transaction(async (tx) => …)` em `changeStatus` | `src/modules/orders/order.service.ts` |

O time é pequeno e não quer infraestrutura nem convenções novas ([09:07] Diego; [09:29] Bruno: "Não vamos botar nada novo"). A feature precisa mexer no código de pedidos num ponto sensível, a transação de mudança de status ([09:40] Bruno).

## Fatores de decisão

- **Convenções consolidadas:** cada domínio já é um módulo com controller, service, repository, routes e schemas ([09:27] Bruno).
- **Nada novo:** o time é pequeno e não quer infraestrutura nem convenções novas ([09:07] Diego, [09:29] Bruno).
- **Erros já padronizados:** o projeto tem `AppError` com códigos em caixa alta, e o error middleware já trata `AppError`, Zod e Prisma ([09:28] Bruno, [09:29] Bruno).
- **Ponto sensível em pedidos:** a feature precisa mexer na transação de mudança de status ([09:40] Bruno).
- **Worker em outro processo:** o PrismaClient é por processo, e o worker roda fora da API ([09:30] Bruno).
- **Padrão de ids:** o projeto usa UUID em tudo ([09:51] Larissa).

## Decisão

O módulo de webhooks segue os padrões do projeto ([09:30] Larissa). A decisão se desdobra em sete pontos.

### 1. Estrutura `ADR-006-DEC-01`

- Pasta `src/modules/webhooks/` (nova), com a mesma divisão dos outros módulos: `webhook.controller.ts`, `webhook.service.ts`, `webhook.repository.ts`, `webhook.routes.ts` e `webhook.schemas.ts` ([09:27] Bruno).
- O módulo é registrado em `src/app.ts` e `src/routes/index.ts`, como os demais.

### 2. Erros `ADR-006-DEC-02`

- Todo erro novo do módulo é um `AppError` cujo `errorCode` tem o **prefixo `WEBHOOK_`**, como `WEBHOOK_NOT_FOUND` ([09:28] Bruno, [09:29] Larissa). `WEBHOOK_INVALID_URL`, também citado como exemplo na reunião, é absorvido pelo `VALIDATION_ERROR` existente no FDD §7 (*interpretação, AMB-26*).
- As novas classes reutilizam as classes de `src/shared/errors/http-errors.ts` que aceitam código customizado: `BadRequestError` (400), `ConflictError` (409) e `UnprocessableEntityError` (422). É o mesmo caminho usado por `InvalidStatusTransitionError` e `InsufficientStockError`.
- Para os casos sem classe que aceite código, a nova classe estende `AppError` diretamente. O principal é o 404: `NotFoundError` fixa o código `NOT_FOUND`.
- O `src/middlewares/error.middleware.ts` não muda, porque já serializa qualquer `AppError` ([09:29] Bruno).

### 3. Validação

- Os schemas Zod de `webhook.schemas.ts` são aplicados com o `validate` existente.
- Exemplo de regra que vai nesse schema: a exigência de https citada por Sofia ([09:23] Sofia).

### 4. Autorização `ADR-006-DEC-06`

- O CRUD de configuração usa `authenticate` e fica aberto a qualquer role autenticada "por enquanto" ([09:37] Sofia).
- O replay da DLQ usa `requireRole('ADMIN')` ([09:36] Larissa).

### 5. Logs `ADR-006-DEC-03`

- O logger Pino de `src/shared/logger/index.ts` é usado na API e no worker.
- Nenhuma biblioteca de log nova ([09:29] Bruno).

### 6. Integração com pedidos `ADR-006-DEC-04`

- A integração acontece por uma **nova** função, `publishWebhookEvent(tx, order, fromStatus, toStatus)`, exportada pelo módulo de webhooks.
- A função recebe o `tx` (`Prisma.TransactionClient`) da transação corrente.
- Ela é chamada por `changeStatus`, em `src/modules/orders/order.service.ts`, depois da gravação em `order_status_history` ([09:41] Bruno, [09:41] Diego).
- O `OrderService` **não** recebe um repository de webhooks injetado.

### 7. Banco

- As novas tabelas seguem `prisma/schema.prisma`: ids UUID ([09:51] Larissa) e nomes de tabela em snake_case com `@@map`. `ADR-006-DEC-07`
- O worker é outro processo, então cria a **sua própria instância** de PrismaClient com a mesma `DATABASE_URL` ([09:30] Bruno), reaproveitando a fábrica de `src/config/database.ts`. `ADR-006-DEC-05`

## Alternativas Consideradas

### ADR-006-ALT-01: Injetar um repository de webhooks inteiro no `OrderService`

Bruno citou a opção em [09:41].

**Motivo do descarte (reunião):** a dependência só precisa de uma operação, enfileirar o evento dentro da transação. Uma função que recebe o `tx` resolve isso ("Não precisa injetar repository inteiro", [09:41] Diego).

**Argumento adicional (do autor):** isso também evita mudar o construtor de `OrderService` e a montagem dele em `src/app.ts`.

### ADR-006-ALT-02: Compartilhar o mesmo PrismaClient entre API e worker

Diego levantou a dúvida em [09:29]. Antes disso, Bruno tinha dito em [09:11] que o worker usaria "o mesmo Prisma client".

**Motivo do descarte (reunião):** "PrismaClient é por processo". Como o worker é outro processo Node, ele precisa de uma instância nova, apontando para o mesmo banco ([09:30] Bruno).

### ADR-006-ALT-03: Id auto-incremental nas tabelas de webhook

Diego perguntou em [09:51].

**Motivo do descarte (reunião):** "Tudo é uuid" no projeto ([09:51] Larissa), como mostra `prisma/schema.prisma`.

## Prós e contras das opções

### Reuso dos padrões existentes (escolhida)

- Pró: quem conhece um módulo navega no de webhooks sem esforço, e a revisão fica mais simples.
- Pró: os erros novos saem no formato padrão sem mexer no error middleware ([09:29] Bruno), e não há dependências novas.
- Contra: pedidos passa a depender de webhooks, e `NotFoundError` não aceita código customizado.
- Contra: o worker não tem error middleware, o `redact` não cobre a secret e a autorização não tem escopo por customer ([09:32] Larissa, [09:37] Sofia).

### Repository injetado (ADR-006-ALT-01)

- Contra: a dependência só precisa enfileirar o evento, e "Não precisa injetar repository inteiro" ([09:41] Diego).
- Contra: obrigaria a "passar um repository do webhook pro OrderService" ([09:41] Bruno), mudando o construtor e a montagem dele em `src/app.ts` (argumento do autor).

### PrismaClient compartilhado (ADR-006-ALT-02)

- Contra: "PrismaClient é por processo" ([09:30] Bruno).
- Contra: o worker é outro processo Node e precisaria de instância própria de qualquer forma ([09:30] Bruno).

### Id auto-incremental (ADR-006-ALT-03)

- Contra: no projeto, "Tudo é uuid" ([09:51] Larissa).
- Contra: as tabelas novas destoariam de `prisma/schema.prisma`, onde os ids são UUID (`@db.Char(36)`).

## Consequências

### Positivas

- **Nada novo a aprender.** Quem conhece um módulo do projeto navega no de webhooks sem esforço, e a revisão de código fica mais simples.
- **Erros no formato padrão sem mexer no middleware.** Os novos erros chegam ao cliente da API como os demais, sem alteração no error middleware.
- **Acoplamento mínimo em pedidos.** A mudança em `order.service.ts` se resume a uma chamada de função dentro da transação, mais o repasse opcional de um id de correlação proposto no FDD (FDD-INT-01/02).
- **Sem dependências novas.** Log, validação e autorização usam o que já existe.

### Negativas

- **Pedidos passa a depender de webhooks.** `order.service.ts` importa de `src/modules/webhooks/`.
- **`NotFoundError` não aceita código.** `ADR-006-CON-02`
  - A hierarquia de erros não é uniforme: `NotFoundError` fixa `NOT_FOUND` e não aceita código customizado (`src/shared/errors/http-errors.ts`).
  - Por isso, `WEBHOOK_NOT_FOUND` exige estender `AppError` diretamente, com o status 404 repetido na nova classe.
  - Alterar `NotFoundError` para aceitar código seria uma mudança em código compartilhado, a decidir na implementação.
- **O worker não tem error middleware.** O middleware só age em requisições HTTP. O worker reaproveita as classes de erro, mas precisa de tratamento e log próprios por evento (AMB-20).
- **O logger não esconde a secret.** O `redact` atual de `src/shared/logger/index.ts` cobre senhas e tokens, mas **não** a secret dos webhooks. É preciso ampliá-lo para que a secret não vaze em log. O assunto é relevante, dado o histórico de vazamento citado em [09:22] Diego.
- **A autorização não tem escopo por cliente.** O modelo existente (`ADMIN`/`OPERATOR` em `src/middlewares/auth.middleware.ts`) não restringe por customer. Somado ao `customerId` vir no body ou no path ([09:32] Larissa), isso permite que qualquer usuário autenticado gerencie webhooks de qualquer customer. O endurecimento ficou para depois ([09:37] Sofia). `ADR-006-CON-01`

### Trade-off

Aceitamos uma dependência direta de pedidos para webhooks, uma pequena irregularidade na hierarquia de erros e as limitações do modelo de autorização atual. Em troca, o módulo fica consistente com o resto do código, sem dependências novas e com a menor alteração possível no fluxo crítico de mudança de status.

## Referências

- Transcrição:
  - [09:07] Diego: time pequeno.
  - [09:11] Bruno: "mesmo Prisma client", depois corrigido.
  - [09:23] Sofia: https via Zod.
  - [09:27] Bruno: padrão de módulos.
  - [09:28] Bruno: erros e códigos.
  - [09:29] Larissa: prefixo `WEBHOOK_`.
  - [09:29] Bruno: Pino e error middleware.
  - [09:29] Diego e [09:30] Bruno: PrismaClient separado.
  - [09:30] Larissa: decisão.
  - [09:32] Larissa: `customer_id` fora do JWT.
  - [09:36] Larissa: `requireRole`.
  - [09:37] Sofia: CRUD aberto por enquanto.
  - [09:41] Bruno e [09:41] Diego: `publishWebhookEvent`.
  - [09:51] Diego e [09:51] Larissa: UUID.
  - [09:48] Larissa: resumo.
- Código: arquivos listados na tabela de Contexto.
- Ponto exato de cada integração, arquivo por arquivo: [FDD, seção "Integração com o sistema existente"](../FDD.md).
