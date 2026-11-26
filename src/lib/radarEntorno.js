/**
 * Express Imobi Tech — Radar de Valorização & Amenidades do Entorno (Fator Localização)
 * Módulo 100% determinístico no cliente (Zero tokens automáticos de IA).
 * Conformidade com ABNT NBR 14653 (Fator de Localização e Infraestrutura Urbana).
 */

export const CATEGORIAS_RADAR = {
  EDUCACAO: 'Educação & Escolas',
  SAUDE: 'Saúde & Hospitais',
  COMERCIO: 'Comércio & Supermercados',
  LAZER: 'Lazer & Parques',
  MOBILIDADE: 'Mobilidade & Vias de Acesso',
  RUIDO_ATENCAO: 'Fator de Atenção / Ruído',
};

export const IMPACTOS_RADAR = {
  ALTA_VALORIZACAO: 'Alta Valorização',
  CONVENIENCIA: 'Conveniência',
  PONTO_ATENCAO: 'Ponto de Atenção',
};

export const ANCORAS_PREDEFINIDAS = [
  {
    nome: 'Supermercado / Atacadista',
    categoria: CATEGORIAS_RADAR.COMERCIO,
    distancia: '300m',
    impacto: IMPACTOS_RADAR.CONVENIENCIA,
    pesoBase: 14,
  },
  {
    nome: 'Escola / Colégio de Referência',
    categoria: CATEGORIAS_RADAR.EDUCACAO,
    distancia: '400m',
    impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO,
    pesoBase: 18,
  },
  {
    nome: 'Hospital / UPA / Centro Médico',
    categoria: CATEGORIAS_RADAR.SAUDE,
    distancia: '800m',
    impacto: IMPACTOS_RADAR.CONVENIENCIA,
    pesoBase: 14,
  },
  {
    nome: 'Parque / Praça Arborizada',
    categoria: CATEGORIAS_RADAR.LAZER,
    distancia: '250m',
    impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO,
    pesoBase: 18,
  },
  {
    nome: 'Avenida Principal / Transporte Integrado',
    categoria: CATEGORIAS_RADAR.MOBILIDADE,
    distancia: '200m',
    impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO,
    pesoBase: 16,
  },
  {
    nome: 'Shopping Center / Polo Gastronômico',
    categoria: CATEGORIAS_RADAR.COMERCIO,
    distancia: '900m',
    impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO,
    pesoBase: 18,
  },
  {
    nome: 'Área Industrial / Ruído / Linha Férrea',
    categoria: CATEGORIAS_RADAR.RUIDO_ATENCAO,
    distancia: '150m',
    impacto: IMPACTOS_RADAR.PONTO_ATENCAO,
    pesoBase: -22,
  },
];

/**
 * Converte distância em texto para metros (ex: '300m' -> 300, '1,5km' -> 1500).
 */
export function converterDistanciaMetros(distanciaStr) {
  if (typeof distanciaStr === 'number') return distanciaStr;
  const texto = String(distanciaStr || '').toLowerCase().trim();
  if (texto.includes('km')) {
    const limpo = texto.replace('km', '').replace(',', '.').trim();
    const km = parseFloat(limpo);
    return Number.isFinite(km) ? Math.round(km * 1000) : 500;
  }
  const limpoM = texto.replace('m', '').replace(/[^\d.]/g, '').trim();
  const m = parseFloat(limpoM);
  return Number.isFinite(m) ? Math.round(m) : 500;
}

/**
 * Classifica a faixa de liquidez com base na nota 0 a 100.
 */
export function classificarLiquidez(score) {
  if (score >= 80) {
    return {
      faixa: '80–100',
      rotulo: 'Liquidez Premium',
      cor: '#10b981',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      descricao: 'Excelente concentração de serviços e alta velocidade de comercialização.',
    };
  }
  if (score >= 60) {
    return {
      faixa: '60–79',
      rotulo: 'Alta Atratividade',
      cor: '#38bdf8',
      badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      descricao: 'Ótima infraestrutura urbana com valorização imobiliária constante.',
    };
  }
  if (score >= 40) {
    return {
      faixa: '40–59',
      rotulo: 'Liquidez Moderada',
      cor: '#f59e0b',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      descricao: 'Infraestrutura padrão com liquidez em linha com a média regional.',
    };
  }
  return {
    faixa: '0–39',
    rotulo: 'Ponto de Atenção / Nicho Específico',
    cor: '#f43f5e',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    descricao: 'Carência de serviços essenciais ou presença de fatores desvalorizadores imediatos.',
  };
}

/**
 * Calcula deterministicamente o Índice de Liquidez & Valorização (0 a 100).
 */
export function calcularIndiceLiquidez(ancoras = []) {
  const lista = Array.isArray(ancoras) ? ancoras : [];
  if (lista.length === 0) {
    return {
      score: 50,
      classificacao: classificarLiquidez(50),
      totalAncoras: 0,
      totalPositivas: 0,
      totalAtencao: 0,
    };
  }

  let pontuacao = 50; // Ponto neutro de partida
  let totalPositivas = 0;
  let totalAtencao = 0;

  for (const ancora of lista) {
    const metros = converterDistanciaMetros(ancora.distancia);
    const peso = Number(ancora.pesoBase ?? (ancora.categoria === CATEGORIAS_RADAR.RUIDO_ATENCAO ? -20 : 15));

    if (peso >= 0 && ancora.categoria !== CATEGORIAS_RADAR.RUIDO_ATENCAO && ancora.impacto !== IMPACTOS_RADAR.PONTO_ATENCAO) {
      totalPositivas++;

      // Fator de proximidade (quanto mais perto a pé, maior o valor)
      let multDist = 1.0;
      if (metros <= 300) multDist = 1.25;
      else if (metros <= 600) multDist = 1.0;
      else if (metros <= 1200) multDist = 0.75;
      else multDist = 0.5;

      // Fator de impacto
      const multImp = ancora.impacto === IMPACTOS_RADAR.ALTA_VALORIZACAO ? 1.2 : 1.0;

      pontuacao += peso * multDist * multImp;
    } else {
      totalAtencao++;

      // Quanto mais perto do fator de ruído, maior a penalidade
      let multPenalidade = 1.0;
      if (metros <= 200) multPenalidade = 1.35;
      else if (metros <= 500) multPenalidade = 1.0;
      else multPenalidade = 0.65;

      pontuacao -= Math.abs(peso) * multPenalidade;
    }
  }

  const scoreFinal = Math.max(0, Math.min(100, Math.round(pontuacao)));
  const classificacao = classificarLiquidez(scoreFinal);

  return {
    score: scoreFinal,
    classificacao,
    totalAncoras: lista.length,
    totalPositivas,
    totalAtencao,
  };
}

/**
 * Gera o Parecer Técnico Automático sobre o Fator Localização (ABNT NBR 14653).
 */
export function gerarParecerFatorLocalizacao({
  bairro = '',
  cidade = '',
  ancoras = [],
  indice = null,
} = {}) {
  const local = [bairro, cidade].filter(Boolean).join(', ') || 'na região analisada';
  const resultadoIndice = indice || calcularIndiceLiquidez(ancoras);
  const lista = Array.isArray(ancoras) ? ancoras : [];

  const positivas = lista.filter(
    (a) => a.categoria !== CATEGORIAS_RADAR.RUIDO_ATENCAO && a.impacto !== IMPACTOS_RADAR.PONTO_ATENCAO
  );
  const atencoes = lista.filter(
    (a) => a.categoria === CATEGORIAS_RADAR.RUIDO_ATENCAO || a.impacto === IMPACTOS_RADAR.PONTO_ATENCAO
  );

  const partes = [];
  partes.push(
    `No tocante ao Fator de Localização e Infraestrutura Urbana (conforme diretrizes da ABNT NBR 14653), o imóvel avaliado em ${local} apresenta Índice de Liquidez e Atratividade Mercadológica avaliado em ${resultadoIndice.score}/100 (${resultadoIndice.classificacao.rotulo}).`
  );

  if (positivas.length > 0) {
    const textoAmenidades = positivas
      .slice(0, 4)
      .map((a) => `${a.nome} (a aprox. ${a.distancia || 'poucos metros'}, vetor de ${a.impacto || 'Conveniência'})`)
      .join('; ');
    partes.push(`O entorno imediato dispõe de consolidação urbana com âncoras estratégicas: ${textoAmenidades}.`);
  } else {
    partes.push('O entorno caracteriza-se por ocupação residencial/rural com acesso básico a serviços.');
  }

  if (atencoes.length > 0) {
    const textoAtencoes = atencoes.map((a) => `${a.nome} (${a.distancia})`).join(', ');
    partes.push(
      `Identifica-se como condicionante de atenção a proximidade de ${textoAtencoes}, fator devidamente ponderado na velocidade estimada de absorção de mercado.`
    );
  }

  partes.push(
    `Conclui-se que a vocação locacional do ponto ${resultadoIndice.score >= 60 ? 'potencializa a liquidez e sustenta a precificação proposta' : 'exige política de precificação alinhada à demanda específica do nicho'}.`
  );

  return partes.join(' ');
}

/**
 * Gera texto argumentativo de alta persuasão para o corretor enviar no WhatsApp.
 */
export function gerarArgumentoWhatsAppLocalizacao({
  bairro = '',
  cidade = '',
  ancoras = [],
  indice = null,
  valorPedido = '',
} = {}) {
  const local = [bairro, cidade].filter(Boolean).join(' - ') || 'localização privilegiada';
  const resIndice = indice || calcularIndiceLiquidez(ancoras);
  const lista = Array.isArray(ancoras) ? ancoras : [];

  const linhas = [
    `📍 *RAIO-X DE LOCALIZAÇÃO & VALORIZAÇÃO — ${local.toUpperCase()}*`,
    ``,
    `🏆 *Índice de Liquidez:* ${resIndice.score}/100 — *${resIndice.classificacao.rotulo}*`,
    `💡 ${resIndice.classificacao.descricao}`,
    ``,
    `✨ *Amenidades e Conveniências a poucos passos:*`,
  ];

  if (lista.length > 0) {
    lista.forEach((a) => {
      const isAlerta = a.categoria === CATEGORIAS_RADAR.RUIDO_ATENCAO || a.impacto === IMPACTOS_RADAR.PONTO_ATENCAO;
      const bullet = isAlerta ? '⚠️' : '✅';
      linhas.push(`${bullet} *${a.nome}*: aprox. ${a.distancia} (${a.impacto})`);
    });
  } else {
    linhas.push(`• Bairro residencial com infraestrutura urbana e acesso facilitado.`);
  }

  if (valorPedido) {
    linhas.push(
      ``,
      `💰 *Preço Pedido:* ${valorPedido.toLocaleString ? valorPedido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : valorPedido}`
    );
  }

  linhas.push(
    ``,
    `🎯 *Defesa de Preço:* Imóvel posicionado em ponto de alta procura e conveniência diária, blindando o patrimônio contra desvalorização e facilitando revenda futura ou renda com locação.`
  );

  return linhas.join('\n');
}
