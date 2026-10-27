# ADR-007: Payload do evento renderizado e gravado (snapshot) no momento da inserção na outbox

- **Data:** reunião técnica de quinta-feira, 09:00–09:53. Decidido depois do resumo final, entre 09:51 e 09:52.
- **Decisores:** Larissa (Tech Lead), Diego (Plataforma), Bruno (Pedidos)
- **Não presentes na decisão:** Marcos (PM) e Sofia (Segurança). As saídas dos dois estão registradas às 09:50, antes desta discussão.
- **Relacionados:** [ADR-001](ADR-001-outbox-no-mysql.md), [ADR-004](ADR-004-hmac-sha256-secret-por-endpoint.md), [ADR-005](ADR-005-at-least-once-com-x-event-id.md)

## Status

**Aceito.** A decisão foi fechada por Bruno em [09:52] ("Beleza, snapshot. Decidido."), depois da preferência de Larissa ([09:52] Larissa) e da concordância de Diego ([09:52] Diego).

## Contexto

Entre a mudança de status e a entrega ao cliente podem passar desde ~2 segundos ([ADR-002](ADR-002-worker-separado-em-polling.md)) até ~15 horas, quando há retentativas ([ADR-003](ADR-003-retry-backoff-e-dlq.md)). Se houver replay manual da DLQ, o intervalo é ainda maior. Bruno perguntou se a outbox deve guardar o payload pronto ou só o `order_id`, para montar o payload na hora do envio ([09:51] Bruno).

O que pode mudar no pedido nesse intervalo, segundo o código atual:

- **O status.** Depois de criado, o pedido só é alterado por mudança de status. As rotas de `src/modules/orders/order.routes.ts` são listagem, consulta, criação, `PATCH /:id/status` e remoção. `ADR-007-COD-02`
- **A existência do pedido.** O pedido pode ser **removido**: `delete` em `src/modules/orders/order.service.ts` permite apagar pedidos nos status `PENDING` ou `CANCELLED`.
  - Um evento de cancelamento ainda aguardando entrega ou retentativa pode, portanto, perder o pedido que o originou.

O payload definido na reunião é enxuto e não inclui os itens ([09:43] Diego, [09:44] Bruno). Todos os campos citados já estão disponíveis dentro da transação de `changeStatus`, que carrega o pedido antes de alterá-lo. O modelo `Order` de `prisma/schema.prisma` tem `orderNumber`, `customerId` e `totalCents`. `ADR-007-COD-01` O esquema completo do payload está no [FDD](../FDD.md).

## Fatores de decisão

- **Intervalo longo até o envio:** entre a mudança de status e a entrega podem passar de ~2s a ~15h, e mais ainda com replay da DLQ ([09:09] Diego, [09:17] Diego, [09:18] Diego).
- **Pedido mutável:** o evento precisa refletir o estado de quando o status mudou ([09:52] Larissa), e o pedido ainda pode mudar de status ou ser removido (`delete` em `src/modules/orders/order.service.ts`).
- **Payload enxuto:** o payload não inclui os itens, e todos os seus campos já estão disponíveis na transação de `changeStatus` ([09:43] Diego, [09:44] Bruno).
- **Secret rotacionável:** a secret pode ser trocada antes do envio, com 24h de carência para a antiga ([09:21] Sofia).

## Decisão

1. **Renderizar na inserção.** O payload JSON completo é montado **no momento da inserção na outbox**, dentro da mesma transação da mudança de status, e gravado na linha do evento ([09:52] Larissa, [09:52] Diego).
2. **Enviar o corpo gravado.** O worker envia exatamente o corpo gravado, sem consultar o pedido de novo. Retentativas e replay reutilizam esse mesmo corpo. *Interpretação adotada (AMB-19).* `ADR-007-DEC-01`
3. **Assinar no envio.** *Interpretação adotada (AMB-25):* a assinatura HMAC ([ADR-004](ADR-004-hmac-sha256-secret-por-endpoint.md)) é calculada **no envio**, sobre os bytes gravados, com a(s) secret(s) válida(s) naquele momento. `ADR-007-DEC-02`
   - A reunião não definiu quando a assinatura é calculada. A escolha segue de dois fatos:
     - o corpo é congelado na inserção, mas a secret pode ser rotacionada antes do envio;
     - durante a carência de 24h valem duas assinaturas (AMB-15).

## Alternativas Consideradas

### ADR-007-ALT-01: Guardar só o `order_id` e renderizar o payload na hora do envio

Proposta por Bruno como alternativa em [09:51].

**Motivo do descarte (reunião):** "Se o pedido mudar depois, o evento ainda reflete o estado de quando o status mudou. Senão tem caso esquisito" ([09:52] Larissa).

**Exemplos concretos do "caso esquisito"** (argumento do autor, ancorado no código):

- Um evento `PAID → PROCESSING` retentado horas depois leria o pedido já em `SHIPPED`. O payload ficaria incoerente com o próprio par `from_status`/`to_status`.
- Um evento `PAID → CANCELLED` em retentativa não teria o que renderizar se o pedido fosse apagado nesse intervalo, algo que `delete` permite para pedidos `CANCELLED`.
- O mesmo `event_id` ([ADR-005](ADR-005-at-least-once-com-x-event-id.md)) poderia chegar com corpos diferentes em tentativas diferentes.

## Prós e contras das opções

### Snapshot na inserção (escolhida)

- Pró: cada evento descreve o pedido no instante em que o status mudou ([09:52] Larissa).
- Pró: retentativas e replay entregam bytes idênticos, e o worker não consulta `orders` no envio.
- Contra: os dados do pedido ficam em repouso na outbox e na DLQ, sem arquivamento nesta feature ([09:08] Diego).
- Contra: ocupa mais espaço em disco e congela o formato de cada evento já gravado.

### Renderizar no envio (ADR-007-ALT-01)

- Pró: a outbox guardaria só o `order_id` ([09:51] Bruno), sem duplicar dados do pedido.
- Contra: se o pedido mudar depois, o evento deixa de refletir o estado de quando o status mudou ([09:52] Larissa).
- Contra: uma retentativa poderia ler o pedido já em outro status, ou nem encontrá-lo se ele tiver sido apagado (argumento do autor).
- Contra: o mesmo `event_id` poderia chegar com corpos diferentes em tentativas diferentes (argumento do autor).

## Consequências

### Positivas

- **Fidelidade ao momento da transição.** Cada evento descreve o pedido no instante em que o status mudou ([09:52] Larissa).
- **Corpo imutável.** Retentativas e replay entregam bytes idênticos, o que é coerente com a deduplicação por `event_id`.
- **Worker desacoplado de pedidos.** O worker não consulta `orders` no envio, e a entrega funciona mesmo que o pedido tenha sido removido depois.
- **Evidência precisa.** A DLQ guarda exatamente o que se tentou enviar ([09:18] Diego).

### Negativas

- **Dados do pedido em repouso por tempo indeterminado.** Os dados do pedido ficam duplicados na outbox e na DLQ, e não há arquivamento nesta feature ([09:08] Diego). `ADR-007-CON-01`
  - Esse ponto foi decidido depois da saída de Sofia.
  - O escopo declarado por Sofia para a revisão de segurança foi "HMAC e geração de secret" ([09:46] Sofia).
  - **Recomenda-se** incluir o snapshot nessa revisão. A reunião não pautou isso.
- **Mais espaço em disco.** Cada linha da outbox guarda o JSON completo, e não só uma referência.
- **Formato congelado por evento.** Uma mudança de formato do payload só vale para eventos novos. Os já gravados saem no formato antigo.
- **A outbox não pode depender da existência do pedido.** Se a linha da outbox tivesse chave estrangeira com remoção em cascata para `orders`, como `order_status_history` tem em `prisma/schema.prisma`, apagar o pedido apagaria o evento pendente. A modelagem precisa evitar isso. Detalhe no [FDD](../FDD.md).

### Trade-off

Aceitamos guardar dados do pedido duplicados e congelar o formato de cada evento já gravado. Em troca, cada evento é fiel ao momento da transição, idêntico em toda reentrega e independente de mudanças posteriores no pedido.

## Referências

- Transcrição:
  - [09:08] Diego: arquivamento fora de escopo
  - [09:18] Diego: DLQ como evidência
  - [09:43] Diego: campos do payload
  - [09:44] Bruno: payload enxuto
  - [09:46] Sofia: escopo da revisão de segurança
  - [09:51] Bruno: a pergunta
  - [09:52] Larissa: snapshot e motivo
  - [09:52] Diego: concordância
  - [09:52] Bruno: decisão
- Código:
  - `src/modules/orders/order.service.ts` (`changeStatus`, `delete`)
  - `src/modules/orders/order.routes.ts` (operações sobre pedidos)
  - `prisma/schema.prisma` (campos de `Order`; cascata em `OrderStatusHistory`)
- Esquema completo do payload e exemplos: [FDD](../FDD.md)
