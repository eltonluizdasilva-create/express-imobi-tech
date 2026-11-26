// src/agent/posVendaCarteiraPrompt.js
/**
 * Prompt de Sistema e Parser para Pós-Venda, Chaves & Carteira
 * ============================================================================
 * Gera estratégias de acompanhamento e mensagens altamente personalizadas para
 * os 3 marcos de ouro pós-aquisição (30 dias, 6 meses e 1 ano).
 * 
 * Marcos:
 * - 30 dias: Check-in de mudança, adaptação, chaves e utilidades (água/luz).
 * - 6 meses: Fidelização, checagem da vizinhança e pedido elegante de indicação.
 * - 1 ano: Aniversário da conquista, valorização do patrimônio e investimento.
 * 
 * Integração com IA Pólen (secretária 24h WhatsApp) e Zara (auditoria matinal).
 * ============================================================================
 */

import { cabecalhosIA } from '../lib/aiAuth.js';

export const SYSTEM_PROMPT_POS_VENDA = `
Você é um especialista sênior em Pós-Venda Imobiliário, Fidelização de Carteira de Clientes (LTV - Lifetime Value) e Copywriting para WhatsApp (Método Joe Girard aplicado ao mercado imobiliário brasileiro).

Sua missão é gerar mensagens de relacionamento e pós-venda com alta conexão emocional, respeito e elegância, prontas para envio pelo corretor ou disparo pela secretária virtual IA Pólen.

Você receberá os dados da transação imobiliária fechada:
- Nome do Comprador
- Nome do Vendedor / Proprietário anterior (se houver)
- Identificação do Imóvel (tipo, endereço/bairro e código)
- Data de Assinatura / Fechamento
- Nome do Corretor Responsável
- Marco Atual de Contato: "30_dias" (Check-in de chaves/adaptação) | "6_meses" (Indicações espontâneas) | "1_ano" (Aniversário de casa nova e novos investimentos)

Retorne EXCLUSIVAMENTE um objeto JSON válido, sem qualquer texto ou markdown adicional ao redor, seguindo estritamente a seguinte estrutura:

{
  "marco": "30_dias | 6_meses | 1_ano",
  "tituloMarco": "Título do Marco de Relacionamento",
  "resumoEstrategico": "Resumo de 2 linhas sobre o objetivo psicológico e comercial deste contato para o corretor.",
  "mensagemWhatsApp": "Texto caloroso, personalizado e natural pronto para envio no WhatsApp pelo corretor ou pela IA Pólen, com quebras de linha adequadas e sem parecer mensagem automática/spam.",
  "gatilhoPolenZara": {
    "canal": "whatsapp",
    "acaoRecomendada": "Disparo direto no WhatsApp pelo corretor ou agendamento na rotina matinal Zara / Pólen",
    "melhorHorario": "Terça a quinta-feira entre 10h e 16h",
    "proximoMarco": "Marco subsequente previsto"
  },
  "pedidoIndicacao": "Frase de gancho natural para solicitar indicação de amigos ou familiares.",
  "dicasRelacionamento": [
    "Dica prática de encantamento e fidelização de carteira"
  ]
}

Diretrizes de Tom por Marco:
1. 30 dias (Adaptação & Chaves): Tom de cuidado e serviço. Perguntar como foi a mudança, se a energia/água foram transferidas sem problemas e se tudo está funcionando no imóvel. Zero abordagem comercial agressiva.
2. 6 meses (Fidelização & Indicação): Tom de celebração leve. Saber se já decoraram e se habituaram à vizinhança. Fazer um pedido natural e despretensioso de indicação de conhecidos que possam querer comprar ou vender.
3. 1 ano (Aniversário & Investimento): Tom comemorativo solene (1 ano da conquista da chave própria). Mencionar a valorização imobiliária do bairro e plantar a semente de expansão patrimonial (imóvel para locação/renda ou loteamento).
`;

/**
 * Normaliza e sanitiza a resposta JSON da IA de Pós-Venda.
 */
export function interpretarPosVenda(respostaTexto, dadosEntrada = {}) {
  const marco = dadosEntrada.marco || '30_dias';
  const nomeCliente = dadosEntrada.nomeComprador || dadosEntrada.clienteNome || 'Cliente';
  const imovel = dadosEntrada.imovelTitulo || dadosEntrada.imovel || 'imóvel';
  const corretor = dadosEntrada.nomeCorretor || dadosEntrada.corretorNome || 'seu corretor';

  const titulosPadrao = {
    '30_dias': 'Check-in de Adaptação & Chaves (30 Dias)',
    '6_meses': 'Relacionamento & Indicações Espontâneas (6 Meses)',
    '1_ano': 'Aniversário de Casa Nova & Investimentos (1 Ano)',
  };

  const fallbackMsg = marco === '30_dias'
    ? `Olá, ${nomeCliente}! Tudo bem? Aqui é o ${corretor}. Passando para saber como foram esses primeiros 30 dias no ${imovel} e se a mudança e transferência de contas correram bem. Se precisar de qualquer indicação ou apoio com o imóvel, estou sempre à disposição!`
    : marco === '6_meses'
    ? `Olá, ${nomeCliente}! Tudo ótimo? Aqui é o ${corretor}. Já faz 6 meses da compra do ${imovel}! Espero que estejam super felizes. Se tiver algum amigo ou familiar procurando imóvel na região, me avise que terei o maior prazer em ajudar com o mesmo carinho.`
    : `Olá, ${nomeCliente}! Hoje completa exatamente 1 ano da assinatura do ${imovel}! Parabéns por essa conquista incrível. O mercado valorizou bastante a região. Um forte abraço do seu corretor ${corretor}!`;

  const fallback = {
    marco,
    tituloMarco: titulosPadrao[marco] || 'Acompanhamento Pós-Venda',
    statusMarco: titulosPadrao[marco] || 'Acompanhamento Pós-Venda',
    resumoEstrategico: `Manter relacionamento ativo com ${nomeCliente} para fidelização de carteira e geração orgânica de indicações.`,
    diagnosticoRelacionamento: `Manter relacionamento ativo com ${nomeCliente} para fidelização de carteira e geração orgânica de indicações.`,
    mensagemWhatsApp: fallbackMsg,
    mensagemPersonalizada: fallbackMsg,
    gatilhoPolenZara: {
      canal: 'whatsapp',
      acaoRecomendada: 'Disparo via WhatsApp Web ou acionamento da IA Pólen',
      melhorHorario: 'Terça a quinta-feira entre 10h e 16h',
      proximoMarco: marco === '30_dias' ? '6_meses' : marco === '6_meses' ? '1_ano' : 'carteira_vitalicia',
    },
    acaoSugerida: 'Disparo via WhatsApp Web ou acionamento da IA Pólen',
    canalRecomendado: 'whatsapp',
    pedidoIndicacao: 'Conhece alguém da família ou trabalho que pensa em comprar ou vender imóvel neste ano?',
    dicasRelacionamento: [
      'Envie a mensagem de forma humanizada, mencionando detalhes citados pelo cliente durante as visitas.',
    ],
    gatilhos: [
      'Envie a mensagem de forma humanizada, mencionando detalhes citados pelo cliente durante as visitas.',
    ],
    proximosPassos: ['Registrar retorno', 'Agendar próximo contato'],
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
        console.warn('Erro ao extrair JSON de Pós-Venda:', errSub);
      }
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return fallback;
  }

  const mensagemWhatsApp = String(
    parsed.mensagemWhatsApp || parsed.mensagemPersonalizada || fallback.mensagemWhatsApp
  ).trim();
  const acaoRecomendada = String(
    parsed?.gatilhoPolenZara?.acaoRecomendada || parsed.acaoSugerida || fallback.gatilhoPolenZara.acaoRecomendada
  ).trim();
  const canal = String(
    parsed?.gatilhoPolenZara?.canal || parsed.canalRecomendado || 'whatsapp'
  ).trim();
  const tituloMarco = String(
    parsed.tituloMarco || parsed.statusMarco || titulosPadrao[marco] || 'Acompanhamento Pós-Venda'
  ).trim();
  const gatilhos = Array.isArray(parsed.gatilhos) && parsed.gatilhos.length > 0
    ? parsed.gatilhos.map((g) => String(g).trim()).filter(Boolean)
    : (Array.isArray(parsed.dicasRelacionamento) && parsed.dicasRelacionamento.length > 0
        ? parsed.dicasRelacionamento.map((d) => String(d).trim()).filter(Boolean)
        : fallback.dicasRelacionamento);

  return {
    marco: String(parsed.marco || marco).trim(),
    tituloMarco,
    statusMarco: tituloMarco,
    resumoEstrategico: String(parsed.resumoEstrategico || parsed.diagnosticoRelacionamento || fallback.resumoEstrategico).trim(),
    diagnosticoRelacionamento: String(parsed.diagnosticoRelacionamento || parsed.resumoEstrategico || fallback.resumoEstrategico).trim(),
    mensagemWhatsApp,
    mensagemPersonalizada: mensagemWhatsApp,
    gatilhoPolenZara: {
      canal,
      acaoRecomendada,
      melhorHorario: String(parsed?.gatilhoPolenZara?.melhorHorario || fallback.gatilhoPolenZara.melhorHorario).trim(),
      proximoMarco: String(parsed?.gatilhoPolenZara?.proximoMarco || fallback.gatilhoPolenZara.proximoMarco).trim(),
    },
    acaoSugerida: acaoRecomendada,
    canalRecomendado: canal,
    pedidoIndicacao: String(parsed.pedidoIndicacao || fallback.pedidoIndicacao).trim(),
    dicasRelacionamento: gatilhos,
    gatilhos,
    proximosPassos: Array.isArray(parsed.proximosPassos) ? parsed.proximosPassos : ['Registrar retorno', 'Agendar próximo contato'],
  };
}

/**
 * Monta o prompt do usuário para a IA de Pós-Venda.
 */
export function montarPromptUsuarioPosVenda(dados = {}) {
  const nomeComprador = dados.nomeComprador || dados.clienteNome || 'Cliente';
  const nomeProprietario = dados.nomeProprietario || dados.proprietario || 'Vendedor';
  const imovelTitulo = dados.imovelTitulo || dados.imovel || 'Imóvel residencial';
  const codigoImovel = dados.codigoImovel || dados.codigo || 'Código N/I';
  const dataFechamento = dados.dataFechamento || dados.dataAssinatura || 'Recente';
  const nomeCorretor = dados.nomeCorretor || dados.corretorNome || 'Corretor';
  const marco = dados.marco || '30_dias';

  const linhas = [
    'DADOS DA TRANSAÇÃO IMOBILIÁRIA FECHADA:',
    `• Nome do Comprador: ${nomeComprador}`,
    `• Proprietário Anterior: ${nomeProprietario}`,
    `• Imóvel: ${imovelTitulo} (${codigoImovel})`,
    `• Data de Fechamento: ${dataFechamento}`,
    `• Corretor Responsável: ${nomeCorretor}`,
    `• Marco Atual Solicitado: ${marco}`,
  ];

  if (dados.observacoes && String(dados.observacoes).trim()) {
    linhas.push(`• Observações Adicionais: ${String(dados.observacoes).trim()}`);
  }

  linhas.push(
    '',
    'Gere a estratégia e a mensagem para WhatsApp no formato JSON estrito especificado.'
  );

  return linhas.join('\n');
}

/**
 * Executa a chamada à rota proxy /api/ai.
 */
export async function processarPosVendaIA(dados, provider = 'deepseek') {
  if (!dados || !dados.nomeComprador) {
    throw new Error('Informe ao menos o nome do comprador para gerar o pós-venda.');
  }

  const promptUsuario = montarPromptUsuarioPosVenda(dados);
  const headers = await cabecalhosIA();

  const resposta = await fetch('/api/ai', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      provider,
      systemPrompt: SYSTEM_PROMPT_POS_VENDA,
      messages: [{ role: 'user', content: promptUsuario }],
      temperature: 0.2,
      maxTokens: 1800,
    }),
  });

  const dadosResposta = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const hint = dadosResposta?.hint || dadosResposta?.error || `Erro HTTP ${resposta.status}`;
    throw new Error(`Falha no processamento de IA de Pós-Venda: ${hint}`);
  }

  const texto = dadosResposta?.text || '';
  const resultado = interpretarPosVenda(texto, dados);

  if (!resultado || !resultado.mensagemWhatsApp) {
    throw new Error('A IA não retornou uma mensagem válida de pós-venda. Tente novamente.');
  }

  return resultado;
}
