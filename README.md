# Design docs com IA: Sistema de Webhooks de Notificação de Pedidos

Esta é a entrega do desafio **"Da Reunião ao Documento: Design Docs Gerados por IA"**. O enunciado original, que ocupava este arquivo, continua no histórico do Git: [README.md no commit `e7f6311`](https://github.com/jeancsbnu/mba-ia-desafio-design-docs-com-ia/blob/e7f6311/README.md).

---

## Sobre o desafio

O ponto de partida era a transcrição de uma reunião técnica de cerca de 55 minutos ([`TRANSCRICAO.md`](TRANSCRICAO.md)). Nela, tech lead, PM, engenharia e segurança definem um **sistema de webhooks** que avisa clientes B2B quando o status de um pedido muda. Junto com a transcrição vinha o código de um Order Management System em Node.js, TypeScript, Prisma e MySQL. Fora a conversa, nada tinha sido registrado. A tarefa foi transformar esse material num pacote de documentação que permita a um time de engenharia começar a implementar: PRD, RFC, FDD, ADRs e um tracker que liga cada item à fala da reunião ou ao arquivo de código de onde ele veio. O código da aplicação não podia ser alterado.

A dificuldade principal não era gerar texto, e sim **não inventar**. A reunião mistura decisões fechadas com ideias descartadas ou adiadas, falas que se corrigem um minuto depois e números que não fecham entre si. Usei a IA como ferramenta principal de produção, no papel de maestro. Eu defini o processo e as revisões e, em cada checkpoint, decidi o que entrava, o que voltava para correção e quando parar.

## Ferramentas de IA utilizadas

| Ferramenta | Papel no processo |
|---|---|
| **Claude Code** (app desktop), sessão principal com **Claude Opus 5.5** | Planejamento das fases no modo de plano. Geração de todos os documentos e aplicação das correções. Escrita do script de validação e dos commits. Também redigiu os prompts, a partir das decisões de processo que tomei. |
| **Subagente Explore** do Claude Code | Mapeou o código com caminhos, símbolos e números de linha reais ([P-01](docs/processo/prompts.md#p-01-mapeamento-do-código-existente)). Isso reduziu o risco de citar código inexistente, mas não o eliminou: o revisor ainda encontrou afirmações erradas sobre o código nos ADRs (IT-06). |
| **Subagente com Claude Sonnet**, na extração cega | Fez uma segunda leitura da transcrição **sem acesso** ao inventário da sessão principal ([P-02](docs/processo/prompts.md#p-02-extração-cega-da-transcrição)). Depois, as duas extrações foram comparadas. |
| **Subagente com Claude Sonnet**, como revisor adversarial | Fez uma revisão por documento, só de leitura ([P-03](docs/processo/prompts.md#p-03-revisor-adversarial-template-reutilizado-em-todas-as-fases) e variantes por fase). Usei um modelo diferente do gerador para reduzir erros em comum. No FDD, o mesmo revisor fez três passadas mantendo o contexto. |
| **Script Node.js**: [`validar-entrega.mjs`](docs/processo/validar-entrega.mjs) | Foi escrito pela IA, mas roda sem IA. Confere os critérios de aceite verificáveis: seções, contagens e IDs, se cada `[hh:mm] Nome` existe literalmente na transcrição, se cada caminho de código existe e se o código continua intocado. |

Todo o pacote foi produzido dentro do Claude Code. Assim, prompts, revisões e correções ficaram no mesmo registro.

## Workflow adotado

### Ordem e fases

Segui a ordem sugerida no enunciado:

1. **Decisões primeiro.** Os ADRs vieram antes de tudo, porque são o esqueleto do restante.
2. **PRD por último**, como consolidação dos demais.
3. **Tracker ao longo do caminho.** Ele foi preenchido a cada fase, e não só no fim.

| Fase | Entrega | Revisão pela IA | Decisão no checkpoint |
|---|---|---|---|
| 0 | [Inventário](docs/processo/inventario.md): decisões, alternativas, requisitos, fora de escopo, questões em aberto, 24 ambiguidades (26 ao final do projeto), mapa do código, glossário e matriz de fronteira | Extração cega com outro modelo, seguida de comparação | Aprovei as interpretações dos pontos ambíguos |
| 1 | [7 ADRs](docs/adrs/README.md) e índice | 16 achados | Aprovei, incluindo uma interpretação que mudou depois da revisão (AMB-13) |
| 2 | [RFC](docs/RFC.md) | 19 achados | Aprovei |
| 3 | [FDD](docs/FDD.md) | 22, 12 e 12 achados, em três passadas | **Pedi a 3ª passada** antes de aprovar. Aceitei incluir um item de SSRF na pauta de segurança do RFC. |
| 4 | [PRD](docs/PRD.md) | 14 achados | **Pedi ajustes**: enxugar o texto, fundir requisitos não funcionais e riscos, e deixar nas dependências só o que foi combinado na reunião |
| — | [Tracker](docs/TRACKER.md) | Validador automático ao fim de cada fase | Linhas acrescentadas dentro dos commits de cada fase |
| 6 | Este README | Revisão de fidelidade aos registros (18 achados) | Aprovação final do README |
| 7 | [Checklist de aceite](docs/processo/checklist-aceite.md) | Revisão cruzada entre todos os documentos: consistência geral atendida e 10 desalinhamentos corrigidos | Merge do PR |

Cada uma das fases 0 a 4 terminou num commit próprio, feito depois da minha aprovação. O tracker avançou dentro desses mesmos commits, e o README tem o seu. No meio do caminho, abri o PR do fork para acompanhar a entrega.

### Como a interação com a IA foi organizada

Em cada documento, o ciclo foi o mesmo:

1. **Prompt da fase**, registrado em [`prompts.md`](docs/processo/prompts.md). Ele define as fontes permitidas, as seções, as regras de altitude e as regras de conteúdo.
2. **Geração** pela sessão principal, a partir do inventário, dos documentos já aprovados e do código.
3. **Revisão adversarial** por outro modelo, sem permissão para editar. O revisor devolve uma tabela de achados classificados com as categorias do P-03: sem fonte, divergente, escopo, altura, código e glossário. As variantes de cada fase acrescentaram categorias como inconsistência, interpretação sem marcação e número inventado.
4. **Correção** dos achados pela sessão principal. Achados sobre código, como a classe `NotFoundError`, o `package.json` e a cascata de chaves estrangeiras, foram conferidos nos arquivos antes da correção. Em seguida, o caso foi registrado em [`iteracoes.md`](docs/processo/iteracoes.md) e o validador rodou de novo.
5. **Checkpoint humano**, seguido do commit.

### Mecanismos contra alucinação

- **Inventário como fonte única.** Nenhum documento pode afirmar algo que não esteja no inventário, acompanhado de `[hh:mm] Nome` ou de um caminho de arquivo.
- **Marcações explícitas.**
  - *(interpretação, AMB-xx)* marca os pontos em que a reunião foi ambígua, como "5 tentativas" contra 5 intervalos de backoff.
  - **(proposta)** marca todo detalhe que a reunião não definiu, como o path de um endpoint novo, o nome de uma coluna ou o mecanismo de instância única do worker.
- **Matriz de fronteira.** Define em que altura cada tema aparece em cada documento. O backoff, por exemplo, é "retentativas por ~15h" no PRD, um link para o ADR-003 no RFC e o algoritmo completo no FDD.
- **IDs visíveis em todos os itens, ligados ao tracker e ao validador.** O tracker fechou com **311 linhas**:
  - 84,2% citam a transcrição, com timestamp e falante validados;
  - 49 apontam para arquivos reais;
  - a cobertura de IDs é de 311/311.

## Prompts customizados

Os oito prompts usados estão em [`docs/processo/prompts.md`](docs/processo/prompts.md). Escolhi os três abaixo porque representam as três camadas do processo: levantar a fonte da verdade, revisar e restringir o que a IA pode afirmar.

### Extração cega da transcrição (P-02)

Este prompt existe porque pedir à mesma IA que revise o próprio inventário tende a só confirmá-lo. A extração independente, feita por outro modelo, achou 5 grupos de erros e omissões no inventário da sessão principal. Um desses grupos tinha 13 ambiguidades que não estavam registradas (IT-04).

```text
Você é um analista de requisitos fazendo uma extração INDEPENDENTE. Leia SOMENTE o
arquivo TRANSCRICAO.md (formato `[hh:mm] Nome: fala`). Não leia nenhum outro arquivo do
repositório. Não use conhecimento externo para completar lacunas.

Cada item DEVE citar a localização exata no formato `[hh:mm] Nome`, copiado
literalmente. Se não houver fala que sustente um item, não o inclua.

Classifique cada item em UMA categoria:
1. DECISÃO FECHADA (indique quem fechou)
2. ALTERNATIVA DESCARTADA (com o motivo literal da rejeição)
3. REQUISITO FUNCIONAL
4. REQUISITO NÃO FUNCIONAL / RESTRIÇÃO (números, segurança, prazos)
5. FORA DE ESCOPO
6. ADIADO / FUTURO
7. QUESTÃO EM ABERTO ("observar", "decidir depois")
8. GANCHO COM O CÓDIGO EXISTENTE
9. AMBIGUIDADE / CONTRADIÇÃO / CORREÇÃO (falas que se contradizem, números que não
   fecham, coisas corrigidas depois, pontos deixados como "X ou Y")
10. LIMITAÇÃO CONHECIDA (garantias explicitamente NÃO dadas)

Seja exaustivo e literal. Atenção especial ao que NÃO entra (5, 6, 7, 10) e às
contradições (9): é onde documentos gerados por IA costumam errar.

Saída: uma tabela por categoria (# | Item | Localização | Observação) + seção
"Números e valores citados".
```

### Revisor adversarial (P-03, template de todas as fases)

Este é o template base. Cada fase acrescentou instruções próprias, todas registradas em [`prompts.md`](docs/processo/prompts.md#p-03-revisor-adversarial-template-reutilizado-em-todas-as-fases). No FDD, o revisor fez o papel de engenheiro sênior e recebeu a lista do que conferir no código. No PRD, fez o papel de PM. Os 95 achados das revisões de documento vieram deste template e das suas variantes.

```text
Você é um revisor adversarial de design docs. Seu trabalho é encontrar problemas,
não elogiar. Documento sob revisão: {ARQUIVO}.
Fontes da verdade: TRANSCRICAO.md e o código em src/, prisma/, tests/, package.json.
Apoio: docs/processo/inventario.md (glossário, matriz de fronteira, interpretações
adotadas).

Para CADA afirmação factual (requisito, decisão, número, restrição, nome de arquivo,
função, tabela, header ou código de erro):
1. Localize a fonte: `[hh:mm] Nome` ou `caminho:linha`. Se não achar → SEM FONTE.
2. Confira se a fonte diz exatamente isso (número, quem, qual opção) → DIVERGENTE.
3. Algo descartado/adiado/em aberto aparece como requisito ou decisão → ESCOPO.
4. O trecho pertence a outro documento segundo a matriz de fronteira → ALTURA.
5. Cita arquivo, símbolo ou comportamento de código inexistente ou errado → CODIGO.
6. Usa nome diferente do glossário → GLOSSARIO.

Detalhes de implementação propostos são aceitáveis no FDD SOMENTE se marcados como
proposta/interpretação e ancorados numa fonte.

Saída: tabela (# | Trecho | Problema | Evidência | Correção sugerida), ordenada por
gravidade, e um veredito de uma linha. Não edite arquivos.
```

### Regras de conteúdo do PRD (trecho do P-07)

O PRD é o documento mais alto nível, e por isso o mais exposto a números "de venda". Este trecho tenta impedir isso. Ele teve uma falha que só a revisão expôs: a lista de números permitidos inclui "3 clientes", que na reunião são os clientes **solicitantes**. A IA transformou esse número em meta, "3 clientes integrados em produção", e o revisor apontou a invenção (IT-11).

```text
- Métricas só com números que vieram da reunião: < 10s, 3 clientes, fim de
  novembro, ~15h, 64KB. Uma métrica sem meta definida na reunião vira
  "indicador de acompanhamento", sem número inventado.
- O rate limiting NÃO entra em "fora de escopo": ele está "em observação"
  (RFC-OQ-01). O e-mail entra como "talvez próxima fase", não como compromisso.
- Opiniões (ex.: "Stripe faz assim") são atribuídas a quem falou.
- Probabilidade e impacto são julgamento do autor e devem ser declarados como tal.
- Toda afirmação cita [hh:mm] Nome ou um documento do pacote.
```

## Iterações e ajustes

O log completo está em [`docs/processo/iteracoes.md`](docs/processo/iteracoes.md). Ele registra 14 iterações, de IT-01 a IT-14.

**Números do processo:**

| Medida | Valor |
|---|---|
| Versões principais de documento | **13**. Conto como versão uma reescrita completa que passou por revisão: inventário (2), ADRs (2), RFC (2), FDD (4) e PRD (3). |
| Achados dos revisores adversariais nos documentos | **95** |
| Erros encontrados pela extração cega | **5 grupos** |
| Achados da revisão de fidelidade deste README (IT-13) | **18** |
| Desalinhamentos entre documentos na revisão cruzada final (IT-14) | **10** |

**Casos principais:**

| # | O que a IA gerou de errado ou raso | Como foi detectado | O que mudou |
|---|---|---|---|
| IT-04 | O inventário da sessão principal tinha três falhas: tratava o **rate limiting como fora de escopo**, quando a decisão foi "observar e decidir depois"; dava como decidido o nome `webhook.worker.ts`, para o qual Bruno deixou duas opções; e omitia o "estado ativo" do cadastro. | Extração cega por outro modelo, comparada com o inventário | O inventário foi corrigido e ganhou 13 ambiguidades novas. O rate limiting passou a aparecer como questão em aberto no inventário, no PRD, no RFC e no FDD. |
| IT-06 | Dois erros sobre o código. O ADR-006 mandava `WEBHOOK_NOT_FOUND` estender `NotFoundError`, mas essa classe **fixa o código `NOT_FOUND`** no construtor (`src/shared/errors/http-errors.ts`). O ADR-004 afirmava que o `package.json` não tem biblioteca criptográfica de terceiros, mas ele tem `bcrypt` e `jsonwebtoken`. | Revisor adversarial. Os dois pontos foram confirmados nos arquivos antes da correção. | As classes de 404 passaram a estender `AppError` diretamente, com a consequência negativa registrada no ADR. A afirmação sobre o `package.json` foi corrigida. |
| IT-07 | O RFC apresentava **4 interpretações como se fossem decisões da reunião**. Também trazia duas citações não literais e uma coluna "Quem decide" com responsáveis que a transcrição não designa. | Revisor adversarial | As interpretações foram marcadas, as citações voltaram ao texto literal e a coluna passou a se chamar "Responsável sugerido" |
| IT-08 | O FDD tinha **4 bugs reais de projeto**:<br>1. o lease do worker vencia no meio do ciclo e deixava dois workers ativos;<br>2. a coluna `TEXT` do MySQL (65.535 bytes) tornava **inalcançável** o limite de 64KB e derrubaria a mudança de status;<br>3. o `X-Request-Id` enviado pelo cliente podia quebrar o `PATCH` de status;<br>4. a "concorrência por endpoint" só deslocava o head-of-line blocking. | Revisor no papel de engenheiro sênior | O worker foi redesenhado em três rotinas: lease com heartbeat, poll desacoplado e tarefa por endpoint. A coluna virou `MediumText` e o id de correlação passou a ser saneado. |
| IT-09/10 | Cada redesenho introduziu problemas novos, cada vez mais específicos: reserva dupla na mesma instância, testes que não rodariam por causa do próprio bloqueio de loopback e um SQL de seleção com custo proporcional ao backlog. | 2ª e 3ª passadas do mesmo revisor. **Pedi a 3ª passada** no checkpoint. | Foi criado um `claimId` por reserva, a seleção passou a ter duas etapas usando só índice e os testes passaram a usar um servidor HTTPS com CA injetada. A contagem foi 22, 12 e 12: parou de cair, mas os achados ficaram menos estruturais a cada passada. A 3ª passada ainda achou 3 problemas bloqueantes. Corrigi os três e encerrei sem uma 4ª passada de confirmação. |
| IT-11 | O PRD **inventou a meta** "3 clientes integrados em produção". Também prometia "nenhum status alterado sem aviso", o que contradiz o FDD, porque cadastro desativado não gera aviso. E tratava a carência de 24h como mitigação de vazamento, quando ela mantém a secret vazada válida. | Revisor no papel de PM | A meta virou "em produção até o fim de novembro", com "3 clientes" marcado como proposta. A garantia passou a valer só para endereço ativo. A troca planejada de secret foi separada da revogação de emergência. |
| IT-05 | O **próprio validador** acusou um falso positivo: contava os IDs de exemplo do enunciado. Depois de corrigido, passou a aprovar fácil demais, porque não via os sub-IDs dos ADRs. | Script (validador) | A medição de cobertura e a regex foram corrigidas |
| IT-02/12 | Ajustes de rumo que **eu** fiz nos checkpoints. Antes de começar, adotei a extração cega, a matriz de fronteira e o revisor com outro modelo. No fim, enxuguei o PRD (−18%) e deixei nas dependências só o que foi combinado na reunião. | Decisão humana | O processo e o PRD mudaram conforme essas decisões |

**O que observei.** As falhas da IA que mais pesaram não foram de escrita. Foram de três tipos:

1. Afirmar com segurança o que não foi decidido.
2. Prometer, nos documentos de alto nível, mais do que a solução garante.
3. Detalhar algo plausível que não funciona, como a coluna `TEXT` com o limite de 64KB.

A revisão por outro modelo pegou esses problemas, documento a documento. O inventário versionado e o validador ajudaram a perceber quando a correção de um documento afetava a rastreabilidade dos outros.

## Como navegar a entrega

```
.
├── README.md                     ← este arquivo: o processo
├── TRANSCRICAO.md                ← fonte (inalterada)
└── docs/
    ├── PRD.md                    ← por quê e o quê
    ├── RFC.md                    ← proposta técnica para revisão do time
    ├── adrs/
    │   ├── README.md             ← índice e convenções
    │   └── ADR-001 … ADR-007     ← uma decisão por arquivo
    ├── FDD.md                    ← como construir
    ├── TRACKER.md                ← origem de cada item (311 linhas)
    └── processo/
        ├── inventario.md         ← fonte da verdade usada na geração
        ├── prompts.md            ← os 8 prompts e as variantes do revisor
        ├── iteracoes.md          ← o que foi corrigido em cada rodada
        ├── checklist-aceite.md   ← critérios do enunciado com evidência
        └── validar-entrega.mjs   ← checagem automática dos critérios
```

**Ordem de leitura sugerida**

1. **[PRD](docs/PRD.md)**: o problema, para quem é, o que entra e o que fica fora.
2. **[RFC](docs/RFC.md)**: a proposta em nível de arquitetura, as alternativas descartadas e as questões em aberto.
3. **[ADRs](docs/adrs/README.md)**: por que cada decisão foi tomada.
4. **[FDD](docs/FDD.md)**: os detalhes de implementação. A seção 10 trata da integração com o código existente.
5. **[Tracker](docs/TRACKER.md)**: de onde veio qualquer item que pareça suspeito.

Para entender o processo, leia o [inventário](docs/processo/inventario.md), depois as [iterações](docs/processo/iteracoes.md) e por fim os [prompts](docs/processo/prompts.md).

**Validação automática.** Requer Node ≥ 20, git e a branch `main` local. Não precisa de pacotes npm.

```bash
node docs/processo/validar-entrega.mjs
```

**Convenções nos documentos**

- `[hh:mm] Nome`: fala da reunião.
- *(interpretação, AMB-xx)*: leitura de um ponto ambíguo. A lista completa está no [inventário, § 8](docs/processo/inventario.md#8-ambiguidades-e-interpretações-adotadas).
- **(proposta)**: detalhe que a reunião não definiu.
- **(novo)**: arquivo que ainda não existe no código.
