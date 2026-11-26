// src/agent/captacaoCampoPrompt.js
/**
 * Prompt de Sistema para Captação de Campo por Áudio com IA
 * ============================================================================
 * Transforma a transcrição de áudio gravado em campo pelo corretor (junto com
 * endereço e valor pedido, se informados) em um objeto JSON estrito com:
 * 1. dadosTecnicos (padrão ABNT NBR 14653 / COFECI)
 * 2. analiseMercado (m² calculado em JS e observação técnica)
 * 3. materialComercial (anúncio portal, roteiro Reels 35s, ficha técnica)
 * ============================================================================
 */

import { cabecalhosIA } from '../lib/aiAuth.js';

export const SYSTEM_PROMPT_CAPTACAO_CAMPO = `
Você é um especialista sênior em avaliação imobiliária (padrão ABNT NBR 14653 / COFECI) e copywriting imobiliário de alta conversão no Brasil.

Sua tarefa é receber a transcrição de um áudio gravado em campo por um corretor de imóveis (junto com endereço e valor pedido, se informados) e retornar EXCLUSIVAMENTE um objeto JSON válido, sem markdown ao redor, seguindo exatamente a estrutura abaixo:

{
  "dadosTecnicos": {
    "cidade": "string ou null",
    "bairro": "string ou null",
    "endereco": "string ou null",
    "tipologia": "Urbano | Rural | Comercial | Industrial",
    "subtipo": "Casa | Apartamento | Lote / Terreno | Sobrado | Chácara | Sala Comercial",
    "areaTotal": number ou null,
    "areaConstruida": number ou null,
    "quartos": number ou null,
    "suites": number ou null,
    "vagas": number ou null,
    "padraoConstrutivo": "Popular | Normal | Médio-Alto | Alto | Luxo",
    "conservacao": "Novo | Ótimo | Bom | Regular | Necessita Reforma",
    "valorPedido": number ou null
  },
  "analiseMercado": {
    "valorM2Pedido": number ou null,
    "observacaoTecnica": "Resumo curto de 2 linhas sobre pontos positivos e pontos de atenção citados no áudio (ex: necessidade de pintura, posição solar)."
  },
  "materialComercial": {
    "tituloAnuncio": "Título curto e magnético para portais (ZAP, VivaReal, OLX)",
    "descricaoPortal": "Descrição persuasiva completa dividida em parágrafos curtos, destacando benefícios, metragem, localização e chamada para visita.",
    "roteiroReels": "Roteiro dinâmico de 35 segundos para Reels/TikTok dividido em: [0-3s GANCHO], [4-25s TOUR GUIADO] e [26-35s CHAMADA PARA AÇÃO].",
    "fichaTecnica": "Lista limpa em tópicos com todas as especificações extraídas do áudio."
  }
}

Regras estritas:
1. Nunca invente metragens ou valores não citados; use null quando não mencionado.
2. Converta expressões faladas como "480 mil" para 480000 e "360 de terreno" para 360.
3. Infira "conservacao" com base nas pistas do áudio (ex: "precisa pintar a fachada" -> "Regular"; "recém-reformado" -> "Ótimo").
`;

/**
 * Helper seguro para converter strings/valores em números reais,
 * evitando NaN, Infinity ou strings numéricas.
 */
export function converterNumeroSeguro(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : null;
  }
  if (typeof valor === 'string') {
    const limpo = valor.trim().replace(/[^\d.,-]/g, '');
    if (!limpo) return null;
    const padronizado = limpo.includes(',') && !limpo.includes('.')
      ? limpo.replace(',', '.')
      : limpo.replace(/,/g, '');
    const num = Number(padronizado);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

/**
 * Normaliza e faz o parse seguro da resposta da IA, tratando eventuais blocos
 * ```json ... ``` ou texto extra colocado pelo modelo.
 *
 * Ajustes garantidos:
 * 1. Converte campos numéricos técnicos com `converterNumeroSeguro`.
 * 2. Calcula `analiseMercado.valorM2Pedido` diretamente em JavaScript:
 *    (valorPedido / (areaConstruida || areaTotal))
 */
export function interpretarCaptacaoCampo(respostaTexto) {
  if (!respostaTexto || typeof respostaTexto !== 'string') return null;

  let parsed = null;
  try {
    const textoLimpo = respostaTexto
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    parsed = JSON.parse(textoLimpo);
  } catch {
    const match = respostaTexto.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch (err) {
        console.warn('Erro ao decodificar JSON recortado de captação de campo:', err);
      }
    }
  }

  if (!parsed || typeof parsed !== 'object') return null;

  // Garante objetos base
  const resultado = {
    dadosTecnicos: parsed.dadosTecnicos && typeof parsed.dadosTecnicos === 'object' ? { ...parsed.dadosTecnicos } : {},
    analiseMercado: parsed.analiseMercado && typeof parsed.analiseMercado === 'object' ? { ...parsed.analiseMercado } : {},
    materialComercial: parsed.materialComercial && typeof parsed.materialComercial === 'object' ? { ...parsed.materialComercial } : {},
  };

  const dt = resultado.dadosTecnicos;

  // 1. Sanitização de campos numéricos (evita string ou NaN)
  dt.areaTotal = converterNumeroSeguro(dt.areaTotal);
  dt.areaConstruida = converterNumeroSeguro(dt.areaConstruida);
  dt.quartos = converterNumeroSeguro(dt.quartos);
  dt.suites = converterNumeroSeguro(dt.suites);
  dt.vagas = converterNumeroSeguro(dt.vagas);
  dt.valorPedido = converterNumeroSeguro(dt.valorPedido);

  // 2. Cálculo direto em JavaScript do valor/m² em vez de depender da conta do LLM
  const valorPedido = dt.valorPedido;
  const areaRef = dt.areaConstruida || dt.areaTotal;
  let valorM2Calculado = null;

  if (valorPedido && areaRef && areaRef > 0) {
    valorM2Calculado = Math.round(valorPedido / areaRef);
  }

  resultado.analiseMercado.valorM2Pedido = valorM2Calculado;

  return resultado;
}

/**
 * Monta o prompt do usuário com a transcrição e dados complementares opcionais.
 */
export function montarPromptUsuarioCaptacao({ transcricao, endereco, valorPedido }) {
  const linhas = [
    'TRANSCRIÇÃO DO ÁUDIO GRAVADO EM CAMPO:',
    '"""',
    String(transcricao || '').trim(),
    '"""',
  ];

  if (endereco && String(endereco).trim()) {
    linhas.push(`ENDEREÇO INFORMADO: ${String(endereco).trim()}`);
  }
  if (valorPedido && String(valorPedido).trim()) {
    linhas.push(`VALOR PEDIDO INFORMADO: ${String(valorPedido).trim()}`);
  }

  linhas.push('', 'Retorne EXCLUSIVAMENTE o objeto JSON correspondente.');
  return linhas.join('\n');
}

/**
 * Executa a chamada à API de IA através do proxy seguro /api/ai.
 */
export async function processarCaptacaoCampoIA({ transcricao, endereco = '', valorPedido = '', provider = 'deepseek' }) {
  if (!transcricao || !String(transcricao).trim()) {
    throw new Error('Nenhuma transcrição de áudio fornecida.');
  }

  const promptUsuario = montarPromptUsuarioCaptacao({ transcricao, endereco, valorPedido });

  const headers = await cabecalhosIA();
  const resposta = await fetch('/api/ai', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      provider,
      systemPrompt: SYSTEM_PROMPT_CAPTACAO_CAMPO,
      messages: [{ role: 'user', content: promptUsuario }],
      temperature: 0.2,
      maxTokens: 1800,
    }),
  });

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const hint = dados?.hint || dados?.error || `Erro HTTP ${resposta.status}`;
    throw new Error(`Falha no processamento de IA: ${hint}`);
  }

  const texto = dados?.text || '';
  const resultado = interpretarCaptacaoCampo(texto);

  if (!resultado || (!resultado.dadosTecnicos && !resultado.materialComercial)) {
    throw new Error('A IA não retornou uma estrutura de captação válida. Tente gravar novamente com mais detalhes.');
  }

  return resultado;
}
