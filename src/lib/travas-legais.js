/**
 * travas-legais.js — travas jurídicas por nicho na captação.
 *
 * LOCAÇÃO — Lei nº 8.245/91, art. 37, parágrafo único:
 *   "É vedada, sob pena de nulidade, mais de uma das modalidades de garantia
 *    num mesmo contrato de locação." O sistema aceita UMA.
 *
 * RURAL — documentação de cartório obrigatória:
 *   CCIR, ITR/NIRF, CAR ativo e certificação de georreferenciamento no SIGEF.
 *
 * MCMV — faixas de renda familiar e elegibilidade ao subsídio.
 */

/* ───────────────────── LOCAÇÃO: garantias ───────────────────── */

import { tetoMcMvPorPorte, PORTE_PADRAO } from './regrasEstaduais.js';

export const GARANTIAS_LOCATICIA = [
  {
    key: 'caucao',
    label: 'Caução',
    detalhe: 'Depósito em dinheiro ou bem, limitado a 3 aluguéis (art. 38)',
  },
  {
    key: 'fiador',
    label: 'Fiador',
    detalhe: 'Garantia pessoal com bens livres e desimpedidos (art. 39-40)',
  },
  {
    key: 'seguro_fianca',
    label: 'Seguro-Fiança',
    detalhe: 'Apólice de seguro contratada pelo inquilino (art. 37, II)',
  },
  {
    key: 'cessao_fiduciaria',
    label: 'Cessão Fiduciária',
    detalhe: 'Transferência fiduciária de bem imóvel ao locador (art. 37, III)',
  },
  {
    key: 'capitalizacao',
    label: 'Título de Capitalização',
    detalhe: 'Garantia em título de capitalização (art. 37, IV)',
  },
];

export const AVISO_NULIDADE_GARANTIA =
  'Art. 37, parágrafo único, da Lei nº 8.245/91: é vedada, sob pena de NULIDADE, mais de uma modalidade de garantia no mesmo contrato. Escolha apenas uma.';

/**
 * Aplica a trava: recebe a seleção do corretor e devolve a seleção válida.
 * Tentar marcar uma segunda garantia NÃO entra — devolve erro explícito.
 */
export function selecionarGarantia(selecionada, nova) {
  if (!nova) return { selecionada: null, erro: null };
  if (selecionada && selecionada !== nova) {
    const atual = GARANTIAS_LOCATICIA.find((g) => g.key === selecionada);
    const tentada = GARANTIAS_LOCATICIA.find((g) => g.key === nova);
    return {
      selecionada,
      erro: `${AVISO_NULIDADE_GARANTIA} Você já marcou "${atual?.label}" e tentou somar "${tentada?.label}".`,
      bloqueado: nova,
    };
  }
  return { selecionada: nova, erro: null };
}

/** Validação no salvar: contrato de locação exige exatamente uma garantia. */
export function validarGarantiaLocacao(garantiaKey, detalhes = {}) {
  if (!garantiaKey) {
    return { ok: false, erro: 'Selecione UMA modalidade de garantia locatícia antes de salvar.' };
  }
  if (!GARANTIAS_LOCATICIA.some((g) => g.key === garantiaKey)) {
    return { ok: false, erro: 'Modalidade de garantia inválida.' };
  }
  if (garantiaKey === 'caucao') {
    const valor = Number(detalhes.caucaoValor) || 0;
    const aluguel = Number(detalhes.valorAluguel ?? detalhes.aluguel) || 0;
    if (aluguel > 0 && valor > aluguel * 3 + 0.01) {
      return { ok: false, erro: 'Caução não pode exceder 3 aluguéis (art. 38 da Lei nº 8.245/91).' };
    }
  }
  if (garantiaKey === 'fiador' && !String(detalhes.fiadorNome || '').trim()) {
    return { ok: false, erro: 'Fiador exige nome e CPF do garantidor.' };
  }
  return { ok: true, erro: null };
}

/* ───────────────────── RURAL: checklist de cartório ───────────────────── */

export const CHECKLIST_RURAL = [
  {
    key: 'ccir',
    label: 'CCIR',
    detalhe: 'Certificado de Cadastro de Imóvel Rural, exercício vigente',
    obrigatorio: true,
  },
  {
    key: 'itr',
    label: 'ITR / NIRF',
    detalhe: 'Recibo de entrega do ITR com NIRF do imóvel',
    obrigatorio: true,
  },
  {
    key: 'car',
    label: 'CAR ativo',
    detalhe: 'Cadastro Ambiental Rural com status "ativo" no Sicar',
    obrigatorio: true,
  },
  {
    key: 'sigef',
    label: 'Georreferenciamento SIGEF',
    detalhe: 'Certificação do INCRA/SIGEF — obrigatória para qualquer área',
    obrigatorio: true,
  },
  {
    key: 'matricula',
    label: 'Matrícula atualizada',
    detalhe: 'Matrícula com georreferenciamento averbado',
    obrigatorio: false,
  },
  {
    key: 'cnd',
    label: 'Certidões negativas',
    detalhe: 'CND tributária e trabalhista do titular',
    obrigatorio: false,
  },
];

/** Bloqueia o cadastro rural enquanto faltar item obrigatório. */
export function validarChecklistRural(marcados = {}) {
  const faltando = CHECKLIST_RURAL.filter((item) => item.obrigatorio && !marcados?.[item.key]);
  if (faltando.length) {
    return {
      ok: false,
      faltando: faltando.map((f) => f.label),
      erro: `Documentação obrigatória pendente: ${faltando.map((f) => f.label).join(', ')}. Sem esses documentos o cartório não registra a transmissão.`,
    };
  }
  return { ok: true, faltando: [], erro: null };
}

/* ───────────────────── MCMV: faixas e elegibilidade ───────────────────── */

export const FAIXAS_MCMV = [
  {
    key: 'faixa1',
    label: 'Faixa 1',
    rendaAte: 2850,
    subsidioReferencia: 55000,
    jurosReferencia: 4.0,
    descricao: 'Renda mensal até R$ 2.850 — maior subsídio, menor juros',
  },
  {
    key: 'faixa2',
    label: 'Faixa 2',
    rendaAte: 4700,
    subsidioReferencia: 29000,
    jurosReferencia: 5.5,
    descricao: 'Renda mensal até R$ 4.700 — subsídio parcial',
  },
  {
    key: 'faixa3',
    label: 'Faixa 3',
    rendaAte: 8600,
    subsidioReferencia: 0,
    jurosReferencia: 7.5,
    descricao: 'Renda mensal até R$ 8.600 — sem subsídio, financiamento com FGTS',
  },
];

export function faixaMcMv(rendaFamiliar) {
  const renda = Number(rendaFamiliar) || 0;
  return FAIXAS_MCMV.find((f) => renda <= f.rendaAte) || null;
}

/**
 * Elegibilidade ao MCMV com as travas usuais:
 * renda dentro do limite, imóvel urbano residencial, sem outro imóvel
 * residencial no nome e (na Faixa 3) uso de FGTS.
 */
export function elegibilidadeMcMv({
  rendaFamiliar = 0,
  possuiOutroImovel = false,
  usaFgts = false,
  valorImovel = 0,
  urbano = true,
  porte = PORTE_PADRAO,
} = {}) {
  const renda = Number(rendaFamiliar) || 0;
  const faixa = faixaMcMv(renda);
  const impedimentos = [];

  if (!faixa) impedimentos.push('Renda familiar acima do teto do programa (R$ 8.600/mês).');
  if (!urbano) impedimentos.push('MCMV atende imóvel urbano residencial; rural não é elegível por esta via.');
  if (possuiOutroImovel) impedimentos.push('Já possui imóvel residencial — regra geral de vedação ao segundo imóvel.');
  if (faixa?.key === 'faixa3' && !usaFgts) impedimentos.push('Faixa 3 exige uso de FGTS no financiamento.');

  const { teto: tetoValor, porte: porteUsado } = tetoMcMvPorPorte(porte);
  if (Number(valorImovel) > tetoValor) {
    impedimentos.push(
      `Valor do imóvel acima do teto de R$ ${tetoValor.toLocaleString('pt-BR')} para o porte ${porteUsado}.`,
    );
  }

  return {
    faixa,
    elegivel: impedimentos.length === 0,
    impedimentos,
    subsidioReferencia: faixa?.subsidioReferencia || 0,
    jurosReferencia: faixa?.jurosReferencia || null,
    tetoImovel: tetoValor,
    porte: porteUsado,
    parcelaAproximada: faixa && Number(valorImovel) > 0
      ? parcelaPrice(Number(valorImovel) - (faixa.subsidioReferencia || 0), faixa.jurosReferencia, 360)
      : null,
  };
}

/** Parcela pela Tabela Price (juros anual → mensal). */
export function parcelaPrice(valorFinanciado, jurosAnualPct, meses = 360) {
  const principal = Math.max(0, Number(valorFinanciado) || 0);
  const i = (Number(jurosAnualPct) || 0) / 100 / 12;
  const n = Math.max(1, Number(meses) || 360);
  if (!principal) return 0;
  const parcela = i === 0 ? principal / n : (principal * i) / (1 - Math.pow(1 + i, -n));
  return Math.round(parcela * 100) / 100;
}

/* ───────────────────── metadados dos nichos ───────────────────── */

export const NICHOS_CAPTACAO = [
  { key: 'rural', label: 'Rural', icone: '🌾', base: 'Lei 8.245/91 + CCIR/ITR/CAR/SIGEF' },
  { key: 'loteamento', label: 'Loteamento', icone: '🏗️', base: 'Quadra, lote e infraestrutura' },
  { key: 'mcmv', label: 'Minha Casa, Minha Vida', icone: '🏡', base: 'Faixas de renda e subsídio' },
  { key: 'alto_padrao', label: 'Alto Padrão', icone: '💎', base: 'Lazer, condomínio e segurança' },
  { key: 'locacao', label: 'Locação', icone: '🔑', base: 'Lei 8.245/91, art. 37' },
];
