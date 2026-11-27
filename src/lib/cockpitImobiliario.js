/**
 * cockpitImobiliario.js — Motor determinístico do Cockpit Visual do Processo Imobiliário
 * ===================================================================================
 * 100% determinístico no frontend (zero tokens automáticos de IA).
 * Alimenta a aba Visão Geral (src/AdminNovo.jsx) com as 3 faixas hierárquicas:
 *   1. Trilho Visual de 7 etapas + Ações Urgentes do Dia;
 *   2. Gráficos Executivos (Funil, Saúde da Carteira, Origem de Clientes);
 *   3. Radar de Mercado Imobiliário & Indicadores de Balcão.
 *
 * Em caso de conta vazia (Cold Start), injeta automaticamente o cenário demo
 * de src/lib/cenarioDemo.js, sinalizando o modo demonstração.
 * ===================================================================================
 */

import {
  obterDadosCenarioDemoMemoria,
  obterCenarioCartorioDemo,
  vistoriasDemoChaves,
} from './cenarioDemo.js';

/** Índices oficiais de balcão para consulta rápida em negociações */
export const INDICES_MERCADO = Object.freeze([
  {
    id: 'selic',
    nome: 'Taxa Selic',
    sigla: 'SELIC',
    valor: '11,25%',
    periodo: 'ao ano',
    subtitulo: 'Taxa Básica de Juros da Economia',
    usoPratico: 'Referência de juros do financiamento imobiliário bancário e rentabilidade de aplicações concorrentes.',
    badgeCor: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  },
  {
    id: 'incc',
    nome: 'INCC-M',
    sigla: 'INCC-M',
    valor: '+0,38%',
    periodo: 'mensal (5,2% 12m)',
    subtitulo: 'Custo Nacional da Construção Civil',
    usoPratico: 'Índice obrigatório para correção monetária do saldo devedor na planta até a entrega definitiva das chaves.',
    badgeCor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
  {
    id: 'igpm',
    nome: 'IGP-M',
    sigla: 'IGP-M',
    valor: '+0,29%',
    periodo: 'mensal (3,8% 12m)',
    subtitulo: 'Índice Geral de Preços do Mercado (FGV)',
    usoPratico: 'Tradicional indexador para reajuste anual de contratos de locação residencial e imóveis comerciais.',
    badgeCor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  {
    id: 'tr',
    nome: 'TR (Taxa Referencial)',
    sigla: 'TR',
    valor: '~0,08%',
    periodo: 'ao mês (~1,7% a.a.)',
    subtitulo: 'Taxa Referencial do Banco Central',
    usoPratico: 'Compõe o custo efetivo total dos financiamentos imobiliários indexados pela TR (ex.: Caixa/SBPE).',
    badgeCor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  },
]);

/** Tendências e destaques práticos do setor para argumento de balcão */
export const TENDENCIAS_MERCADO = Object.freeze([
  {
    id: 'credito_caixa',
    titulo: 'Crédito Habitacional / Caixa',
    tema: 'Cotas SBPE & Financiamento',
    resumo: 'Ajuste nas cotas de amortização pelo SBPE e valorização da composição de renda familiar.',
    argumentoComercial: 'Com a exigência maior de entrada no SBPE, antecipar a aprovação da carta de crédito e somar rendas familiares assegura as taxas vigentes antes de novas restrições.',
    icone: 'Landmark',
  },
  {
    id: 'mcmv',
    titulo: 'Minha Casa Minha Vida',
    tema: 'Subsídios & Teto Ampliado',
    resumo: 'Teto de até R$ 350 mil e taxas a partir de 4,25% a.a. impulsionam a liquidez de 2 quartos.',
    argumentoComercial: 'Com subsídios elevados e juros abaixo da inflação, a prestação do financiamento MCMV fica frequentemente inferior ao valor médio de aluguel na mesma região.',
    icone: 'Building',
  },
  {
    id: 'liquidez_precificacao',
    titulo: 'Liquidez & Precificação',
    tema: 'Janela Crítica de 40 Dias',
    resumo: 'Imóveis com preço alinhado ao m² do bairro concentram 80% das visitas no primeiro mês.',
    argumentoComercial: 'Imóvel superestimado perde o efeito de novidade e fica estagnado mais de 90 dias; precificação técnica com laudo gera propostas firmes logo nas primeiras 3 semanas.',
    icone: 'TrendingUp',
  },
  {
    id: 'locacao_garantias',
    titulo: 'Locação & Garantias',
    tema: 'Garantias Digitais & Fim do Fiador',
    resumo: 'Seguro-fiança e caução no cartão reduzem a vacância locatícia para menos de 15 dias.',
    argumentoComercial: 'A dispensa do fiador tradicional atrai inquilinos qualificados com análise cadastral instantânea, assegurando o recebimento do aluguel sem risco de inadimplência.',
    icone: 'Key',
  },
]);

/** As 7 etapas fundamentais do ciclo imobiliário de ponta a ponta */
export const ETAPAS_PROCESSO_IMOBILIARIO = Object.freeze([
  {
    id: 'clientes_contatos',
    passo: '01',
    nome: 'Clientes & Contatos',
    descricao: 'leads ativos / novos contatos que chegaram',
    abaDestino: 'funil_leads',
    plano: 'gratis',
    badge: 'GRÁTIS',
    cor: '#10b981',
    icone: 'Users',
  },
  {
    id: 'captacao_avaliacao',
    passo: '02',
    nome: 'Captação & Avaliação',
    descricao: 'imóveis captados / em avaliação',
    abaDestino: 'captacao_imobi',
    plano: 'pro',
    badge: 'PRO',
    cor: '#38bdf8',
    icone: 'Building2',
  },
  {
    id: 'visitas_agendadas',
    passo: '03',
    nome: 'Visitas Agendadas',
    descricao: 'visitas da semana / retornos',
    abaDestino: 'visitas_imobi',
    plano: 'gratis',
    badge: 'GRÁTIS',
    cor: '#10b981',
    icone: 'CalendarClock',
  },
  {
    id: 'propostas_credito',
    passo: '04',
    nome: 'Propostas & Crédito',
    descricao: 'propostas abertas / triagem bancária',
    abaDestino: 'historico',
    plano: 'pro',
    badge: 'PRO',
    cor: '#38bdf8',
    icone: 'FileText',
  },
  {
    id: 'cartorio_vistoria',
    passo: '05',
    nome: 'Cartório & Vistoria',
    descricao: 'certidões, ITBI, escritura e entrega de chaves',
    abaDestino: 'notafiscal',
    plano: 'plus',
    badge: 'PLUS',
    cor: '#a855f7',
    icone: 'FileCheck2',
  },
  {
    id: 'repasse_comissao',
    passo: '06',
    nome: 'Repasse & Comissão',
    descricao: 'comissões liberadas / VGV fechado',
    abaDestino: 'notafiscal',
    plano: 'plus',
    badge: 'PLUS',
    cor: '#a855f7',
    icone: 'CircleDollarSign',
  },
  {
    id: 'pos_venda_carteira',
    passo: '07',
    nome: 'Pós-Venda & Carteira',
    descricao: 'clientes entregues, acompanhamento pós-venda e reativação',
    abaDestino: 'pos_venda',
    plano: 'plus',
    badge: 'PLUS',
    cor: '#a855f7',
    icone: 'HeartHandshake',
  },
]);

/** Formata moeda brasileira */
export function formatarMoeda(valor) {
  const num = Number(valor) || 0;
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

/** Formata número abreviado em milhões / mil (ex.: R$ 4,8M ou R$ 850k) */
export function formatarValorAbreviado(valor) {
  const num = Number(valor) || 0;
  if (num >= 1000000) {
    return `R$ ${(num / 1000000).toFixed(1).replace('.', ',')}M`;
  }
  if (num >= 1000) {
    return `R$ ${(num / 1000).toFixed(0)}k`;
  }
  return formatarMoeda(num);
}

/** Extrai data numérica ou milissegundos a partir de Timestamp do Firestore ou string */
export function extrairMilissegundos(dataValor) {
  if (!dataValor) return null;
  if (typeof dataValor === 'number') return dataValor;
  if (typeof dataValor?.toMillis === 'function') return dataValor.toMillis();
  if (dataValor?.seconds) return dataValor.seconds * 1000;
  if (typeof dataValor === 'string') {
    const ms = Date.parse(dataValor);
    return isNaN(ms) ? null : ms;
  }
  if (dataValor instanceof Date) return dataValor.getTime();
  return null;
}

/**
 * Calcula todos os indicadores operacionais do cockpit de ponta a ponta
 */
export function calcularCockpit({
  imoveis = [],
  leads = [],
  visitas = [],
  propostas = [],
  tarefas = [],
  cartorio = [],
  vistorias = [],
  posVenda = [],
  agora = Date.now(),
} = {}) {
  const diaMs = 24 * 60 * 60 * 1000;
  const horaMs = 60 * 60 * 1000;

  // Verifica se estamos em Cold Start (tenant vazio sem imóveis e sem leads)
  const semImoveis = !Array.isArray(imoveis) || imoveis.length === 0;
  const semLeads = !Array.isArray(leads) || leads.length === 0;
  const emModoDemo = semImoveis && semLeads;

  let baseImoveis = Array.isArray(imoveis) ? [...imoveis] : [];
  let baseLeads = Array.isArray(leads) ? [...leads] : [];
  let baseVisitas = Array.isArray(visitas) ? [...visitas] : [];
  let basePropostas = Array.isArray(propostas) ? [...propostas] : [];
  let baseCartorio = Array.isArray(cartorio) ? [...cartorio] : [];
  let baseVistorias = Array.isArray(vistorias) ? [...vistorias] : [];
  let basePosVenda = Array.isArray(posVenda) ? [...posVenda] : [];

  if (emModoDemo) {
    const { imoveisDemo, leadsDemo } = obterDadosCenarioDemoMemoria();
    baseImoveis = imoveisDemo;
    baseLeads = leadsDemo;
    baseCartorio = obterCenarioCartorioDemo(agora);
    baseVistorias = vistoriasDemoChaves;
    baseVisitas = [
      { id: 'vis_1', imovelTitulo: 'Apartamento 3 Qts Vista Mar', leadNome: 'Rodrigo Meireles', dataHora: new Date(agora + 1 * diaMs).toISOString(), status: 'Agendada' },
      { id: 'vis_2', imovelTitulo: 'Casa em Condomínio Fechado', leadNome: 'Camila Rodrigues', dataHora: new Date(agora + 2 * diaMs).toISOString(), status: 'Confirmada' },
      { id: 'vis_3', imovelTitulo: 'Studio Mobiliado Beira Mar', leadNome: 'Fernanda Costa', dataHora: new Date(agora - 1 * diaMs).toISOString(), status: 'Realizada' },
    ];
    basePropostas = [
      { id: 'prop_1', imovelTitulo: 'Cobertura Duplex Jardins', valorProposta: 2400000, comprador: 'Bruno Albuquerque', status: 'Em Análise Bancária' },
      { id: 'prop_2', imovelTitulo: 'Apartamento 3 Qts Vista Mar', valorProposta: 820000, comprador: 'Juliana Peixoto', status: 'Em Negociação' },
    ];
    basePosVenda = [
      { id: 'pos_1', nomeComprador: 'Marcelo Vasconcelos', imovelTitulo: 'Apartamento Residencial Jardins', valorVenda: 740000, diasEntrega: 28, pendencia: 'Pesquisa 30 dias de Chaves' },
      { id: 'pos_2', nomeComprador: 'Ana Beatriz Souza', imovelTitulo: 'Casa Terra Brasilis', valorVenda: 890000, diasEntrega: 90, pendencia: 'Revisão de Garantias Construtora' },
      { id: 'pos_3', nomeComprador: 'Lucas Pinheiro', imovelTitulo: 'Studio Iracema', valorVenda: 410000, diasEntrega: 180, pendencia: 'Reativação / Indicação de Amigo' },
    ];
  }

  // Se não temos cartório passado explicitamente mas não é demo, buscar negociacoes
  if (!emModoDemo && baseCartorio.length === 0 && basePropostas.length > 0) {
    baseCartorio = basePropostas
      .filter((p) => p.status === 'fechada' || p.status === 'aprovada' || p.status === 'concluida')
      .map((p) => ({
        id: p.id || `cart_${Math.random()}`,
        imovelTitulo: p.imovelTitulo || p.titulo || 'Negociação Imobiliária',
        compradorNome: p.compradorNome || p.cliente || 'Comprador',
        valor: Number(p.valor || p.valorProposta || 0),
        statusGeral: 'em_andamento',
      }));
  }

  // 1. CÁLCULO DAS 7 ETAPAS
  // ---------------------------------------------------------
  // Passo 1: Clientes & Contatos
  const totalLeads = baseLeads.length;
  const leadsNovos = baseLeads.filter((l) => {
    const ms = extrairMilissegundos(l.criadoEm || l.createdAt);
    return ms ? agora - ms <= 48 * horaMs : true;
  }).length;

  // Passo 2: Captação & Avaliação
  const totalImoveis = baseImoveis.length;
  const vgvImoveis = baseImoveis.reduce((acc, im) => acc + (Number(im.valor) || 0), 0);

  // Passo 3: Visitas Agendadas
  const totalVisitas = baseVisitas.length;
  const visitasSemana = baseVisitas.filter((v) => {
    const ms = extrairMilissegundos(v.dataHora || v.data);
    return ms ? Math.abs(agora - ms) <= 7 * diaMs : true;
  }).length;

  // Passo 4: Propostas & Crédito
  const totalPropostas = basePropostas.length;
  const vgvPropostas = basePropostas.reduce((acc, p) => acc + (Number(p.valorProposta || p.valor || 0)), 0);

  // Passo 5: Cartório & Vistoria
  const totalCartorio = baseCartorio.length || (emModoDemo ? 3 : 0);
  const totalVistorias = baseVistorias.length || (emModoDemo ? 2 : 0);

  // Passo 6: Repasse & Comissão
  // Comissões estimadas a 6% do VGV fechado ou das propostas aceitas
  const vgvFechado = baseCartorio.reduce((acc, c) => acc + (Number(c.valor || c.valorNegociacao || 0)), 0) || (emModoDemo ? 2840000 : 0);
  const comissoesLiberadas = vgvFechado * 0.06;

  // Passo 7: Pós-Venda & Carteira
  const totalPosVenda = basePosVenda.length || (emModoDemo ? 3 : 0);

  const dadosEtapas = {
    clientes_contatos: {
      quantidade: totalLeads,
      resumo: `${leadsNovos} novos contatos`,
      valorSecundario: 'CRM de Entrada',
    },
    captacao_avaliacao: {
      quantidade: totalImoveis,
      resumo: formatarValorAbreviado(vgvImoveis) + ' VGV',
      valorSecundario: 'Carteira Ativa',
    },
    visitas_agendadas: {
      quantidade: totalVisitas,
      resumo: `${visitasSemana} esta semana`,
      valorSecundario: 'Retornos & Campo',
    },
    propostas_credito: {
      quantidade: totalPropostas,
      resumo: vgvPropostas > 0 ? formatarValorAbreviado(vgvPropostas) : `${totalPropostas} em mesa`,
      valorSecundario: 'Mesa & Triagem',
    },
    cartorio_vistoria: {
      quantidade: totalCartorio,
      resumo: `${totalVistorias} vistorias`,
      valorSecundario: 'CNDs & Registro',
    },
    repasse_comissao: {
      quantidade: formatarValorAbreviado(comissoesLiberadas),
      resumo: '6% VGV Fechado',
      valorSecundario: 'Repasses & NFS-e',
    },
    pos_venda_carteira: {
      quantidade: totalPosVenda,
      resumo: 'Clientes em carteira',
      valorSecundario: 'Reativação & Chaves',
    },
  };

  const etapasCompletas = ETAPAS_PROCESSO_IMOBILIARIO.map((etapa) => ({
    ...etapa,
    ...(dadosEtapas[etapa.id] || {}),
  }));

  // 2. AÇÕES URGENTES DO HOJE
  // ---------------------------------------------------------
  // Leads sem resposta (> 24 horas)
  const leadsSemResposta = baseLeads.filter((l) => {
    if (l.semResposta === true) return true;
    if (Number(l.horasSemResposta) > 24 || Number(l.horasSemContato) > 24) return true;
    const ms = extrairMilissegundos(l.ultimoContatoEm || l.criadoEm);
    return ms ? (agora - ms) > 24 * horaMs : false;
  }).map((l) => ({
    id: l.id || l.telefone || l.nome,
    titulo: l.nome || 'Lead sem nome',
    subtitulo: `${l.interesse || 'Interesse geral'} · Sem retorno há ${l.horasSemResposta || Math.round((agora - (extrairMilissegundos(l.ultimoContatoEm || l.criadoEm) || agora)) / horaMs)}h`,
    tipo: 'lead_sem_resposta',
    acao: 'Atender Lead',
    abaDestino: 'funil_leads',
    telefone: l.telefone,
  }));

  // Certidões perto do vencimento (<= 5 dias ou vencida)
  const certidoesUrgentes = [];
  baseCartorio.forEach((neg) => {
    const certs = neg.etapas?.certidoes?.itens || neg.certidoes || {};
    Object.entries(certs).forEach(([key, item]) => {
      const validade = extrairMilissegundos(item?.validadeAte);
      if (validade) {
        const diasRest = Math.ceil((validade - agora) / diaMs);
        if (diasRest <= 5) {
          certidoesUrgentes.push({
            id: `${neg.id}_${key}`,
            titulo: `${item.rotulo || key.toUpperCase()} (${neg.imovelTitulo || 'Imóvel'})`,
            subtitulo: diasRest <= 0 ? 'Certidão VENCIDA — renovar urgente' : `Vence em ${diasRest} dia(s)`,
            tipo: 'certidao_vencimento',
            acao: 'Abrir Cartório',
            abaDestino: 'notafiscal',
          });
        }
      }
    });
  });

  // Fallback demo caso não haja certidões montadas
  if (emModoDemo && certidoesUrgentes.length === 0) {
    certidoesUrgentes.push({
      id: 'demo_cnd_1',
      titulo: 'Matrícula Atualizada (Residencial Jardins)',
      subtitulo: 'Vence em 3 dias — necessária para minuta da escritura',
      tipo: 'certidao_vencimento',
      acao: 'Abrir Cartório',
      abaDestino: 'notafiscal',
    });
  }

  // Imóveis parados há mais de 40 dias
  const imoveisParados = baseImoveis.filter((im) => {
    if (Number(im.diasParado) > 40) return true;
    const ms = extrairMilissegundos(im.criadoEm || im.atualizadoEm);
    return ms ? (agora - ms) > 40 * diaMs : false;
  }).map((im) => ({
    id: im.id || im.codigo || im.titulo,
    titulo: im.titulo || 'Imóvel em carteira',
    subtitulo: `${im.bairro || 'Sem bairro'} · Parado há ${im.diasParado || Math.round((agora - (extrairMilissegundos(im.criadoEm) || agora)) / diaMs)} dias`,
    tipo: 'imovel_parado',
    acao: 'Prestação de Contas',
    abaDestino: 'mapa_inteligencia',
    imovelCompleto: im,
  }));

  // Pós-venda pendente
  const posVendaUrgentes = basePosVenda.map((pv) => ({
    id: pv.id,
    titulo: `Pós-Venda: ${pv.nomeComprador || 'Cliente'} (${pv.imovelTitulo || 'Imóvel'})`,
    subtitulo: pv.pendencia || `Entregue há ${pv.diasEntrega || 30} dias — contato de relacionamento pendente`,
    tipo: 'pos_venda_pendente',
    acao: 'Ver Pós-Venda',
    abaDestino: 'pos_venda',
  }));

  const acoesUrgentes = [
    ...leadsSemResposta,
    ...certidoesUrgentes,
    ...imoveisParados,
    ...posVendaUrgentes,
  ];

  // 3. GRÁFICOS EXECUTIVOS DETERMINÍSTICOS
  // ---------------------------------------------------------
  // 3.1 Funil de Conversão & VGV
  const funilContatos = Math.max(totalLeads, 1);
  const funilVisitas = totalVisitas;
  const funilPropostas = totalPropostas;
  const funilFechamentos = baseCartorio.length || (emModoDemo ? 1 : 0);

  const funil = {
    contatos: {
      label: 'Contatos Recebidos',
      total: funilContatos,
      pct: 100,
      cor: '#38bdf8',
    },
    visitas: {
      label: 'Visitas Agendadas',
      total: funilVisitas,
      pct: Math.min(100, Math.round((funilVisitas / funilContatos) * 100)) || 0,
      cor: '#10b981',
    },
    propostas: {
      label: 'Propostas & Crédito',
      total: funilPropostas,
      pct: Math.min(100, Math.round((funilPropostas / funilContatos) * 100)) || 0,
      cor: '#f59e0b',
    },
    fechamentos: {
      label: 'Fechamentos & Pós-Venda',
      total: funilFechamentos,
      pct: Math.min(100, Math.round((funilFechamentos / funilContatos) * 100)) || 0,
      cor: '#a855f7',
    },
    taxaConversaoGeral: Math.min(100, Math.round((funilFechamentos / funilContatos) * 100)) || 0,
    vgvEmMesa: vgvPropostas + vgvFechado,
  };

  // 3.2 Saúde & Liquidez da Carteira (0-20 dias, 21-40 dias, +40 dias)
  let count0a20 = 0;
  let count21a40 = 0;
  let countMais40 = 0;

  baseImoveis.forEach((im) => {
    let dias = Number(im.diasParado);
    if (!dias) {
      const ms = extrairMilissegundos(im.criadoEm || im.atualizadoEm);
      dias = ms ? Math.round((agora - ms) / diaMs) : 10;
    }
    if (dias <= 20) count0a20 += 1;
    else if (dias <= 40) count21a40 += 1;
    else countMais40 += 1;
  });

  const totalImoveisSaude = Math.max(totalImoveis, 1);
  const saudeCarteira = {
    faixa0a20: {
      label: '0–20 dias (Alta Liquidez)',
      quantidade: count0a20,
      pct: Math.round((count0a20 / totalImoveisSaude) * 100),
      cor: '#10b981',
      status: 'Saudável',
    },
    faixa21a40: {
      label: '21–40 dias (Meia-Vida / Atenção)',
      quantidade: count21a40,
      pct: Math.round((count21a40 / totalImoveisSaude) * 100),
      cor: '#f59e0b',
      status: 'Atenção',
    },
    faixaMais40: {
      label: '+40 dias (Alerta de Estagnação)',
      quantidade: countMais40,
      pct: Math.round((countMais40 / totalImoveisSaude) * 100),
      cor: '#ef4444',
      status: 'Crítico',
    },
    total: totalImoveis,
    precisaPrestacaoContas: countMais40 > 0,
  };

  // 3.3 Origem dos Clientes & Atendimento
  let origemWhatsapp = 0;
  let origemPortal = 0;
  let origemPortais = 0;
  let origemIndicacao = 0;

  baseLeads.forEach((l) => {
    const orig = String(l.origem || '').toLowerCase();
    if (orig.includes('whatsapp') || orig.includes('pólen') || orig.includes('polen')) {
      origemWhatsapp += 1;
    } else if (orig.includes('/portal') || orig.includes('portal do cliente') || orig.includes('vitrine')) {
      origemPortal += 1;
    } else if (orig.includes('zap') || orig.includes('vivareal') || orig.includes('olx') || orig.includes('portal imobiliário') || orig.includes('google')) {
      origemPortais += 1;
    } else {
      origemIndicacao += 1;
    }
  });

  const totalOrigens = Math.max(totalLeads, 1);
  const origemClientes = {
    whatsapp: {
      label: 'WhatsApp (Pólen 24h)',
      total: origemWhatsapp,
      pct: Math.round((origemWhatsapp / totalOrigens) * 100),
      cor: '#10b981',
    },
    portal: {
      label: 'Portal do Cliente (/portal)',
      total: origemPortal,
      pct: Math.round((origemPortal / totalOrigens) * 100),
      cor: '#38bdf8',
    },
    portais: {
      label: 'Portais (ZAP, VivaReal, OLX)',
      total: origemPortais,
      pct: Math.round((origemPortais / totalOrigens) * 100),
      cor: '#a855f7',
    },
    indicacao: {
      label: 'Indicação / Balcão Direto',
      total: origemIndicacao,
      pct: Math.round((origemIndicacao / totalOrigens) * 100),
      cor: '#f59e0b',
    },
  };

  return {
    emModoDemo,
    etapas: etapasCompletas,
    acoesUrgentes,
    funil,
    saudeCarteira,
    origemClientes,
    totais: {
      leads: totalLeads,
      imoveis: totalImoveis,
      visitas: totalVisitas,
      propostas: totalPropostas,
      vgvCarteira: vgvImoveis,
      vgvFechado,
      comissoesLiberadas,
    },
  };
}
