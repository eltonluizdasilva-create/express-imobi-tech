// src/agent/arenaRoleplayPrompt.js
/**
 * Arena de Treinamento & Roleplay IA — Motor de Simulação e Avaliação
 * ============================================================================
 * Simulação de atendimento imobiliário em até 5 turnos com clientes realistas
 * (Moderado, Exigente ou Tubarão) sobre as objeções mais frequentes de mercado.
 * Gera avaliação executiva detalhada com nota (0-10), pontos fortes, falhas de
 * autoridade/condução e scripts ideais de contorno.
 * ============================================================================
 */

import { cabecalhosIA } from '../lib/aiAuth.js';

export const CENARIOS_ROLEPLAY = [
  {
    id: 'imovel_caro',
    titulo: 'Cliente achou o imóvel caro',
    subtitulo: 'Objeção clássica de preço vs valor por m² e custo de reforma',
    contexto: 'O cliente visitou um apartamento de 3 dormitórios por R$ 750.000 e afirma que no mesmo prédio ou bairro encontrou opções por R$ 680.000.',
    primeiraFala: 'Gostei do imóvel, mas R$ 750 mil está bem fora da realidade. Vi outro anúncio aqui no bairro por R$ 680 mil com a mesma metragem. Por que eu pagaria 70 mil a mais nesse?',
    dicaEstrategica: 'Não dê desconto de imediato. Defenda a liquidez, acabamentos, posição solar, vaga ou documentação e faça perguntas investigativas.',
  },
  {
    id: 'sem_exclusividade',
    titulo: 'Proprietário recusa exclusividade',
    subtitulo: 'Proprietário quer colocar com 5 imobiliárias para "vender mais rápido"',
    contexto: 'O proprietário de uma casa em condomínio de R$ 1,2 milhão quer deixar o imóvel com várias imobiliárias e corretores autônomos sem contrato de exclusividade.',
    primeiraFala: 'Não trabalho com exclusividade. Quanto mais corretores anunciando minha casa, mais rápido vende. Por que eu deveria amarrar meu imóvel só na sua imobiliária?',
    dicaEstrategica: 'Mostre que quem tem muitos corretores não tem nenhum defendendo seu preço. Apresente plano de investimento em tráfego pago, filtros de segurança e relatórios quinzenais.',
  },
  {
    id: 'sumiu_pos_visita',
    titulo: 'Lead sumiu após a visita',
    subtitulo: 'Cliente adorou a visita mas parou de responder às mensagens no WhatsApp',
    contexto: 'O lead realizou visita no sábado, demonstrou entusiasmo com a área de lazer, mas já se passaram 3 dias sem retorno nas mensagens de follow-up.',
    primeiraFala: 'Oi corretor, desculpe a demora. Estivemos pensando e decidimos não seguir com esse imóvel. Se surgir outra oportunidade a gente se fala, obrigado.',
    dicaEstrategica: 'Não seja evasivo nem agressivo. Descubra a real trava (preço, cônjuge, financiamento ou outro imóvel) com perguntas abertas sem parecer desesperado.',
  },
  {
    id: 'esperar_juros',
    titulo: 'Cliente quer esperar a taxa de juros cair',
    subtitulo: 'Paralisia por notícias econômicas e medo de taxa Selic / juros de financiamento',
    contexto: 'Comprador com renda aprovada de R$ 18.000 quer adiar a compra em 1 ano esperando nova queda dos juros bancários.',
    primeiraFala: 'Estive lendo as notícias e acho que vou segurar a compra. Os juros do financiamento ainda estão altos. Prefiro esperar a Selic cair mais no ano que vem para financiar.',
    dicaEstrategica: 'Calcule o custo de esperar: a valorização imobiliária histórica supera a economia de juros, e o financiamento sempre pode ser portado/renegociado no futuro.',
  },
  {
    id: 'personalizado',
    titulo: 'Cenário Personalizado de Treinamento',
    subtitulo: 'Defina uma situação ou objeção específica vivenciada pela equipe',
    contexto: 'Situação imobiliária customizada configurada pelo corretor ou gestor comercial.',
    primeiraFala: 'Pois é, analisei a proposta mas ainda tenho fortes ressalvas antes de tomar qualquer decisão. Como vocês resolvem essa questão?',
    dicaEstrategica: 'Mantenha a postura consultiva, valide o ponto do cliente antes de rebater e conduza com perguntas firmes.',
  },
];

export const NIVEIS_DIFICULDADE = [
  {
    id: 'moderado',
    label: 'Moderado',
    descricao: 'Cliente indeciso e prudente. Ouve argumentos lógicos, mas precisa de segurança e clareza para avançar.',
    badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  },
  {
    id: 'exigente',
    label: 'Exigente',
    descricao: 'Cliente cético e analítico. Confronta dados, compara opções com portais e pressiona por justificativas técnicas.',
    badge: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  },
  {
    id: 'tubarao',
    label: 'Tubarão',
    descricao: 'Negociador agressivo ou investidor experiente. Pressiona por desconto, testa a firmeza do corretor e não tolera amadorismo.',
    badge: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  },
];

export const SYSTEM_PROMPT_SIMULADOR_CLIENTE = `
Você é o motor de simulação de roleplay imobiliário para treinamento de corretores de imóveis no Brasil.
Sua função é interpretar o PAPEL DO CLIENTE (comprador ou proprietário) em um diálogo dinâmico de negociação de até 5 turnos.

Diretrizes de Atuação como Cliente:
1. NUNCA saia do personagem. NUNCA aja como instrutor ou avaliador durante o diálogo.
2. Responda em primeira pessoa, com naturalidade brasileira (linguagem direta de WhatsApp ou conversa pessoal).
3. Adapte sua resistência ao nível de dificuldade definido:
   - Moderado: Pede explicações, tem dúvidas legítimas, cede se o corretor for empático e claro.
   - Exigente: Questiona fontes, aponta inconsistências, não aceita frases prontas ("o melhor acabamento da cidade"), exige dados concretos.
   - Tubarão: Desafia o corretor abertamente, blefa sobre outras opções mais baratas, diz que só fecha com desconto agressivo ou condição extraordinária.
4. Tamanho da resposta: Máximo de 2 a 4 frases curtas e contundentes (estilo conversa real de negócios imobiliários).
5. Termômetro emocional: Mantenha a objeção viva a menos que o corretor tenha feito uma argumentação extraordinariamente precisa.

Retorne EXCLUSIVAMENTE um objeto JSON válido, sem qualquer markdown ao redor, seguindo estritamente a estrutura:
{
  "respostaCliente": "Texto da fala do cliente respondendo ao corretor",
  "emocaoCliente": "cético | curioso | irritado | satisfeito | firme | pensativo",
  "conducaoCorretor": "FORTE | REGULAR | FRACA",
  "observacaoInterna": "Breve nota interna de 1 linha sobre como o corretor lidou com o argumento neste turno"
}
`;

export const SYSTEM_PROMPT_AVALIADOR_ROLEPLAY = `
Você é um Diretor Comercial Imobiliário Sênior de elite e Juiz de Negociações Imobiliárias (especialista em técnicas de vendas de alto padrão, SPIN Selling imobiliário e contorno de objeções no Brasil).

Sua tarefa é analisar a transcrição completa de uma sessão de treinamento/roleplay (até 5 turnos) entre um corretor e um cliente simulado e gerar um diagnóstico executivo imparcial, construtivo e técnico.

Regras de Avaliação:
- Avalie de forma rigorosa mas educativa:
  * 0 a 4: Postura submissa, gaguejou, cedeu desconto sem contrapartida, concordou com a objeção do cliente ou foi agressivo/evasivo.
  * 5 a 7: Manteve a calma e usou bons argumentos, mas perdeu oportunidades de fazer perguntas de fechamento ou permitiu que o cliente dominasse o rumo da conversa.
  * 8 a 10: Postura consultiva de autoridade, fez perguntas investigativas poderosas, defendeu valor antes de preço, contornou objeções com dados e convidou para o próximo passo.

Retorne EXCLUSIVAMENTE um objeto JSON válido, sem qualquer texto ou markdown adicional ao redor, seguindo estritamente o modelo:
{
  "nota": number (ex: 7.5, número entre 0 e 10),
  "nivelDesempenho": "Iniciante | Em Evolução | Profissional Competente | Negociador de Elite",
  "resumoExecutivo": "Diagnóstico claro de 2 a 3 linhas sobre a atuação geral do corretor.",
  "pontosFortes": [
    "Ponto forte observado na conduta ou argumentação"
  ],
  "ondePerdeuAutoridade": [
    "Momento exato em que o corretor fraquejou, perdeu a condução ou cedeu à pressão do cliente"
  ],
  "frasesIdeaisContorno": [
    {
      "objecao": "Resumo da objeção apresentada pelo cliente",
      "fraseRecomendada": "Exatamente o que o corretor deveria ter dito (script pronto e poderoso)",
      "porQueFunciona": "Explicação técnica do gatilho ou técnica utilizada"
    }
  ],
  "planoMelhoria": [
    "Ação prática recomendada para treinar antes do próximo atendimento"
  ]
}
`;

/**
 * Normaliza e sanitiza a resposta JSON de turno do cliente simulado.
 */
export function interpretarTurnoCliente(respostaTexto, fallbackTexto = '') {
  const fallback = {
    respostaCliente: fallbackTexto || 'Entendi o que você disse, mas ainda não estou 100% convencido. Me mostre números concretos.',
    emocaoCliente: 'cético',
    conducaoCorretor: 'REGULAR',
    observacaoInterna: 'Resposta gerada por contingência.',
  };

  if (!respostaTexto || typeof respostaTexto !== 'string') return fallback;

  let limpo = respostaTexto.trim();
  if (limpo.startsWith('```')) {
    limpo = limpo.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  try {
    const parsed = JSON.parse(limpo);
    return {
      respostaCliente: String(parsed.respostaCliente || fallback.respostaCliente).trim(),
      emocaoCliente: String(parsed.emocaoCliente || 'cético').trim(),
      conducaoCorretor: ['FORTE', 'REGULAR', 'FRACA'].includes(String(parsed.conducaoCorretor).toUpperCase())
        ? String(parsed.conducaoCorretor).toUpperCase()
        : 'REGULAR',
      observacaoInterna: String(parsed.observacaoInterna || '').trim(),
    };
  } catch {
    const inicio = limpo.indexOf('{');
    const fim = limpo.lastIndexOf('}');
    if (inicio !== -1 && fim !== -1 && fim > inicio) {
      try {
        const sub = JSON.parse(limpo.substring(inicio, fim + 1));
        return {
          respostaCliente: String(sub.respostaCliente || fallback.respostaCliente).trim(),
          emocaoCliente: String(sub.emocaoCliente || 'cético').trim(),
          conducaoCorretor: ['FORTE', 'REGULAR', 'FRACA'].includes(String(sub.conducaoCorretor).toUpperCase())
            ? String(sub.conducaoCorretor).toUpperCase()
            : 'REGULAR',
          observacaoInterna: String(sub.observacaoInterna || '').trim(),
        };
      } catch {
        // continua para fallback com texto livre se houver
      }
    }
    // Se veio texto livre sem JSON, aproveita o texto livre como resposta do cliente
    if (limpo.length > 5 && !limpo.includes('{')) {
      return {
        ...fallback,
        respostaCliente: limpo,
      };
    }
    return fallback;
  }
}

/**
 * Normaliza e sanitiza a avaliação executiva final do roleplay.
 */
export function interpretarAvaliacaoRoleplay(respostaTexto) {
  const fallback = {
    nota: 6.5,
    nivelDesempenho: 'Em Evolução',
    resumoExecutivo: 'O corretor manteve o diálogo ativo e buscou contornar a objeção, mas faltou aprofundar perguntas investigativas antes de apresentar argumentos defensivos.',
    pontosFortes: [
      'Manteve a calma e cordialidade diante da objeção colocada pelo cliente.',
      'Não abandonou o contato e buscou trazer pontos positivos do imóvel/serviço.',
    ],
    ondePerdeuAutoridade: [
      'Tentou rebater a objeção de imediato em vez de fazer perguntas abertas para descobrir a motivação real.',
      'Faltou propor um fechamento ou próximo passo concreto com data e hora combinadas.',
    ],
    frasesIdeaisContorno: [
      {
        objecao: 'Objeção do cenário treinado',
        fraseRecomendada: 'Compreendo perfeitamente sua cautela. Se nós conseguirmos alinhar esse ponto específico mantendo a segurança jurídica que você busca, faria sentido avançarmos com a proposta hoje?',
        porQueFunciona: 'Isola a objeção e testa o real compromisso de compra sem gerar atrito desnecessário.',
      },
    ],
    planoMelhoria: [
      'Praticar a técnica de isolamento de objeções antes de defender preço ou condições.',
      'Treinar roteiros de perguntas abertas (SPIN Selling) no início do atendimento.',
    ],
  };

  if (!respostaTexto || typeof respostaTexto !== 'string') return fallback;

  let limpo = respostaTexto.trim();
  if (limpo.startsWith('```')) {
    limpo = limpo.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  let parsed = null;
  try {
    parsed = JSON.parse(limpo);
  } catch {
    const inicio = limpo.indexOf('{');
    const fim = limpo.lastIndexOf('}');
    if (inicio !== -1 && fim !== -1 && fim > inicio) {
      try {
        parsed = JSON.parse(limpo.substring(inicio, fim + 1));
      } catch {
        parsed = null;
      }
    }
  }

  if (!parsed || typeof parsed !== 'object') return fallback;

  const notaNum = parseFloat(parsed.nota);
  const notaValida = !isNaN(notaNum) ? Math.min(10, Math.max(0, Math.round(notaNum * 10) / 10)) : fallback.nota;

  return {
    nota: notaValida,
    nivelDesempenho: String(parsed.nivelDesempenho || (notaValida >= 8.5 ? 'Negociador de Elite' : notaValida >= 7 ? 'Profissional Competente' : notaValida >= 5 ? 'Em Evolução' : 'Iniciante')).trim(),
    resumoExecutivo: String(parsed.resumoExecutivo || fallback.resumoExecutivo).trim(),
    pontosFortes: Array.isArray(parsed.pontosFortes) && parsed.pontosFortes.length > 0
      ? parsed.pontosFortes.map((p) => String(p).trim()).filter(Boolean)
      : fallback.pontosFortes,
    ondePerdeuAutoridade: Array.isArray(parsed.ondePerdeuAutoridade) && parsed.ondePerdeuAutoridade.length > 0
      ? parsed.ondePerdeuAutoridade.map((p) => String(p).trim()).filter(Boolean)
      : fallback.ondePerdeuAutoridade,
    frasesIdeaisContorno: Array.isArray(parsed.frasesIdeaisContorno) && parsed.frasesIdeaisContorno.length > 0
      ? parsed.frasesIdeaisContorno.map((item) => ({
          objecao: String(item?.objecao || 'Objeção apresentada').trim(),
          fraseRecomendada: String(item?.fraseRecomendada || '').trim(),
          porQueFunciona: String(item?.porQueFunciona || '').trim(),
        })).filter((i) => i.fraseRecomendada.length > 0)
      : fallback.frasesIdeaisContorno,
    planoMelhoria: Array.isArray(parsed.planoMelhoria) && parsed.planoMelhoria.length > 0
      ? parsed.planoMelhoria.map((p) => String(p).trim()).filter(Boolean)
      : fallback.planoMelhoria,
  };
}

/**
 * Monta o prompt do turno para o cliente simulado.
 */
export function montarPromptTurnoCliente({ cenarioObj, dificuldadeId, historico, mensagemCorretor, turnoAtual }) {
  const dif = NIVEIS_DIFICULDADE.find((d) => d.id === dificuldadeId) || NIVEIS_DIFICULDADE[0];
  const linhas = [
    `CENÁRIO DE TREINAMENTO: ${cenarioObj?.titulo || 'Atendimento Imobiliário'}`,
    `CONTEXTO DO NEGÓCIO: ${cenarioObj?.contexto || ''}`,
    `NÍVEL DE EXIGÊNCIA DO CLIENTE: ${dif.label} (${dif.descricao})`,
    `TURNO ATUAL: ${turnoAtual} de 5`,
    '',
    'HISTÓRICO DA CONVERSA ATÉ O MOMENTO:',
  ];

  if (Array.isArray(historico) && historico.length > 0) {
    historico.forEach((msg, idx) => {
      const autor = msg.autor === 'corretor' ? 'Corretor' : 'Cliente';
      linhas.push(`[${idx + 1}] ${autor}: ${msg.texto}`);
    });
  }

  linhas.push(
    `[Atual] Corretor: ${mensagemCorretor}`,
    '',
    'Responda como o cliente para dar continuidade ao diálogo, de acordo com o nível de exigência. Retorne EXCLUSIVAMENTE o JSON especificado.'
  );

  return linhas.join('\n');
}

/**
 * Monta o prompt para o Diretor Comercial IA avaliar a sessão completa.
 */
export function montarPromptAvaliacao({ cenarioObj, dificuldadeId, historico }) {
  const dif = NIVEIS_DIFICULDADE.find((d) => d.id === dificuldadeId) || NIVEIS_DIFICULDADE[0];
  const linhas = [
    `AVALIAÇÃO DE ROLEPLAY DE TREINAMENTO IMOBILIÁRIO`,
    `CENÁRIO: ${cenarioObj?.titulo || 'Atendimento Imobiliário'}`,
    `CONTEXTO: ${cenarioObj?.contexto || ''}`,
    `NÍVEL DE DIFICULDADE ENFRENTADO: ${dif.label}`,
    `TOTAL DE TURNOS REALIZADOS: ${Math.ceil((historico?.length || 0) / 2)}`,
    '',
    'TRANSCRIÇÃO COMPLETA DA SIMULAÇÃO:',
  ];

  if (Array.isArray(historico)) {
    historico.forEach((msg, idx) => {
      const autor = msg.autor === 'corretor' ? 'CORRETOR' : 'CLIENTE';
      linhas.push(`Turno ${idx + 1} - ${autor}: "${msg.texto}"`);
    });
  }

  linhas.push(
    '',
    'Analise tecnicamente o desempenho do corretor e retorne EXCLUSIVAMENTE o objeto JSON com nota de 0 a 10, pontos fortes, onde perdeu autoridade e as frases ideais de contorno.'
  );

  return linhas.join('\n');
}

/**
 * Executa a chamada à rota /api/ai para obter a resposta do cliente simulado.
 */
export async function processarTurnoRoleplayIA({ cenarioObj, dificuldadeId, historico, mensagemCorretor, turnoAtual, provider = 'deepseek' }) {
  if (!mensagemCorretor || !String(mensagemCorretor).trim()) {
    throw new Error('A mensagem do corretor não pode ser vazia.');
  }

  const promptUsuario = montarPromptTurnoCliente({
    cenarioObj,
    dificuldadeId,
    historico,
    mensagemCorretor,
    turnoAtual,
  });

  const headers = await cabecalhosIA();
  const resposta = await fetch('/api/ai', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      provider,
      systemPrompt: SYSTEM_PROMPT_SIMULADOR_CLIENTE,
      messages: [{ role: 'user', content: promptUsuario }],
      temperature: 0.6,
      maxTokens: 500,
    }),
  });

  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const hint = dados?.hint || dados?.error || `Erro HTTP ${resposta.status}`;
    throw new Error(`Falha no simulador de roleplay: ${hint}`);
  }

  const texto = dados?.text || '';
  return interpretarTurnoCliente(texto);
}

/**
 * Executa a chamada à rota /api/ai para avaliar a sessão do roleplay.
 */
export async function processarAvaliacaoRoleplayIA({ cenarioObj, dificuldadeId, historico, provider = 'deepseek' }) {
  if (!Array.isArray(historico) || historico.length === 0) {
    throw new Error('Nenhum turno registrado para avaliação.');
  }

  const promptUsuario = montarPromptAvaliacao({
    cenarioObj,
    dificuldadeId,
    historico,
  });

  const headers = await cabecalhosIA();
  const resposta = await fetch('/api/ai', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      provider,
      systemPrompt: SYSTEM_PROMPT_AVALIADOR_ROLEPLAY,
      messages: [{ role: 'user', content: promptUsuario }],
      temperature: 0.2,
      maxTokens: 1500,
    }),
  });

  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const hint = dados?.hint || dados?.error || `Erro HTTP ${resposta.status}`;
    throw new Error(`Falha na avaliação da sessão de roleplay: ${hint}`);
  }

  const texto = dados?.text || '';
  return interpretarAvaliacaoRoleplay(texto);
}
