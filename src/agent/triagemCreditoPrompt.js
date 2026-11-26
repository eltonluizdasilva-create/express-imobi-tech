// src/agent/triagemCreditoPrompt.js
/**
 * Prompt de Sistema e Parser Estruturado para Triagem de Financiamento & Crédito
 * ============================================================================
 * Pré-qualificação inteligente de compradores de imóveis segundo diretrizes
 * da Caixa Econômica Federal, SBPE e Programa Minha Casa Minha Vida (MCMV/FGTS).
 * 
 * Regras aplicadas:
 * - Comprometimento máximo de renda: 30% da renda familiar bruta mensal.
 * - Idade do proponente mais velho + prazo de amortização <= 80 anos e 6 meses.
 * - Uso de FGTS: 36+ meses de contribuição, sem imóvel na mesma comarca/região.
 * - Comprovação de residência ou trabalho na cidade/limítrofe.
 * - Presença de dependentes (cônjuge, filhos, estudantes até 24 anos) para subsídio.
 * - Histórico de subsídio da União/FGTS (vedação a benefício duplicado).
 * ============================================================================
 */

import { cabecalhosIA } from '../lib/aiAuth.js';

export const SYSTEM_PROMPT_TRIAGEM_CREDITO = `
Você é um correspondente bancário sênior especialista em crédito imobiliário no Brasil (Caixa Econômica Federal, SBPE e Programa Minha Casa Minha Vida - MCMV / FGTS).

Sua missão é realizar a triagem técnica e financeira da ficha rápida do comprador, calculando a capacidade de pagamento, entrada mínima, uso de FGTS e subsídio habitacional, identificando impedimentos normativos e preparando o dossiê executivo para envio ao Correspondente Bancário.

Retorne EXCLUSIVAMENTE um objeto JSON válido, sem qualquer texto ou markdown adicional ao redor, seguindo estritamente a seguinte estrutura:

{
  "statusViabilidade": "APROVAVEL | AJUSTE_ENTRADA | IMPEDIMENTO",
  "scoreAprovacao": 85,
  "resumoEnquadramento": "Diagnóstico claro de 2 a 3 linhas para o corretor de imóveis orientar o cliente.",
  "programaSugerido": "MCMV Faixa 1 | MCMV Faixa 2 | MCMV Faixa 3 | SBPE SAC | SBPE Price",
  "estimativaFinanceira": {
    "valorImovel": number,
    "rendaFamiliar": number,
    "capacidadeParcelaMaxima": number,
    "valorFinanciavelEstimado": number,
    "entradaNecessariaEstimada": number,
    "saldoFgtsUtilizavel": number,
    "subsidioEstimado": number,
    "desembolsoRecursoProprio": number,
    "prazoMaximoMeses": number
  },
  "alertasDocumentais": [
    {
      "tipo": "REGRA | ALERTA | DOCUMENTO",
      "titulo": "Título curto do ponto de atenção",
      "descricao": "Explicação objetiva da regra ou exigência documental"
    }
  ],
  "dossieCorrespondente": "Texto completo, organizado em tópicos com emojis técnicos e linhas separadoras, pronto para envio ao correspondente bancário via WhatsApp com dados do comprador, simulação e checklist de documentos a colher."
}

Regras para definição do statusViabilidade:
- APROVAVEL: Renda comporta a parcela (até 30% da renda), entrada compatível com saldo de FGTS/recursos próprios, idade dentro do limite (idade + prazo <= 80,5 anos), sem impedimentos de FGTS ou restrições cadastrais conhecidas.
- AJUSTE_ENTRADA: A renda suporta o financiamento, mas o valor financiado é menor que 80%, exigindo uma complementação maior de recursos próprios ou mais FGTS na entrada.
- IMPEDIMENTO: Idade muito avançada inviabilizando o prazo mínimo (ex: > 75 anos), renda insuficiente para o valor pretendido mesmo em prazo máximo, ou descumprimento de regra imperativa de FGTS (ex: possui outro imóvel na comarca ou já utilizou subsídio federal anterior de forma impeditiva).
`;

function converterNumeroSeguro(valor, padrao = 0) {
  if (valor === null || valor === undefined || valor === '') return padrao;
  if (typeof valor === 'number') return Number.isNaN(valor) ? padrao : valor;
  const limpo = String(valor).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(limpo);
  return Number.isNaN(n) ? padrao : n;
}

/**
 * Normaliza e valida a resposta da IA para a Triagem de Crédito.
 */
export function interpretarTriagemCredito(respostaTexto, dadosEntrada = {}) {
  const fallback = {
    statusViabilidade: 'AJUSTE_ENTRADA',
    scoreAprovacao: 65,
    resumoEnquadramento: 'Ficha recebida. Necessário validar parâmetros de renda e entrada com o correspondente.',
    programaSugerido: 'SBPE SAC / MCMV',
    estimativaFinanceira: {
      valorImovel: converterNumeroSeguro(dadosEntrada.valorImovel, 250000),
      rendaFamiliar: converterNumeroSeguro(dadosEntrada.rendaFamiliar, 6000),
      capacidadeParcelaMaxima: Math.round(converterNumeroSeguro(dadosEntrada.rendaFamiliar, 6000) * 0.3),
      valorFinanciavelEstimado: Math.round(converterNumeroSeguro(dadosEntrada.valorImovel, 250000) * 0.8),
      entradaNecessariaEstimada: Math.round(converterNumeroSeguro(dadosEntrada.valorImovel, 250000) * 0.2),
      saldoFgtsUtilizavel: converterNumeroSeguro(dadosEntrada.saldoFgts, 0),
      subsidioEstimado: 0,
      desembolsoRecursoProprio: Math.max(0, Math.round(converterNumeroSeguro(dadosEntrada.valorImovel, 250000) * 0.2) - converterNumeroSeguro(dadosEntrada.saldoFgts, 0)),
      prazoMaximoMeses: 360,
    },
    alertasDocumentais: [
      {
        tipo: 'DOCUMENTO',
        titulo: 'Comprovação de Renda e FGTS',
        descricao: 'Apresentar os 3 últimos holerites, extrato do FGTS com chave e certidão de nascimento/casamento.',
      },
    ],
    dossieCorrespondente: 'Ficha rápida registrada no sistema Express Imobi Tech para pré-análise de financiamento.',
  };

  if (!respostaTexto || typeof respostaTexto !== 'string') {
    return fallback;
  }

  let limpo = respostaTexto.trim();
  if (limpo.startsWith('```')) {
    limpo = limpo.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  let parsed = null;
  try {
    parsed = JSON.parse(limpo);
  } catch (err) {
    const inicio = limpo.indexOf('{');
    const fim = limpo.lastIndexOf('}');
    if (inicio !== -1 && fim !== -1 && fim > inicio) {
      try {
        parsed = JSON.parse(limpo.substring(inicio, fim + 1));
      } catch (errSub) {
        console.warn('Erro ao extrair JSON de Triagem de Crédito:', errSub);
      }
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return fallback;
  }

  // 1. Status de Viabilidade
  let status = String(parsed.statusViabilidade || '').toUpperCase().trim();
  if (!['APROVAVEL', 'AJUSTE_ENTRADA', 'IMPEDIMENTO'].includes(status)) {
    if (status.includes('APROV') || status.includes('VERDE')) status = 'APROVAVEL';
    else if (status.includes('IMPED') || status.includes('VERM') || status.includes('RECUS')) status = 'IMPEDIMENTO';
    else status = 'AJUSTE_ENTRADA';
  }

  // 2. Score de Aprovação
  let scoreAprovacao = Number(parsed.scoreAprovacao);
  if (Number.isNaN(scoreAprovacao) || scoreAprovacao < 0 || scoreAprovacao > 100) {
    scoreAprovacao = status === 'APROVAVEL' ? 90 : status === 'IMPEDIMENTO' ? 25 : 65;
  } else {
    scoreAprovacao = Math.round(scoreAprovacao);
  }

  // 3. Estimativas Financeiras com conferência matemática em JavaScript
  const rawEst = parsed.estimativaFinanceira && typeof parsed.estimativaFinanceira === 'object'
    ? parsed.estimativaFinanceira
    : {};

  const valorImovel = converterNumeroSeguro(rawEst.valorImovel || dadosEntrada.valorImovel, 250000);
  const rendaFamiliar = converterNumeroSeguro(rawEst.rendaFamiliar || dadosEntrada.rendaFamiliar, 6000);
  
  // Regra prudencial SFH: Parcela máxima é exatamente 30% da renda familiar bruta
  const capacidadeParcelaMaxima = Math.round(rendaFamiliar * 0.30);

  let valorFinanciavelEstimado = converterNumeroSeguro(rawEst.valorFinanciavelEstimado);
  if (valorFinanciavelEstimado <= 0 || valorFinanciavelEstimado > valorImovel * 0.85) {
    valorFinanciavelEstimado = Math.round(valorImovel * 0.80);
  }

  let entradaNecessariaEstimada = converterNumeroSeguro(rawEst.entradaNecessariaEstimada);
  if (entradaNecessariaEstimada <= 0) {
    entradaNecessariaEstimada = Math.max(0, valorImovel - valorFinanciavelEstimado);
  }

  const saldoFgtsUtilizavel = converterNumeroSeguro(rawEst.saldoFgtsUtilizavel || dadosEntrada.saldoFgts, 0);
  const subsidioEstimado = converterNumeroSeguro(rawEst.subsidioEstimado, 0);

  const desembolsoRecursoProprio = Math.max(
    0,
    entradaNecessariaEstimada - saldoFgtsUtilizavel - subsidioEstimado
  );

  let prazoMaximoMeses = parseInt(rawEst.prazoMaximoMeses, 10);
  const idadeComprador = parseInt(dadosEntrada.idadeMaisVelho, 10);
  if (idadeComprador && idadeComprador > 0) {
    // Idade + Prazo <= 80,5 anos (966 meses)
    const limiteMeses = Math.floor((80.5 - idadeComprador) * 12);
    prazoMaximoMeses = Math.min(prazoMaximoMeses || 420, Math.max(12, Math.min(420, limiteMeses)));
  } else if (!prazoMaximoMeses || prazoMaximoMeses <= 0) {
    prazoMaximoMeses = 360;
  }

  const estimativaFinanceira = {
    valorImovel,
    rendaFamiliar,
    capacidadeParcelaMaxima,
    valorFinanciavelEstimado,
    entradaNecessariaEstimada,
    saldoFgtsUtilizavel,
    subsidioEstimado,
    desembolsoRecursoProprio,
    prazoMaximoMeses,
  };

  // 4. Resumo e Programa
  const resumoEnquadramento = String(parsed.resumoEnquadramento || '').trim() ||
    `Ficha rápida classificada como ${status} com capacidade de parcela de até ${capacidadeParcelaMaxima.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`;

  const programaSugerido = String(parsed.programaSugerido || '').trim() ||
    (rendaFamiliar <= 8000 && valorImovel <= 350000 ? 'MCMV / FGTS' : 'SBPE SAC');

  // 5. Alertas Documentais
  const alertasDocumentais = Array.isArray(parsed.alertasDocumentais) && parsed.alertasDocumentais.length > 0
    ? parsed.alertasDocumentais.map((alerta) => ({
        tipo: ['REGRA', 'ALERTA', 'DOCUMENTO'].includes(String(alerta?.tipo).toUpperCase()) ? String(alerta.tipo).toUpperCase() : 'DOCUMENTO',
        titulo: String(alerta?.titulo || 'Exigência Documental').trim(),
        descricao: String(alerta?.descricao || '').trim(),
      }))
    : [
        {
          tipo: 'DOCUMENTO',
          titulo: 'Documentos do Comprador',
          descricao: 'RG, CPF, Comprovante de Residência recente e Certidão de Estado Civil.',
        },
        {
          tipo: 'REGRA',
          titulo: 'Comprovação de Renda',
          descricao: '3 últimos contracheques para CLT ou 6 últimos extratos bancários com IRPF para autônomos.',
        },
      ];

  // 6. Dossiê do Correspondente
  let dossieCorrespondente = String(parsed.dossieCorrespondente || '').trim();
  if (!dossieCorrespondente) {
    dossieCorrespondente = [
      'DOSSIÊ PRÉVIO DE FINANCIAMENTO HABITACIONAL — EXPRESS IMOBI TECH',
      '==============================================================',
      `STATUS: ${status} (Score de Enquadramento: ${scoreAprovacao}/100)`,
      `PROGRAMA RECOMENDADO: ${programaSugerido}`,
      '',
      'DADOS DA SIMULAÇÃO:',
      `• Valor do Imóvel: ${valorImovel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      `• Renda Bruta Familiar: ${rendaFamiliar.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      `• Parcela Máxima Permitida (30%): ${capacidadeParcelaMaxima.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      `• Financiamento Estimado: ${valorFinanciavelEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      `• Entrada Necessária: ${entradaNecessariaEstimada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      `• FGTS Aplicado: ${saldoFgtsUtilizavel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      `• Desembolso Líquido: ${desembolsoRecursoProprio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      `• Prazo Máximo: ${prazoMaximoMeses} meses`,
      '',
      'RESUMO:',
      resumoEnquadramento,
    ].join('\n');
  }

  return {
    statusViabilidade: status,
    scoreAprovacao,
    resumoEnquadramento,
    programaSugerido,
    estimativaFinanceira,
    alertasDocumentais,
    dossieCorrespondente,
  };
}

/**
 * Monta o prompt do usuário com todos os campos da ficha rápida.
 */
export function montarPromptUsuarioTriagem(dados) {
  const linhas = [
    'FICHA RÁPIDA DE TRIAGEM DE CRÉDITO DO COMPRADOR:',
    `• Tipo do Imóvel: ${dados.tipoImovel || 'Residencial Urbano'}`,
    `• Cidade / Bairro: ${[dados.cidade, dados.bairro, dados.uf].filter(Boolean).join(' - ') || 'Não informado'}`,
    `• Valor do Imóvel: ${dados.valorImovel || 'Não informado'}`,
    `• Renda Familiar Bruta Mensal: ${dados.rendaFamiliar || 'Não informado'}`,
    `• Idade do Comprador Mais Velho: ${dados.idadeMaisVelho || 'Não informado'} anos`,
    `• Possui Co-comprador / Composição de Renda: ${dados.possuiCoComprador ? `Sim (${dados.parentescoCoComprador || 'Cônjuge/Familiar'})` : 'Não'}`,
    `• Possui Dependentes (cônjuge / filhos / estudante até 24 anos): ${dados.possuiDependentes ? `Sim (${dados.qtdDependentes || 1} dependente(s))` : 'Não'}`,
    `• Vínculo de Residência ou Trabalho na Cidade/Limítrofe há 1+ ano: ${dados.vinculoCidade ? 'Sim' : 'Não'}`,
    `• Tempo de Trabalho sob Regime do FGTS (36+ meses somados): ${dados.fgtsMais36Meses ? 'Sim' : 'Não'}`,
    `• Saldo de FGTS Disponível: R$ ${dados.saldoFgts || '0,00'}`,
    `• Já foi beneficiado com subsídio habitacional anterior da União/FGTS: ${dados.historicoSubsidio ? 'Sim' : 'Não'}`,
    `• Já possui imóvel residencial na mesma comarca ou limítrofe: ${dados.possuiImovelLocal ? 'Sim' : 'Não'}`,
  ];

  if (dados.observacoes && String(dados.observacoes).trim()) {
    linhas.push(`• Observações do Corretor: ${String(dados.observacoes).trim()}`);
  }

  linhas.push(
    '',
    'Realize o cálculo prudencial e retorne EXCLUSIVAMENTE o objeto JSON no formato especificado.'
  );

  return linhas.join('\n');
}

/**
 * Executa a chamada à IA (/api/ai) para a Triagem de Financiamento.
 */
export async function processarTriagemCreditoIA(dadosFicha, provider = 'deepseek') {
  if (!dadosFicha || !dadosFicha.rendaFamiliar || !dadosFicha.valorImovel) {
    throw new Error('Informe ao menos a Renda Familiar e o Valor do Imóvel para a triagem.');
  }

  const promptUsuario = montarPromptUsuarioTriagem(dadosFicha);
  const headers = await cabecalhosIA();

  const resposta = await fetch('/api/ai', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      provider,
      systemPrompt: SYSTEM_PROMPT_TRIAGEM_CREDITO,
      messages: [{ role: 'user', content: promptUsuario }],
      temperature: 0.1,
      maxTokens: 2000,
    }),
  });

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const hint = dados?.hint || dados?.error || `Erro HTTP ${resposta.status}`;
    throw new Error(`Falha no processamento de IA da Triagem de Crédito: ${hint}`);
  }

  const texto = dados?.text || '';
  const resultado = interpretarTriagemCredito(texto, dadosFicha);

  if (!resultado || !resultado.statusViabilidade) {
    throw new Error('A IA não retornou um diagnóstico válido. Tente novamente.');
  }

  return resultado;
}
