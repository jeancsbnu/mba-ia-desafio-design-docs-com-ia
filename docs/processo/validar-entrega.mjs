#!/usr/bin/env node
// Validação automática da entrega contra os critérios de aceite do desafio.
// Uso: node docs/processo/validar-entrega.mjs [--strict]
//   --strict: documentos ainda não escritos (placeholders) contam como falha.
// Somente leitura: não altera nenhum arquivo.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const STRICT = process.argv.includes('--strict');
const results = [];

const read = (rel) => {
  const p = join(ROOT, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
};
const norm = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9;: ]+/g, ' ').trim();
const headings = (md) => md.split(/\r?\n/).filter((l) => /^#{1,6}\s/.test(l)).map((l) => norm(l.replace(/^#+\s*/, '')));
const isPlaceholder = (md) => md === null || md.split(/\r?\n/).filter((l) => l.trim()).length < 8;
const record = (area, name, ok, detail = '') => results.push({ area, name, status: ok ? 'PASS' : 'FAIL', detail });
const pending = (area, name) => results.push({ area, name, status: STRICT ? 'FAIL' : 'PENDENTE', detail: 'documento ainda não escrito' });

const hasHeading = (md, ...needles) => {
  const hs = headings(md);
  return needles.some((n) => hs.some((h) => h.includes(norm(n))));
};
const section = (md, headingNeedle) => {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => /^#{1,6}\s/.test(l) && norm(l).includes(norm(headingNeedle)));
  if (start < 0) return '';
  const level = lines[start].match(/^#+/)[0].length;
  const end = lines.findIndex((l, i) => i > start && /^#{1,6}\s/.test(l) && l.match(/^#+/)[0].length <= level);
  return lines.slice(start, end < 0 ? undefined : end).join('\n');
};
const countIds = (md, prefix) => new Set(md.match(new RegExp(`\\b${prefix}-\\d{2}\\b`, 'g')) ?? []).size;
const checkSections = (area, md, required) => {
  const missing = required.filter((alts) => !hasHeading(md, ...[].concat(alts)));
  record(area, 'seções obrigatórias', missing.length === 0, missing.length ? `faltando: ${missing.map((m) => [].concat(m)[0]).join(', ')}` : `${required.length} seções`);
};

// Arquivos novos propostos pela feature (não existem no repositório por definição).
const PROPOSED = [/^src\/worker\.ts$/, /^src\/modules\/webhooks\//, /^prisma\/migrations\/\d{14}_webhooks?/, /^tests\/webhooks\.test\.ts$/];
const CODE_PATH_RE = /\b(?:src|prisma|tests)\/[\w./-]*\w\.(?:ts|prisma|sql|toml)\b/g;
const codePaths = (md) => [...new Set(md.match(CODE_PATH_RE) ?? [])];
const classifyPaths = (paths) => {
  const proposed = paths.filter((p) => PROPOSED.some((re) => re.test(p)));
  const missing = paths.filter((p) => !proposed.includes(p) && !existsSync(join(ROOT, p)));
  const real = paths.filter((p) => !proposed.includes(p) && !missing.includes(p));
  return { real, proposed, missing };
};

// ---------------------------------------------------------------- ADRs
const adrDir = join(ROOT, 'docs/adrs');
const adrFiles = existsSync(adrDir) ? readdirSync(adrDir).filter((f) => f.endsWith('.md')) : [];
const adrs = adrFiles.filter((f) => /^ADR-\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(f));
const adrOthers = adrFiles.filter((f) => !adrs.includes(f) && f !== 'README.md');
if (adrs.length === 0) pending('ADRs', 'arquivos ADR-NNN-*.md');
else {
  record('ADRs', 'quantidade entre 5 e 8', adrs.length >= 5 && adrs.length <= 8, `${adrs.length} ADRs`);
  record('ADRs', 'sem arquivos fora do padrão', adrOthers.length === 0, adrOthers.join(', '));
  const adrText = {};
  for (const f of adrs) {
    const md = read(`docs/adrs/${f}`);
    adrText[f] = md;
    const sec = ['Status', 'Contexto', ['Decisão', 'Decisao'], ['Alternativas Consideradas'], ['Consequências', 'Consequencias']];
    const missing = sec.filter((alts) => !hasHeading(md, ...[].concat(alts)));
    const cons = norm(section(md, 'Consequencias'));
    const tradeoff = /positiv/.test(cons) && /negativ/.test(cons);
    record('ADRs', `${f}: seções`, missing.length === 0 && tradeoff, missing.length ? `faltando: ${missing.map((m) => [].concat(m)[0]).join(', ')}` : tradeoff ? 'ok' : 'consequências sem positivas/negativas');
  }
  const all = norm(Object.values(adrText).map((md) => md.split(/\r?\n/)[0]).join(' ') + ' ' + adrs.join(' '));
  const decisions = {
    'Outbox no MySQL': /outbox/,
    'Retry com backoff e DLQ': /(retry|backoff).*(dlq|dead)|(dlq|dead).*(retry|backoff)/,
    'HMAC-SHA256 por endpoint': /hmac/,
    'At-least-once com X-Event-Id': /at least once|event id/,
    'Worker separado em polling': /worker|polling/,
    'Reuso dos padrões': /reuso|padroes|padrao/,
  };
  const covered = Object.entries(decisions).filter(([, re]) => re.test(all)).map(([k]) => k);
  record('ADRs', 'cobre ≥ 5 das 6 decisões principais', covered.length >= 5, `${covered.length}/6: ${covered.join('; ')}`);
  const withCode = adrs.filter((f) => classifyPaths(codePaths(adrText[f])).real.length > 0);
  record('ADRs', '≥ 1 ADR referencia código existente', withCode.length >= 1, withCode.join(', '));
}

// ---------------------------------------------------------------- PRD
const prd = read('docs/PRD.md');
if (isPlaceholder(prd)) pending('PRD', 'docs/PRD.md');
else {
  checkSections('PRD', prd, [
    ['Resumo'], ['Problema'], ['Publico'], ['Objetivos'], ['Escopo'], ['Fora de escopo'],
    ['Requisitos funcionais'], ['Requisitos nao funcionais'], ['Decisoes'], ['Dependencias'],
    ['Riscos'], ['Criterios de aceitacao', 'Criterios de aceite'], ['Estrategia de testes'],
  ]);
  record('PRD', '≥ 8 requisitos funcionais', countIds(prd, 'PRD-FR') >= 8, `${countIds(prd, 'PRD-FR')} PRD-FR`);
  record('PRD', '≥ 1 métrica com meta', countIds(prd, 'PRD-MET') >= 1, `${countIds(prd, 'PRD-MET')} PRD-MET`);
  record('PRD', '≥ 2 itens fora de escopo', countIds(prd, 'PRD-OOS') >= 2, `${countIds(prd, 'PRD-OOS')} PRD-OOS`);
  const riscos = norm(section(prd, 'Riscos'));
  record('PRD', '≥ 2 riscos com probabilidade/impacto/mitigação', countIds(prd, 'PRD-RISK') >= 2 && /probabilidade/.test(riscos) && /impacto/.test(riscos) && /mitigacao/.test(riscos), `${countIds(prd, 'PRD-RISK')} PRD-RISK`);
  const fr = norm(section(prd, 'Requisitos funcionais'));
  const leak = ['e mail', 'email', 'dashboard', 'painel', 'rate limit', 'redis', 'order created', 'exactly once'].filter((t) => fr.includes(t));
  record('PRD', 'sem vazamento de escopo nos requisitos funcionais', leak.length === 0, leak.join(', '));
}

// ---------------------------------------------------------------- RFC
const rfc = read('docs/RFC.md');
if (isPlaceholder(rfc)) pending('RFC', 'docs/RFC.md');
else {
  checkSections('RFC', rfc, [
    ['Metadados'], ['Resumo', 'TL;DR', 'TL DR'], ['Contexto'], ['Proposta'],
    ['Alternativas consideradas'], ['Questoes em aberto'], ['Impacto'], ['Decisoes relacionadas'],
  ]);
  const meta = norm(rfc.slice(0, 3000));
  record('RFC', 'metadados autor/status/data/revisores', ['autor', 'status', 'data', 'revisores'].every((k) => meta.includes(k)));
  record('RFC', '≥ 2 alternativas descartadas', countIds(rfc, 'RFC-ALT') >= 2, `${countIds(rfc, 'RFC-ALT')} RFC-ALT`);
  record('RFC', '≥ 2 questões em aberto', countIds(rfc, 'RFC-OQ') >= 2, `${countIds(rfc, 'RFC-OQ')} RFC-OQ`);
  const links = [...new Set([...rfc.matchAll(/\]\((\.?\/?adrs\/ADR-\d{3}-[\w-]+\.md)\)/g)].map((m) => m[1]))];
  const broken = links.filter((l) => !existsSync(join(ROOT, 'docs', l)));
  record('RFC', '≥ 2 links válidos para ADRs', links.length - broken.length >= 2, `${links.length} links${broken.length ? `, quebrados: ${broken.join(', ')}` : ''}`);
  const words = rfc.replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length;
  record('RFC', 'tamanho de 2 a 4 páginas (~900–2200 palavras)', words >= 900 && words <= 2200, `${words} palavras`);
}

// ---------------------------------------------------------------- FDD
const fdd = read('docs/FDD.md');
if (isPlaceholder(fdd)) pending('FDD', 'docs/FDD.md');
else {
  checkSections('FDD', fdd, [
    ['Contexto'], ['Objetivos tecnicos'], ['Escopo'], ['Fluxos'], ['Contratos publicos'],
    ['Matriz de erros'], ['Resiliencia'], ['Observabilidade'], ['Dependencias'],
    ['Criterios de aceite'], ['Riscos'], ['Integracao com o sistema existente'],
  ]);
  const contratos = section(fdd, 'Contratos publicos');
  const endpoints = new Set(contratos.match(/\b(GET|POST|PATCH|PUT|DELETE)\s+`?\/api\/v1\/[\w/:-]+/g) ?? []);
  record('FDD', '≥ 4 endpoints HTTP', endpoints.size >= 4, `${endpoints.size} endpoints`);
  const fences = (contratos.match(/```/g) ?? []).length / 2;
  record('FDD', 'exemplos de request/response', fences >= 8, `${fences} blocos de código em Contratos`);
  const codes = new Set(section(fdd, 'Matriz de erros').match(/\bWEBHOOK_[A-Z_]+\b/g) ?? []);
  record('FDD', 'matriz de erros com prefixo WEBHOOK_', codes.size >= 3, [...codes].join(', '));
  const integ = classifyPaths(codePaths(section(fdd, 'Integracao com o sistema existente')));
  record('FDD', '≥ 4 caminhos reais em "Integração com o sistema existente"', integ.real.length >= 4, `${integ.real.length} reais`);
  const obs = norm(section(fdd, 'Observabilidade'));
  record('FDD', 'observabilidade cita métricas, logs e tracing', /metric/.test(obs) && /\blog/.test(obs) && /tracing|rastreamento/.test(obs));
}

// ---------------------------------------------------------------- Caminhos de código em todos os documentos
const docs = ['docs/PRD.md', 'docs/RFC.md', 'docs/FDD.md', 'docs/TRACKER.md', 'README.md', ...adrs.map((f) => `docs/adrs/${f}`)];
const allPaths = classifyPaths([...new Set(docs.flatMap((d) => codePaths(read(d) ?? '')))]);
record('Consistência', 'nenhum caminho de código inexistente', allPaths.missing.length === 0, allPaths.missing.length ? `inexistentes: ${allPaths.missing.join(', ')}` : `${allPaths.real.length} reais, ${allPaths.proposed.length} novos propostos`);

// ---------------------------------------------------------------- Tracker
const tracker = read('docs/TRACKER.md');
const transcript = read('TRANSCRICAO.md');
if (isPlaceholder(tracker)) pending('Tracker', 'docs/TRACKER.md');
else {
  const rows = tracker.split(/\r?\n/)
    .filter((l) => /^\|/.test(l) && !/^\|\s*-/.test(l))
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()))
    .filter((c) => c.length === 6 && !/^id$/i.test(c[0]));
  record('Tracker', 'tabela com 6 colunas', rows.length > 0, `${rows.length} linhas`);
  const speakers = new Set(transcript.match(/^\[\d{2}:\d{2}\] [^:]+:/gm) ?? []);
  const badRefs = [];
  let transc = 0;
  let code = 0;
  for (const [id, doc, , , fonte, loc] of rows) {
    if (!existsSync(join(ROOT, doc.replace(/`/g, '')))) badRefs.push(`${id}: documento ${doc}`);
    if (fonte.replace(/`/g, '') === 'TRANSCRICAO') {
      const refs = loc.match(/\[\d{2}:\d{2}\] [A-Za-zÀ-ú]+/g) ?? [];
      const valid = refs.filter((r) => speakers.has(`${r}:`));
      if (refs.length === 0 || valid.length !== refs.length) badRefs.push(`${id}: ${loc}`);
      else transc++;
    } else if (fonte.replace(/`/g, '') === 'CODIGO') {
      const paths = (loc.match(/[\w./-]+\.\w+/g) ?? []).map((p) => p.split(':')[0]);
      if (paths.length === 0 || paths.some((p) => !existsSync(join(ROOT, p)))) badRefs.push(`${id}: ${loc}`);
      else code++;
    } else badRefs.push(`${id}: fonte "${fonte}"`);
  }
  record('Tracker', 'todas as localizações válidas', badRefs.length === 0, badRefs.slice(0, 10).join(' | ') + (badRefs.length > 10 ? ` (+${badRefs.length - 10})` : ''));
  record('Tracker', '≥ 70% das linhas com TRANSCRICAO válida', transc / rows.length >= 0.7, `${((100 * transc) / rows.length).toFixed(1)}%`);
  record('Tracker', '≥ 5 linhas CODIGO com caminho real', code >= 5, `${code} linhas`);
  const idRe = /\b(?:(?:PRD|RFC|FDD)-[A-Z]+-\d{2}|ADR-\d{3}(?:-[A-Z]{3}-\d{2})?)\b/g;
  // Só os documentos de design contam; o README descreve o processo e não tem itens rastreáveis.
  const designDocs = docs.filter((d) => d !== 'docs/TRACKER.md' && d !== 'README.md');
  const docIds = new Set(designDocs.flatMap((d) => (read(d) ?? '').match(idRe) ?? []));
  const trackerIds = new Set(rows.map((r) => r[0].replace(/`/g, '')));
  const missing = [...docIds].filter((i) => !trackerIds.has(i));
  record('Tracker', '≥ 80% dos itens dos documentos rastreados', docIds.size > 0 && 1 - missing.length / docIds.size >= 0.8, `${docIds.size - missing.length}/${docIds.size}${missing.length ? `; sem linha: ${missing.slice(0, 15).join(', ')}` : ''}`);
}

// ---------------------------------------------------------------- README
const readme = read('README.md');
if (/^# Da Reuni/.test(readme ?? '')) pending('README', 'README.md (ainda é o enunciado)');
else {
  checkSections('README', readme, [
    ['Sobre o desafio'], ['Ferramentas de IA'], ['Workflow'], ['Prompts customizados'], ['Iteracoes'], ['Como navegar'],
  ]);
  const prompts = section(readme, 'Prompts customizados');
  record('README', '≥ 2 prompts em blocos de código', (prompts.match(/```/g) ?? []).length >= 4);
  const its = section(readme, 'Iteracoes');
  record('README', '≥ 2 iterações concretas', (its.match(/IT-\d{2}/g) ?? []).length >= 2 || (its.match(/^\s*(?:\d+\.|-|\|)/gm) ?? []).length >= 2);
}

// ---------------------------------------------------------------- Código intocado
try {
  const base = execSync('git merge-base HEAD main', { cwd: ROOT }).toString().trim();
  const changed = execSync(`git diff --name-only ${base}`, { cwd: ROOT }).toString().split(/\r?\n/).filter(Boolean);
  const untracked = execSync('git ls-files --others --exclude-standard', { cwd: ROOT }).toString().split(/\r?\n/).filter(Boolean);
  const forbidden = [...changed, ...untracked].filter((f) =>
    /^(src|prisma|tests)\//.test(f) ||
    /^(package(-lock)?\.json|tsconfig[\w.]*\.json|vitest\.config\.ts|\.env\.example|docker-compose\.yml|\.eslintrc\.json|\.prettierrc|\.prettierignore|\.gitignore|TRANSCRICAO\.md)$/.test(f));
  record('Consistência', 'código, configs e transcrição intocados', forbidden.length === 0, forbidden.join(', '));
} catch (e) {
  record('Consistência', 'código, configs e transcrição intocados', false, `git indisponível: ${e.message.split('\n')[0]}`);
}

// ---------------------------------------------------------------- Saída
const icon = { PASS: '✔', FAIL: '✘', PENDENTE: '…' };
for (const r of results) console.log(`${icon[r.status]} [${r.status}] ${r.area}: ${r.name}${r.detail ? `: ${r.detail}` : ''}`);
const count = (s) => results.filter((r) => r.status === s).length;
console.log(`\n${count('PASS')} ok, ${count('FAIL')} falhas, ${count('PENDENTE')} pendentes`);
process.exit(count('FAIL') ? 1 : 0);
