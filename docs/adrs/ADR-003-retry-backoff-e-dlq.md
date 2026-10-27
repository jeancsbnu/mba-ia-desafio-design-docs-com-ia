# ADR-003: Retry com backoff exponencial e Dead Letter Queue em tabela separada

- **Data:** reunião técnica de quinta-feira, 09:00–09:53
- **Decisores:** Larissa (Tech Lead), Diego (Plataforma)
- **Consultados:** Bruno (Pedidos), Marcos (PM), Sofia (Segurança)
- **Relacionados:** [ADR-001](ADR-001-outbox-no-mysql.md), [ADR-002](ADR-002-worker-separado-em-polling.md), [ADR-005](ADR-005-at-least-once-com-x-event-id.md), [ADR-006](ADR-006-reuso-dos-padroes-do-projeto.md)

## Status

**Aceito.** Os pontos foram fechados assim:

| Ponto | Fechamento |
|---|---|
| Número de tentativas e intervalos | [09:17] Larissa: "Decidido: 5 tentativas, backoff 1m/5m/30m/2h/12h" |
| DLQ em tabela separada | Proposta em [09:18] Diego, com "Faz sentido" de [09:18] Bruno |
| Endpoint de replay | Anotado em [09:19] Larissa |
| Replay exigir ADMIN | [09:36] Larissa |

Tudo isso foi confirmado no resumo de [09:48] Larissa.

## Contexto

O cliente pode estar offline quando o worker tenta entregar ([09:14] Larissa). Indisponibilidades longas acontecem: já houve cliente com duas horas de manutenção planejada ([09:16] Diego).

A política de retentativa tem de equilibrar duas coisas:

1. cobrir indisponibilidades reais, de horas, sem desistir cedo demais;
2. não deixar eventos pendurados para sempre quando o cliente sumiu ([09:15] Diego).

Os eventos que esgotam as tentativas precisam de um destino que permita investigar o que houve e reprocessar.

**Premissa: o que conta como falha.** `ADR-003-PRE-01`

- Um cliente "que não responde em 10s a gente trata como falha e marca pra retry" ([09:42] Diego).
- *Interpretação adotada (AMB-17):* qualquer resposta fora da faixa 2xx e qualquer erro de rede também contam como falha.
- O timeout e o critério de sucesso são parâmetros de resiliência, detalhados no [FDD](../FDD.md).

## Fatores de decisão

- **Cliente offline:** o worker pode encontrar o cliente fora do ar na hora da entrega ([09:14] Larissa).
- **Indisponibilidades de horas:** já houve cliente com duas horas de manutenção planejada ([09:16] Diego).
- **Fim definido:** um evento não pode ficar pendurado para sempre se o cliente sumiu ([09:15] Diego).
- **Evidência para reprocessar:** os eventos esgotados precisam de um destino que sirva para debug e reprocessamento, sem sujar a leitura da outbox ([09:18] Diego).
- **Replay controlado:** reprocessar a fila de entrega não é tarefa de operador e exige registrar quem fez ([09:36] Sofia).

## Decisão

1. **Retentativas com backoff exponencial**, em intervalos de **1 min, 5 min, 30 min, 2 h e 12 h** ([09:17] Diego).
   - Somados, os intervalos dão 14h36min, que Diego descreveu como "quase 15 horas entre primeira falha e última tentativa" ([09:17] Diego).
   - *Interpretação adotada (AMB-02):* "5 tentativas" significa **5 retentativas depois do envio inicial**, até 6 envios no total. `ADR-003-DEC-01`
   - É a única leitura que fecha com os 5 intervalos e com a janela de ~15h. Também bate com o argumento de Diego contra 3 tentativas: "três vezes em 30 minutos" ([09:16] Diego) corresponde aos três primeiros intervalos, 1m + 5m + 30m, cerca de 36 min, arredondados na fala.
2. **Dead Letter Queue em tabela separada.** Quando a última retentativa falha, o evento é tratado como falha permanente e **movido** para a tabela **`webhook_dead_letter`**, com o payload, o motivo da falha e o timestamp ([09:15] Diego, [09:18] Diego). `ADR-003-DEC-02`
   - *Interpretação adotada (AMB-13):* "mover" quer dizer que o evento deixa a outbox e passa a existir só na DLQ, na mesma operação. O status "falhou" citado em [09:08] Diego é tratado como transitório: a última tentativa falhou e o evento aguarda a próxima.
3. **Reprocessamento manual** via `POST /admin/webhooks/dead-letter/:id/replay`, que "recoloca na outbox como pendente" ([09:18] Diego, [09:35] Diego). `ADR-003-DEC-03`
   - *Interpretação adotada (AMB-19):* o evento recolocado mantém o mesmo `eventId` ([ADR-005](ADR-005-at-least-once-com-x-event-id.md)) e começa um ciclo de tentativas novo.
   - A linha da DLQ é marcada como reprocessada, sem ser apagada, para que a evidência fique preservada.
4. **Segurança do replay.** O replay exige role **ADMIN**, reaproveitando o `requireRole` existente ([09:36] Sofia, [09:36] Larissa), e **registra quem o executou**, para auditoria ([09:36] Sofia). `ADR-003-DEC-04`

## Alternativas Consideradas

### ADR-003-ALT-01: Retry indefinido com backoff

Diego mencionou que "algumas pessoas defendem" essa opção ([09:15] Diego).

**Motivo do descarte (reunião):** se o cliente sumiu, o evento fica pendurado para sempre ([09:15] Diego).

### ADR-003-ALT-02: Apenas 3 tentativas

Bruno propôs em [09:16], por ser "mais agressivo".

**Motivo do descarte (reunião):** "3 é pouco". As três retentativas se esgotam em cerca de meia hora, e um cliente com indisponibilidade de manhã perderia os eventos, sendo que já houve manutenção planejada de duas horas ([09:16] Diego). Larissa: "Cinco fica bom" ([09:16] Larissa).

### ADR-003-ALT-03: Marcar como "failed" na própria outbox, sem tabela de DLQ

Larissa pôs as duas opções em [09:17].

**Motivo do descarte (reunião):** a tabela separada deixa "mais limpa a leitura da outbox principal" e serve "como evidence pra debug e reprocessamento" ([09:18] Diego). Por isso o evento esgotado sai da outbox (AMB-13).

## Prós e contras das opções

### Cinco retentativas com backoff e DLQ em tabela (escolhida)

- Pró: cobre até ~15h de indisponibilidade, lendo "5 tentativas" como 5 retentativas *(interpretação, AMB-02)*, com folga para a manutenção de duas horas ([09:16] Diego).
- Pró: ciclo de vida finito, e a DLQ guarda payload e motivo para investigar e reprocessar ([09:18] Diego).
- Contra: acima de ~15h, o evento depende de replay manual, o que Marcos achou aceitável ([09:17] Marcos).
- Contra: o cliente não é avisado das falhas, porque o e-mail ficou fora desta fase ([09:37] Larissa).

### Retry indefinido (ADR-003-ALT-01)

- Pró: dispensaria o replay manual depois de indisponibilidades acima de ~15h.
- Contra: se o cliente sumiu, o evento fica pendurado para sempre ([09:15] Diego).

### Apenas 3 tentativas (ADR-003-ALT-02)

- Pró: "mais agressivo" ([09:16] Bruno).
- Contra: as três retentativas se esgotam em cerca de meia hora ([09:16] Diego).
- Contra: não cobriria a manutenção de duas horas que já aconteceu ([09:16] Diego).

### "failed" na própria outbox (ADR-003-ALT-03)

- Contra: deixa menos limpa a leitura da outbox principal ([09:18] Diego).
- Contra: abre mão da tabela separada que serve "como evidence pra debug e reprocessamento" ([09:18] Diego).

## Consequências

### Positivas

- **Indisponibilidades longas cobertas.** O cliente pode ficar fora por até ~15h sem perder eventos, o que cobre com folga o caso real de manutenção de duas horas ([09:16] Diego).
- **Ciclo de vida finito.** Nenhum evento fica eternamente pendente, e a outbox principal contém só eventos ainda em jogo ([09:18] Diego).
- **Evidência preservada.** A DLQ guarda o payload e o motivo, o que permite investigar e reprocessar sob demanda ([09:18] Diego).
- **Replay controlado.** O reprocessamento fica restrito a ADMIN, com trilha de auditoria ([09:36] Sofia).

### Negativas

- **Indisponibilidade acima de ~15h exige intervenção.** O evento só volta a ser entregue por replay manual de um ADMIN. Marcos achou aceitável: "Se um cliente meu cair por 15 horas, ele já tá com problema sério dele" ([09:17] Marcos). `ADR-003-CON-01`
- **O cliente não é avisado.** A plataforma não informa o cliente quando os webhooks dele estão falhando, porque o aviso por e-mail ficou fora desta fase ([09:37] Larissa). Ele só descobre consultando o histórico de entregas. `ADR-003-CON-02`
- **Falta uma forma de localizar o evento na DLQ.** A reunião definiu só o endpoint de replay, que exige o `:id` do evento, e nenhum meio de encontrá-lo. Sem uma consulta da DLQ, o ADMIN depende de acesso direto ao banco. Uma listagem administrativa é proposta no [FDD](../FDD.md). `ADR-003-CON-03`
- **A ordenação se perde durante o backoff.** Enquanto um evento espera a retentativa (até 12h), eventos posteriores do mesmo pedido podem ser entregues antes ([ADR-002](ADR-002-worker-separado-em-polling.md), AMB-09).

### Trade-off

Aceitamos que indisponibilidades acima de ~15h dependam de replay manual e que o cliente não seja avisado das falhas. Em troca, temos uma política de retentativa previsível, com fim definido e evidência auditável de cada falha.

## Referências

- Falas da reunião:
  - [09:08] Diego: status da outbox;
  - [09:14] Larissa: cliente offline;
  - [09:15] Diego: backoff, teto e "move pra DLQ";
  - [09:16] Bruno, [09:16] Diego e [09:16] Larissa: 3 ou 5 tentativas;
  - [09:17] Diego: intervalos;
  - [09:17] Marcos: janela aceitável;
  - [09:17] Larissa: decisão;
  - [09:18] Diego e [09:18] Bruno: DLQ e replay;
  - [09:19] Larissa: endpoint anotado;
  - [09:36] Sofia e [09:36] Larissa: ADMIN e auditoria;
  - [09:37] Larissa: e-mail fora da fase;
  - [09:42] Diego: timeout;
  - [09:48] Larissa: resumo.
- Código: `src/middlewares/auth.middleware.ts` (`requireRole`). `ADR-003-COD-01`
- Algoritmo de agendamento, transições de status, contrato do replay e listagem da DLQ: [FDD](../FDD.md).
