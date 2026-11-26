/**
 * api/cron-zara.js — Cron Matinal das 08:00 (America/Sao_Paulo)
 * ============================================================================
 * Disparado diariamente às 11:00 UTC (08:00 BRT) via Vercel Cron.
 * Executa a auditoria operacional da Zara em cada tenant ativo:
 * 1. Lê regras comerciais do Tom (imobiliarias/{tenantId}/config/regras_tom);
 * 2. Identifica leads acima do SLA e imóveis parados acima do prazo;
 * 3. Chama DeepSeek (com fallback em cadeia) usando o prompt estrito da Zara;
 * 4. Grava diagnóstico em imobiliarias/{tenantId}/auditorias_zara e no doc 'ultima'.
 * ============================================================================
 */

import {
  adminDisponivel,
  listarDocumentos,
  obterDocumento,
  criarDocumento,
  definirDocumento,
} from './_firestoreAdmin.js';

const REGRAS_TOM_PADRAO = {
  comissaoPadrao: 6,
  descontoMaximo: 5,
  politicaPermuta: 'Aceita até 30% em veículos ou imóveis de menor valor avaliados pela imobiliária',
  slaAtendimentoMinutos: 15,
  diasAlertaImovelParado: 30,
  regrasEquipe: 'Todo lead recebido deve ser contatado em até 15 minutos. Imóveis parados há mais de 30 dias devem passar por revisão de preço ou novas fotos. Propostas com permuta exigem laudo prévio.',
};

async function chamarDeepSeekZara(prompt) {
  const chave = process.env.DEEPSEEK_API_KEY;
  if (!chave) {
    throw new Error('DEEPSEEK_API_KEY não configurada no servidor.');
  }

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${chave}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1200,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Falha na API DeepSeek (${res.status}): ${txt.slice(0, 200)}`);
  }

  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('Resposta vazia da DeepSeek.');
  }
  return text.trim();
}

function filtrarCriticos(leads = [], imoveis = [], regras = REGRAS_TOM_PADRAO) {
  const agora = Date.now();
  const slaMin = Number(regras.slaAtendimentoMinutos) || 15;
  const diasLimite = Number(regras.diasAlertaImovelParado) || 30;

  const leadsAtrasados = leads
    .filter((l) => {
      const st = String(l.status || '').toLowerCase();
      if (['convertido', 'ganho', 'perdido', 'descartado', 'concluído', 'concluido'].includes(st)) return false;
      if (l.horasSemContato && l.horasSemContato * 60 > slaMin) return true;
      const t = l.criadoEm || l.dataCriacao || l.createdAt || l.atualizadoEm;
      const ms = t?.seconds ? t.seconds * 1000 : t ? new Date(t).getTime() : 0;
      return ms > 0 && (agora - ms) / 60000 > slaMin;
    })
    .map((l) => ({
      id: l.id || 'lead',
      nome: l.nome || 'Lead sem nome',
      tempoParado: l.horasSemContato ? `${l.horasSemContato}h` : 'acima do SLA',
      corretor: l.corretor || l.corretorResponsavel || 'Não atribuído',
    }));

  const imoveisParados = imoveis
    .filter((im) => {
      const st = String(im.status || '').toLowerCase();
      if (['vendido', 'alugado', 'inativo'].includes(st)) return false;
      if (Number.isFinite(im.diasParado) && im.diasParado >= diasLimite) return true;
      const t = im.atualizadoEm || im.criadoEm || im.dataCadastro;
      const ms = t?.seconds ? t.seconds * 1000 : t ? new Date(t).getTime() : 0;
      return ms > 0 && (agora - ms) / 86400000 >= diasLimite;
    })
    .map((im) => ({
      id: im.id || 'imovel',
      codigo: im.codigo || im.id || 'S/C',
      titulo: im.titulo || 'Imóvel sem título',
      diasParado: Number(im.diasParado) || Math.floor((agora - (im.atualizadoEm?.seconds ? im.atualizadoEm.seconds * 1000 : agora)) / 86400000),
      corretor: im.corretorResponsavel || 'Não atribuído',
    }));

  return { leadsAtrasados, imoveisParados };
}

export default async function handler(req, res) {
  // Verificação de autorização opcional com CRON_SECRET se configurado na Vercel
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ erro: 'Não autorizado para disparo do cron.' });
    }
  }

  if (!adminDisponivel()) {
    return res.status(503).json({
      erro: 'Credenciais do Firestore Admin não configuradas no servidor (FIREBASE_SERVICE_ACCOUNT).',
    });
  }

  try {
    // 1. Listar oficinas / imobiliárias ativas
    const docsOficinas = await listarDocumentos('oficinas', { pageSize: 100 });
    const resultados = [];

    for (const ofi of docsOficinas) {
      const tenantId = ofi.id;
      if (!tenantId) continue;

      try {
        // Carregar regras comerciais
        const regrasDoc = await obterDocumento(`imobiliarias/${tenantId}/config/regras_tom`);
        const regrasTom = { ...REGRAS_TOM_PADRAO, ...(regrasDoc || {}) };

        // Carregar leads e imóveis
        const leadsDocs = await listarDocumentos(`oficinas/${tenantId}/leads_imobi`, { pageSize: 200 });
        const imoveisDocs = await listarDocumentos(`oficinas/${tenantId}/imoveis_imobi`, { pageSize: 200 });

        const { leadsAtrasados, imoveisParados } = filtrarCriticos(leadsDocs, imoveisDocs, regrasTom);

        // Se não há leads nem imóveis, pular tenant sem atividade
        if (leadsDocs.length === 0 && imoveisDocs.length === 0) {
          resultados.push({ tenantId, status: 'vazio_ignorado' });
          continue;
        }

        const regrasJson = JSON.stringify(regrasTom, null, 2);
        const leadsAtrasadosJson = JSON.stringify(leadsAtrasados, null, 2);
        const imoveisParadosJson = JSON.stringify(imoveisParados, null, 2);

        const promptZara = `Você é Zara, Diretora de Operações e Rotina da imobiliária no Express Imobi Tech.
Sua função é auditar o funil diário com base estrita nas Regras Comerciais da Casa e nos dados operacionais reais fornecidos abaixo.

REGRAS DA CASA (TOM):
${regrasJson}

DADOS CRÍTICOS DO DIA:
- Leads com atendimento pendente ou acima do SLA:
${leadsAtrasadosJson}

- Imóveis sem visita ou atualização acima do prazo:
${imoveisParadosJson}

FORMATO DA ENTREGA (Direto ao ponto, estilo boletim executivo das 08:00):
1. **Resumo em 2 linhas** (status geral da operação hoje e conformidade com as regras).
2. **Urgências de Atendimento** (cite nominalmente os leads, tempo parado, corretor responsável e a ação exata segundo a regra da casa).
3. **Carteira Travada** (cite código/título do imóvel parado, tempo sem giro e sugestão prática: ajuste de preço, novas fotos ou reposicionamento).
4. **Ação Prioritária do Gestor Hoje** (1 única decisão clara e prática para destravar caixa hoje).

DIRETRIZES OBRIGATÓRIAS:
- Baseie sua análise exclusivamente nas regras e dados fornecidos acima.
- Se algum bloco de dados estiver vazio, informe com naturalidade que a operação está dentro da meta para aquele indicador.
- NUNCA adicione notas técnicas, avisos de depuração, notas de rodapé ou menções a nomes de variáveis no texto entregue. Entregue estritamente os 4 pontos solicitados.`;

        let relatorio = '';
        try {
          relatorio = await chamarDeepSeekZara(promptZara);
          relatorio = String(relatorio || '')
            .replace(/\(Nota:[^)]+\)/gi, '')
            .replace(/Nota:[^\n]+/gi, '')
            .replace(/\{\{[^}]+\}\}/g, '')
            .trim();
        } catch (aiErr) {
          relatorio = `1. **Resumo em 2 linhas**\nAuditoria automática das 08:00 executada. Foram identificados ${leadsAtrasados.length} lead(s) com SLA vencido e ${imoveisParados.length} imóvel(is) sem giro.\n\n2. **Urgências de Atendimento**\n${leadsAtrasados.map((l) => `- ${l.nome} (${l.tempoParado}) - Corretor: ${l.corretor}`).join('\n') || 'Nenhum lead acima do SLA.'}\n\n3. **Carteira Travada**\n${imoveisParados.map((i) => `- [${i.codigo}] ${i.titulo} (${i.diasParado} dias) - Corretor: ${i.corretor}`).join('\n') || 'Nenhum imóvel sem giro.'}\n\n4. **Ação Prioritária do Gestor Hoje**\nCobrar atualização imediata dos corretores responsáveis pelos atendimentos pendentes.`;
        }

        const agoraIso = new Date().toISOString();
        const payload = {
          tenantId,
          relatorio,
          geradoEm: agoraIso,
          horaFormatada: '08:00',
          dataExtenso: new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
          totalLeadsAtrasados: leadsAtrasados.length,
          totalImoveisParados: imoveisParados.length,
          leadsAtrasados,
          imoveisParados,
          regrasAplicadas: regrasTom,
          origem: 'vercel_cron_matinal',
        };

        // Grava no histórico e no documento 'ultima'
        await criarDocumento(`imobiliarias/${tenantId}/auditorias_zara`, payload);
        await definirDocumento(`imobiliarias/${tenantId}/auditorias_zara/ultima`, payload);

        resultados.push({
          tenantId,
          status: 'sucesso',
          leadsAtrasados: leadsAtrasados.length,
          imoveisParados: imoveisParados.length,
        });
      } catch (tenantErr) {
        resultados.push({ tenantId, status: 'erro', mensagem: tenantErr.message });
      }
    }

    return res.status(200).json({
      sucesso: true,
      executadoEm: new Date().toISOString(),
      tenantsProcessados: resultados.length,
      detalhes: resultados,
    });
  } catch (err) {
    console.error('Erro na execução do Cron Zara:', err);
    return res.status(500).json({ erro: err.message });
  }
}
