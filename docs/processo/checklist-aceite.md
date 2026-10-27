# Checklist de aceite

Revisão final da entrega contra os **Critérios de Aceite** do enunciado. O enunciado está em [`README.md` no commit `e7f6311`](https://github.com/jeancsbnu/mba-ia-desafio-design-docs-com-ia/blob/e7f6311/README.md#critérios-de-aceite).

Cada item traz duas coisas:

- a evidência no pacote;
- quando existe, a checagem automática correspondente em [`validar-entrega.mjs`](validar-entrega.mjs).

Para reproduzir as checagens automáticas, rode:

```bash
node docs/processo/validar-entrega.mjs
```

Última execução, na branch `docs/alinhamento-formato-curso` (fase 8): **39 ok, 0 falhas, 0 pendentes**.

## Formato apresentado no curso (fase 8)

| Critério | Status | Evidência |
|---|---|---|
| PRD e FDD seguem o formato apresentado no curso | ☑ | O PRD segue o esqueleto de PRD do curso: cabeçalho com versão e responsável, problemas priorizados, requisitos com fluxos e prioridade, requisitos não funcionais por categoria, arquitetura e abordagem, decisões com justificativa e trade-off, riscos com plano de contingência e critérios em checklist. O FDD segue o esqueleto de FDD do curso: versão, responsável, suposições e restrições, Tipo, Método e Rota em cada contrato, contrato de função, invariantes, política de fallback, alertas e consultas de acompanhamento, dependências com versão mínima e contingência por risco. Os títulos exigidos pelo enunciado foram mantidos. As páginas do curso consultadas estão listadas em [P-09](prompts.md#p-09-alinhamento-ao-formato-do-curso). |
| RFC no formato do curso | ☑ | O curso não traz modelo de RFC. O RFC segue as seções exigidas pelo enunciado e foi enxugado para ~1.600 palavras, dentro de 2 a 4 páginas. |
| ADRs no formato MADR do curso | ☑ | Os 7 ADRs ganharam "Fatores de decisão" e "Prós e contras das opções", sem perder as seções exigidas pelo enunciado. |

## PRD (`docs/PRD.md`)

| Critério | Status | Evidência |
|---|---|---|
| Arquivo existe e está em Markdown | ☑ | [docs/PRD.md](../PRD.md) |
| Contém todas as seções obrigatórias do requisito 1 | ☑ | Seções 1 a 12 do PRD. Script: "PRD: seções obrigatórias: 13 seções" |
| No mínimo 8 requisitos funcionais discutidos na reunião | ☑ | 12 itens, de PRD-FR-01 a FR-12, todos com `[hh:mm] Nome`. No tracker, as 12 linhas têm fonte `TRANSCRICAO`. |
| Pelo menos 1 objetivo com métrica e meta quantitativa | ☑ | PRD-MET-01: "< 10s" ([09:02] Marcos). PRD-MET-03: "0 mudanças sem aviso". PRD-MET-04: "~15h". |
| "Fora de escopo" lista ≥ 2 itens descartados ou adiados na reunião | ☑ | 8 itens, de PRD-OOS-01 a OOS-08 (o 08, outros tipos de evento, é interpretação AMB-11): e-mail [09:37], painel [09:40], inbound [09:02], arquivamento [09:08], itens no payload [09:43], ordem global/exactly-once [09:13]/[09:25] e multi-worker [09:13]. O rate limiting aparece à parte, como "em observação". |
| "Riscos" com ≥ 2 riscos com probabilidade, impacto e mitigação | ☑ | 5 riscos, de PRD-RISK-01 a RISK-05, com os subitens Probabilidade, Impacto, Mitigação e Plano de contingência. Script: "5 PRD-RISK". |

## RFC (`docs/RFC.md`)

| Critério | Status | Evidência |
|---|---|---|
| Arquivo existe e está em Markdown | ☑ | [docs/RFC.md](../RFC.md) |
| Contém todas as seções obrigatórias do requisito 2 | ☑ | Metadados (autoria, status, data, revisores = participantes), TL;DR, contexto, proposta, alternativas, questões em aberto, impacto e riscos, decisões relacionadas. Script: "8 seções" e "metadados autor/status/data/revisores". |
| "Alternativas consideradas" com ≥ 2 alternativas descartadas na reunião, cada uma com trade-off | ☑ | 6 alternativas, de RFC-ALT-01 a ALT-06: síncrono [09:04], Redis [09:07], trigger [09:09], retry indefinido/3 tentativas [09:15]/[09:16], exactly-once [09:25] e secret global [09:21]. Cada uma tem a coluna "Trade-off que levou ao descarte". |
| "Questões em aberto" com ≥ 2 pontos adiados ou não decididos | ☑ | 6 questões, de RFC-OQ-01 a OQ-06: rate limiting [09:39], escala do worker [09:13], permissões do CRUD [09:37], pauta de segurança [09:46], e-mail [09:37] e arquivamento [09:08]. |
| Referencia, com link, ≥ 2 ADRs | ☑ | Links para ADR-001 a ADR-007 nas seções de proposta, alternativas e decisões relacionadas. Script: "7 links". |

## FDD (`docs/FDD.md`)

| Critério | Status | Evidência |
|---|---|---|
| Arquivo existe e está em Markdown | ☑ | [docs/FDD.md](../FDD.md) |
| Contém todas as seções obrigatórias do requisito 3 | ☑ | §1 a §15, incluindo "Integração com o sistema existente" (§10). Script: "12 seções". |
| "Contratos públicos" com ≥ 4 endpoints HTTP, payload de exemplo (request e response) e status codes | ☑ | São 8 endpoints, de FDD-CONTRATO-01 a 08, o contrato de saída (CONTRATO-09) e o contrato da função `publishWebhookEvent` (CONTRATO-10). Cada endpoint tem blocos `http` de request e response e uma tabela de status. Script: "13 endpoints" e "18 blocos de código". |
| Matriz de erros com prefixo `WEBHOOK_` | ☑ | §7, de FDD-ERR-01 a ERR-18 (`WEBHOOK_NOT_FOUND`, `WEBHOOK_DEAD_LETTER_ALREADY_REPLAYED`, `WEBHOOK_PAYLOAD_TOO_LARGE`, …). |
| "Integração com o sistema existente" com ≥ 4 caminhos reais | ☑ | §10, de FDD-INT-01 a INT-18. Exemplos: `src/modules/orders/order.service.ts`, `src/app.ts`, `src/routes/index.ts`, `src/shared/errors/http-errors.ts` e `prisma/schema.prisma`. Script: "23 reais". |
| "Observabilidade" cita métricas, logs e tracing | ☑ | §9: logs (FDD-OBS-01/02), métricas (FDD-OBS-03), tracing por correlação (FDD-OBS-04) e alertas (FDD-OBS-05). |

## ADRs (`docs/adrs/`)

| Critério | Status | Evidência |
|---|---|---|
| Entre 5 e 8 arquivos no formato `ADR-NNN-titulo-em-kebab-case.md` | ☑ | 7 arquivos, de ADR-001 a ADR-007. O [`README.md`](../adrs/README.md) da pasta é o índice. Script: "7 ADRs" e "sem arquivos fora do padrão". |
| Cada ADR com Status, Contexto, Decisão, Alternativas Consideradas e Consequências | ☑ | Script: "seções: ok" para os 7. As Consequências trazem as subseções Positivas, Negativas e Trade-off. Desde a fase 8, cada ADR também tem "Fatores de decisão" e "Prós e contras das opções". |
| Cobre ≥ 5 das 6 decisões principais | ☑ | **6/6**: outbox (001), worker em polling (002), retry/DLQ (003), HMAC por endpoint (004), at-least-once/X-Event-Id (005) e reuso de padrões (006). O snapshot do payload (007) é extra. |
| ≥ 1 ADR referencia arquivos, módulos ou classes do código | ☑ | O ADR-006 traz uma tabela com 13 referências de código (`ADR-006-COD-01` a `COD-13`). Também citam código os ADRs 001, 002, 003 e 007. |

## Tracker (`docs/TRACKER.md`)

| Critério | Status | Evidência |
|---|---|---|
| Existe e segue o formato de tabela do requisito 5 | ☑ | Colunas ID, Documento, Tipo, Conteúdo (resumo), Fonte, Localização. Script: "tabela com 6 colunas: 387 linhas". |
| ≥ 80% dos itens identificáveis com linha correspondente | ☑ | **387/387 (100%)**. Os IDs de todos os documentos (`PRD-*`, `RFC-*`, `FDD-*` e `ADR-*` com sub-IDs) têm linha. |
| ≥ 70% das linhas com Fonte = `TRANSCRICAO` e timestamp `[hh:mm] Nome` válido | ☑ | **86,6%**. Cada `[hh:mm] Nome` foi conferido literalmente contra `TRANSCRICAO.md`. Script: "todas as localizações válidas". |
| ≥ 5 linhas com Fonte = `CODIGO` e caminho real | ☑ | **52 linhas**. Todos os caminhos existem no repositório. |

## README (`README.md`)

| Critério | Status | Evidência |
|---|---|---|
| Contém todas as seções obrigatórias do requisito 6 | ☑ | Sobre o desafio (2 parágrafos), Ferramentas de IA utilizadas, Workflow adotado, Prompts customizados, Iterações e ajustes, Como navegar a entrega. Script: "6 seções". |
| Lista ≥ 1 ferramenta de IA | ☑ | Claude Code (Opus 5.5), subagente Explore, subagentes com Sonnet (extração cega e revisor) e o validador, escrito por IA. |
| ≥ 2 prompts customizados em blocos de código | ☑ | 3 blocos: P-02, P-03 e um trecho do P-07. Os 9 prompts completos estão em [prompts.md](prompts.md). |
| ≥ 2 iterações ou ajustes concretos | ☑ | A tabela "Casos principais" tem 9 casos. O log completo vai de IT-01 a IT-15, em [iteracoes.md](iteracoes.md). |

## Consistência geral

| Critério | Status | Evidência |
|---|---|---|
| Nenhum requisito, decisão ou restrição contradiz a transcrição ou o código | ☑ | 6 revisões adversariais por documento (IT-06 a IT-11), com os achados corrigidos. A revisão cruzada final (IT-14) concluiu que **nada contradiz a transcrição ou o código** e corrigiu 10 desalinhamentos entre documentos. |
| Nenhum arquivo de código mencionado é inexistente | ☑ | Script: "nenhum caminho de código inexistente: 27 reais, 3 novos propostos". Os 3 propostos (`src/worker.ts`, `src/modules/webhooks/*` e `tests/webhooks.test.ts`) aparecem marcados como **(novo)**. |

## Restrições do enunciado

| Restrição | Status | Evidência |
|---|---|---|
| Código da aplicação intocado (`src/`, `prisma/`, `tests/`, configs) | ☑ | Script: "código, configs e transcrição intocados". O comando `git diff --name-only main` lista só `README.md` e arquivos em `docs/`. |
| `TRANSCRICAO.md` não alterado | ☑ | Mesma checagem do script |
| Estrutura obrigatória do entregável | ☑ | `README.md`, `docs/PRD.md`, `docs/RFC.md`, `docs/FDD.md`, `docs/TRACKER.md` e `docs/adrs/ADR-00N-*.md`. Arquivos extras: `docs/adrs/README.md` (índice) e `docs/processo/` (evidência do processo). |
| Documentos em Markdown | ☑ | Todos os entregáveis são `.md` |
