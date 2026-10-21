# Prompts utilizados

Registro dos prompts escritos para conduzir a IA, na ordem em que foram usados. Cada fase do workflow (ver [README](../../README.md)) acrescenta seus prompts aqui antes de gerar o documento correspondente.

Convenção: `P-NN` = prompt; "Ferramenta" indica quem executou (sessão principal do Claude Code ou subagente, com o modelo).

---

## P-01: Mapeamento do código existente

- **Fase:** 0 (planejamento)
- **Ferramenta:** Claude Code, subagente `Explore` (somente leitura)
- **Objetivo:** obter caminhos reais, nomes de símbolos e números de linha para que nenhum documento cite código inexistente.

```text
Repositório: <raiz> (Node.js + TypeScript, Express, Prisma/MySQL, Zod, Pino, Vitest).
Vou escrever design docs de uma nova feature de webhooks de notificação de pedidos
(outbox + worker) e preciso de um mapa PRECISO do código existente, com caminhos reais,
nomes reais de símbolos e números de linha. Não invente nada; se algo não existir,
diga que não existe.

Responda, com caminho:linha para cada item:
1. order.service.ts: assinatura e corpo resumido de changeStatus — como a transação é
   aberta, o que ela faz, quem é o "changedBy", que erros lança. Cite as linhas exatas
   onde um publishWebhookEvent(tx, ...) seria chamado.
2. order.status.ts: enum de status e a lista completa de transições permitidas.
3. prisma/schema.prisma: modelos, tipo de id, campos de Order, enum de Role,
   convenções de nome (@@map?).
4. shared/errors/*: AppError (construtor, campos), classes derivadas e TODOS os códigos
   de erro existentes no projeto, com onde são definidos.
5. error.middleware.ts: tratamento de AppError, ZodError, Prisma e formato JSON de erro.
6. auth.middleware.ts: nomes exatos (authenticate? requireRole?), assinatura, req.user.
7. logger e request-logger: configuração do Pino; existe request id / correlation id?
8. shared/http/response.ts: helpers de resposta.
9. routes/index.ts e app.ts: registro de módulos, prefixo de rotas, exemplo de *.routes.ts.
10. validate.middleware.ts e um *.schemas.ts: padrão Zod.
11. server.ts, config/database.ts, config/env.ts: entrypoint, PrismaClient, env.
12. package.json: scripts e dependências relevantes (há cliente HTTP? crypto?).
13. tests/*: padrão de testes (supertest? banco real?).
14. .env.example e docker-compose.yml.
15. Confirme que NÃO existe nenhum mecanismo de eventos/fila/webhook no código.

Termine com "Pontos de integração para o módulo de webhooks" (arquivo real → uso).
```

**Resultado:** mapa consolidado em [inventario.md § Mapa do código](inventario.md#9-mapa-do-código-verificado). Achados que mudaram o rumo estão em [iteracoes.md](iteracoes.md) (IT-01).

---

## P-02: Extração cega da transcrição

- **Fase:** 0
- **Ferramenta:** Claude Code, subagente `Explore` com **Sonnet** (modelo diferente da sessão principal, para não herdar os mesmos vieses)
- **Objetivo:** uma segunda extração independente, feita sem ver o inventário da sessão principal, para comparar as duas e achar omissões e timestamps errados.

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

---

## P-03: Revisor adversarial (template reutilizado em todas as fases)

- **Fase:** 1 a 6, uma vez por documento gerado
- **Ferramenta:** Claude Code, subagente com **Sonnet** revisando texto gerado pelo Opus
- **Objetivo:** caçar alucinação, vazamento de escopo, duplicação entre documentos e citações de código erradas antes do checkpoint humano.

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

---

## P-04: Geração dos ADRs

- **Fase:** 1
- **Ferramenta:** Claude Code, sessão principal (Opus 5.5)
- **Objetivo:** produzir de 5 a 8 ADRs que registrem as decisões fechadas na reunião, cada uma no seu arquivo, sem repetir o detalhamento que pertence ao FDD.

```text
Gere os ADRs do Sistema de Webhooks a partir EXCLUSIVAMENTE de
docs/processo/inventario.md (decisões D-xx, alternativas ALT-xx, ambiguidades AMB-xx,
mapa do código, glossário e matriz de fronteira). Não releia a transcrição para
"completar" nada: se algo não está no inventário, não entra.

Um arquivo por decisão, em docs/adrs/ADR-NNN-titulo-em-kebab-case.md:
  001 outbox no MySQL (D-01, D-02, D-20; ALT-01, ALT-02, ALT-11)
  002 worker separado em polling (D-03..D-05; ALT-03, ALT-04; OOS-06)
  003 retry com backoff e DLQ (D-07..D-10; ALT-05..ALT-07; AMB-02, AMB-17, AMB-19)
  004 HMAC-SHA256 com secret por endpoint (D-11..D-13; ALT-08; AMB-07, AMB-14, AMB-15)
  005 at-least-once com X-Event-Id (D-14; ALT-09; AMB-04, AMB-16, AMB-23)
  006 reuso dos padrões do projeto (D-06, D-15..D-17, D-19; ALT-12, ALT-13, ALT-15)
  007 payload snapshot na inserção (D-18; ALT-14)

Formato MADR em PT-BR, com estas seções, nesta ordem:
  Status | Contexto | Decisão | Alternativas Consideradas | Consequências
  (### Positivas, ### Negativas, ### Trade-off) | Referências
Regras:
- Cada alternativa recebe um rótulo ADR-NNN-ALT-NN, diz quem propôs ou cogitou e
  dá o motivo do descarte com timestamp. Uma alternativa "plausível" que não foi
  discutida é permitida só quando marcada como tal.
- Consequências negativas precisam ser reais e específicas (custos, riscos,
  limitações), não genéricas. O trade-off fica numa frase explícita
  "aceitamos X em troca de Y".
- Toda interpretação de ponto ambíguo é marcada como "interpretação adotada (AMB-xx)".
- O ADR-006 cita caminhos REAIS do mapa do código. Arquivos novos vêm marcados
  como "(novo)".
- Altura: o ADR explica POR QUE. Contratos HTTP, DDL, pseudo-código e matriz de erros
  ficam no FDD; aqui no máximo nomes (tabela, header, função).
- Opiniões ("Stripe faz assim", "99%") são atribuídas a quem falou.
- Status "Aceito". A data é a da reunião ("quinta-feira"), sem dia inventado.
Depois, reescreva docs/adrs/README.md como índice e acrescente as linhas dos ADRs
em docs/TRACKER.md.
```

---

## P-05: Geração do RFC

- **Fase:** 2
- **Ferramenta:** Claude Code, sessão principal (Opus 5.5)
- **Objetivo:** consolidar a proposta técnica para revisão do time. É um documento curto, em nível de arquitetura, que **referencia** os ADRs em vez de repeti-los.

```text
Escreva docs/RFC.md: um RFC de 2 a 4 páginas (1.000 a 2.000 palavras, sem contar
blocos de código) que a Larissa submeteria ao time para revisão, conforme o
compromisso registrado em [09:50] Larissa.
Fontes: SOMENTE docs/processo/inventario.md e os ADRs em docs/adrs/. Os ADRs
estão aprovados: o RFC não decide nada diferente deles.

Seções obrigatórias, nesta ordem:
  Metadados (autor, status "Em revisão", data de redação, revisores = participantes
    da reunião, com o papel de cada um na revisão)
  Resumo (TL;DR)
  Contexto e problema
  Proposta técnica (visão geral: componentes e fluxo, em um diagrama Mermaid)
  Alternativas consideradas
  Questões em aberto
  Impacto e riscos
  Decisões relacionadas
  Próximos passos

Regras de altura (matriz de fronteira, inventário § 11):
- NÃO incluir contratos HTTP, payloads, DDL, nomes de colunas, algoritmos,
  matriz de erros nem variáveis de ambiente. Isso é FDD.
- Cada componente da proposta tem 2 a 4 linhas e um link para o ADR que o justifica.
  Não repetir contexto nem consequências do ADR.
- Problema de negócio e métricas: 1 parágrafo, com link para o PRD.

Regras de conteúdo:
- IDs visíveis: RFC-PROP-NN (componentes), RFC-ALT-NN (alternativas),
  RFC-OQ-NN (questões em aberto), RFC-RISK-NN (riscos), RFC-IMP-NN (impactos).
- Alternativas: no mínimo 2, todas REALMENTE discutidas e descartadas na reunião,
  em tabela com proponente, trade-off do descarte e timestamp.
- Questões em aberto: no mínimo 2, só pontos LEVANTADOS na reunião e não
  decididos ou adiados. Para cada uma: estado atual, o que precisa ser decidido
  e quem decide. Pontos derivados pelo autor (ex.: assinar o X-Timestamp) só
  entram como subitem da pauta de segurança, marcados como derivados.
- Riscos: em nível de arquitetura, com mitigação proposta e referência.
- Interpretações (AMB-xx) aparecem como tal.
- Sem datas absolutas inventadas para o prazo (AMB-22).
```

---

## P-06: Geração do FDD

- **Fase:** 3
- **Ferramenta:** Claude Code, sessão principal (Opus 5.5), depois de ler os arquivos de integração no código (`app.ts`, `routes/index.ts`, `server.ts`, `env.ts`, middlewares, erros, logger, `schema.prisma`, `tests/setup.ts`)
- **Objetivo:** documento de implementação, acionável o bastante para alguém começar a programar. É o único documento do pacote que desce a contratos, modelo de dados e algoritmos.

```text
Escreva docs/FDD.md para o Sistema de Webhooks. Fontes: docs/processo/inventario.md,
os ADRs aprovados, o RFC aprovado e o CÓDIGO REAL. Abra cada arquivo antes de citar
um nome, uma linha ou um comportamento. Nada contradiz os ADRs.

Seções obrigatórias:
- Contexto e motivação técnica
- Objetivos técnicos
- Escopo e exclusões
- Modelo de dados (proposto)
- Fluxos detalhados: publicação na outbox, ciclo do worker, entrega, retry, DLQ,
  replay e rotação, com diagramas Mermaid de sequência e de estado
- Contratos públicos: endpoints sob /api/v1, cada um com request e response de
  exemplo, headers, status codes e semântica; e o contrato de SAÍDA (payload e
  headers do POST ao cliente)
- Matriz de erros com códigos WEBHOOK_* (classe base, HTTP, quando ocorre). Inclua
  os erros internos do worker
- Estratégias de resiliência
- Observabilidade: métricas, logs e tracing, SEM infraestrutura nova
- Integração com o sistema existente: arquivo por arquivo, com o que muda e onde
- Dependências e compatibilidade
- Critérios de aceite técnicos, verificáveis por teste
- Riscos e mitigação

Regras:
- IDs visíveis em todos os itens: FDD-MOD, FDD-FLUXO, FDD-CONTRATO, FDD-ERR,
  FDD-RES, FDD-OBS, FDD-INT, FDD-DEP, FDD-AC, FDD-RISK.
- Toda decisão da reunião cita [hh:mm] Nome. Todo detalhe que a reunião NÃO definiu
  (nome de coluna, path de endpoint novo, variável de ambiente, formato do header
  com duas assinaturas, tamanho de lote, mecanismo de instância única…) vem
  marcado "(proposta)", com a justificativa ancorada numa decisão ou no código.
- Use as interpretações AMB-xx do inventário e marque-as como tal.
- Cumpra os compromissos que ADRs e RFC remetem ao FDD:
  - concorrência sem quebrar a ordem por pedido
  - proteção contra instância dupla
  - monitoramento
  - redact de secret
  - listagem da DLQ
  - outbox sem FK em cascata para orders
  - WEBHOOK_NOT_FOUND estendendo AppError
  - assinatura dupla
  - linhas presas em PROCESSING
  - webhook_deliveries
- Respeite o código: envelope de erro { error: { code, message, details? } },
  campo errorCode, prefixo /api/v1, validate() -> VALIDATION_ERROR,
  paginated(), requireRole, padrão de testes com supertest e MySQL real.
- Nada descartado vira requisito: sem e-mail, sem rate limiting, sem
  multi-worker, sem order.created, sem itens no payload.
```
