/**
 * fiscal.js — motor fiscal do Express Imobi Tech.
 *
 * Reforma Tributária (LC 214/2025): IBS + CBS.
 * Locação residencial por pessoa física tem regime específico:
 *   - alíquota reduzida em 70% (paga 30% da alíquota cheia)
 *   - redutor social de R$ 600 por imóvel residencial
 *   - enquadramento obrigatório quando o locador PF passa dos limites
 *
 * CIB — Cadastro Imobiliário Brasileiro ("CPF do imóvel"), 20 dígitos:
 *   7 dígitos do IBGE do município + 13 dígitos sequenciais.
 *
 * Nada aqui transmite nada: os arquivos gerados são de apoio
 * (DIMOB / DIRPF / e-Financeira), para conferência do contador.
 */

export const ALIQUOTA_CHEIA = 26.5; // IBS 17,7% + CBS 8,8%
export const IBS = 17.7;
export const CBS = 8.8;

/** Locador PF: 30% da alíquota cheia (redução de 70%). */
export const FATOR_LOCADOR_PF = 0.3;
export const ALIQUOTA_LOCADOR_PF = Number((ALIQUOTA_CHEIA * FATOR_LOCADOR_PF).toFixed(3)); // 7,95%

/** Redutor social mensal por imóvel residencial (LC 214/2025). */
export const REDUTOR_SOCIAL_IMOVEL = 600;

/** Limites de enquadramento obrigatório do locador PF. */
export const LIMITES_LOCADOR_PF = {
  imoveis: 3,
  receitaComImoveis: 240000, // > 3 imóveis E receita > R$ 240.000
  receitaAbsoluta: 288000, // receita > R$ 288.000, qualquer quantidade
};

/* ───────────────────────────── CIB ───────────────────────────── */

export function normalizarCib(valor) {
  return String(valor || '').replace(/\D/g, '');
}

export function validarCib(valor) {
  const cib = normalizarCib(valor);
  if (!cib) return { ok: false, erro: 'CIB vazio.' };
  if (cib.length !== 20) {
    return { ok: false, erro: `CIB deve ter 20 dígitos (recebido: ${cib.length}).` };
  }
  const ibge = cib.slice(0, 7);
  if (ibge.startsWith('0')) {
    return { ok: false, erro: 'Os 7 primeiros dígitos são o código IBGE do município e não podem começar com zero.' };
  }
  return { ok: true, cib, ibge, sequencial: cib.slice(7), formatado: formatarCib(cib) };
}

export function formatarCib(valor) {
  const cib = normalizarCib(valor);
  if (cib.length !== 20) return cib;
  return `${cib.slice(0, 7)}.${cib.slice(7, 13)}.${cib.slice(13)}`;
}

/* ─────────────────────── IRPF progressivo ─────────────────────── */

/** Tabela mensal do IRPF (carnê-leão) — faixas e parcelas de dedução. */
const TABELA_IRPF = [
  { ate: 2259.2, aliquota: 0, deducao: 0 },
  { ate: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { ate: 3751.05, aliquota: 0.15, deducao: 381.44 },
  { ate: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { ate: Infinity, aliquota: 0.275, deducao: 896.0 },
];

export function irpfMensal(base) {
  const valor = Math.max(0, Number(base) || 0);
  const faixa = TABELA_IRPF.find((f) => valor <= f.ate) || TABELA_IRPF[TABELA_IRPF.length - 1];
  const imposto = Math.max(0, valor * faixa.aliquota - faixa.deducao);
  return { aliquota: faixa.aliquota, imposto, efetiva: valor > 0 ? imposto / valor : 0 };
}

/* ───────────── Termômetro fiscal do locador (PF) ───────────── */

/**
 * @param {object} p
 * @param {number} p.qtdImoveis  imóveis locados do proprietário
 * @param {number} p.receitaAnual receita anual de aluguéis do CPF
 */
export function termometroLocador({ qtdImoveis = 0, receitaAnual = 0 } = {}) {
  const imoveis = Number(qtdImoveis) || 0;
  const receita = Number(receitaAnual) || 0;
  const { imoveis: maxImoveis, receitaComImoveis, receitaAbsoluta } = LIMITES_LOCADOR_PF;

  const porQuantidadeEReceita = imoveis > maxImoveis && receita > receitaComImoveis;
  const porReceitaAbsoluta = receita > receitaAbsoluta;
  const enquadrado = porQuantidadeEReceita || porReceitaAbsoluta;

  const motivos = [];
  if (porQuantidadeEReceita) {
    motivos.push(`mais de ${maxImoveis} imóveis locados e receita anual acima de R$ ${receitaComImoveis.toLocaleString('pt-BR')}`);
  }
  if (porReceitaAbsoluta) {
    motivos.push(`receita anual acima de R$ ${receitaAbsoluta.toLocaleString('pt-BR')}`);
  }

  const nivel = enquadrado
    ? 'critico'
    : imoveis > maxImoveis || receita > receitaComImoveis * 0.8
      ? 'atencao'
      : 'ok';

  return {
    qtdImoveis: imoveis,
    receitaAnual: receita,
    enquadrado,
    nivel,
    motivos,
    alerta: enquadrado
      ? 'Locador pessoa física ENQUADRADO no IBS/CBS. A partir daqui a locação entra no regime regular com alíquota reduzida em 70% e redutor social de R$ 600 por imóvel residencial.'
      : nivel === 'atencao'
        ? 'Perto do limite de enquadramento. Revise quantidade de imóveis e receita projetada antes de fechar o ano.'
        : 'Dentro do limite: locador pessoa física fora do regime regular de IBS/CBS.',
  };
}

/* ───────── IBS/CBS do locador PF e comparativo com holding ───────── */

/**
 * IBS/CBS devido no mês pelo locador PF enquadrado.
 * Base = aluguel; alíquota = 30% da cheia; redutor = R$ 600 por imóvel residencial.
 */
export function ibsCbsLocadorPF({ aluguelMensal = 0, imoveisResidenciais = 1, enquadrado = true } = {}) {
  const base = Math.max(0, Number(aluguelMensal) || 0);
  const imoveis = Math.max(1, Number(imoveisResidenciais) || 1);
  if (!enquadrado) {
    return { base, aliquota: 0, bruto: 0, redutor: 0, devido: 0, enquadrado: false };
  }
  const bruto = base * (ALIQUOTA_LOCADOR_PF / 100);
  const redutor = Math.min(bruto, REDUTOR_SOCIAL_IMOVEL * imoveis);
  return {
    base,
    aliquota: ALIQUOTA_LOCADOR_PF,
    bruto: round2(bruto),
    redutor: round2(redutor),
    devido: round2(Math.max(0, bruto - redutor)),
    enquadrado: true,
  };
}

/**
 * Comparativo PF x Holding Patrimonial (estimativa de engenharia legal).
 *
 * PF: IRPF progressivo (até 27,5%) + IBS/CBS reduzido (7,95%).
 * Holding: Lucro Presumido com presunção de 32% sobre a receita de locação,
 *         IRPJ 15% + adicional 10% sobre o que exceder R$ 20.000/mês de lucro
 *         presumido + CSLL 9%. Distribuição de lucros ao sócio PF isenta.
 */
export function compararPfHolding({ receitaAnual = 0 } = {}) {
  const receita = Math.max(0, Number(receitaAnual) || 0);
  const mensal = receita / 12;

  const irpf = irpfMensal(mensal);
  const irpfAno = round2(irpf.imposto * 12);
  const ibsCbsAno = round2(receita * (ALIQUOTA_LOCADOR_PF / 100));
  const totalPF = round2(irpfAno + ibsCbsAno);

  const lucroPresumido = receita * 0.32;
  const irpj = lucroPresumido * 0.15;
  const adicional = Math.max(0, lucroPresumido - 240000) * 0.10;
  const csll = lucroPresumido * 0.09;
  const totalHolding = round2(irpj + adicional + csll);
  const ibsCbsHolding = round2(receita * (ALIQUOTA_CHEIA / 100)); // PJ sem o redutor do PF

  return {
    receitaAnual: receita,
    pf: {
      irpfAno,
      aliquotaIrpf: Number((irpf.aliquota * 100).toFixed(1)),
      ibsCbsAno,
      total: totalPF,
      cargaPct: receita ? Number(((totalPF / receita) * 100).toFixed(2)) : 0,
    },
    holding: {
      presuncao: 0.32,
      lucroPresumido: round2(lucroPresumido),
      irpj: round2(irpj),
      adicional: round2(adicional),
      csll: round2(csll),
      ibsCbs: ibsCbsHolding,
      total: round2(totalHolding + ibsCbsHolding),
      cargaPct: receita ? Number((((totalHolding + ibsCbsHolding) / receita) * 100).toFixed(2)) : 0,
    },
    vantagemHolding: round2(totalPF - (totalHolding + ibsCbsHolding)),
    observacao:
      'Estimativa para decisão. Holding exige contabilidade, pró-labore e custo de manutenção; ganho de capital e ITBI/ITCMD na integralização não estão incluídos.',
  };
}

/* ───────────── Composição do repasse mensal ───────────── */

export function comporRepasse({
  aluguel = 0,
  condominio = 0,
  iptu = 0,
  taxaAdminPct = 10,
  issPct = 0,
  irrfPct = 0,
  ibsCbsPct = 0,
} = {}) {
  const base = Math.max(0, Number(aluguel) || 0);
  const cond = Math.max(0, Number(condominio) || 0);
  const iptuV = Math.max(0, Number(iptu) || 0);

  const taxaAdmin = base * (Number(taxaAdminPct) / 100);
  const iss = taxaAdmin * (Number(issPct) / 100);
  const irrf = base * (Number(irrfPct) / 100);
  const ibsCbs = base * (Number(ibsCbsPct) / 100);

  const totalInquilino = base + cond + iptuV;
  const retencoes = taxaAdmin + iss + irrf + ibsCbs;
  const liquidoProprietario = Math.max(0, base - irrf - ibsCbs) + cond + iptuV;

  return {
    aluguel: base,
    condominio: cond,
    iptu: iptuV,
    taxaAdmin: round2(taxaAdmin),
    iss: round2(iss),
    irrf: round2(irrf),
    ibsCbs: round2(ibsCbs),
    totalInquilino: round2(totalInquilino),
    totalRetencoes: round2(retencoes),
    liquidoProprietario: round2(liquidoProprietario),
    liquidoImobiliaria: round2(taxaAdmin - iss),
  };
}

/* ───────────── Demonstrativo anual DIMOB / DIRPF / e-Financeira ───────────── */

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function anoDaNota(nota) {
  const bruto = nota?.dataEmissao || nota?.data || nota?.criadoEm || nota?.competencia;
  if (!bruto) return null;
  if (typeof bruto === 'string') {
    const iso = bruto.match(/(\d{4})-(\d{2})/);
    if (iso) return { ano: Number(iso[1]), mes: Number(iso[2]) };
    const br = bruto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (br) return { ano: Number(br[3]), mes: Number(br[2]) };
  }
  if (typeof bruto?.toDate === 'function') {
    const d = bruto.toDate();
    return { ano: d.getFullYear(), mes: d.getMonth() + 1 };
  }
  if (bruto instanceof Date) return { ano: bruto.getFullYear(), mes: bruto.getMonth() + 1 };
  return null;
}

/**
 * Consolida notas em demonstrativo anual por CPF do proprietário.
 * @param {Array} notas
 * @param {object} opts { ano, cpf }
 */
export function demonstrativoAnual(notas = [], { ano = new Date().getFullYear(), cpf = null } = {}) {
  const cpfAlvo = cpf ? String(cpf).replace(/\D/g, '') : null;
  const linhas = [];

  for (const nota of Array.isArray(notas) ? notas : []) {
    const ref = anoDaNota(nota);
    if (!ref || ref.ano !== Number(ano)) continue;
    const docProprietario = String(nota?.proprietarioDoc || nota?.proprietarioCpf || '').replace(/\D/g, '');
    if (cpfAlvo && docProprietario !== cpfAlvo) continue;

    const aluguel = num(nota?.valorBruto ?? nota?.aluguel ?? nota?.valor);
    const taxa = num(nota?.taxaAdministracao ?? nota?.taxa);
    linhas.push({
      mes: ref.mes,
      mesNome: MESES[ref.mes - 1],
      nota: nota?.numero || nota?.id || '—',
      cib: nota?.cib || '',
      imovel: nota?.imovelRef || nota?.imovel || '—',
      proprietario: nota?.proprietarioNome || '—',
      proprietarioDoc: docProprietario,
      inquilino: nota?.clienteNome || nota?.cliente || '—',
      aluguel: round2(aluguel),
      taxa: round2(taxa),
      iss: round2(num(nota?.iss)),
      irrf: round2(num(nota?.irrf)),
      ibsCbs: round2(num(nota?.ibsCbs ?? nota?.ibs_cbs)),
      repasse: round2(num(nota?.valorRepasse ?? nota?.repasse)),
    });
  }

  linhas.sort((a, b) => a.mes - b.mes);

  const porMes = MESES.map((nome, i) => {
    const doMes = linhas.filter((l) => l.mes === i + 1);
    return {
      mes: i + 1,
      mesNome: nome,
      qtd: doMes.length,
      aluguel: round2(sum(doMes, 'aluguel')),
      taxa: round2(sum(doMes, 'taxa')),
      iss: round2(sum(doMes, 'iss')),
      irrf: round2(sum(doMes, 'irrf')),
      ibsCbs: round2(sum(doMes, 'ibsCbs')),
      repasse: round2(sum(doMes, 'repasse')),
    };
  });

  const imoveis = [...new Set(linhas.map((l) => l.cib || l.imovel))].filter(Boolean);

  return {
    ano: Number(ano),
    cpf: cpfAlvo || 'todos',
    linhas,
    porMes,
    total: {
      qtd: linhas.length,
      imoveis: imoveis.length,
      aluguel: round2(sum(linhas, 'aluguel')),
      taxa: round2(sum(linhas, 'taxa')),
      iss: round2(sum(linhas, 'iss')),
      irrf: round2(sum(linhas, 'irrf')),
      ibsCbs: round2(sum(linhas, 'ibsCbs')),
      repasse: round2(sum(linhas, 'repasse')),
    },
    termometro: termometroLocador({ qtdImoveis: imoveis.length, receitaAnual: sum(linhas, 'aluguel') }),
  };
}

/** CSV (Excel pt-BR: separador ; e BOM). */
export function csvDemonstrativo(demo) {
  const cab = ['Mês', 'Nota', 'CIB', 'Imóvel', 'Proprietário', 'CPF/CNPJ', 'Inquilino', 'Aluguel', 'Taxa Adm', 'ISS', 'IRRF', 'IBS/CBS', 'Repasse'];
  const linhas = [cab.join(';')];
  for (const l of demo.linhas) {
    linhas.push([
      l.mesNome, l.nota, l.cib, l.imovel, l.proprietario, l.proprietarioDoc,
      l.inquilino, br(l.aluguel), br(l.taxa), br(l.iss), br(l.irrf), br(l.ibsCbs), br(l.repasse),
    ].join(';'));
  }
  linhas.push('');
  linhas.push(['TOTAIS', '', '', `${demo.total.imoveis} imóvel(is)`, '', '', `${demo.total.qtd} nota(s)`,
    br(demo.total.aluguel), br(demo.total.taxa), br(demo.total.iss), br(demo.total.irrf), br(demo.total.ibsCbs), br(demo.total.repasse)].join(';'));
  return '\uFEFF' + linhas.join('\r\n');
}

/** Baixa o demonstrativo como arquivo no navegador. */
export function baixarDemonstrativo(demo, rotulo = 'DIMOB-DIRPF') {
  if (typeof document === 'undefined') return null;
  const csv = csvDemonstrativo(demo);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `demonstrativo_${rotulo}_${demo.ano}_${demo.cpf}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return a.download;
}

/* ─────────────────────────── helpers ─────────────────────────── */

function num(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = parseFloat(String(v ?? '').replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function sum(arr, key) {
  return (arr || []).reduce((acc, item) => acc + (Number(item?.[key]) || 0), 0);
}

function br(n) {
  return (Number(n) || 0).toFixed(2).replace('.', ',');
}
