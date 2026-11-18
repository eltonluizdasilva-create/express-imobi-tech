/**
 * api/xml-portais.js — feed XML para ZAP/VivaReal/OLX/Imovelweb/Chaves na Mão
 * ============================================================================
 * GET /api/xml-portais?oficinaId=<uid>[&limite=500]
 * Resposta: application/xml; charset=utf-8
 *
 * Lê oficinas/{id}, oficinas/{id}/configuracoes/geral e imoveis_imobi via
 * service account (Admin: não depende das rules). Sem credencial → 503.
 * ============================================================================
 */
import { gerarXmlImoveis, imovelPublicavel } from '../src/lib/portais.js';
import { adminDisponivel, erroDeCredencial, listarDocumentos, obterDocumento } from './_firestoreAdmin.js';

const RX_OFICINA = /^[A-Za-z0-9_-]{6,64}$/;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });

  const oficinaId = String(req.query?.oficinaId || '').trim();
  if (!RX_OFICINA.test(oficinaId)) {
    return res.status(400).json({ error: 'oficinaId inválido', esperado: 'id da oficina (uid)' });
  }
  if (!adminDisponivel()) return res.status(503).json(erroDeCredencial());

  try {
    const [oficina, config] = await Promise.all([
      obterDocumento(`oficinas/${oficinaId}`),
      obterDocumento(`oficinas/${oficinaId}/configuracoes/geral`),
    ]);

    if (!oficina) return res.status(404).json({ error: 'Oficina não encontrada' });

    const limite = Math.min(2000, Math.max(1, Number(req.query?.limite) || 500));
    const imoveis = await listarDocumentos(`oficinas/${oficinaId}/imoveis_imobi`, { pageSize: 300 });

    const contexto = {
      nomeOficina: oficina.nomeOficina || oficina.nome || config?.nome || 'Imobiliária',
      creci: config?.creci || oficina.creci || '',
      whatsapp: config?.whatsapp || config?.telefone || oficina.telefone || '',
      email: config?.email || oficina.email || '',
      cidade: config?.cidade || oficina.cidade || '',
      uf: config?.uf || oficina.uf || '',
    };

    const xml = gerarXmlImoveis(imoveis.slice(0, limite), {
      oficina: contexto,
      dataAtualizacao: new Date().toISOString().slice(0, 10),
    });

    const publicaveis = imoveis.filter(imovelPublicavel).length;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.setHeader('X-Total-Imoveis', String(imoveis.length));
    res.setHeader('X-Imoveis-Publicaveis', String(publicaveis));
    return res.status(200).send(xml);
  } catch (erro) {
    if (erro?.semCredencial) return res.status(503).json(erroDeCredencial());
    console.error('[xml-portais]', erro?.message);
    return res.status(500).json({ error: 'Falha ao gerar o XML', detail: String(erro?.message || erro).slice(0, 200) });
  }
}
