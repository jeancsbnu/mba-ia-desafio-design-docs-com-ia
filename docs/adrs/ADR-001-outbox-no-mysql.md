# ADR-001: Padrão Outbox no MySQL para eventos de webhook

- **Data:** reunião técnica de quinta-feira, 09:00–09:53 (a transcrição não informa o dia do mês)
- **Decisores:** Larissa (Tech Lead), Diego (Plataforma), Bruno (Pedidos)
- **Presentes, sem se posicionar sobre este ponto:** Marcos (PM), Sofia (Segurança)
- **Relacionados:** [ADR-002](ADR-002-worker-separado-em-polling.md), [ADR-003](ADR-003-retry-backoff-e-dlq.md), [ADR-005](ADR-005-at-least-once-com-x-event-id.md), [ADR-006](ADR-006-reuso-dos-padroes-do-projeto.md), [ADR-007](ADR-007-payload-snapshot-na-insercao.md)

## Status

**Aceito.** Larissa fechou a decisão em [09:08] ("Tá decidido então: outbox em MySQL") e a confirmou no resumo final de [09:48].

## Contexto

Clientes B2B querem ser notificados quando o status de seus pedidos muda, em menos de 10 segundos ([09:00] Marcos, [09:02] Marcos). O problema de negócio está no [PRD](../PRD.md).

A mudança de status acontece em `OrderService.changeStatus`, no arquivo `src/modules/orders/order.service.ts`. É uma transação interativa do Prisma (`this.prisma.$transaction(async (tx) => …)`) que já faz bastante coisa ([09:04] Bruno):

- valida a transição;
- debita ou repõe estoque;
- atualiza `orders`;
- grava `order_status_history`.

A notificação tem de nascer desse ponto e precisa atender a duas exigências opostas:

1. **Consistência:** se o status mudou, o evento precisa existir; se a transação deu rollback, o evento não pode existir ([09:06] Diego).
2. **Isolamento:** a mudança de status não pode depender da disponibilidade nem da velocidade do cliente. Desfazer uma mudança de status porque o sistema do cliente está fora do ar não é aceitável ([09:04] Bruno).

Há também uma restrição do time: ele é pequeno, não quer subir infraestrutura nova e o banco disponível é o MySQL já existente ([09:07] Diego).

## Decisão

1. **Padrão adotado.** É o **Transactional Outbox no MySQL existente**. Dentro da transação do `changeStatus`, a mesma transação SQL que atualiza `orders` e `order_status_history`, o evento é gravado na tabela `webhook_outbox` ([09:06] Diego).
2. **Falha na gravação desfaz tudo.** Se a gravação na outbox falhar, a transação inteira é desfeita, porque não pode haver mudança de status sem evento ([09:40] Bruno, [09:41] Diego). `ADR-001-DEC-01`
3. **Filtro na inserção.** Só se gravam eventos para os webhooks do customer que estão inscritos naquele status. Se nenhum webhook quer o status, nada é inserido ([09:34] Bruno, [09:34] Diego). `ADR-001-DEC-02`
   - *Interpretação adotada (AMB-04):* grava-se uma linha por webhook inscrito, para que cada cadastro tenha o seu próprio ciclo de tentativas.
4. **Indexação.** A outbox tem índice no status do evento e na data de criação, para que a leitura dos pendentes continue barata com a tabela crescendo ([09:08] Diego). `ADR-001-DEC-03`
5. **Leitura e envio ficam fora da transação.** Quem faz isso é um worker separado ([ADR-002](ADR-002-worker-separado-em-polling.md)).

O modelo da tabela, os valores de status e o ponto exato da chamada no código estão no [FDD](../FDD.md).

## Alternativas Consideradas

### ADR-001-ALT-01: Disparar o webhook de forma síncrona dentro do `changeStatus`

Foi a primeira opção posta na mesa ([09:03] Larissa). Bruno e Diego a rejeitaram ([09:04] Bruno, [09:06] Diego: "Síncrono está fora de questão"), com a concordância de Larissa ([09:04] Larissa).

**Motivo do descarte (reunião):** uma chamada HTTP dentro da transação faria qualquer cliente lento travar a mudança de status de outros pedidos. Se o cliente estivesse fora do ar, só restariam duas saídas: desfazer a mudança de status, o que é inaceitável, ou perder o evento ([09:04] Bruno).

### ADR-001-ALT-02: Fila externa (Redis Streams ou similar)

Larissa citou essa opção em [09:07].

**Motivo do descarte (reunião):** seria preciso subir e operar mais infraestrutura. Para um time pequeno, montar um Redis Cluster só para isso seria overengineering ([09:07] Larissa, [09:07] Diego).

**Argumento adicional (do autor, não discutido na reunião):** publicar numa fila externa fica fora da transação MySQL. Isso exigiria um mecanismo a mais para que evento e mudança de status fossem confirmados juntos (o problema do *dual write*), coisa que a outbox resolve por construção.

### ADR-001-ALT-03: Gravar todos os eventos e filtrar por status na hora do envio

Diego levantou a dúvida em [09:34]. Bruno respondeu que o filtro fica na inserção e Diego concordou.

**Motivo do descarte (reunião):** filtrar na inserção economiza linhas na tabela, porque eventos que nenhum webhook quer nunca são gravados ([09:34] Bruno).

## Consequências

### Positivas

- **Atomicidade.** Evento e mudança de status são confirmados ou desfeitos juntos. Não existe evento órfão nem evento perdido ([09:06] Diego, [09:41] Diego).
- **Isolamento.** A disponibilidade e a latência do cliente deixam de afetar a mudança de status ([09:04] Bruno).
- **Nenhuma infraestrutura nova.** A solução usa o MySQL e o Prisma que já existem ([09:07] Diego).
- **Estado consultável.** Cada evento tem seu estado registrado em tabela, consultável com SQL comum. O histórico detalhado de tentativas fica numa tabela própria, proposta no FDD (AMB-05).

### Negativas

- **A transação fica mais pesada.** A transação de `changeStatus`, que Bruno já descreve como "pesada" ([09:04] Bruno), passa a fazer também a consulta dos webhooks inscritos e uma escrita por webhook inscrito.
- **A tabela cresce sem limpeza.** O arquivamento das linhas entregues ficou fora do escopo desta feature ([09:08] Diego). A preocupação de Bruno com performance ([09:07] Bruno) é mitigada pelos índices, mas não eliminada. `ADR-001-CON-01`
- **A latência mínima passa a depender do worker.** Como o envio é assíncrono, o atraso vem do intervalo do worker ([ADR-002](ADR-002-worker-separado-em-polling.md)).
- **Mudanças de cadastro não retroagem.** Como o filtro é aplicado na inserção, alterar os status de interesse de um webhook só afeta eventos futuros. Pelo mesmo motivo, um webhook criado depois de uma mudança de status não recebe esse evento. É consequência direta de [09:34] Bruno.

### Trade-off

Aceitamos uma transação de status um pouco mais pesada e uma tabela que cresce sem arquivamento. Em troca, temos consistência garantida entre status e evento, sem subir nenhuma infraestrutura.

## Referências

- Falas da reunião:
  - [09:03] Larissa: o problema;
  - [09:04] Bruno e [09:04] Larissa: contra o disparo síncrono;
  - [09:06] Diego: definição do outbox;
  - [09:07] Larissa e [09:07] Diego: Redis descartado;
  - [09:07] Bruno: performance;
  - [09:08] Diego: índices e arquivamento;
  - [09:08] Larissa: decisão;
  - [09:34] Bruno e [09:34] Diego: filtro na inserção;
  - [09:40] Bruno e [09:41] Diego: mesma transação e rollback;
  - [09:48] Larissa: resumo.
- Código: `src/modules/orders/order.service.ts` (`changeStatus`). `ADR-001-COD-01`
