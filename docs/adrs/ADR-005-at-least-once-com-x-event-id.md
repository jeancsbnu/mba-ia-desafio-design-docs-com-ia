# ADR-005: Garantia de entrega at-least-once com deduplicação pelo cliente via `X-Event-Id`

- **Data:** reunião técnica de quinta-feira, 09:00–09:53
- **Decisores:** Diego (Plataforma), Larissa (Tech Lead)
- **Consultados:** Bruno (Pedidos), Sofia (Segurança), Marcos (PM)
- **Relacionados:** [ADR-001](ADR-001-outbox-no-mysql.md), [ADR-003](ADR-003-retry-backoff-e-dlq.md), [ADR-007](ADR-007-payload-snapshot-na-insercao.md)

## Status

**Aceito.** Larissa fechou a decisão em [09:26] ("At-least-once com X-Event-Id pra dedup do lado do cliente. Decisão.") e a repetiu no resumo de [09:48].

## Contexto

A política de retentativa ([ADR-003](ADR-003-retry-backoff-e-dlq.md)) conta como falha o cliente que não responde em 10 segundos ([09:42] Diego). Disso decorre uma situação inevitável: se o cliente recebeu e processou o evento, mas a resposta não chegou ao worker dentro do prazo, o worker não consegue distinguir isso de uma falha real. Ele então retenta.

Logo, a plataforma precisa assumir e comunicar uma semântica de entrega. As opções são:

| Semântica | O que pode acontecer |
|---|---|
| At-most-once | pode perder eventos |
| At-least-once | pode duplicar eventos |
| Exactly-once | nem perde, nem duplica |

Na reunião, Bruno perguntou como o cliente reconheceria um mesmo evento recebido duas vezes ([09:25] Bruno).

## Decisão

1. **Semântica at-least-once.** A plataforma garante entrega **at-least-once**: o cliente pode receber o mesmo evento mais de uma vez e "tem que estar preparado" ([09:24] Diego).
2. **Identificador do evento.** Cada evento leva no header **`X-Event-Id`** um UUID gerado quando o evento entra na outbox, "único por evento", e o cliente deduplica por ele ([09:25] Diego).
   - *Interpretação adotada (AMB-23):* o mesmo valor aparece no campo `event_id` do payload ([09:43] Diego).
   - *Interpretação adotada (AMB-04):* há uma linha de outbox por webhook inscrito ([ADR-001](ADR-001-outbox-no-mysql.md)), e cada linha recebe o seu `eventId` na inserção. `ADR-005-DEC-01`
   - *Interpretação adotada (AMB-19):* o `eventId` é reutilizado sem alteração em todas as retentativas **e** no replay manual da DLQ ([ADR-003](ADR-003-retry-backoff-e-dlq.md)). A reunião não detalhou o replay além de "recoloca na outbox como pendente" ([09:18] Diego). A reutilização é adotada porque, sem ela, a deduplicação do cliente deixaria de funcionar justamente nas reentregas.
3. **Comunicação ao cliente.** A semântica será documentada em destaque no portal de desenvolvedor ([09:26] Marcos). `ADR-005-DEC-02`
4. **Terminologia.** O resumo da reunião fala em "Idempotência por X-Event-Id" ([09:48] Larissa), mas a decisão registrada é entrega at-least-once com deduplicação **feita pelo cliente** ([09:25] Diego, [09:25] Sofia). Por isso, nenhum documento deve afirmar que a plataforma é idempotente (AMB-16). `ADR-005-DEC-03`

## Alternativas Consideradas

### ADR-005-ALT-01: Garantia exactly-once

**Motivo do descarte (reunião):** exigiria "coordenação dos dois lados" e "fica muito mais complexo" ([09:25] Diego).

Diego também afirmou que at-least-once com `event_id` "resolve 99% dos casos" e que "Stripe faz assim, GitHub faz assim". Essas afirmações são de Diego e não foram verificadas neste documento ([09:25] Diego).

### ADR-005-ALT-02: At-most-once (enviar uma vez, sem retentar)

*Alternativa de referência, não discutida na reunião.* Está registrada para deixar explícito o outro extremo do espectro de semânticas.

**Por que não se aplica:** eliminaria as duplicatas ao custo de perder o evento sempre que o cliente estivesse indisponível. Isso contradiz a política de retentativa decidida para cobrir indisponibilidades de horas ([09:15] Diego, [09:16] Diego).

## Consequências

### Positivas

- **Simplicidade do lado da plataforma.** O worker só precisa retentar o que não recebeu resposta 2xx a tempo, sem coordenar nada com o cliente.
- **Robustez.** Nenhuma falha transitória causa perda de evento dentro da janela de retentativas ([ADR-003](ADR-003-retry-backoff-e-dlq.md)).
- **Deduplicação barata.** Basta ao cliente um identificador único por entrega, sem precisar comparar conteúdo.

### Negativas

- **A responsabilidade passa para o cliente.** Sofia apontou isso diretamente: "Isso joga responsabilidade pro cliente" ([09:25] Sofia). Um cliente que não deduplica pode processar o mesmo evento duas vezes. `ADR-005-CON-01`
- **O cliente precisa reter os `event_id` por bastante tempo.** Para deduplicar com segurança, o cliente tem de lembrar os `event_id` recebidos pelo menos durante a janela de retentativas, de cerca de 15h ([09:17] Diego). Se houver replay manual, esse prazo fica indefinido. `ADR-005-CON-02`
- **Depende de documentação.** A semântica só funciona se for bem comunicada aos clientes ([09:26] Marcos).
- **O `eventId` não pode mudar.** Isso decorre da interpretação adotada: o `eventId` precisa ser gerado uma única vez e persistido na inserção. Nenhuma reentrega pode gerar um id novo.

### Trade-off

Aceitamos que o cliente receba duplicatas e tenha de guardar os ids já recebidos para deduplicar. Em troca, a entrega fica simples e robusta, sem coordenação entre as duas partes.

## Referências

- Transcrição:
  - [09:15] Diego e [09:16] Diego: política de retentativa
  - [09:17] Diego: janela de ~15h
  - [09:18] Diego: replay
  - [09:24] Diego: at-least-once
  - [09:25] Bruno: como diferenciar eventos
  - [09:25] Diego: `X-Event-Id` e descarte do exactly-once
  - [09:25] Sofia: responsabilidade do cliente
  - [09:26] Marcos: portal
  - [09:26] Larissa: decisão
  - [09:42] Diego: timeout
  - [09:43] Diego: `event_id` no payload
  - [09:48] Larissa: resumo
- Momento de geração do `eventId`, headers e reutilização no replay: [FDD](../FDD.md)
