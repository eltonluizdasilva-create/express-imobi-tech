/**
 * regrasEstaduais.js — motor nacional de ITCMD/ITCD/ITD e inventário.
 *
 * Fontes de desenho:
 *  - EC 132/2023 + LC 214/2025: ITCMD progressivo, faixas entre 2% e 8%.
 *  - CPC, art. 611: prazo de 60 dias para abertura do inventário.
 *  - Resolução CNJ nº 571/2024: inventário extrajudicial com herdeiros menores.
 *
 * IMPORTANTE: valores de alíquota, desconto e multa são PARÂMETROS de cálculo,
 * não parecer jurídico. Cada UF carrega `confianca` para você saber o que já
 * está fechado com a SEFAZ e o que ainda precisa de validação do contador.
 */

const PRAZO_CPC_611 = 60;

/** Faixas progressivas de 2% a 8% em 4 degraus (padrão da EC 132). */
function faixasProgressivas(minima, maxima) {
  const passo = (maxima - minima) / 3;
  return [
    { ate: 100000, aliquota: round1(minima) },
    { ate: 300000, aliquota: round1(minima + passo) },
    { ate: 800000, aliquota: round1(minima + passo * 2) },
    { ate: Infinity, aliquota: round1(maxima) },
  ];
}

function round1(n) {
  return Math.round(Number(n) * 10) / 10;
}

const base = (uf, nome, imposto, minima, maxima, extra = {}) => ({
  uf,
  nome,
  imposto,
  aliquotaUnica: false,
  aliquotaMin: minima,
  aliquotaMax: maxima,
  faixas: faixasProgressivas(minima, maxima),
  prazoInventarioDias: PRAZO_CPC_611,
  desconto: null,
  multa: null,
  confianca: 'referencia',
  ...extra,
});

/** 26 estados + DF. */
export const REGRAS_ESTADUAIS_UF = {
  AC: base('AC', 'Acre', 'ITCMD', 2, 8),
  AL: base('AL', 'Alagoas', 'ITCMD', 2, 8),
  AP: base('AP', 'Amapá', 'ITCMD', 2, 8),
  AM: base('AM', 'Amazonas', 'ITCMD', 2, 8),
  BA: base('BA', 'Bahia', 'ITD', 3.5, 8),
  CE: base('CE', 'Ceará', 'ITCD', 2, 8),
  DF: base('DF', 'Distrito Federal', 'ITCD', 4, 8),
  ES: base('ES', 'Espírito Santo', 'ITCMD', 4, 8),
  GO: base('GO', 'Goiás', 'ITCD', 2, 8),
  MA: base('MA', 'Maranhão', 'ITCD', 2, 8),
  MT: base('MT', 'Mato Grosso', 'ITCD', 2, 8),
  MS: base('MS', 'Mato Grosso do Sul', 'ITCMD', 3, 6),
  MG: base('MG', 'Minas Gerais', 'ITCD', 5, 5, {
    aliquotaUnica: true,
    confianca: 'validado',
    desconto: { pct: 15, diasPrazo: 90, descricao: '15% de desconto no ITCD pago em até 90 dias' },
    fonte: 'Lei estadual MG + regra informada pela operação',
  }),
  PA: base('PA', 'Pará', 'ITCMD', 2, 8),
  PB: base('PB', 'Paraíba', 'ITCD', 2, 8),
  PR: base('PR', 'Paraná', 'ITCMD', 4, 8),
  PE: base('PE', 'Pernambuco', 'ITCMD', 2, 8),
  PI: base('PI', 'Piauí', 'ITCMD', 2, 8),
  RJ: base('RJ', 'Rio de Janeiro', 'ITD', 4.5, 8),
  RN: base('RN', 'Rio Grande do Norte', 'ITCMD', 3, 8),
  RS: base('RS', 'Rio Grande do Sul', 'ITCD', 3, 6),
  RO: base('RO', 'Rondônia', 'ITCMD', 2, 8),
  RR: base('RR', 'Roraima', 'ITCMD', 2, 8),
  SC: base('SC', 'Santa Catarina', 'ITCMD', 1, 8),
  SP: base('SP', 'São Paulo', 'ITCMD', 4, 4, {
    aliquotaUnica: true,
    confianca: 'validado',
    multa: { pct: 10, descricao: 'Multa de 10% sobre o imposto se o inventário não for aberto em 60 dias' },
    fonte: 'Lei estadual SP (ITCMD 4%) + CPC art. 611',
  }),
  SE: base('SE', 'Sergipe', 'ITCMD', 2, 8),
  TO: base('TO', 'Tocantins', 'ITCMD', 2, 8),
};

export const UFS = Object.keys(REGRAS_ESTADUAIS_UF);
export const UF_PADRAO = 'MG';

/* ───────────────── Porte do município × teto MCMV ───────────────── */

export const PORTES_MUNICIPIO = [
  {
    key: 'metropole',
    label: 'Metrópole / Capital',
    tetoMcMv: 350000,
    descricao: 'Regiões metropolitanas e capitais',
  },
  {
    key: 'media',
    label: 'Cidade Média',
    tetoMcMv: 300000,
    descricao: 'Municípios de porte médio, acima de 100 mil habitantes',
  },
  {
    key: 'pequena',
    label: 'Cidade Pequena',
    tetoMcMv: 264000,
    descricao: 'Municípios pequenos e zona rural',
  },
];

export const PORTE_PADRAO = 'media';

export function porteValido(key) {
  return PORTES_MUNICIPIO.some((p) => p.key === key);
}

export function portePorKey(key) {
  return PORTES_MUNICIPIO.find((p) => p.key === key) || PORTES_MUNICIPIO.find((p) => p.key === PORTE_PADRAO);
}

/** Teto do imóvel no MCMV conforme o porte do município selecionado. */
export function tetoMcMvPorPorte(porte) {
  const teto = portePorKey(porte).tetoMcMv;
  return {
    porte: portePorKey(porte).key,
    teto,
    tetoFormatado: `R$ ${teto.toLocaleString('pt-BR')}`,
  };
}

/* ───────────────────── Imposto de herança ───────────────────── */

export function regraUF(uf) {
  const chave = String(uf || UF_PADRAO).toUpperCase();
  return REGRAS_ESTADUAIS_UF[chave] || REGRAS_ESTADUAIS_UF[UF_PADRAO];
}

export function siglaImposto(uf) {
  return regraUF(uf).imposto;
}

export function prazoInventario(uf) {
  const r = regraUF(uf);
  return {
    uf: r.uf,
    dias: r.prazoInventarioDias,
    desconto: r.desconto,
    multa: r.multa,
    resumo: `${r.prazoInventarioDias} dias (CPC, art. 611)` +
      (r.desconto ? ` · ${r.desconto.descricao}` : '') +
      (r.multa ? ` · ${r.multa.descricao}` : ''),
  };
}

/** Alíquota e imposto de herança/doação para um valor de base. */
export function aliquotaHeranca(uf, valorBase = 0) {
  const r = regraUF(uf);
  const valor = Math.max(0, Number(valorBase) || 0);
  const faixa = r.faixas.find((f) => valor <= f.ate) || r.faixas[r.faixas.length - 1];
  const imposto = valor * (faixa.aliquota / 100);
  const isencaoPadrao = 0;
  return {
    uf: r.uf,
    impostoSigla: r.imposto,
    valorBase: valor,
    aliquota: faixa.aliquota,
    imposto: Math.round(imposto * 100) / 100,
    aliquotaUnica: r.aliquotaUnica,
    faixas: r.faixas,
    isentoSob: isencaoPadrao,
    confianca: r.confianca,
    aviso:
      'Alíquotas são parâmetros de cálculo. Confirme a tabela vigente e as isenções na SEFAZ do estado antes de emitir guia.',
  };
}

/** Compara herança com e sem a reforma (informativo para o cliente). */
export function comparativoHeranca(uf, valorBase = 0, doacao = false) {
  const info = aliquotaHeranca(uf, valorBase);
  const imposto = info.imposto;
  return {
    ...info,
    doacao,
    impostoFormatado: imposto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    observacao: doacao
      ? 'Na doação, confira a isenção de bens de pequeno valor e o limite estadual de não incidência.'
      : 'No inventário, o tributo é calculado sobre a base da herança transmitida (averbação dos bens).',
  };
}
