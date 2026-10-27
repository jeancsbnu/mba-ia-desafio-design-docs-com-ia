# PRD: Sistema de Webhooks de Notificação de Pedidos

| Campo | Valor |
|---|---|
| **Produto** | Order Management System (OMS) |
| **Feature** | Avisos de mudança de status de pedido para clientes B2B (webhooks de saída) |
| **Versão** | 1.1. A versão 1.0 (20/10/2026) foi reorganizada no modelo de PRD do curso. As decisões não mudaram. Os fluxos e erros de cada requisito trazem detalhes propostos no FDD, marcados como *(proposta)*. |
| **Data** | 26/10/2026. A transcrição registra a reunião de origem como "quinta-feira", sem data. |
| **Responsável** | Marcos (PM) *(interpretação: é quem representa o produto na reunião)* |
| **Liderança técnica** | Larissa (Tech Lead) |
| **Autoria do documento** | @jeancsbnu, com apoio de IA |
| **Status** | Em revisão |
| **Documentos ligados** | [RFC](RFC.md), [ADRs](adrs/README.md), [FDD](FDD.md), [Tracker](TRACKER.md) |

**Notação.** Cada item cita sua origem: a fala na [`TRANSCRICAO.md`](../TRANSCRICAO.md), no formato `[hh:mm] Nome`, ou um documento do pacote. Quatro marcas indicam o que não veio pronto da reunião:

- *(interpretação, AMB-xx)*: leitura de um ponto ambíguo, registrada no [inventário](processo/inventario.md#8-ambiguidades-e-interpretações-adotadas).
- *(proposta)*: algo que a reunião não definiu e que o pacote propõe.
- *(avaliação do autor)*: julgamento do redator, como prioridade, probabilidade e plano de contingência.
- *(hipótese)*: ponto do modelo do curso que a reunião não discutiu, a confirmar.

---

## 1. Resumo e contexto

A plataforma vai **avisar os clientes B2B, em tempo quase real, quando o status de um pedido deles mudar**. O aviso é uma chamada HTTP para um endereço cadastrado pelo cliente (webhook de saída). Assim o cliente não precisa mais consultar a API repetidamente.

A funcionalidade nasceu de um pedido formal de três clientes ([09:00] Marcos). Escopo, garantias e restrições foram definidos numa reunião técnica com produto (Marcos), liderança técnica (Larissa), pedidos (Bruno), plataforma (Diego) e segurança (Sofia).

Este PRD trata do **porquê** e do **quê**. O **como** está no [RFC](RFC.md) e no [FDD](FDD.md).

## 2. Contexto e problema

### 2.1 Problema e motivação

- **Polling lento e caro.** Atlas Comercial, MaxDistribuição e Nova Cargo consultam `GET /orders` "de tempos em tempos" para descobrir mudanças, o que deixa a integração "lenta e cara pra eles" ([09:00] Marcos). A plataforma não tem aviso de saída: o cliente precisa perguntar para saber.
- **O que conta como tempo real.** Para eles, "qualquer coisa abaixo de 10 segundos já é tempo real" ([09:02] Marcos).
- **Risco comercial.** A reunião cita dois marcos e não os reconcilia *(interpretação, AMB-22)*:
  - a Atlas pode migrar para um concorrente se a funcionalidade não sair "até fim do trimestre" ([09:00] Marcos);
  - Marcos também diz que "a Atlas quer pra fim de novembro" ([09:45] Marcos).

### 2.2 Problemas priorizados

A reunião não priorizou problemas. Impacto e prioridade abaixo são *(avaliação do autor)*, apoiados nas falas citadas.

| ID | Problema | Impacto | Prioridade | Origem |
|---|---|---|---|---|
| PRD-PROB-01 | Os clientes só descobrem mudanças de status por polling | Integração lenta e cara para os três clientes que fizeram o pedido formal | Alta: é o motivo da funcionalidade | [09:00] Marcos |
| PRD-PROB-02 | A Atlas pode trocar a plataforma por um concorrente | Perda de um cliente B2B se a entrega atrasar | Alta: é o que define o prazo | [09:00] Marcos, [09:45] Marcos |

### 2.3 Público-alvo e cenários de uso

| Público | Interesse | Origem |
|---|---|---|
| Clientes B2B integradores (Atlas Comercial, MaxDistribuição, Nova Cargo) | Receber as mudanças de status sem polling | [09:00] Marcos |
| Usuários da plataforma que representam o cliente | Cadastrar e gerenciar endereços pela API, com o JWT do sistema | [09:32] Marcos |
| Administradores (papel ADMIN) | Reprocessar avisos que falharam de forma definitiva | [09:36] Sofia, [09:36] Larissa |
| Produto e portal de desenvolvedor | Documentar integração, garantia de entrega e limitações | [09:26] Marcos, [09:40] Marcos |

| ID | Cenário | Origem |
|---|---|---|
| PRD-CEN-01 | O cliente quer saber só de pedidos enviados ou entregues e cadastra um endereço com esses dois status. | [09:33] Marcos |
| PRD-CEN-02 | O sistema do cliente fica 2h fora do ar numa manutenção planejada. Os avisos chegam na tentativa seguinte à volta, dentro da janela de ~15h. | [09:16] Diego, [09:17] Diego |
| PRD-CEN-03 | **Troca planejada de secret**, com 24h para o cliente migrar. | [09:21] Sofia |
| PRD-CEN-04 | **Suspeita de vazamento:** invalidar a secret antiga na hora. A revogação imediata é *(proposta)* do [FDD](FDD.md#fdd-fluxo-07-rotação-de-secret) e depende da avaliação de segurança. | [09:22] Diego |
| PRD-CEN-05 | O cliente recebe o mesmo aviso duas vezes e descarta a duplicata pelo identificador. | [09:25] Diego |
| PRD-CEN-06 | O cliente investiga um aviso que não chegou pelos últimos 100 envios. | [09:34] Marcos |
| PRD-CEN-07 | Um aviso esgotou as tentativas, e um administrador o reprocessa, com registro de quem fez. | [09:18] Diego, [09:36] Sofia |
| PRD-CEN-08 | O cliente tem vários endereços e sabe de qual cadastro veio cada aviso. | [09:44] Sofia |
| PRD-CEN-09 | O cliente desativa um endereço *(interpretação de "estado ativo", [09:21] Bruno)*. Mudanças durante a inatividade não geram aviso, e os pendentes ficam retidos por até 24h *(prazo proposto no FDD)* antes de irem para a fila de falhas. | [09:21] Bruno, [FDD FLUXO-08](FDD.md#fdd-fluxo-08-crud-de-cadastro) |
| PRD-CEN-10 | Um desenvolvedor do cliente integra pelo portal, que explica a garantia "ao menos uma vez" e a limitação de ordem. | [09:26] Marcos, [09:13] Larissa |

### 2.4 Onde a feature será implantada

- **PRD-IMP-01 No OMS que já existe.** Os endereços são geridos pela mesma API, com o JWT do sistema ([09:32] Marcos), e os dados ficam no mesmo banco de dados ([09:07] Diego).
- **PRD-IMP-02 Um único componente novo:** um processo de envio, separado da API, na mesma base de código ([09:11] Diego, [09:30] Larissa). A visão completa está na [seção 7](#7-arquitetura-e-abordagem).
- **PRD-IMP-03 Destino dos avisos:** os endereços https dos próprios clientes, fora da infraestrutura da plataforma ([09:19] Sofia, [09:23] Sofia).

## 3. Objetivos e métricas de sucesso

| ID | Objetivo | Métrica | Meta | Origem |
|---|---|---|---|---|
| PRD-MET-01 | Aviso em "tempo real" | Atraso entre a mudança de status e o **início** do 1º envio. É visível ao cliente pelos dois horários informados no aviso. | **Abaixo de 10s.** Medir até o início do envio é *(interpretação, AMB-21)*. Acompanhar pelo p95, excluindo endereços pausados, é *(proposta)* ([FDD-OBS-03](FDD.md#fdd-obs-03-métricas-derivadas-proposta)). | [09:02] Marcos, [09:10] Larissa |
| PRD-MET-02 | Entregar no prazo pedido | Funcionalidade disponível em produção | **Até o fim de novembro** (pedido da Atlas). Ter os 3 clientes solicitantes integrados é *(proposta de meta complementar)*: depende de trabalho deles. | [09:45] Marcos |
| PRD-MET-03 | Consistência entre pedido e aviso | Mudanças de status com endereço **ativo** inscrito que não geraram aviso | **0** | [09:40] Bruno, [09:41] Diego |
| PRD-MET-04 | Tolerar indisponibilidade do cliente | Janela em que a plataforma continua tentando | **~15h**: 5 tentativas lidas como 5 retentativas depois do envio inicial *(interpretação, AMB-02)* | [09:17] Diego, [09:17] Larissa |
| PRD-MET-05 | Reduzir o polling | Chamadas a `GET /orders` dos usuários dos 3 clientes, medidas nos logs de requisição existentes (`http_request`) | *Indicador de acompanhamento*, sem meta numérica definida na reunião. Medir a linha de base antes do lançamento. | [09:00] Marcos |
| PRD-MET-06 | Saúde das entregas | Avisos que chegam à fila de falhas (DLQ), por cliente | *Indicador de acompanhamento.* Usá-lo como insumo para decidir sobre o e-mail é *(proposta)* ([RFC-OQ-05](RFC.md#questões-em-aberto)). | [09:37] Larissa |

**Premissa a confirmar.** A reunião não cruzou a estimativa de 3 sprints ([09:47] Larissa) com o marco de fim de novembro, porque não informou o início nem a duração dos sprints. Marcos ficou de confirmar o prazo com a Atlas ([09:47] Marcos).

## 4. Escopo

### Incluso

- Aviso a cada mudança de status de pedido, só para os status que o endereço escolheu (PRD-FR-01, PRD-FR-04).
- Gestão dos endereços pela API: cadastro, edição, remoção, listagem, desativação e restrição a https (PRD-FR-02, PRD-FR-03, PRD-FR-05).
- Assinatura dos avisos e troca de secret com carência (PRD-FR-06, PRD-FR-07).
- Identificação e conteúdo do aviso (PRD-FR-08, PRD-FR-09).
- Retentativas automáticas, fila de falhas e reprocessamento por administrador (PRD-FR-10, PRD-FR-11).
- Histórico dos últimos 100 envios de cada endereço (PRD-FR-12).

### Fora de escopo

| ID | Item | Situação na reunião | Origem |
|---|---|---|---|
| PRD-OOS-01 | Aviso por **e-mail** ao cliente quando os webhooks dele falham | Fora desta fase. "Talvez próxima fase, depois que a gente medir o impacto": é adiamento condicional, não compromisso. | [09:37] Marcos, [09:37] Larissa, [09:38] Marcos |
| PRD-OOS-02 | **Painel visual** para o cliente | "Só endpoints". O painel é um projeto separado do time de frontend. | [09:39] Marcos, [09:40] Larissa |
| PRD-OOS-03 | Webhooks de **entrada** | "Só saindo da gente pra eles." | [09:02] Sofia, [09:02] Marcos |
| PRD-OOS-04 | **Arquivamento** das linhas entregues da fila interna (~30 dias) | Fora desta funcionalidade. É interno e não afeta o histórico que o cliente consulta. | [09:08] Diego |
| PRD-OOS-05 | **Itens do pedido** no aviso | Não vão. O cliente consulta o pedido se precisar. | [09:43] Diego |
| PRD-OOS-06 | **Ordem global** e entrega **exatamente uma vez** | Não oferecidas. Ver PRD-NFR-04. | [09:13] Larissa, [09:14] Marcos, [09:25] Diego |
| PRD-OOS-07 | **Várias instâncias** de processamento em paralelo | "Problema do futuro, não agora." | [09:13] Diego |
| PRD-OOS-08 | **Outros tipos de evento** (ex.: criação de pedido) | Só a mudança de status foi discutida (`order.status_changed`) *(interpretação, AMB-11)* | [09:43] Diego |

### Em observação (questão em aberto)

O **controle de volume de envio por cliente** (rate limiting) não é implementado nesta fase, mas também não foi descartado. A decisão foi "observar e decidir depois" ([09:39] Diego, [09:39] Larissa). Ver [RFC-OQ-01](RFC.md#questões-em-aberto).

## 5. Requisitos funcionais

**Prioridade** *(avaliação do autor)*. A reunião não priorizou requisitos: todos entraram na estimativa de 3 sprints ([09:46] Larissa, [09:47] Larissa). Regra usada:

- **Alta:** sem ele, o aviso não funciona como a reunião combinou, ou ele foi exigido pela segurança. Todos os itens do resumo de fechamento ([09:48] Larissa) estão aqui.
- **Média:** complementa a operação, mas o aviso funciona sem ele.

Nenhum ficou com prioridade baixa: o que era opcional foi para fora de escopo. Os fluxos estão em linguagem de produto; contratos e códigos de erro estão no [FDD](FDD.md#6-contratos-públicos).

### PRD-FR-01: Aviso de mudança de status

A plataforma **avisa** o cliente quando o status de um pedido dele muda, chamando o endereço cadastrado. O fluxo é só de saída ([09:00] Marcos, [09:02] Marcos).

**Fluxo principal**
- O pedido muda de status, e a plataforma registra o aviso junto com a mudança.
- O aviso sai em segundo plano em menos de 10s (PRD-NFR-01) e entra no histórico (PRD-FR-12).

**Fluxos alternativos e exceções**
- Nenhum endereço ativo escolheu o status: não há aviso (PRD-FR-04).
- Vários endereços inscritos: cada um recebe o seu aviso *(interpretação, AMB-04)*.

**Erros previstos**
- O aviso não pode ser registrado: a mudança de status é desfeita ([09:40] Bruno).

**Prioridade:** Alta.

### PRD-FR-02: Cadastro de endereço

O cliente **cadastra** um endereço pela API, com os status de interesse. A plataforma gera a secret e a entrega na criação ([09:31] Marcos).

**Fluxo principal**
- O usuário informa o cliente, o endereço e os status. O cliente vem nos dados do cadastro, não do login ([09:32] Larissa).
- A plataforma gera a secret e a devolve só nessa resposta *(interpretação, AMB-10)*.

**Fluxos alternativos e exceções**
- O mesmo cliente pode ter vários endereços (PRD-CEN-08).

**Erros previstos**
- Endereço sem https: recusado (PRD-FR-05). Cliente inexistente ou dados inválidos: recusado *(proposta)*.
- Usuário não autenticado: acesso negado ([09:48] Larissa).

**Prioridade:** Alta.

### PRD-FR-03: Gestão dos endereços

O cliente **edita, remove e lista** os endereços de um cliente, e pode **desativá-los e reativá-los** *(interpretação de "estado ativo", [09:21] Bruno)* ([09:33] Bruno).

**Fluxo principal**
- O usuário lista os endereços, edita o endereço ou os status de interesse, ou remove o que não usa mais.

**Fluxos alternativos e exceções**
- Desativação: sem avisos novos, e os pendentes ficam retidos (PRD-CEN-09). Na reativação, os retidos voltam a sair *(proposta)*.
- Remoção com avisos pendentes: eles vão para a fila de falhas sem envio *(proposta)*.

**Erros previstos**
- Endereço inexistente ou removido: "não encontrado" *(proposta)*.

**Prioridade:** Alta.

### PRD-FR-04: Filtro por status

Cada endereço recebe **apenas os status escolhidos** ([09:33] Marcos, [09:34] Bruno).

**Fluxo principal**
- Na mudança de status, só os endereços ativos que escolheram o novo status recebem aviso.

**Fluxos alternativos e exceções**
- Nenhum endereço escolheu o status: nada é registrado nem aparece no histórico ([09:34] Bruno).
- Mudança nos status escolhidos: vale para as próximas mudanças de pedido *(proposta)*.

**Erros previstos**
- Status inexistente, ou "pendente", que nunca é destino de mudança: recusado *(proposta)*.

**Prioridade:** Alta. O filtro faz parte do cadastro com os status de interesse (PRD-FR-02).

### PRD-FR-05: Somente endereços https

Só são aceitos endereços **https**. Os demais são recusados no cadastro ([09:23] Sofia).

**Fluxo principal**
- No cadastro e na edição, a plataforma confere o https.

**Fluxos alternativos e exceções**
- Endereços que apontam para a rede interna da plataforma também são recusados *(proposta do FDD, sujeita à revisão de segurança)*.

**Erros previstos**
- Endereço http: erro de validação ([09:23] Sofia).

**Prioridade:** Alta.

### PRD-FR-06: Assinatura dos avisos

Cada aviso é **assinado** com a secret do endereço, para o cliente confirmar origem e integridade ([09:19] Sofia, [09:20] Sofia).

**Fluxo principal**
- A plataforma assina cada aviso, e o cliente verifica a assinatura com a mesma secret ([09:20] Sofia).

**Fluxos alternativos e exceções**
- Na carência de uma troca de secret, o aviso traz as duas assinaturas *(interpretação, AMB-15)*.

**Erros previstos**
- Assinatura que não confere indica aviso forjado ou adulterado ([09:19] Sofia). Recusá-lo cabe ao cliente.

**Prioridade:** Alta.

### PRD-FR-07: Troca de secret

O cliente **troca a secret** pela API, e a anterior vale por mais 24h ([09:21] Sofia).

**Fluxo principal**
- A plataforma gera a nova secret e a mostra uma única vez *(interpretação, AMB-10)*. Por 24h, valem a nova e a anterior.

**Fluxos alternativos e exceções**
- Suspeita de vazamento: revogação imediata, sem as 24h (PRD-CEN-04) *(proposta, depende da revisão de segurança)*.

**Erros previstos**
- Nova troca durante a carência: recusada, para não invalidar na hora a secret em uso *(proposta, [FDD FLUXO-07](FDD.md#fdd-fluxo-07-rotação-de-secret))*.
- Endereço inexistente ou removido: "não encontrado" *(proposta)*.

**Prioridade:** Alta.

### PRD-FR-08: Identificação do aviso

Cada aviso traz um **identificador único**, que se repete nos reenvios, e informa **de qual cadastro** veio ([09:25] Diego, [09:44] Sofia).

**Fluxo principal**
- O cliente guarda os identificadores já processados e descarta as repetições (PRD-CEN-05).

**Fluxos alternativos e exceções**
- O identificador se mantém nas retentativas ([09:25] Diego) e no reprocessamento manual *(interpretação, AMB-19)*.

**Erros previstos**
- Cliente que não descarta repetições processa o aviso duas vezes (PRD-RISK-02).

**Prioridade:** Alta.

### PRD-FR-09: Conteúdo do aviso

O aviso traz os **dados essenciais da mudança**: pedido, número, status anterior e novo, cliente, momento e valor total. **Não** traz os itens ([09:43] Diego).

**Fluxo principal**
- O aviso descreve o pedido como estava no momento da mudança ([09:52] Larissa). Os itens, se necessários, vêm de uma consulta ao pedido ([09:43] Diego).

**Fluxos alternativos e exceções**
- Reenvios repetem o mesmo conteúdo, mesmo que o pedido mude depois ([09:52] Larissa).

**Erros previstos**
- Aviso acima de 64KB: não é enviado e aparece como erro no histórico (PRD-NFR-06).

**Prioridade:** Alta.

### PRD-FR-10: Retentativas automáticas

Se o cliente não responder em **até 10s**, ou não responder com sucesso, a plataforma **tenta de novo**, em intervalos crescentes, por ~15h ([09:15] Diego, [09:17] Diego, [09:42] Diego). Considerar sucesso apenas a resposta 2xx é *(interpretação, AMB-17)*.

**Fluxo principal**
- Depois de uma falha, a plataforma tenta de novo após 1min, 5min, 30min, 2h e 12h, e para no primeiro sucesso ([09:17] Larissa).

**Fluxos alternativos e exceções**
- Endereço desativado: as tentativas ficam suspensas, sem ser consumidas *(proposta)*.
- Processo de envio parado: os avisos já registrados esperam e saem quando ele volta *(inferência do registro na mesma transação, [09:06] Diego)*.

**Erros previstos**
- Tempo esgotado, resposta sem sucesso ou falha de rede contam como falha ([09:42] Diego). Se a última retentativa falha, o aviso vai para a fila de falhas (PRD-FR-11).

**Prioridade:** Alta.

### PRD-FR-11: Fila de falhas e reprocessamento

Avisos que esgotam as tentativas vão para uma **fila de falhas**. Um administrador pode consultá-la *(proposta)* e **reprocessar** os avisos, e a plataforma registra quem fez isso ([09:18] Diego, [09:36] Sofia).

**Fluxo principal**
- O aviso esgotado entra na fila com o motivo. Um administrador o reprocessa, e a plataforma registra quem fez ([09:36] Sofia).

**Fluxos alternativos e exceções**
- Avisos acima de 64KB entram na fila sem envio *(interpretação, AMB-03)*.

**Erros previstos**
- Usuário sem papel de administrador: acesso negado ([09:36] Sofia).
- Aviso acima de 64KB, já reprocessado ou de endereço removido ou inativo: recusado *(proposta)*.

**Prioridade:** Alta.

### PRD-FR-12: Histórico de envios

O cliente consulta os **últimos 100 envios** de um endereço, com resultado, conteúdo, resposta e tempo ([09:34] Marcos). A contagem por endereço e por tentativa é *(interpretação, AMB-24 e AMB-05)*.

**Fluxo principal**
- A plataforma mostra os últimos 100 envios do endereço, do mais recente para o mais antigo *(proposta)*.

**Fluxos alternativos e exceções**
- Avisos que foram para a fila de falhas sem envio também aparecem, como erro *(proposta)*.

**Erros previstos**
- Endereço inexistente: "não encontrado" *(proposta)*.

**Prioridade:** Média.

## 6. Requisitos não funcionais

Agrupados pelas categorias do modelo do curso.

**Performance**
- **PRD-NFR-01 Latência:** o 1º envio começa em menos de 10s após a mudança (PRD-MET-01) ([09:02] Marcos, [09:10] Larissa).

**Disponibilidade**
- **PRD-NFR-08 Disponibilidade:** a reunião não definiu meta *(hipótese: a mesma da API do OMS, a confirmar com a liderança técnica)*. Uma parada do processo de envio atrasa os avisos, mas não os perde, porque eles já estão registrados *(inferência, [09:06] Diego, [09:11] Diego)*.

**Segurança e autorização**
- **PRD-NFR-05 Segurança:** https obrigatório, secret única por endereço e assinatura HMAC-SHA256 ([09:20] Sofia, [09:21] Sofia, [09:23] Sofia).
- **PRD-NFR-09 Autorização:** a gestão de endereços fica aberta a qualquer usuário autenticado, "por enquanto" ([09:37] Sofia). O reprocessamento exige o papel de administrador ([09:36] Sofia). O risco dessa abertura está em PRD-RISK-05.

**Observabilidade**
- **PRD-NFR-10 Acompanhamento:** o cliente acompanha as entregas dele pelo histórico (PRD-FR-12). O time acompanha as métricas da [seção 3](#3-objetivos-e-métricas-de-sucesso) pelos logs que o projeto já usa ([09:29] Bruno) e por consultas ao banco *(proposta, [FDD-OBS-03](FDD.md#fdd-obs-03-métricas-derivadas-proposta))*.

**Confiabilidade e integridade de dados**
- **PRD-NFR-02 Isolamento:** a lentidão ou indisponibilidade do cliente nunca trava nem desfaz uma mudança de status ([09:04] Bruno).
- **PRD-NFR-03 Consistência:** para cada endereço ativo inscrito, a mudança de status e o registro do aviso acontecem juntos. Se o aviso não puder ser registrado, a mudança é desfeita ([09:40] Bruno, [09:41] Diego).
- **PRD-NFR-04 Garantia de entrega e ordem:** cada aviso é entregue **ao menos uma vez**, então o cliente deve descartar duplicatas ([09:24] Diego, [09:25] Sofia). Os avisos de um mesmo pedido saem na ordem em que aconteceram, com uma única instância de processamento, mas não há ordem global ([09:12] Diego, [09:13] Larissa). Durante as retentativas, um aviso posterior pode chegar antes *(interpretação, AMB-09)*.

**Compatibilidade e portabilidade**
- **PRD-NFR-06 Tamanho:** avisos acima de 64KB não são enviados e contam como erro ([09:23] Sofia, [09:24] Larissa).
- **PRD-NFR-07 Sem infraestrutura nova:** mesmo banco e mesma base técnica. O único componente novo é um processo de envio ([09:07] Diego, [09:11] Diego, [09:30] Larissa).

**Compliance**
- **PRD-NFR-11 Auditoria:** cada reprocessamento registra quem o fez, como trilha de auditoria ([09:36] Sofia). A reunião não tratou de outra exigência regulatória.

**Acessibilidade**
- Não se aplica: esta fase não tem interface visual, só endpoints (PRD-OOS-02).

## 7. Arquitetura e abordagem

Visão de produto. Os componentes estão detalhados no [RFC](RFC.md#proposta-técnica) e, no nível de implementação, no [FDD](FDD.md).

**Abordagem**
- **PRD-ARQ-01:** o aviso é registrado na mesma operação que muda o status do pedido e é enviado depois, em segundo plano ([09:06] Diego, [09:40] Bruno).
- **PRD-ARQ-02:** um processo de envio separado busca os avisos pendentes em intervalos curtos, dentro da meta de 10s ([09:09] Diego, [09:10] Larissa).

**Componentes**
- **PRD-ARQ-03 API do OMS**, com um módulo novo para gestão de endereços, histórico e reprocessamento ([09:27] Bruno).
- **PRD-ARQ-04 Banco de dados atual**, com os cadastros de endereço, os avisos pendentes e a fila de falhas ([09:07] Diego, [09:17] Larissa, [09:21] Bruno).
- **PRD-ARQ-05 Processo de envio (worker)**, novo e separado da API, para não cair junto quando a API reinicia ([09:11] Diego).

**Integrações**
- **PRD-ARQ-06 Mudança de status de pedido** no OMS: é onde o aviso nasce ([09:40] Bruno).
- **PRD-ARQ-07 Sistemas dos clientes:** recebem os avisos por https e verificam a assinatura ([09:20] Sofia, [09:23] Sofia).
- **PRD-ARQ-08 Portal de desenvolvedor:** documenta a integração ([09:26] Marcos, [09:40] Marcos).

## 8. Decisões e trade-offs principais

Cada decisão tem um ADR com o contexto e as alternativas descartadas.

### PRD-DEC-01 Decisão: registrar o aviso junto com a mudança de status e enviá-lo em segundo plano
- **Justificativa:** nenhum aviso registrado se perde, e um cliente lento nunca trava a plataforma ([09:04] Bruno, [09:06] Diego).
- **Trade-off:** o envio é quase em tempo real, não instantâneo. Se o aviso não puder ser registrado, a mudança de status é desfeita ([09:40] Bruno).
- **ADR:** [ADR-001](adrs/ADR-001-outbox-no-mysql.md), [ADR-002](adrs/ADR-002-worker-separado-em-polling.md)

### PRD-DEC-02 Decisão: retentar por ~15h e depois mandar para a fila de falhas
- **Justificativa:** cobre indisponibilidades de horas, como a manutenção de 2h que um cliente já teve ([09:16] Diego).
- **Trade-off:** depois disso, o reenvio é manual, e o cliente não recebe alerta ([09:37] Larissa).
- **ADR:** [ADR-003](adrs/ADR-003-retry-backoff-e-dlq.md)

### PRD-DEC-03 Decisão: assinar com uma secret por endereço
- **Justificativa:** a origem é verificável, e um vazamento atinge só um endereço ([09:21] Sofia).
- **Trade-off:** o cliente precisa implementar a verificação ([09:20] Sofia).
- **ADR:** [ADR-004](adrs/ADR-004-hmac-sha256-secret-por-endpoint.md)

### PRD-DEC-04 Decisão: entregar ao menos uma vez
- **Justificativa:** não exige coordenação entre os dois lados ([09:25] Diego).
- **Trade-off:** o cliente precisa descartar duplicatas ([09:25] Sofia).
- **ADR:** [ADR-005](adrs/ADR-005-at-least-once-com-x-event-id.md)

### PRD-DEC-05 Decisão: construir com os padrões e a infraestrutura atuais
- **Justificativa:** consistência com o código existente, sem dependências novas ([09:30] Larissa).
- **Trade-off:** limitações herdadas, como permissões sem escopo por cliente (PRD-RISK-05).
- **ADR:** [ADR-006](adrs/ADR-006-reuso-dos-padroes-do-projeto.md)

### PRD-DEC-06 Decisão: o aviso reflete o pedido no momento da mudança
- **Justificativa:** avisos coerentes e idênticos em todo reenvio ([09:52] Larissa).
- **Trade-off:** os dados do pedido ficam guardados, e o arquivamento não entra nesta fase ([09:08] Diego).
- **ADR:** [ADR-007](adrs/ADR-007-payload-snapshot-na-insercao.md)

## 9. Dependências

Todas foram combinadas na reunião. O tipo é a classificação do modelo do curso.

### PRD-DEP-01 Produto: portal de desenvolvedor
Marcos (PM) documenta em destaque a garantia "ao menos uma vez", como integrar via API e a limitação de ordem ([09:26] Marcos, [09:40] Marcos, [09:13] Larissa). Sem isso, o cliente não sabe que precisa descartar duplicatas.

### PRD-DEP-02 Segurança: revisão de HMAC e geração de secret
Sofia (Segurança) revisa o código por pelo menos 2 dias úteis antes do deploy ([09:46] Sofia, [09:49] Sofia). A revisão precisa ser agendada e bloqueia a subida.

### PRD-DEP-03 Comercial: prazo e comunicação com os clientes
Marcos (PM) confirma o prazo com a Atlas e atualiza os clientes ([09:47] Marcos, [09:49] Marcos). O prazo final depende dessa confirmação (PRD-MET-02).

### PRD-DEP-04 Engenharia: revisão técnica antes da implementação
Larissa abre o documento de design e marca uma sessão de revisão com Bruno e Diego antes de começar a codar ([09:50] Larissa).

### PRD-DEP-05 Cliente externo: preparo do sistema que recebe os avisos
Cada cliente B2B precisa de um endereço https, responder em até 10s, validar a assinatura e descartar duplicatas ([09:23] Sofia, [09:42] Diego, [09:20] Sofia, [09:25] Diego).

## 10. Riscos e mitigação

Probabilidade, impacto e plano de contingência são *(avaliação do autor)*. A reunião não os quantificou.

### PRD-RISK-01: a Atlas migra para o concorrente por atraso na entrega
- **Probabilidade:** média
- **Impacto:** alto. Perda de um dos três clientes que pediram a funcionalidade ([09:00] Marcos, [09:45] Marcos).
- **Mitigação:**
  - agendar cedo a revisão de segurança ([09:46] Sofia);
  - acompanhar o prazo com a Atlas ([09:47] Marcos);
  - validar contra o prazo, na revisão técnica, os acréscimos *(propostos)* do FDD, porque a estimativa de 3 sprints considerou o escopo da reunião ([09:46] Larissa).
- **Plano de contingência:** primeiro, adiar as propostas do FDD que não são exigência da reunião nem da segurança ([FDD §15](FDD.md#15-propostas-além-da-reunião)). Se ainda faltar prazo, negociar com a Atlas uma entrega em duas etapas, com o histórico de envios (PRD-FR-12, prioridade média) na segunda. A revisão de segurança não é cortada.

### PRD-RISK-02: o sistema do cliente é impactado pelos avisos
O cliente não valida a assinatura, não descarta duplicatas ou recebe rajadas de avisos sem controle de volume.
- **Probabilidade:** média
- **Impacto:** médio. Processamento repetido ou indevido do lado do cliente ([09:25] Sofia, [09:38] Diego).
- **Mitigação:**
  - destacar no portal a garantia "ao menos uma vez" e o passo a passo da validação ([09:26] Marcos);
  - observar os envios por cliente para decidir sobre o controle de volume ([09:39] Larissa, [RFC-OQ-01](RFC.md#questões-em-aberto)).
- **Plano de contingência:** desativar o endereço do cliente afetado, o que retém os avisos pendentes por até 24h *(proposta do FDD)*, e reabrir a decisão sobre o controle de volume. Enquanto o endereço está inativo, mudanças novas não geram aviso, e o cliente reconcilia pela API (PRD-RISK-04).

### PRD-RISK-03: vazamento de secret, como já aconteceu com um cliente
- **Probabilidade:** média
- **Impacto:** alto. Quem tem a secret consegue forjar avisos para aquele endereço ([09:19] Sofia, [09:22] Diego).
- **Mitigação:**
  - secret única por endereço ([09:21] Sofia);
  - troca planejada com carência de 24h ([09:21] Sofia);
  - revogação imediata para vazamento *(proposta do FDD, a avaliar na revisão de segurança, [09:46] Sofia)*.
- **Plano de contingência:** se a revogação imediata não for aprovada, remover o endereço comprometido e cadastrar outro, que nasce com secret nova.

### PRD-RISK-04: o cliente não percebe as falhas
O cliente não recebe alerta quando os avisos falham, e as mudanças ocorridas com o endereço desativado não geram aviso.
- **Probabilidade:** média
- **Impacto:** médio. O cliente perde mudanças de status sem saber ([09:37] Larissa, [09:21] Bruno).
- **Mitigação:**
  - histórico de entregas e reprocessamento manual (PRD-FR-11, PRD-FR-12);
  - orientação *(proposta)* de não desativar o endereço durante manutenção curta, porque as retentativas de ~15h já cobrem esse caso ([09:16] Diego, [FDD-RISK-13](FDD.md#13-riscos-e-mitigação)).
  - O e-mail é item adiado (PRD-OOS-01), não mitigação.
- **Plano de contingência:** contato direto do produto com o cliente afetado e reprocessamento da fila de falhas por um administrador, depois que o cliente corrigir o problema.

### PRD-RISK-05: permissões amplas
Qualquer usuário autenticado gerencia endereços de qualquer cliente e pode passar a receber os dados de pedidos de outro cliente *(interpretação, ADR-006-CON-01)*.
- **Probabilidade:** média
- **Impacto:** alto. Exposição de dados de pedidos entre clientes ([09:32] Larissa).
- **Mitigação:**
  - risco aceito "por enquanto" ([09:37] Sofia), com o endurecimento em aberto e sem data ([RFC-OQ-03](RFC.md#questões-em-aberto));
  - levar o tema à revisão de segurança *(proposta)*: o escopo declarado dela é HMAC e secret.
- **Plano de contingência:** se houver uso indevido, antecipar o endurecimento das permissões (RFC-OQ-03).

## 11. Critérios de aceitação

Checklist do que define a funcionalidade como pronta, em comportamentos observáveis pelo cliente ou pelo administrador. Os critérios técnicos, verificáveis por teste automatizado, estão em [FDD §12](FDD.md#12-critérios-de-aceite-técnicos).

- [ ] **PRD-AC-01:** um cliente inscrito em "enviado" recebe o aviso quando um pedido passa para "enviado", e o horário de envio informado no aviso fica a menos de 10s do horário da mudança ([09:02] Marcos, [09:33] Marcos).
- [ ] **PRD-AC-02:** o cliente não recebe avisos de status que não escolheu nem de endereços desativados ([09:34] Bruno).
- [ ] **PRD-AC-03:** um cliente fora do ar por 2h recebe os avisos do período nas tentativas seguintes, sem intervenção manual ([09:16] Diego).
- [ ] **PRD-AC-04:** a mudança de status conclui com sucesso mesmo com o endereço do cliente fora do ar ou lento ([09:04] Bruno).
- [ ] **PRD-AC-05:** o cliente valida a assinatura com a sua secret. Depois de uma troca planejada, a secret anterior continua aceita por 24h ([09:20] Sofia, [09:21] Sofia).
- [ ] **PRD-AC-06:** um endereço sem https é recusado ([09:23] Sofia).
- [ ] **PRD-AC-07:** o cliente reconhece um aviso repetido pelo identificador e sabe de qual cadastro ele veio ([09:25] Diego, [09:44] Sofia).
- [ ] **PRD-AC-08:** o cliente vê os últimos 100 envios de um endereço, com resultado, resposta e tempo ([09:34] Marcos).
- [ ] **PRD-AC-09:** só um administrador reprocessa a fila de falhas, e a plataforma registra quem o fez ([09:36] Sofia).
- [ ] **PRD-AC-10:** o aviso traz os dados essenciais da mudança e não traz os itens do pedido ([09:43] Diego).
- [ ] **PRD-AC-11:** um aviso que continua falhando é reenviado em intervalos crescentes e, depois de ~15h, aparece na fila de falhas ([09:17] Diego, [09:18] Diego).
- [ ] **PRD-AC-12:** se o aviso de um endereço ativo inscrito não puder ser registrado, a mudança de status não acontece ([09:40] Bruno).
- [ ] **PRD-AC-13:** duas mudanças seguidas do mesmo pedido chegam na ordem em que aconteceram, quando entregues de primeira ([09:12] Diego).
- [ ] **PRD-AC-14:** um aviso acima de 64KB não é enviado e aparece como erro no histórico do endereço ([09:24] Larissa).

## 12. Estratégia de testes e validação

### Tipos de teste obrigatórios

- **Testes ponta a ponta**, previstos na estimativa ([09:46] Larissa). Cobrem os critérios técnicos do [FDD §12](FDD.md#12-critérios-de-aceite-técnicos), com banco real e um servidor de teste no papel do cliente, no mesmo padrão dos testes atuais do projeto.
- **Regressão:** os testes existentes de pedidos e autenticação continuam passando.
- **Revisão de segurança:** Sofia revisa HMAC e geração de secret antes do deploy ([09:46] Sofia), com os itens derivados de [RFC-OQ-04](RFC.md#questões-em-aberto).

### Estratégia de validação

1. **Validação com os clientes** *(proposta)*. É feita com os 3 clientes solicitantes, começando pela Atlas por causa do prazo, seguindo o portal ([09:26] Marcos).
2. **Medição antes e depois.**
   - Antes do lançamento, registrar a linha de base da PRD-MET-05.
   - Depois, acompanhar três indicadores:
     - PRD-MET-01, pelas métricas de entrega do [FDD §9](FDD.md#9-observabilidade);
     - PRD-MET-05, pelos logs de requisição;
     - PRD-MET-06, pela fila de falhas.
   - Esses dados alimentam as decisões adiadas, cujo critério ainda está em aberto ([RFC-OQ-01](RFC.md#questões-em-aberto), [RFC-OQ-05](RFC.md#questões-em-aberto)).
