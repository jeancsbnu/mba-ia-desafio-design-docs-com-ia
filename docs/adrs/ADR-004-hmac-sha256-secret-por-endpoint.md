# ADR-004: Autenticação por HMAC-SHA256 com secret por endpoint e rotação com carência de 24h

- **Data:** reunião técnica de quinta-feira, 09:00–09:53
- **Decisores:** Sofia (Segurança), com concordância de Larissa (Tech Lead)
- **Consultados:** Bruno (Pedidos), Diego (Plataforma), Marcos (PM)
- **Relacionados:** [ADR-005](ADR-005-at-least-once-com-x-event-id.md), [ADR-007](ADR-007-payload-snapshot-na-insercao.md)

## Status

**Aceito.** Sofia fechou a decisão em [09:22]:

> "Decidido: HMAC-SHA256 sobre o corpo do request, secret por endpoint, suporte a rotação com grace period de 24h"

Larissa a confirmou no resumo de [09:48]. Antes do deploy, Sofia pediu pelo menos 2 dias úteis para revisar com calma o HMAC e a geração de secret ([09:46] Sofia). `ADR-004-CON-02`

## Contexto

Os webhooks levam dados de pedidos para endpoints fora da infraestrutura da plataforma. O cliente precisa conseguir verificar duas coisas ([09:19] Sofia):

- **autenticidade:** a requisição veio mesmo da plataforma;
- **integridade:** ninguém alterou o payload no caminho.

O risco de vazamento de credencial é concreto: um cliente já vazou uma secret em log da própria aplicação ([09:22] Diego). `ADR-004-CON-01` Por isso o mecanismo precisa:

- limitar o estrago de um vazamento;
- permitir trocar a credencial sem interromper a integração;
- ser algo para o qual "todo cliente sério tem biblioteca" ([09:20] Sofia).

**Premissa de transporte.** A URL cadastrada tem de ser **https**. Uma URL `http` é recusada com erro de validação no schema Zod ([09:23] Sofia). Sofia deixou claro que isso "nem é decisão arquitetural", mas é sobre esse canal que a assinatura opera. O detalhe fica no [FDD](../FDD.md). `ADR-004-PRE-01`

## Fatores de decisão

- **Autenticidade e integridade:** o cliente precisa verificar que a requisição veio da plataforma e que ninguém alterou o payload ([09:19] Sofia).
- **Risco concreto de vazamento:** um cliente já vazou uma secret em log da própria aplicação ([09:22] Diego).
- **Estrago limitado:** um vazamento não pode comprometer todos os clientes, porque com uma secret global "se vaza uma, vaza tudo" ([09:21] Sofia).
- **Troca sem interrupção:** o cliente precisa de tempo para migrar os seus sistemas quando a secret muda ([09:21] Sofia).
- **Adoção pelo cliente:** o mecanismo deve ser padrão de mercado, algo para o qual "todo cliente sério tem biblioteca" ([09:20] Sofia).

## Decisão

1. **Assinatura HMAC-SHA256 sobre o corpo do request.** Cada requisição é assinada com HMAC-SHA256 calculado sobre o corpo ([09:20] Sofia, [09:22] Sofia). A assinatura vai no header **`X-Signature`**. Sofia sugeriu "um header tipo X-Signature" em [09:20], e o nome foi fixado na lista de headers de [09:44] Diego. O cliente recalcula o HMAC com a secret que tem e compara o resultado.
2. **Uma secret por endpoint**, sem secret global ([09:21] Sofia). `ADR-004-DEC-01`
   - A secret é **gerada pela plataforma** e devolvida ao cliente na criação do webhook ([09:31] Marcos).
   - Ela fica no cadastro do webhook, junto com a URL, o customer (`customerId`) e o estado ativo ([09:21] Bruno, [09:21] Sofia). `ADR-004-DEC-04`
3. **Rotação pela API.** O cliente pode pedir uma nova secret pela API, e a anterior **continua válida por 24 horas em paralelo**, para que ele migre os seus sistemas. Depois disso, deixa de valer ([09:21] Sofia). `ADR-004-DEC-02`
   - *Interpretação adotada (AMB-15):* como há um único header de assinatura ([09:44] Diego), durante a carência o `X-Signature` leva as duas assinaturas, uma com a secret nova e outra com a antiga. Assim, um cliente que valide com qualquer uma das duas aceita a requisição. `ADR-004-DEC-03`
   - O ponto está marcado para a revisão de segurança. O FDD acrescenta, como *proposta*, uma rotação de emergência sem carência e o bloqueio de nova rotação durante a carência ([FDD FLUXO-07](../FDD.md#fdd-fluxo-07-rotação-de-secret)).

## Alternativas Consideradas

### ADR-004-ALT-01: Uma secret global da plataforma para todos os clientes

**Motivo do descarte (reunião):** "se vaza uma, vaza tudo" ([09:21] Sofia). Um único vazamento comprometeria a verificação de todos os clientes e obrigaria a uma troca coordenada com todos eles.

### ADR-004-ALT-02: Assinatura assimétrica (chave privada da plataforma, chave pública para o cliente)

*Alternativa plausível, não discutida na reunião.* A plataforma assinaria com uma chave privada e publicaria a chave pública para os clientes verificarem.

**Por que não foi adotada:** a reunião escolheu HMAC por ser o padrão de mercado para webhooks e por "todo cliente sério" ter biblioteca para isso ([09:20] Sofia). A assinatura assimétrica exige mais do cliente: gestão de chave pública e outro algoritmo de verificação.

Ela fica registrada porque resolveria a principal negativa desta decisão: a plataforma deixaria de guardar, para cada cliente, um segredo recuperável (ver Consequências). Cabe à revisão de segurança avaliar se essa troca compensa ([09:46] Sofia).

## Prós e contras das opções

### HMAC-SHA256 com secret por endpoint (escolhida)

- Pró: autenticidade e integridade são verificadas com uma primitiva padrão, para a qual o cliente já tem biblioteca ([09:20] Sofia).
- Pró: um vazamento afeta só um endpoint, e a rotação normal troca a secret sem downtime ([09:21] Sofia). A revogação imediata em caso de vazamento é proposta do FDD.
- Contra: a secret precisa ficar recuperável para assinar *(interpretação, AMB-07)*, ponto aberto da revisão de segurança ([09:46] Sofia).
- Contra: a assinatura cobre só o corpo ([09:22] Sofia), então o `X-Timestamp` não protege contra replay *(interpretação, AMB-14)*, e a rotação acrescenta estado.

### Secret global (ADR-004-ALT-01)

- Contra: "se vaza uma, vaza tudo" ([09:21] Sofia).
- Contra: um único vazamento obrigaria a uma troca coordenada com todos os clientes.

### Assinatura assimétrica (ADR-004-ALT-02)

- Pró: a plataforma deixaria de guardar um segredo recuperável por cliente (argumento do autor).
- Contra: exige mais do cliente, com gestão de chave pública e outro algoritmo de verificação (argumento do autor).
- Contra: a reunião preferiu o HMAC, padrão de mercado para o qual "todo cliente sério tem biblioteca" ([09:20] Sofia).

## Consequências

### Positivas

- **Verificação simples do lado do cliente.** Autenticidade e integridade são verificadas com uma primitiva padrão, para a qual o cliente já tem biblioteca ([09:20] Sofia).
- **Estrago de vazamento limitado.** Um vazamento afeta só um endpoint, e a rotação permite reagir sem downtime ([09:21] Sofia, [09:22] Diego).
- **Sem dependência nova.** O HMAC-SHA256 está no módulo nativo `node:crypto` do Node.js, compatível com o `engines.node >= 20` de `package.json`. `ADR-004-COD-01`
  - As bibliotecas criptográficas de terceiros já presentes (`bcrypt` e `jsonwebtoken`) atendem a senhas e ao JWT. Nenhuma é necessária para o HMAC.

### Negativas

- **A secret precisa ser recuperável.** Para assinar, a plataforma precisa da secret em forma utilizável. Não basta guardar um hash, como se faz com senhas. A forma de armazenamento é ponto aberto da revisão de segurança ([09:46] Sofia, AMB-07).
- **O `X-Timestamp` não protege contra replay.** A assinatura cobre só o corpo ([09:22] Sofia), e o `X-Timestamp` fica fora dela (AMB-14). Quem capturar uma requisição pode reenviar o mesmo corpo e a mesma assinatura com um timestamp novo. Ou seja, mesmo que o cliente queira detectar replay pelo `X-Timestamp` ([09:44] Diego), ele não consegue fazer isso de forma confiável. A proteção efetiva que sobra é a deduplicação por `X-Event-Id` ([ADR-005](ADR-005-at-least-once-com-x-event-id.md)). Assinar ou não o timestamp é decisão pendente para a revisão de segurança. `ADR-004-CON-03`
- **A rotação acrescenta estado.** Durante as 24h de carência convivem duas secrets por endpoint, com regras de expiração e assinatura dupla.
- **A proteção depende do cliente.** Sem a validação da assinatura implementada do lado dele, o mecanismo não protege nada.

### Trade-off

Aceitamos três custos: guardar a secret de forma recuperável, administrar duas secrets durante a rotação e deixar a proteção contra replay incompleta. Em troca, temos verificação de origem e integridade padrão de mercado, fácil de implementar no cliente e com o estrago de um vazamento limitado a um endpoint.

## Referências

- Falas da reunião:
  - [09:19] Sofia: requisito de autenticidade e integridade.
  - [09:20] Sofia: HMAC, SHA-256 e "header tipo X-Signature".
  - [09:21] Sofia e [09:21] Bruno: secret por endpoint, dados do cadastro, rotação de 24h.
  - [09:22] Diego: vazamento anterior.
  - [09:22] Sofia: decisão.
  - [09:23] Sofia: https.
  - [09:31] Marcos: secret gerada pela plataforma.
  - [09:44] Diego: headers `X-Signature` e `X-Timestamp`.
  - [09:46] Sofia: revisão de segurança.
  - [09:48] Larissa: resumo.
- Código: `package.json` (`engines.node >= 20`; dependências `bcrypt` e `jsonwebtoken`).
- Cálculo exato da assinatura, formato do header com duas assinaturas e contrato do endpoint de rotação: [FDD](../FDD.md).
