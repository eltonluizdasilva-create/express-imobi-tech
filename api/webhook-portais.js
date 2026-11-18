/**
 * api/webhook-portais.js — recebe leads dos portais
 * ============================================================================
 * POST /api/webhook-portais?oficinaId=<uid>&token=<tokenPortal>
 * Aceita JSON ou form-urlencoded. Grava em oficinas/{oid}/leads_imobi.
 *
 * Segurança: o token fica em oficinas/{oid}/configuracoes/portais (leitura só
 * de gestor pelas rules) e é comparado em tempo constante. Sem token válido,
 * nada é gravado. Rate limit simples por IP para evitar flood.
 * ============================================================================
 */
import {
  detectarPortal, interpretarLeadPortal, leadPortalValido, leadParaFirestore, validarToken,
} from '../src/lib/portais.js';
import {
  adminDisponivel, criarDocumento, erroDeCredencial, listarDocumentos, obterDocumento,
} from './_firestoreAdmin.js';

const RX_OFICINA = /^[A-Za-z0-9_-]{6,64}$/;

const janelas = new Map();
function excedeu(ip, max = 40) {
  const agora = Date.now();
  const w = janelas.get(ip);
  if (!w || agora - w.inicio > 60_000) { janelas.set(ip, { inicio: agora, total: 1 }); return false; }
  w.total += 1;
  return w.total > max;
}

function corpoDaRequisicao(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) {
    if (req.body.trim().startsWith('{')) {
      try { return JSON.parse(req.body); } catch { return {}; }
    }
    const params = new URLSearchParams(req.body);
    return Object.fromEntries(params.entries());
  }
  return {};
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const oficinaId = String(req.query?.oficinaId || '').trim();
  const token = String(req.query?.token || req.headers['x-portal-token'] || '').trim();
  if (!RX_OFICINA.test(oficinaId)) return res.status(400).json({ error: 'oficinaId inválido' });
  if (!token) return res.status(401).json({ error: 'token ausente' });
  if (!adminDisponivel()) return res.status(503).json(erroDeCredencial());

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconhecido';
  if (excedeu(ip)) return res.status(429).json({ error: 'Muitas requisições' });

  try {
    const portais = await obterDocumento(`oficinas/${oficinaId}/configuracoes/portais`);
    if (!portais?.token) return res.status(403).json({ error: 'Integração não configurada nesta oficina' });
    if (portais.ativo === false) return res.status(403).json({ error: 'Integração desativada' });
    if (!validarToken(token, portais.token)) return res.status(401).json({ error: 'token inválido' });

    const corpo = corpoDaRequisicao(req);
    if (!corpo || typeof corpo !== 'object' || !Object.keys(corpo).length) {
      return res.status(400).json({ error: 'payload vazio' });
    }

    const portal = detectarPortal({ portal: req.query?.portal, body: corpo, headers: req.headers });
    const lead = interpretarLeadPortal(corpo, { portal });
    if (!leadPortalValido(lead)) {
      return res.status(422).json({ error: 'lead sem nome ou sem contato', recebido: { nome: Boolean(lead.nome), telefone: Boolean(lead.telefone), email: Boolean(lead.email) } });
    }

    // Vínculo com o imóvel: procura pelo código do anúncio
    let imovelId = null;
    if (lead.imovelCodigo) {
      const imoveis = await listarDocumentos(`oficinas/${oficinaId}/imoveis_imobi`, { pageSize: 300 });
      const achado = imoveis.find((i) => String(i.codigo || '').toLowerCase() === lead.imovelCodigo.toLowerCase() || i.id === lead.imovelCodigo);
      imovelId = achado?.id || null;
    }

    const payload = {
      ...leadParaFirestore(lead, { imovelId }),
      data_registro: lead.recebidoEm,
      // Date vira timestampValue no encoder — o CRM ordena por este campo
      criadoEm: new Date(),
      portalOrigem: portal,
      recebidoPorWebhook: true,
    };

    const criado = await criarDocumento(`oficinas/${oficinaId}/leads_imobi`, payload);

    return res.status(200).json({
      ok: true,
      leadId: criado.id,
      portal,
      origem: lead.origem,
      imovelVinculado: Boolean(imovelId),
    });
  } catch (erro) {
    if (erro?.semCredencial) return res.status(503).json(erroDeCredencial());
    console.error('[webhook-portais]', erro?.message);
    return res.status(500).json({ error: 'Falha ao gravar o lead', detail: String(erro?.message || erro).slice(0, 200) });
  }
}
