# ADR-002: Worker em processo separado, lendo a outbox por polling de 2 segundos

- **Data:** reunião técnica de quinta-feira, 09:00–09:53
- **Decisores:** Larissa (Tech Lead), Diego (Plataforma), Bruno (Pedidos)
- **Consultados:** Marcos (PM)
- **Relacionados:** [ADR-001](ADR-001-outbox-no-mysql.md), [ADR-003](ADR-003-retry-backoff-e-dlq.md), [ADR-006](ADR-006-reuso-dos-padroes-do-projeto.md)

## Status

**Aceito.** Larissa registrou a decisão em [09:10] ("Vamos registrar isso como uma decisão. Worker em polling, 2s") e a confirmou no resumo de [09:48].

## Contexto

Com o outbox ([ADR-001](ADR-001-outbox-no-mysql.md)), os eventos ficam gravados no MySQL. Falta decidir **quem lê** essa tabela e **como** ele fica sabendo que há eventos novos.

- **Latência.** O cliente quer receber a notificação em menos de 10 segundos ([09:02] Marcos).
- **Sem notificação nativa.** O MySQL não tem um mecanismo de notificação a processos externos como o NOTIFY/LISTEN do Postgres. Uma trigger só executa SQL ([09:09] Diego).
- **Ciclo de vida da API.** A API é iniciada por `src/server.ts`. Se o worker rodar dentro dela, "se a API reinicia, perde o worker" ([09:11] Diego).
- **Ordenação.** A reunião tratou a ordenação como propriedade do desenho com worker único: processar em ordem de criação entrega os eventos de um pedido na ordem em que aconteceram ([09:12] Diego). Os clientes, por sua vez, "nunca pediram garantia de ordering global"; eles "só querem saber se cada pedido deles mudou" ([09:14] Marcos).

## Decisão

1. **Processo separado.** O worker roda num processo próprio, fora da API, com uma entry-point nova `src/worker.ts` (novo) e o script `npm run worker` ([09:11] Diego, [09:11] Larissa). Usa o mesmo banco e a mesma stack ([09:11] Bruno, [09:11] Diego). `ADR-002-DEC-01`
2. **Lógica dentro do módulo.** O processamento fica dentro do módulo de webhooks. `ADR-002-DEC-02`
   - *Interpretação adotada (AMB-12):* o arquivo é `src/modules/webhooks/webhook.worker.ts` (novo), uma das duas opções citadas em [09:28] Bruno.
   - `src/worker.ts` é só a entry-point.
3. **Polling.** O worker lê a outbox em loop **a cada 2 segundos**, buscando em lotes pequenos os eventos pendentes mais antigos ([09:08] Diego, [09:09] Diego).
4. **Uma única instância.** Ela processa em ordem de criação, e assim os eventos de um mesmo pedido saem na ordem em que foram gerados ([09:12] Diego). `ADR-002-DEC-03` O desenho final (lease, seleção justa por endpoint, uma tarefa por endpoint) está em [FDD FLUXO-02](../FDD.md#fdd-fluxo-02-ciclo-do-worker).

## Alternativas Consideradas

### ADR-002-ALT-01: Trigger no banco para acordar o worker (abordagem reativa)

Bruno propôs essa opção em [09:09] para reduzir a latência.

**Motivo do descarte (reunião):** o MySQL não tem listener nativo. Uma trigger não notifica processo externo, e para "avisar o worker" seria preciso improvisar algo, como escrever em arquivo ou chamar um endpoint ("fica esquisito"). Além disso, o polling de 2s já atende o requisito de menos de 10s com folga ([09:09] Diego).

### ADR-002-ALT-02: Worker rodando dentro do processo da API

**Motivo do descarte (reunião):** se a API reinicia, o worker vai junto ([09:11] Diego).

**Argumento adicional (do autor, não discutido na reunião):** com processos separados, a carga de envio também fica fora do caminho das requisições HTTP da API.

### ADR-002-ALT-03: Vários workers em paralelo

Diego levantou o cenário em [09:12] Diego e [09:13] Diego.

**Motivo do descarte (adiamento):** com vários workers, a ordenação por pedido se perde. Escalar exigiria particionar por `order_id` ou usar lock pessimista, e Diego classificou isso como "problema do futuro, não agora" ([09:13] Diego). Por isso a escala fica registrada como questão em aberto, não como rejeição definitiva.

## Consequências

### Positivas

- **Requisito de latência cumprido.** Em condição normal, o polling acrescenta um atraso de **até ~2s no pior caso** antes do primeiro envio, abaixo dos 10s pedidos ([09:09] Diego, [09:10] Marcos).
- **Falhas isoladas.** Reinícios da API não interrompem o envio, e vice-versa ([09:11] Diego).
- **Simplicidade.** É um loop sobre uma tabela indexada, sem infraestrutura de mensageria ([ADR-001](ADR-001-outbox-no-mysql.md)).
- **Ordem por pedido no primeiro envio.** Com instância única, os eventos de um pedido saem na ordem em que foram gerados ([09:12] Diego). A ressalva sobre retentativas está nas Negativas.

### Negativas

- **Atraso aceito.** Larissa chamou esse atraso de "latência mínima… no pior caso" ([09:10] Larissa). O termo "mínima" foi impreciso: com polling a cada 2s, o atraso fica entre 0 e ~2s. `ADR-002-CON-01`
- **Bloqueio por cliente lento (head-of-line).** Um worker único que processa em ordem, com até 10s de espera por tentativa ([09:42] Diego), faz um cliente lento ou fora do ar atrasar a fila de **todos** os clientes. É o mesmo efeito que Bruno usou contra o envio síncrono ([09:04] Bruno), agora deslocado para o worker. A mitigação (concorrência limitada entre webhooks diferentes, por exemplo) é detalhe de implementação no [FDD](../FDD.md) e não pode quebrar a ordem por pedido. `ADR-002-CON-02`
- **Ordenação limitada.** A ordem vale só por pedido e só com instância única. Não há ordenação global ([09:13] Larissa).
  - *Interpretação adotada (AMB-09):* com retry e backoff ([ADR-003](ADR-003-retry-backoff-e-dlq.md)), um evento posterior do mesmo pedido pode ser entregue antes da retentativa de um evento anterior.
- **Nada impede uma segunda instância.** Ninguém impede que subam duas instâncias por engano, e isso quebraria a ordenação sem nenhum aviso. Uma proteção operacional é detalhe do FDD.
- **Ponto único de falha.** Se o worker parar, os eventos se acumulam na outbox (sem se perder) até ele voltar. Há ainda um novo processo para implantar e monitorar.
- **Consulta constante.** O worker consulta o banco a cada 2s, haja eventos ou não.

### Trade-off

Aceitamos até ~2s de atraso, o risco de um cliente lento atrasar os demais e uma única instância. Em troca, ficamos com uma solução simples, sem infraestrutura nova e com ordem por pedido no primeiro envio.

## Referências

- Falas da reunião:
  - [09:04] Bruno: o efeito de cliente lento;
  - [09:08] Diego e [09:09] Diego: polling e lotes;
  - [09:09] Bruno e [09:09] Diego: trigger descartada;
  - [09:10] Marcos e [09:10] Larissa: decisão e latência;
  - [09:11] Diego, [09:11] Larissa e [09:11] Bruno: processo separado;
  - [09:12] Diego, [09:13] Diego, [09:13] Larissa e [09:14] Marcos: ordenação e escala;
  - [09:28] Bruno: onde fica a lógica;
  - [09:42] Diego: timeout;
  - [09:48] Larissa: resumo.
- Código:
  - `src/server.ts`: entry-point da API, modelo para o `src/worker.ts` (novo). `ADR-002-COD-01`
  - `package.json`: hoje não existe script `worker`.
- Loop, tamanho do lote, claim de eventos, encerramento gracioso e proteção contra instância dupla: [FDD](../FDD.md).
