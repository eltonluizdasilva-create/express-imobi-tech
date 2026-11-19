/**
 * brainStore.js — acesso ao Firestore do Company Brain.
 * ============================================================================
 * Fonte única de credencial, token e operações usada por:
 *   • scripts/sync-brain.js   (CLI brain:push / brain:pull)
 *   • scripts/brain-mcp.js    (servidor MCP stdio)
 *
 * CREDENCIAL (nunca no código)
 *   FIREBASE_SERVICE_ACCOUNT  caminho do JSON, JSON puro ou base64
 *   FIREBASE_PROJECT_ID       opcional (default: project_id do service account)
 *   Fallback: scripts-locais/service-account.json (gitignored)
 * ============================================================================
 */

import { createSign } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PASTA_BRAIN = join(RAIZ, 'company-brain');
export const COLECAO = 'company_brain';
const ESCOPO = 'https://www.googleapis.com/auth/datastore';

export const DOCS = [
  { slug: '01-identidade-produtos', titulo: 'Identidade e Produtos' },
  { slug: '02-regras-comerciais', titulo: 'Regras Comerciais' },
  { slug: '03-mapa-agentes', titulo: 'Mapa de Agentes e Skills' },
  { slug: '04-arquitetura-stack', titulo: 'Arquitetura e Stack' },
  { slug: '05-decisoes-ativas', titulo: 'Decisões Ativas' },
  { slug: '06-governanca-lei-financeiro', titulo: 'Governança Fiscal e Financeira' },
];

export const SLUGS = DOCS.map((d) => d.slug);

try {
  process.loadEnvFile?.(join(RAIZ, '.env'));
} catch {
  /* sem .env: usa o ambiente */
}

/* ------------------------------- credencial ------------------------------ */
function tentarJson(texto) {
  try {
    const j = JSON.parse(texto);
    if (j.client_email && j.private_key) return j;
  } catch {
    /* não era JSON */
  }
  return null;
}

export function carregarServiceAccount() {
  const bruto = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();

  if (bruto.startsWith('{')) {
    const j = tentarJson(bruto);
    if (j) return j;
  }
  if (bruto && existsSync(bruto)) {
    const j = tentarJson(readFileSync(bruto, 'utf8'));
    if (j) return j;
  }
  if (bruto) {
    try {
      const j = tentarJson(Buffer.from(bruto, 'base64').toString('utf8'));
      if (j) return j;
    } catch {
      /* ignora */
    }
  }

  const padrao = join(RAIZ, 'scripts-locais', 'service-account.json');
  if (existsSync(padrao)) return tentarJson(readFileSync(padrao, 'utf8'));

  return null;
}

export const sa = carregarServiceAccount();
export const PROJETO = process.env.FIREBASE_PROJECT_ID || sa?.project_id || 'express-ai-automation';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJETO}/databases/(default)/documents/${COLECAO}`;

/* ---------------------------------- auth --------------------------------- */
const b64url = (v) => Buffer.from(v).toString('base64url');

async function horaDoServidor() {
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', { method: 'HEAD' });
    const d = r.headers.get('date');
    return d ? Math.round((new Date(d).getTime() - Date.now()) / 1000) : 0;
  } catch {
    return 0;
  }
}

let cache = null;

export async function token() {
  if (cache && cache.exp > Date.now() + 60000) return cache.valor;

  if (!sa) {
    throw new Error(
      'Credencial ausente: defina FIREBASE_SERVICE_ACCOUNT ou mantenha scripts-locais/service-account.json'
    );
  }

  const desvio = await horaDoServidor();
  const agora = Math.floor(Date.now() / 1000) + desvio;
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: ESCOPO,
      aud: 'https://oauth2.googleapis.com/token',
      iat: agora,
      exp: agora + 3600,
    })
  );
  const assinatura = createSign('RSA-SHA256').update(`${header}.${claims}`).sign(sa.private_key, 'base64url');

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${assinatura}`,
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`token: HTTP ${r.status} ${j.error || ''} ${j.error_description || ''}`);

  cache = { valor: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 - 120000 };
  return cache.valor;
}

const cab = async () => ({ Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' });

/* -------------------------------- leitura -------------------------------- */
function lerCampo(f) {
  if (!f) return '';
  if (f.stringValue !== undefined) return f.stringValue;
  if (f.timestampValue !== undefined) return f.timestampValue;
  return '';
}

export async function listarDocs() {
  const docs = [];
  let pageToken;
  do {
    const url = new URL(BASE);
    url.searchParams.set('pageSize', '100');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const r = await fetch(url, { headers: await cab() });
    const j = await r.json();
    if (!r.ok) throw new Error(`listar: HTTP ${r.status} ${j.error?.message || ''}`);
    for (const d of j.documents || []) {
      docs.push({
        slug: d.name.split('/').pop(),
        titulo: lerCampo(d.fields?.titulo),
        conteudo: lerCampo(d.fields?.conteudo),
        updatedAt: lerCampo(d.fields?.updatedAt),
        updatedBy: lerCampo(d.fields?.updatedBy),
      });
    }
    pageToken = j.nextPageToken;
  } while (pageToken);
  return docs;
}

export async function lerDoc(slug) {
  const r = await fetch(`${BASE}/${encodeURIComponent(slug)}`, { headers: await cab() });
  if (r.status === 404) return null;
  const j = await r.json();
  if (!r.ok) throw new Error(`ler ${slug}: HTTP ${r.status} ${j.error?.message || ''}`);
  return {
    slug,
    titulo: lerCampo(j.fields?.titulo),
    conteudo: lerCampo(j.fields?.conteudo),
    updatedAt: lerCampo(j.fields?.updatedAt),
    updatedBy: lerCampo(j.fields?.updatedBy),
  };
}

/* -------------------------------- escrita -------------------------------- */
export async function gravarDoc(slug, { titulo, conteudo, updatedBy = 'pc' }) {
  const url = `${BASE}/${encodeURIComponent(slug)}?updateMask.fieldPaths=titulo&updateMask.fieldPaths=conteudo&updateMask.fieldPaths=updatedAt&updateMask.fieldPaths=updatedBy`;
  const body = {
    fields: {
      titulo: { stringValue: String(titulo || slug).slice(0, 160) },
      conteudo: { stringValue: String(conteudo || '') },
      updatedAt: { timestampValue: new Date().toISOString() },
      updatedBy: { stringValue: updatedBy === 'mobile' ? 'mobile' : 'pc' },
    },
  };
  const r = await fetch(url, { method: 'PATCH', headers: await cab(), body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(`gravar ${slug}: HTTP ${r.status} ${j.error?.message || ''}`);
  return j;
}

/* ------------------------------- markdown -------------------------------- */
export function tituloDoMarkdown(texto, slug) {
  const m = String(texto).match(/^#\s+(.+)$/m);
  return (m ? m[1].trim() : slug).slice(0, 160);
}

/** Anexa uma seção no topo (antes do primeiro "## "), como a rota /brain faz. */
export function anexarSecao(conteudo, texto, data = new Date().toISOString().slice(0, 10), origem = 'agent') {
  const atual = String(conteudo || '');
  const bloco = `## ${data} — ${origem === 'mobile' ? 'Captura rápida (mobile)' : 'Decisão registrada'}\n\n${texto.trim()}\n\n---\n\n`;
  const posicao = atual.search(/^## /m);
  return posicao >= 0 ? atual.slice(0, posicao) + bloco + atual.slice(posicao) : `${atual}\n${bloco}`;
}

/**
 * Marca uma regra como [OBSOLETO] e aponta o substituto.
 * `alvo` é um trecho único da linha/decisão a aposentar.
 */
export function marcarObsoleto(conteudo, alvo, substituto) {
  const texto = String(conteudo || '');
  const indice = texto.indexOf(alvo);
  if (indice < 0) return { ok: false, motivo: 'trecho não encontrado' };

  // pega a linha inteira que contém o trecho
  const inicioLinha = texto.lastIndexOf('\n', indice) + 1;
  const fimLinha = texto.indexOf('\n', indice);
  const linha = texto.slice(inicioLinha, fimLinha === -1 ? undefined : fimLinha);

  if (linha.includes('[OBSOLETO]')) return { ok: false, motivo: 'já estava marcada' };

  const marcada = `${linha.replace(/^(\|\s*[^|]+\|\s*)/, '$1**[OBSOLETO]** ')} **[OBSOLETO]**${substituto ? ` → substituída por ${substituto}` : ''}`;
  const novo = texto.slice(0, inicioLinha) + marcada + texto.slice(fimLinha === -1 ? undefined : fimLinha);

  return { ok: true, linha: marcada.trim(), conteudo: novo };
}

export function buscarConteudo(docs, termo) {
  const alvo = String(termo || '').toLowerCase();
  if (!alvo) return [];
  const achados = [];
  for (const d of docs) {
    const linhas = String(d.conteudo || '').split('\n');
    linhas.forEach((linha, i) => {
      if (linha.toLowerCase().includes(alvo)) {
        achados.push({ slug: d.slug, linha: i + 1, texto: linha.trim().slice(0, 220) });
      }
    });
  }
  return achados.slice(0, 40);
}
