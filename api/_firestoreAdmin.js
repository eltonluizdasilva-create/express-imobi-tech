/**
 * _firestoreAdmin.js — Firestore via REST + Service Account (sem dependência)
 * ============================================================================
 * Por que não firebase-admin: o pacote não está na raiz do projeto e o build da
 * Vercel não deve baixar dependência nova. Aqui assinamos o JWT com `node:crypto`
 * e falamos direto com a API REST do Firestore (Admin: ignora as rules).
 *
 * VARIÁVEL DE AMBIENTE (Vercel → Settings → Environment Variables):
 *   FIREBASE_SERVICE_ACCOUNT        = conteúdo JSON da service account
 *   ou FIREBASE_SERVICE_ACCOUNT_BASE64 = o mesmo JSON em base64
 * ============================================================================
 */
import crypto from 'node:crypto';

const ESCOPO = 'https://www.googleapis.com/auth/datastore';
const V1 = 'https://firestore.googleapis.com/v1';

let cache = { token: null, exp: 0 };

function lerCredenciais() {
  const bruto = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  let texto = bruto || '';
  if (!texto && base64) {
    try { texto = Buffer.from(base64, 'base64').toString('utf8'); } catch { texto = ''; }
  }
  if (!texto) return null;
  try {
    const sa = JSON.parse(texto);
    if (!sa.client_email || !sa.private_key) return null;
    return sa;
  } catch {
    return null;
  }
}

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

async function horaServidor() {
  try {
    const r = await fetch('https://www.googleapis.com/discovery/v1/apis', { method: 'HEAD' });
    const ms = Date.parse(r.headers.get('date') || '');
    if (Number.isFinite(ms)) return Math.floor(ms / 1000);
  } catch { /* usa relógio local */ }
  return Math.floor(Date.now() / 1000);
}

async function obterToken(sa) {
  if (cache.token && cache.exp > Date.now() + 60_000) return cache.token;

  const agora = await horaServidor();
  const cabecalho = b64url({ alg: 'RS256', typ: 'JWT' });
  const corpo = {
    iss: sa.client_email,
    scope: ESCOPO,
    aud: 'https://oauth2.googleapis.com/token',
    iat: agora - 60,
    exp: agora + 3000,
  };
  const assinado = `${cabecalho}.${b64url(corpo)}`;
  const chave = crypto.createPrivateKey(sa.private_key);
  const assinatura = crypto.createSign('RSA-SHA256').update(assinado).sign(chave, 'base64url');
  const jwt = `${assinado}.${assinatura}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const dados = await resp.json();
  if (!resp.ok) throw new Error(`token: ${dados.error_description || dados.error || resp.status}`);

  cache = { token: dados.access_token, exp: Date.now() + (dados.expires_in || 3600) * 1000 };
  return cache.token;
}

export function projetoAtual() {
  const sa = lerCredenciais();
  return sa?.project_id || process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'express-ai-automation';
}

/** true = credencial disponível; false = endpoint deve responder 503. */
export function adminDisponivel() {
  return Boolean(lerCredenciais());
}

export function erroDeCredencial() {
  return {
    error: 'Integração sem credencial do Firebase no servidor',
    hint: 'Cadastre FIREBASE_SERVICE_ACCOUNT (JSON) ou FIREBASE_SERVICE_ACCOUNT_BASE64 na Vercel e faça redeploy.',
  };
}

async function req(caminho, init = {}) {
  const sa = lerCredenciais();
  if (!sa) throw Object.assign(new Error('sem credencial'), { semCredencial: true });
  const token = await obterToken(sa);
  const url = caminho.startsWith('http') ? caminho : `${V1}/${caminho}`;
  const resposta = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const texto = await resposta.text();
  let json = {};
  try { json = texto ? JSON.parse(texto) : {}; } catch { json = { raw: texto.slice(0, 300) }; }
  if (!resposta.ok && resposta.status !== 404) {
    throw new Error(`firestore ${resposta.status}: ${json?.error?.message || texto.slice(0, 160)}`);
  }
  return { ok: resposta.ok, status: resposta.status, json };
}

/* ---------------------------- value encoding ----------------------------- */

export function paraValorFirestore(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(paraValorFirestore) } };
  if (typeof v === 'object') {
    if (v instanceof Date) return { timestampValue: v.toISOString() };
    return { mapValue: { fields: paraCampos(v) } };
  }
  return { stringValue: String(v) };
}

export function paraCampos(obj = {}) {
  const campos = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    campos[k] = paraValorFirestore(v);
  }
  return campos;
}

export function deValorFirestore(valor = {}) {
  if ('stringValue' in valor) return valor.stringValue;
  if ('booleanValue' in valor) return valor.booleanValue;
  if ('integerValue' in valor) return Number(valor.integerValue);
  if ('doubleValue' in valor) return Number(valor.doubleValue);
  if ('timestampValue' in valor) return valor.timestampValue;
  if ('nullValue' in valor) return null;
  if ('arrayValue' in valor) return (valor.arrayValue.values || []).map(deValorFirestore);
  if ('mapValue' in valor) return deCampos(valor.mapValue.fields || {});
  return null;
}

export function deCampos(campos = {}) {
  const obj = {};
  for (const [k, v] of Object.entries(campos)) obj[k] = deValorFirestore(v);
  return obj;
}

function docParaObjeto(doc) {
  const id = String(doc.name || '').split('/').pop();
  return { id, ...deCampos(doc.fields || {}) };
}

/* --------------------------------- API ----------------------------------- */

export async function listarDocumentos(caminho, { pageSize = 300 } = {}) {
  const projeto = projetoAtual();
  const base = `projects/${projeto}/databases/(default)/documents/${caminho}`;
  const saida = [];
  let pageToken = '';

  do {
    const url = `${V1}/${base}?pageSize=${pageSize}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const { ok, json } = await req(url);
    if (!ok) break;
    saida.push(...(json.documents || []).map(docParaObjeto));
    pageToken = json.nextPageToken || '';
  } while (pageToken && saida.length < 2000);

  return saida;
}

export async function obterDocumento(caminho) {
  const projeto = projetoAtual();
  const { ok, json } = await req(`projects/${projeto}/databases/(default)/documents/${caminho}`);
  if (!ok) return null;
  return docParaObjeto(json);
}

export async function criarDocumento(caminhoColecao, dados) {
  const projeto = projetoAtual();
  const { ok, json } = await req(`projects/${projeto}/databases/(default)/documents/${caminhoColecao}`, {
    method: 'POST',
    body: JSON.stringify({ fields: paraCampos(dados) }),
  });
  if (!ok) throw new Error(`criar documento: ${json?.error?.message || 'falha'}`);
  return { id: String(json.name || '').split('/').pop(), ...deCampos(json.fields || {}) };
}

export async function definirDocumento(caminho, dados) {
  const projeto = projetoAtual();
  const { ok, json } = await req(`projects/${projeto}/databases/(default)/documents/${caminho}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: paraCampos(dados) }),
  });
  if (!ok) throw new Error(`gravar documento: ${json?.error?.message || 'falha'}`);
  return { id: String(json.name || '').split('/').pop(), ...deCampos(json.fields || {}) };
}
