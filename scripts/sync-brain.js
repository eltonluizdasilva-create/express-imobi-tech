#!/usr/bin/env node
/**
 * sync-brain.js — espelho do Company Brain entre o disco e o Firestore.
 * ============================================================================
 *   company-brain/*.md  ⇄  Firestore `company_brain/{slug}`
 *        (PC)                        (nuvem / celular)
 *
 *   npm run brain:push   →  disco → nuvem
 *   npm run brain:pull   →  nuvem → disco (backup automático antes de sobrescrever)
 *
 * AUTOMAÇÃO (sem comando manual no dia a dia):
 *   • `.githooks/post-commit` roda `push` quando o commit toca `company-brain/`
 *     — ative uma vez com `npm run brain:hooks`.
 *   • `scripts/brain-mcp.js` (servidor MCP) lê a nuvem e grava decisões durante
 *     a conversa, já marcando regras antigas como [OBSOLETO].
 *
 * Credencial: FIREBASE_SERVICE_ACCOUNT (caminho/JSON/base64) ou
 * scripts-locais/service-account.json. Nunca no código.
 *
 * Flags: --dry-run  --force  --only <slug>
 * ============================================================================
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  COLECAO,
  PASTA_BRAIN as PASTA,
  PROJETO,
  RAIZ,
  gravarDoc,
  listarDocs,
  sa,
  tituloDoMarkdown,
} from './lib/brainStore.js';

const BACKUP = join(PASTA, '.backup');

const argv = process.argv.slice(2);
const MODO = (argv[0] || '').toLowerCase();
const flag = (n) => argv.includes(n);
const valor = (n) => {
  const i = argv.indexOf(n);
  return i >= 0 ? argv[i + 1] : undefined;
};
const DRY = flag('--dry-run');
const FORCE = flag('--force');
const SO = valor('--only');

if (!['push', 'pull'].includes(MODO)) {
  console.error('uso: node scripts/sync-brain.js <push|pull> [--dry-run] [--force] [--only slug]');
  process.exit(1);
}

if (!sa) {
  console.error(
    '✖ Credencial não encontrada.\n' +
      '  Defina FIREBASE_SERVICE_ACCOUNT (caminho, JSON ou base64) no .env\n' +
      '  ou mantenha o arquivo scripts-locais/service-account.json.'
  );
  process.exit(2);
}

/* -------------------------------- helpers -------------------------------- */
function arquivosLocais() {
  if (!existsSync(PASTA)) return [];
  return readdirSync(PASTA)
    .filter((n) => n.endsWith('.md'))
    .filter((n) => !SO || n.replace(/\.md$/, '') === SO)
    .sort();
}

const stamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

function backupDe(slug, conteudo) {
  if (!existsSync(BACKUP)) mkdirSync(BACKUP, { recursive: true });
  const destino = join(BACKUP, `${slug}-${stamp()}.md`);
  writeFileSync(destino, conteudo, 'utf8');
  return destino;
}

/* --------------------------------- push ---------------------------------- */
async function push() {
  const arquivos = arquivosLocais();
  if (!arquivos.length) {
    console.log('nada para enviar: company-brain/ está vazio');
    return 0;
  }

  console.log(`── brain:push → ${PROJETO}/${COLECAO} ${DRY ? '(dry-run)' : ''}`);
  const remotos = new Map((await listarDocs()).map((d) => [d.slug, d]));

  let enviados = 0;
  let pulados = 0;

  for (const nome of arquivos) {
    const slug = nome.replace(/\.md$/, '');
    const caminho = join(PASTA, nome);
    const conteudo = readFileSync(caminho, 'utf8');
    const titulo = tituloDoMarkdown(conteudo, slug);
    const mtime = statSync(caminho).mtime;
    const remoto = remotos.get(slug);

    if (remoto && remoto.conteudo === conteudo) {
      console.log(`  = ${slug.padEnd(26)} igual nos dois lados`);
      continue;
    }

    if (remoto && remoto.updatedAt && !FORCE) {
      const remotoMs = new Date(remoto.updatedAt).getTime();
      if (Number.isFinite(remotoMs) && remotoMs > mtime.getTime() + 2000) {
        console.log(
          `  ! ${slug.padEnd(26)} nuvem mais nova (${remoto.updatedAt}, por ${remoto.updatedBy || '?'}) — rode brain:pull ou use --force`
        );
        pulados += 1;
        continue;
      }
    }

    if (DRY) {
      console.log(`  → ${slug.padEnd(26)} enviaria ${conteudo.length} chars`);
      enviados += 1;
      continue;
    }

    await gravarDoc(slug, { titulo, conteudo, updatedBy: 'pc' });
    console.log(`  ↑ ${slug.padEnd(26)} ${remoto ? 'atualizado' : 'criado'} (${conteudo.length} chars)`);
    enviados += 1;
  }

  console.log(`\nenviados: ${enviados} | pulados: ${pulados} | total local: ${arquivos.length}`);
  return 0;
}

/* --------------------------------- pull ---------------------------------- */
async function pull() {
  console.log(`── brain:pull ← ${PROJETO}/${COLECAO} ${DRY ? '(dry-run)' : ''}`);
  const remotos = await listarDocs();
  if (!remotos.length) {
    console.log('nada na nuvem ainda: rode brain:push primeiro');
    return 0;
  }

  let baixados = 0;
  let iguais = 0;
  let ignorados = 0;

  for (const doc of remotos) {
    if (SO && doc.slug !== SO) continue;
    const caminho = join(PASTA, `${doc.slug}.md`);
    const existe = existsSync(caminho);
    const atual = existe ? readFileSync(caminho, 'utf8') : '';

    if (existe && atual === doc.conteudo) {
      console.log(`  = ${doc.slug.padEnd(26)} igual nos dois lados`);
      iguais += 1;
      continue;
    }

    if (existe && !FORCE) {
      const localMs = statSync(caminho).mtime.getTime();
      const remotoMs = doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0;
      if (Number.isFinite(remotoMs) && remotoMs + 2000 < localMs) {
        console.log(
          `  ! ${doc.slug.padEnd(26)} disco mais novo que a nuvem (${doc.updatedAt || 'sem data'}) — use --force ou brain:push`
        );
        ignorados += 1;
        continue;
      }
    }

    if (DRY) {
      console.log(`  ← ${doc.slug.padEnd(26)} baixaria ${doc.conteudo.length} chars${existe ? ' (sobrescreve)' : ''}`);
      baixados += 1;
      continue;
    }

    const destinoBackup = existe && atual !== doc.conteudo ? backupDe(doc.slug, atual) : null;

    writeFileSync(caminho, doc.conteudo, 'utf8');
    console.log(
      `  ↓ ${doc.slug.padEnd(26)} ${existe ? 'atualizado' : 'criado'} (${doc.conteudo.length} chars)` +
        (destinoBackup ? ` · backup: ${destinoBackup.replace(RAIZ, '').replace(/\\/g, '/')}` : '')
    );
    baixados += 1;
  }

  console.log(`\nbaixados: ${baixados} | iguais: ${iguais} | ignorados: ${ignorados} | na nuvem: ${remotos.length}`);
  return 0;
}

/* --------------------------------- main ---------------------------------- */
try {
  const codigo = MODO === 'push' ? await push() : await pull();
  process.exit(codigo);
} catch (e) {
  console.error(`✖ ${e.message || e}`);
  process.exit(3);
}
