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
