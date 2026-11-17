/**
 * parametrosPadrao.js — defaults PUROS (sem Firestore), testáveis em Node.
 * Ver parametros.js para o carregamento de parametrosCredito/{versao}.
 */

export const VERSAO_PADRAO = 'provisorio-2026-11';

export const CAMPOS_CONFERIR = [
  'mcmv.faixa2Renda',
  'mcmv.faixa3Renda',
  'mcmv.subsidioMax',
  'mcmv.subsidioMaxNorte',
  'mcmv.jurosFaixa1a3',
  'sbpe.cotaSAC',
  'seguros.mipPct',
  'seguros.dfiPct',
  'seguros.tarifaMensal',
  'sbpe.cotaPrice',
  'estimativaSubsidio',
];

export const PARAMETROS_PADRAO = {
  versao: VERSAO_PADRAO,
  vigenciaInicio: '2026-11-01',
  vigenciaFim: null,
  validado: false,           // vira true quando você conferir e gravar
  fonte: 'defaults do código',

  mcmv: {
    faixa1Renda: 3200,       // informado
    faixa2Renda: 5000,       // PROVISÓRIO (CONFERIR)
    faixa3Renda: 9600,       // PROVISÓRIO (CONFERIR)
    faixa3Imovel: 400000,    // informado
    faixa4Renda: 13000,      // informado
    faixa4Imovel: 600000,    // informado
    subsidioMax: 55000,      // informado (CONFERIR vigência)
    subsidioMaxNorte: 65000, // informado
    jurosFaixa1a3: 6.5,      // NÃO INFORMADO — valor de trabalho (CONFERIR)
    jurosFaixa4Min: 10.0,    // informado (~10–10,5%)
    jurosFaixa4Max: 10.5,
    cotaMaxima: 0.80,
  },

  sbpe: {
    cotaSAC: 0.80,           // informado
    cotaPrice: 0.70,         // informado
    tetoSFH: 2250000,        // informado
    comprometimentoMax: 0.30,// informado
    taxaPadrao: 10.5,        // CONFERIR
  },

  // Seguros e tarifa cobrados junto da parcela (CONFERIR — variam por banco,
  // idade do proponente e valor financiado; aqui são taxas de trabalho).
  seguros: {
    mipPct: 0.05,        // % ao mês sobre o saldo devedor inicial
    dfiPct: 0.015,       // % ao mês sobre o valor do imóvel
    tarifaMensal: 25,    // R$ por mês (administração/TAC diluída)
  },

  // Estimativa interna de subsídio (a Caixa define o valor real).
  // pct = percentual do valor financiável usado como estimativa, limitado ao teto.
  estimativaSubsidio: { faixa1: 0.20, faixa2: 0.12, faixa3: 0.05 },

  comissoes: [
    { banco: 'Caixa', modalidade: 'SBPE', percentual: 1.0 },
    { banco: 'Caixa', modalidade: 'MCMV', percentual: 1.0 },
    { banco: 'Itaú', modalidade: 'SBPE', percentual: 1.2 },
    { banco: 'Bradesco', modalidade: 'SBPE', percentual: 1.1 },
    { banco: 'Santander', modalidade: 'SBPE', percentual: 1.2 },
  ],
};

function fundir(base, extra) {
  if (!extra || typeof extra !== 'object') return base;
  const saida = { ...base };
  for (const [k, v] of Object.entries(extra)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object') {
      saida[k] = fundir(base[k], v);
    } else if (v !== undefined && v !== null) {
      saida[k] = v;
    }
  }
  return saida;
}


/** Funde o documento publicado sobre os defaults (deep merge raso por grupo). */
export function fundirParametros(base, extra) {
  return fundir(base, extra);
}

/** Texto para o selo de aviso na UI. */
export function avisoDeParametros(params) {
  if (!params) return 'Parâmetros não carregados.';
  if (params.validado === true) return null;
  return 'Parâmetros não validados — valores provisórios (CONFERIR) antes de usar em proposta real.';
}
