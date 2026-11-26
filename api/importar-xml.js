/**
 * api/importar-xml.js — leitura de link XML de portal/CRM (D-23.16)
 * ============================================================================
 * O navegador não consegue buscar o feed de ZAP/VivaReal/OLX/VRSync por causa
 * de CORS. Este endpoint busca o link no servidor e devolve o XML cru; o
 * parser roda no front (`src/lib/importacao/xmlImoveis.js`).
 *
 * CONTRATO
 *   POST /api/importar-xml
 *     Authorization: Bearer <ID token do Firebase Auth>   (obrigatório)
 *     { "url": "https://www.zapimoveis.com.br/xml/....xml" }
 *   -> 200 { ok, url, contentType, tamanho, conteudo }
 *
 *   GET /api/importar-xml -> diagnóstico (sem buscar nada)
 *
 * SEGURANÇA
 *   • só http/https, sem credenciais na URL;
 *   • bloqueia localhost, `.local`/`.internal` e faixas privadas (SSRF);
 *   • até 2 redirecionamentos, cada salto validado de novo;
 *   • 5 MB de teto e 15 s de tempo;
 *   • 20 buscas por minuto por uid.
 * ============================================================================
 */

/* global process */

import { verificarIdToken } from './_authToken.js';

const EXIGIR_AUTH = String(process.env.XML_IMPORT_REQUIRE_AUTH ?? 'true') !== 'false';
const LIMITE_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 15000;
const MAX_REDIRECIONAMENTOS = 2;
const JANELA_MS = 60000;
const MAX_POR_JANELA = 20;
const USER_AGENT = 'ExpressImobiTech/1.0 (+https://expresstech.com.br; importacao de XML imobiliario)';

const janelas = new Map();

function excedeuLimite(chave) {
  const agora = Date.now();
  const janela = janelas.get(chave);
  if (!janela || agora - janela.inicio > JANELA_MS) {
    janelas.set(chave, { inicio: agora, total: 1 });
    return false;
  }
  janela.total += 1;
  return janela.total > MAX_POR_JANELA;
}

const IPV4_PRIVADO = /^(0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

function hostProibido(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.home')) return true;
  if (host === 'metadata.google.internal') return true;
  if (IPV4_PRIVADO.test(host)) return true;
  if (host === '::1' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) return true;
  return false;
}

/** Valida a URL nos dois sentidos e devolve `{ ok, url }` ou `{ ok:false, erro }`. */
export function validarUrlXml(bruta) {
  let url;
  try {
    url = new URL(String(bruta || '').trim());
  } catch {
    return { ok: false, erro: 'Informe um link completo, começando com https://' };
  }
  if (!/^https?:$/.test(url.protocol)) {
    return { ok: false, erro: 'Somente links http:// ou https:// são aceitos.' };
  }
  if (url.username || url.password) {
    return { ok: false, erro: 'O link não pode trazer usuário e senha embutidos.' };
  }
  if (hostProibido(url.hostname)) {
    return { ok: false, erro: 'Endereço interno bloqueado. Use o link público do feed do portal.' };
  }
  return { ok: true, url: url.toString() };
}

async function autorizar(req, res) {
  if (!EXIGIR_AUTH) return { ok: true, uid: 'dev' };
  const bruto = req.headers?.authorization || req.headers?.Authorization || '';
  let resultado;
  try {
    resultado = await verificarIdToken(bruto);
  } catch (erro) {
    resultado = { ok: false, motivo: String(erro?.message || erro).slice(0, 160) };
  }
  if (!resultado?.ok) {
    res.status(401).json({
      error: 'Não autorizado',
      codigo: 'nao_autorizado',
      motivo: resultado?.motivo,
      hint: 'Abra o painel logado na sua conta e tente novamente.',
    });
    return { ok: false };
  }
  return { ok: true, uid: resultado.uid };
}

async function baixarConteudo(urlInicial) {
  let atual = urlInicial;

  for (let salto = 0; salto <= MAX_REDIRECIONAMENTOS; salto += 1) {
    const validado = validarUrlXml(atual);
    if (!validado.ok) return { ok: false, status: 400, erro: validado.erro };

    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort(), TIMEOUT_MS);
    try {
      const resposta = await fetch(validado.url, {
        method: 'GET',
        redirect: 'manual',
        signal: controle.signal,
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/xml,text/xml,*/*' },
      });

      if (resposta.status >= 300 && resposta.status < 400) {
        const destino = resposta.headers?.get?.('location');
        if (!destino) return { ok: false, status: 502, erro: 'O portal redirecionou sem informar o destino.' };
        atual = new URL(destino, validado.url).toString();
        continue;
      }
      if (!resposta.ok) {
        return {
          ok: false,
          status: 502,
          erro: `O portal respondeu HTTP ${resposta.status}. Confira se o link do XML ainda está ativo.`,
        };
      }

      const buffer = await resposta.arrayBuffer();
      if (buffer.byteLength > LIMITE_BYTES) {
        return { ok: false, status: 413, erro: 'O feed passa de 5 MB. Importe em lotes ou envie o arquivo XML.' };
      }
      const conteudo = new TextDecoder('utf-8').decode(buffer);
      const inicio = conteudo.slice(0, 600);
      if (/^\s*<!doctype\s+html|<html[\s>]/i.test(inicio)) {
        return {
          ok: false,
          status: 422,
          erro: 'O link devolveu uma página HTML, não o XML do feed. Confira o endereço de exportação no portal.',
        };
      }
      if (!conteudo.includes('<')) {
        return { ok: false, status: 422, erro: 'O link devolveu um conteúdo que não é XML.' };
      }
      return {
        ok: true,
        url: validado.url,
        contentType: resposta.headers?.get?.('content-type') || 'desconhecido',
        tamanho: buffer.byteLength,
        conteudo,
      };
    } catch (erro) {
      const abortado = erro?.name === 'AbortError';
      return {
        ok: false,
        status: abortado ? 504 : 502,
        erro: abortado
          ? 'O portal demorou mais de 15 s para responder. Tente de novo ou envie o arquivo XML.'
          : `Não foi possível abrir o link (${String(erro?.message || erro).slice(0, 120)}).`,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  return { ok: false, status: 502, erro: 'Redirecionamentos demais no link informado.' };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const sessao = await autorizar(req, res);
  if (!sessao.ok) return;

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      endpoint: 'importar-xml',
      limiteMb: LIMITE_BYTES / (1024 * 1024),
      timeoutSegundos: TIMEOUT_MS / 1000,
      authObrigatoria: EXIGIR_AUTH,
    });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Use POST com { url }.' });
  }

  if (excedeuLimite(sessao.uid || 'anon')) {
    return res.status(429).json({ error: 'Muitas leituras de XML em 1 minuto. Aguarde alguns segundos.' });
  }

  const corpo =
    typeof req.body === 'string'
      ? (() => {
          try {
            return JSON.parse(req.body);
          } catch {
            return null;
          }
        })()
      : req.body;

  if (!corpo || typeof corpo !== 'object') {
    return res.status(400).json({ error: 'Corpo inválido: envie { url }.' });
  }

  const resultado = await baixarConteudo(corpo.url);
  if (!resultado.ok) return res.status(resultado.status || 502).json({ error: resultado.erro });

  return res.status(200).json({
    ok: true,
    url: resultado.url,
    contentType: resultado.contentType,
    tamanho: resultado.tamanho,
    conteudo: resultado.conteudo,
  });
}
