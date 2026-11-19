/**
 * api/_authToken.js — verificação de Firebase ID token sem dependência externa.
 * ============================================================================
 * Usado pelos endpoints serverless que custam dinheiro por chamada (ex.: Places).
 * Nada de chave: a verificação usa apenas os certificados publicos do Google.
 *
 *   POST /api/...  Authorization: Bearer <idToken do Firebase Auth>
 *
 * REGRAS
 *   - assinatura RS256 conferida com o certificado do `kid` do header;
 *   - `aud` precisa ser o projeto Firebase (padrao express-ai-automation);
 *   - `iss` precisa ser https://securetoken.google.com/<projeto>;
 *   - `exp` no futuro (tolerancia de 60 s).
 *   - `iat` NAO e validado contra o relogio local de proposito: maquinas com
 *     relogio fora de hora rejeitariam tokens legitimos, e a assinatura ja
 *     garante que o token veio do Google.
 *
 * Certificados ficam em cache de 1 hora (o Google rotaciona devagar).
 * ============================================================================
 */

import crypto from 'node:crypto';

const PROJETO = process.env.FIREBASE_PROJECT_ID || 'express-ai-automation';
const CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cache = { expira: 0, certs: null };

function base64urlParaBuffer(parte) {
  return Buffer.from(String(parte).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

async function certificados() {
  const agora = Date.now();
  if (cache.certs && cache.expira > agora) return cache.certs;

  const r = await fetch(CERTS_URL, { signal: AbortSignal.timeout(6000) });
  if (!r.ok) throw new Error(`certificados: HTTP ${r.status}`);
  const corpo = await r.json();
  cache = { certs: corpo, expira: agora + 3600_000 };
  return corpo;
}

/**
 * @param {string} idToken
 * @returns {Promise<{ok: true, uid: string} | {ok: false, motivo: string}>}
 */
export async function verificarIdToken(idToken) {
  const bruto = String(idToken || '').replace(/^Bearer\s+/i, '').trim();
  if (!bruto) return { ok: false, motivo: 'token ausente' };

  const partes = bruto.split('.');
  if (partes.length !== 3) return { ok: false, motivo: 'token malformado' };

  let header;
  let claims;
  try {
    header = JSON.parse(base64urlParaBuffer(partes[0]).toString('utf8'));
    claims = JSON.parse(base64urlParaBuffer(partes[1]).toString('utf8'));
  } catch {
    return { ok: false, motivo: 'token ilegivel' };
  }

  if (header.alg !== 'RS256') return { ok: false, motivo: 'algoritmo inesperado' };

  let certs;
  try {
    certs = await certificados();
  } catch (e) {
    return { ok: false, motivo: `certificados indisponiveis: ${e.message}` };
  }

  const pem = certs[header.kid];
  if (!pem) return { ok: false, motivo: 'kid desconhecido' };

  const assinaturaOk = crypto.verify(
    'RSA-SHA256',
    Buffer.from(`${partes[0]}.${partes[1]}`),
    pem,
    base64urlParaBuffer(partes[2])
  );
  if (!assinaturaOk) return { ok: false, motivo: 'assinatura invalida' };

  const agora = Math.floor(Date.now() / 1000);
  if (!claims.exp || claims.exp + 60 < agora) return { ok: false, motivo: 'token expirado' };
  if (claims.aud !== PROJETO) return { ok: false, motivo: 'audiencia de outro projeto' };
  if (claims.iss !== `https://securetoken.google.com/${PROJETO}`) {
    return { ok: false, motivo: 'emissor invalido' };
  }
  if (!claims.sub || typeof claims.sub !== 'string') return { ok: false, motivo: 'uid ausente' };

  return { ok: true, uid: claims.sub };
}

export function projetoFirebase() {
  return PROJETO;
}
