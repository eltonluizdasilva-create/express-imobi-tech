// src/agent/dueDiligencePrompt.js
/**
 * Prompt de Sistema e Parser para Due Diligence & Raio-X de Matrícula com IA
 * ============================================================================
 * Analisa o texto de Matrícula de Imóvel, IPTU, Certidões Negativas (CNDs)
 * e documentos pessoais sob a ótica da Lei de Registros Públicos (Lei 6.015/73),
 * Código Civil Brasileiro e normas do CNJ.
 * 
 * Retorna diagnóstico estruturado:
 * - semaforo: "VERDE" | "AMARELO" | "VERMELHO"
 * - scoreSeguranca: 0 a 100
 * - resumoExecutivo
 * - dadosIdentificados (matrícula, cartório, proprietários, áreas, divergências)
 * - alertasRisco (hipoteca, penhora, usufruto, alienação, etc.)
 * - checklistCertidoes (status: OK | PENDENTE | ATENCAO + ação)
 * - recomendacaoFinal
 * ============================================================================
 */

import { cabecalhosIA } from '../lib/aiAuth.js';

export const SYSTEM_PROMPT_DUE_DILIGENCE = `
Você é um especialista jurídico sênior em Direito Imobiliário e Notarial/Registral brasileiro (Lei 6.015/73 - Lei de Registros Públicos, Código Civil Brasileiro e Provimentos do CNJ).

Sua missão é realizar uma Due Diligence Imobiliária e Raio-X de Matrícula completo, analisando o conteúdo de Matrícula do Imóvel, IPTU, Certidões Negativas de Débitos (CNDs) e documentos pessoais para blindar a transação imobiliária contra riscos de evicção, fraudes à execução, penhoras e indisponibilidades.

Retorne EXCLUSIVAMENTE um objeto JSON válido, sem blocos de texto ou markdown adicional ao redor, seguindo estritamente a seguinte estrutura:

{
  "semaforo": "VERDE | AMARELO | VERMELHO",
  "scoreSeguranca": 85,
  "resumoExecutivo": "Diagnóstico direto e executivo em linguagem clara de 2 a 4 linhas para o corretor e gestor imobiliário.",
  "dadosIdentificados": {
    "numeroMatricula": "string ou null",
    "cartorioRI": "string ou null",
    "proprietariosAtuais": ["string"],
    "areaMatricula": "string ou null",
    "areaIPTU": "string ou null",
    "divergenciaArea": false,
    "valorVenalIPTU": "string ou null"
  },
  "alertasRisco": [
    {
      "nivel": "CRITICO | ALERTA | OBSERVACAO",
      "titulo": "Título curto do apontamento (ex: Alienação Fiduciária Ativa / Penhora Judicial / Divergência de Área Construída / Averbação de Casamento Pendente)",
      "descricao": "Explicação prática do risco e de como sanar.",
      "baseLegal": "Dispositivo legal ou praxe notarial aplicável"
    }
  ],
  "checklistCertidoes": [
    {
      "item": "Nome da certidão (ex: Matrícula Atualizada com Ônus e Ações Reipersecutórias, CND Municipal de Tributos Imobiliários, CND Conjunta Federal PGFN/RFB, CND Trabalhista BNDT, Certidão de Distribuidores Cíveis Estaduais)",
      "status": "OK | PENDENTE | ATENCAO",
      "acaoRecomendada": "Ação prática recomendada para emissão ou validação antes da lavratura da escritura"
    }
  ],
  "recomendacaoFinal": "Recomendação conclusiva para fechar o negócio com segurança jurídica."
}

Critérios para definição do Semáforo:
- VERDE: Imóvel livre de gravames restritivos, proprietários com plena disponibilidade dos bens, certidões regulares, apto para lavratura de escritura ou contrato de financiamento.
- AMARELO: Apontamentos solucionáveis com diligência prévia (ex: saldo devedor de alienação fiduciária com anuência do credor, averbação de casamento/divórcio pendente, habite-se/área construída precisando de averbação, certidão em emissão).
- VERMELHO: Riscos impeditivos ou de alta litigiosidade (penhora averbada, indisponibilidade via CNIB, ação reipersecutória, usufruto vitalício sem renúncia, titularidade com cadeia dominial rompida ou processo executivo com risco claro de fraude à execução).
`;

/**
 * Normaliza e sanitiza a resposta textual da IA, garantindo retorno estrito e seguro.
 */
export function interpretarDueDiligence(respostaTexto) {
  if (!respostaTexto || typeof respostaTexto !== 'string') {
    return {
      semaforo: 'AMARELO',
      scoreSeguranca: 50,
      resumoExecutivo: 'Não foi possível processar a resposta da IA. Verifique os dados inseridos.',
      dadosIdentificados: {
        numeroMatricula: null,
        cartorioRI: null,
        proprietariosAtuais: [],
        areaMatricula: null,
        areaIPTU: null,
        divergenciaArea: false,
        valorVenalIPTU: null,
      },
      alertasRisco: [],
      checklistCertidoes: [],
      recomendacaoFinal: 'Recomenda-se obter certidão atualizada de matrícula para análise detalhada.',
    };
  }

  let limpo = respostaTexto.trim();
  // Remove markdown codeblock (```json ... ``` ou ``` ...)
  if (limpo.startsWith('```')) {
    limpo = limpo.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  let parsed = null;
  try {
    parsed = JSON.parse(limpo);
  } catch (err) {
    // Tenta encontrar o bloco JSON mais externo { ... }
    const inicio = limpo.indexOf('{');
    const fim = limpo.lastIndexOf('}');
    if (inicio !== -1 && fim !== -1 && fim > inicio) {
      try {
        parsed = JSON.parse(limpo.substring(inicio, fim + 1));
      } catch (errSub) {
        console.warn('Erro ao extrair JSON de Due Diligence:', errSub);
      }
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      semaforo: 'AMARELO',
      scoreSeguranca: 50,
      resumoExecutivo: respostaTexto.slice(0, 300),
      dadosIdentificados: {
        numeroMatricula: null,
        cartorioRI: null,
        proprietariosAtuais: [],
        areaMatricula: null,
        areaIPTU: null,
        divergenciaArea: false,
        valorVenalIPTU: null,
      },
      alertasRisco: [{
        nivel: 'OBSERVACAO',
        titulo: 'Análise Preliminar',
        descricao: 'A resposta não pôde ser convertida em JSON estrito. Revise o parecer manualmente.',
        baseLegal: 'Lei 6.015/73',
      }],
      checklistCertidoes: [
        {
          item: 'Matrícula Atualizada de Inteiro Teor com Ônus e Ações',
          status: 'PENDENTE',
          acaoRecomendada: 'Solicitar certidão vintenária no Cartório de Registro de Imóveis competente.',
        },
      ],
      recomendacaoFinal: 'Solicitar assessoria jurídica imobiliária para conferência documental.',
    };
  }

  // 1. Normalização do Semáforo
  let semaforo = String(parsed.semaforo || '').toUpperCase().trim();
  if (!['VERDE', 'AMARELO', 'VERMELHO'].includes(semaforo)) {
    if (semaforo.includes('VERD')) semaforo = 'VERDE';
    else if (semaforo.includes('VERM') || semaforo.includes('RED')) semaforo = 'VERMELHO';
    else semaforo = 'AMARELO';
  }

  // 2. Normalização do Score (0 - 100)
  let scoreSeguranca = Number(parsed.scoreSeguranca);
  if (Number.isNaN(scoreSeguranca) || scoreSeguranca < 0 || scoreSeguranca > 100) {
    scoreSeguranca = semaforo === 'VERDE' ? 90 : semaforo === 'VERMELHO' ? 30 : 65;
  } else {
    scoreSeguranca = Math.round(scoreSeguranca);
  }

  // 3. Resumo Executivo
  const resumoExecutivo = String(parsed.resumoExecutivo || '').trim() ||
    `Diagnóstico registral concluído com classificação ${semaforo}.`;

  // 4. Dados Identificados
  const rawDados = parsed.dadosIdentificados && typeof parsed.dadosIdentificados === 'object'
    ? parsed.dadosIdentificados
    : {};
  const dadosIdentificados = {
    numeroMatricula: rawDados.numeroMatricula ? String(rawDados.numeroMatricula).trim() : null,
    cartorioRI: rawDados.cartorioRI ? String(rawDados.cartorioRI).trim() : null,
    proprietariosAtuais: Array.isArray(rawDados.proprietariosAtuais)
      ? rawDados.proprietariosAtuais.map((p) => String(p).trim()).filter(Boolean)
      : rawDados.proprietariosAtuais ? [String(rawDados.proprietariosAtuais).trim()] : [],
    areaMatricula: rawDados.areaMatricula ? String(rawDados.areaMatricula).trim() : null,
    areaIPTU: rawDados.areaIPTU ? String(rawDados.areaIPTU).trim() : null,
    divergenciaArea: Boolean(rawDados.divergenciaArea),
    valorVenalIPTU: rawDados.valorVenalIPTU ? String(rawDados.valorVenalIPTU).trim() : null,
  };

  // Se houver área na matrícula e no IPTU com divergência textual, marca divergenciaArea
  if (dadosIdentificados.areaMatricula && dadosIdentificados.areaIPTU) {
    const numMat = parseFloat(dadosIdentificados.areaMatricula.replace(/[^0-9.,]/g, '').replace(',', '.'));
    const numIptu = parseFloat(dadosIdentificados.areaIPTU.replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (!Number.isNaN(numMat) && !Number.isNaN(numIptu) && Math.abs(numMat - numIptu) > 2) {
      dadosIdentificados.divergenciaArea = true;
    }
  }

  // 5. Alertas de Risco
  const alertasRisco = Array.isArray(parsed.alertasRisco)
    ? parsed.alertasRisco.map((alerta) => {
        let nivel = String(alerta?.nivel || 'OBSERVACAO').toUpperCase().trim();
        if (!['CRITICO', 'ALERTA', 'OBSERVACAO'].includes(nivel)) {
          nivel = 'OBSERVACAO';
        }
        return {
          nivel,
          titulo: String(alerta?.titulo || 'Apontamento Registral').trim(),
          descricao: String(alerta?.descricao || '').trim(),
          baseLegal: String(alerta?.baseLegal || 'Lei 6.015/73').trim(),
        };
      })
    : [];

  // Se o semáforo for VERMELHO e não tiver nenhum alerta CRITICO, eleva o primeiro ou cria um
  if (semaforo === 'VERMELHO' && !alertasRisco.some((a) => a.nivel === 'CRITICO')) {
    if (alertasRisco.length > 0) {
      alertasRisco[0].nivel = 'CRITICO';
    } else {
      alertasRisco.push({
        nivel: 'CRITICO',
        titulo: 'Risco Registral Crítico Detectado',
        descricao: 'A análise identificou apontamentos que colocam em risco a segurança jurídica da aquisição.',
        baseLegal: 'Lei 6.015/73 e Código Civil',
      });
    }
  }

  // 6. Checklist de Certidões
  const checklistPadrao = [
    { item: 'Matrícula Atualizada (Inteiro Teor + Ônus + Ações)', status: 'PENDENTE', acaoRecomendada: 'Emitir no Cartório de Registro de Imóveis (validade de 30 dias).' },
    { item: 'Certidão Negativa de Tributos Imobiliários (IPTU)', status: 'PENDENTE', acaoRecomendada: 'Solicitar certidão negativa de débitos imobiliários na Prefeitura.' },
    { item: 'Certidão Conjunta Federal (PGFN / Receita Federal)', status: 'PENDENTE', acaoRecomendada: 'Emitir gratuitamente no portal e-CAC da Receita Federal.' },
    { item: 'Certidão Negativa de Débitos Trabalhistas (CNDT)', status: 'PENDENTE', acaoRecomendada: 'Emitir gratuitamente no portal do Tribunal Superior do Trabalho (TST).' },
    { item: 'Certidões Cíveis e Fiscais da Justiça Estadual', status: 'PENDENTE', acaoRecomendada: 'Consultar distribuidores cíveis e fiscais do domicílio dos vendedores e do imóvel.' },
  ];

  let checklistCertidoes = [];
  if (Array.isArray(parsed.checklistCertidoes) && parsed.checklistCertidoes.length > 0) {
    checklistCertidoes = parsed.checklistCertidoes.map((item) => {
      let status = String(item?.status || 'PENDENTE').toUpperCase().trim();
      if (!['OK', 'PENDENTE', 'ATENCAO'].includes(status)) {
        status = 'PENDENTE';
      }
      return {
        item: String(item?.item || 'Certidão Registral').trim(),
        status,
        acaoRecomendada: String(item?.acaoRecomendada || 'Conferir com o cartório competente.').trim(),
      };
    });
  } else {
    checklistCertidoes = checklistPadrao;
  }

  // 7. Recomendação Final
  const recomendacaoFinal = String(parsed.recomendacaoFinal || '').trim() ||
    (semaforo === 'VERDE'
      ? 'Documentação em ordem para formalização de proposta e minuta de escritura.'
      : semaforo === 'AMARELO'
      ? 'Regularizar as pendências listadas no checklist antes da assinatura da escritura definitiva.'
      : 'Suspender pagamento de sinal até que os gravames impeditivos sejam plenamente cancelados e comprovados por certidão de ônus.');

  return {
    semaforo,
    scoreSeguranca,
    resumoExecutivo,
    dadosIdentificados,
    alertasRisco,
    checklistCertidoes,
    recomendacaoFinal,
  };
}

/**
 * Monta o prompt do usuário para Due Diligence.
 */
export function montarPromptUsuarioDueDiligence({ textoDocumentos, informacoesAdicionais = '' }) {
  const blocos = [
    'DOCUMENTOS IMOBILIÁRIOS ENVIADOS PARA DUE DILIGENCE (MATRÍCULA, IPTU, CNDs, PESSOAIS):',
    '"""',
    String(textoDocumentos || '').trim(),
    '"""',
  ];

  if (informacoesAdicionais && String(informacoesAdicionais).trim()) {
    blocos.push(
      '',
      'INFORMAÇÕES ADICIONAIS DA NEGOCIAÇÃO:',
      String(informacoesAdicionais).trim()
    );
  }

  blocos.push(
    '',
    'Analise com rigor técnico notarial (Lei 6.015/73) e retorne EXCLUSIVAMENTE o objeto JSON correspondente.'
  );

  return blocos.join('\n');
}

/**
 * Executa a análise de Due Diligence via proxy /api/ai.
 */
export async function processarDueDiligenceIA({
  textoDocumentos,
  informacoesAdicionais = '',
  provider = 'deepseek',
}) {
  if (!textoDocumentos || !String(textoDocumentos).trim()) {
    throw new Error('Nenhum texto de matrícula ou documentação foi fornecido para análise.');
  }

  const promptUsuario = montarPromptUsuarioDueDiligence({
    textoDocumentos,
    informacoesAdicionais,
  });

  const headers = await cabecalhosIA();
  const resposta = await fetch('/api/ai', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      provider,
      systemPrompt: SYSTEM_PROMPT_DUE_DILIGENCE,
      messages: [{ role: 'user', content: promptUsuario }],
      temperature: 0.1,
      maxTokens: 2500,
    }),
  });

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const hint = dados?.hint || dados?.error || `Erro HTTP ${resposta.status}`;
    throw new Error(`Falha no processamento de IA da Due Diligence: ${hint}`);
  }

  const texto = dados?.text || '';
  const resultado = interpretarDueDiligence(texto);

  if (!resultado || !resultado.semaforo) {
    throw new Error('A IA não retornou um parecer estruturado válido para a matrícula. Tente novamente com mais detalhes.');
  }

  return resultado;
}
