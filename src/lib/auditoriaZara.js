import { doc, getDoc, setDoc, addDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import { carregarRegrasTom } from './regrasTom.js';
import { cabecalhosIA } from './aiAuth.js';
import { obterDadosCenarioDemoMemoria } from './cenarioDemo.js';

/**
 * Calcula resumo enxuto de leads atrasados e imóveis parados conforme as regras comerciais do Tom.
 */
export function extrairResumoCriticoOperacao(leads = [], imoveis = [], regras = {}) {
  const agora = Date.now();
  const diaMs = 24 * 60 * 60 * 1000;
  const minutoMs = 60 * 1000;

  const slaMinutos = Number(regras?.slaAtendimentoMinutos) || 15;
  const diasLimiteImovel = Number(regras?.diasAlertaImovelParado) || 30;

  // 1. Filtrar leads atrasados
  const leadsAtrasados = (Array.isArray(leads) ? leads : [])
    .filter((lead) => {
      if (!lead) return false;
      const status = String(lead.status || '').toLowerCase();
      if (['convertido', 'ganho', 'perdido', 'descartado', 'concluído', 'concluido'].includes(status)) {
        return false;
      }
      const horasAtraso = lead.horasSemContato || lead.horasSemResposta;
      if (horasAtraso && horasAtraso * 60 > slaMinutos) {
        return true;
      }
      const dataRef = lead.criadoEm || lead.dataCriacao || lead.createdAt || lead.atualizadoEm;
      const ms = dataRef?.toMillis ? dataRef.toMillis() : dataRef ? new Date(dataRef).getTime() : 0;
      if (ms > 0) {
        const diffMinutos = Math.floor((agora - ms) / minutoMs);
        return diffMinutos > slaMinutos;
      }
      return false;
    })
    .map((lead) => {
      let tempoStr = '';
      const horasAtraso = lead.horasSemContato || lead.horasSemResposta;
      if (horasAtraso) {
        tempoStr = `${horasAtraso}h sem resposta`;
      } else {
        const dataRef = lead.criadoEm || lead.dataCriacao || lead.createdAt || lead.atualizadoEm;
        const ms = dataRef?.toMillis ? dataRef.toMillis() : dataRef ? new Date(dataRef).getTime() : 0;
        const mins = ms > 0 ? Math.floor((agora - ms) / minutoMs) : 0;
        if (mins >= 1440) {
          tempoStr = `${Math.floor(mins / 1440)}d ${Math.floor((mins % 1440) / 60)}h sem resposta`;
        } else if (mins >= 60) {
          tempoStr = `${Math.floor(mins / 60)}h ${mins % 60}m sem resposta`;
        } else {
          tempoStr = `${mins}m sem resposta`;
        }
      }
      return {
        id: lead.id || lead.codigo || 'lead',
        nome: lead.nome || 'Lead sem nome',
        tempoParado: tempoStr,
        corretor: lead.corretor || lead.corretorResponsavel || 'Não atribuído',
      };
    });

  // 2. Filtrar imóveis parados acima do prazo
  const imoveisParados = (Array.isArray(imoveis) ? imoveis : [])
    .filter((imovel) => {
      if (!imovel) return false;
      const status = String(imovel.status || '').toLowerCase();
      if (['vendido', 'alugado', 'inativo', 'desativado'].includes(status)) {
        return false;
      }
      if (Number.isFinite(imovel.diasParado) && imovel.diasParado >= diasLimiteImovel) {
        return true;
      }
      const marco = imovel.atualizadoEm || imovel.criadoEm || imovel.dataCadastro;
      const ms = marco?.toMillis ? marco.toMillis() : marco ? new Date(marco).getTime() : 0;
      if (ms > 0) {
        const dias = Math.floor((agora - ms) / diaMs);
        return dias >= diasLimiteImovel;
      }
      return false;
    })
    .map((imovel) => {
      let dias = imovel.diasParado;
      if (!Number.isFinite(dias)) {
        const marco = imovel.atualizadoEm || imovel.criadoEm || imovel.dataCadastro;
        const ms = marco?.toMillis ? marco.toMillis() : marco ? new Date(marco).getTime() : 0;
        dias = ms > 0 ? Math.floor((agora - ms) / diaMs) : 0;
      }
      return {
        id: imovel.id || imovel.codigo || 'imovel',
        codigo: imovel.codigo || imovel.id || 'S/C',
        titulo: imovel.titulo || 'Imóvel sem título',
        diasParado: Number(dias) || 0,
        corretor: imovel.corretorResponsavel || imovel.corretor || 'Não atribuído',
      };
    });

  return { leadsAtrasados, imoveisParados };
}

/**
 * Executa a auditoria matinal da Zara via DeepSeek e salva o diagnóstico em imobiliarias/{tenantId}/auditorias_zara
 */
export async function executarAuditoriaZara(tenantId, { db = null, leads = null, imoveis = null, regras = null } = {}) {
  if (!tenantId) {
    throw new Error('Tenant ID não fornecido para auditoria da Zara.');
  }

  // 1. Carregar regras comerciais do Tom se não fornecidas
  const regrasTom = regras || (await carregarRegrasTom(tenantId, db));

  // 2. Obter leads e imóveis se não injetados
  let leadsLista = leads;
  let imoveisLista = imoveis;

  if ((!leadsLista || !imoveisLista) && db) {
    try {
      if (!leadsLista) {
        const snapLeads = await getDocs(collection(db, 'oficinas', tenantId, 'leads_imobi'));
        leadsLista = (snapLeads?.docs || []).map((d) => ({ id: d.id, ...d.data() }));
      }
      if (!imoveisLista) {
        const snapImv = await getDocs(collection(db, 'oficinas', tenantId, 'imoveis_imobi'));
        imoveisLista = (snapImv?.docs || []).map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn('Aviso ao buscar dados no Firestore para auditoria Zara:', err.message);
    }
  }

  leadsLista = Array.isArray(leadsLista) ? leadsLista : [];
  imoveisLista = Array.isArray(imoveisLista) ? imoveisLista : [];

  let cenarioDemoInjetado = false;
  // Se a conta não tiver imóveis nem leads cadastrados, injeta automaticamente o cenário demo em memória
  if (leadsLista.length === 0 && imoveisLista.length === 0) {
    const dadosDemo = obterDadosCenarioDemoMemoria();
    leadsLista = dadosDemo.leadsDemo;
    imoveisLista = dadosDemo.imoveisDemo;
    cenarioDemoInjetado = true;
  }

  // 3. Montar resumo JSON enxuto
  const { leadsAtrasados, imoveisParados } = extrairResumoCriticoOperacao(leadsLista, imoveisLista, regrasTom);

  // 4. Montar dados em JSON.stringify
  const regrasJson = JSON.stringify(regrasTom, null, 2);
  const leadsAtrasadosJson = JSON.stringify(leadsAtrasados, null, 2);
  const imoveisParadosJson = JSON.stringify(imoveisParados, null, 2);

  // 5. Template de prompt com substituição dos placeholders
  const templatePrompt = `Você é Zara, Diretora de Operações e Rotina da imobiliária no Express Imobi Tech.
Sua função é auditar o funil diário com base estrita nas Regras Comerciais da Casa e nos dados operacionais reais fornecidos abaixo.

REGRAS DA CASA (TOM):
{{regras_tom_json}}

DADOS CRÍTICOS DO DIA:
- Leads com atendimento pendente ou acima do SLA:
{{leads_atrasados_json}}

- Imóveis sem visita ou atualização acima do prazo:
{{imoveis_parados_json}}

FORMATO DA ENTREGA (Direto ao ponto, estilo boletim executivo das 08:00):
1. **Resumo em 2 linhas** (status geral da operação hoje e conformidade com as regras).
2. **Urgências de Atendimento** (cite nominalmente os leads, tempo parado, corretor responsável e a ação exata segundo a regra da casa).
3. **Carteira Travada** (cite código/título do imóvel parado, tempo sem giro e sugestão prática: ajuste de preço, novas fotos ou reposicionamento).
4. **Ação Prioritária do Gestor Hoje** (1 única decisão clara e prática para destravar caixa hoje).

DIRETRIZES OBRIGATÓRIAS:
- Baseie sua análise exclusivamente nas regras e dados fornecidos acima.
- Se algum bloco de dados estiver vazio, informe com naturalidade que a operação está dentro da meta para aquele indicador.
- NUNCA adicione notas técnicas, avisos de depuração, notas de rodapé ou menções a nomes de variáveis no texto entregue. Entregue estritamente os 4 pontos solicitados.`;

  // Interpolação física dos placeholders com JSON.stringify()
  const promptZara = templatePrompt
    .replace('{{regras_tom_json}}', regrasJson)
    .replace('{{leads_atrasados_json}}', leadsAtrasadosJson)
    .replace('{{imoveis_parados_json}}', imoveisParadosJson);

  // 6. Chamar API DeepSeek via /api/ai
  let relatorioTexto = '';
  try {
    const url = typeof window !== 'undefined' ? '/api/ai' : (typeof process !== 'undefined' && process.env?.APP_URL ? `${process.env.APP_URL}/api/ai` : null);
    if (!url) {
      throw new Error('Ambiente local de teste sem URL base para /api/ai');
    }
    const headers = await cabecalhosIA();
    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        provider: 'deepseek',
        model: 'deepseek-chat',
        prompt: promptZara,
        temperature: 0.2,
        maxTokens: 1200,
      }),
    });

    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data?.text) {
      throw new Error(data?.error || `Falha no proxy de IA (${resp.status})`);
    }
    relatorioTexto = data.text;
  } catch (err) {
    console.warn('Erro ao chamar DeepSeek para auditoria da Zara, gerando diagnóstico analítico direto:', err);
    // Fallback analítico determinístico baseado nas regras da casa
    relatorioTexto = gerarDiagnosticoAnaliticoDireto(regrasTom, leadsAtrasados, imoveisParados);
  }

  // Sanitização rigorosa: remove qualquer nota sobre variáveis ou menções {{...}} residuais
  relatorioTexto = String(relatorioTexto || '')
    .replace(/\(Nota:[^)]+\)/gi, '')
    .replace(/Nota:[^\n]+/gi, '')
    .replace(/\{\{[^}]+\}\}/g, '')
    .trim();

  // 7. Montar objeto da auditoria
  const agoraIso = new Date().toISOString();
  const registroAuditoria = {
    tenantId,
    relatorio: relatorioTexto,
    geradoEm: agoraIso,
    horaFormatada: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    dataExtenso: new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
    totalLeadsAtrasados: leadsAtrasados.length,
    totalImoveisParados: imoveisParados.length,
    leadsAtrasados,
    imoveisParados,
    regrasAplicadas: regrasTom,
    cenarioDemoInjetado,
  };

  // 7. Salvar no Firestore e localStorage
  try {
    localStorage.setItem(`zara_ultima_auditoria:${tenantId}`, JSON.stringify(registroAuditoria));
  } catch {
    /* ignora */
  }

  if (db && tenantId) {
    try {
      // Grava no histórico
      await addDoc(collection(db, 'imobiliarias', tenantId, 'auditorias_zara'), {
        ...registroAuditoria,
        criadoEm: Timestamp.now(),
      });
      // Atualiza o documento 'ultima' para leitura instantânea
      await setDoc(doc(db, 'imobiliarias', tenantId, 'auditorias_zara', 'ultima'), {
        ...registroAuditoria,
        atualizadoEm: Timestamp.now(),
      }, { merge: true });
    } catch (err) {
      console.warn('Aviso ao salvar auditoria Zara no Firestore:', err.message);
    }
  }

  return registroAuditoria;
}

/**
 * Lê a última auditoria gravada para o tenant (Firestore com fallback no localStorage)
 */
export async function carregarUltimaAuditoriaZara(tenantId, db = null) {
  if (!tenantId) return null;

  // 1. Tentar Firestore
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'imobiliarias', tenantId, 'auditorias_zara', 'ultima'));
      if (snap.exists()) {
        return snap.data();
      }
    } catch (err) {
      console.warn('Aviso ao carregar última auditoria Zara do Firestore:', err.message);
    }
  }

  // 2. Fallback localStorage
  try {
    const salvo = localStorage.getItem(`zara_ultima_auditoria:${tenantId}`);
    if (salvo) {
      return JSON.parse(salvo);
    }
  } catch {
    /* ignora */
  }

  return null;
}

/**
 * Gerador de diagnóstico analítico determinístico de fallback
 * caso a chave da API esteja indisponível no ambiente de teste local.
 */
function gerarDiagnosticoAnaliticoDireto(regras, leadsAtrasados, imoveisParados) {
  const slaMin = regras?.slaAtendimentoMinutos || 15;
  const diasParado = regras?.diasAlertaImovelParado || 30;

  const linhas = [];
  linhas.push(`1. **Resumo em 2 linhas**`);
  if (leadsAtrasados.length === 0 && imoveisParados.length === 0) {
    linhas.push(`Operação com 100% de conformidade às regras do Tom. SLA de atendimento e giro de imóveis dentro da meta estabelecida.`);
  } else {
    linhas.push(`Operação com gargalos críticos: ${leadsAtrasados.length} lead(s) estourando o SLA de ${slaMin}m e ${imoveisParados.length} imóvel(is) sem giro há mais de ${diasParado} dias.`);
  }

  linhas.push(`\n2. **Urgências de Atendimento**`);
  if (leadsAtrasados.length === 0) {
    linhas.push(`Nenhum lead acima do SLA de ${slaMin} minutos. Atendimento dentro da meta da casa.`);
  } else {
    leadsAtrasados.forEach((l) => {
      linhas.push(`- **${l.nome}** (${l.tempoParado}) — Corretor: ${l.corretor}. Ação: Contato imediato via WhatsApp/Ligação conforme SLA de ${slaMin}m ou redistribuição da fila.`);
    });
  }

  linhas.push(`\n3. **Carteira Travada**`);
  if (imoveisParados.length === 0) {
    linhas.push(`Nenhum imóvel sem visita ou atualização acima de ${diasParado} dias. Carteira ativa e girando.`);
  } else {
    imoveisParados.forEach((imv) => {
      linhas.push(`- **[${imv.codigo}] ${imv.titulo}** (${imv.diasParado} dias sem giro) — Corretor: ${imv.corretor}. Sugestão: Revisão de valor de mercado (-5%), novas fotos de alto padrão e reposicionamento em portais.`);
    });
  }

  linhas.push(`\n4. **Ação Prioritária do Gestor Hoje**`);
  if (leadsAtrasados.length > 0) {
    linhas.push(`Cobrar os corretores responsáveis pelos leads travados há mais tempo e rodar a roleta para quem não responder até às 09:30.`);
  } else if (imoveisParados.length > 0) {
    linhas.push(`Reunir corretores responsáveis pelos imóveis com mais de ${diasParado} dias de pátio para notificar proprietários e alinhar ajuste de preço.`);
  } else {
    linhas.push(`Manter ritmo de captação qualificada e incentivar propostas ativas da equipe comercial.`);
  }

  return linhas.join('\n');
}
