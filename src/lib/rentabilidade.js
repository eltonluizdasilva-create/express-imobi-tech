/**
 * rentabilidade.js — rentabilidade de imóvel para investidor (determinístico).
 *
 * Fonte única da regra que o laudo executivo já usa no AGENTE 2
 * (`src/hooks/useLaudoImobi.js`): cap rate anual = aluguel × 12 / valor,
 * **líquido de 8% de vacância e administração**, e ROI de 5 anos =
 * valorização + renda acumulada. Antes desta extração a Calculadora de ROI do
 * portal público repetia a conta com outra premissa (D-23.37).
 *
 * Zero chamada de IA: só aritmética sobre o que a imobiliária informa.
 */

/** Vacância + administração descontadas do aluguel bruto (regra do AGENTE 2). */
export const TAXA_VACANCIA_ADMINISTRACAO = 0.08;

export const ANOS_PROJECAO_PADRAO = 5;

const num = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const duasCasas = (n) => Math.round(n * 100) / 100;

/**
 * @param {object} entrada
 * @param {number} entrada.valorCompra valor de aquisição do imóvel
 * @param {number} entrada.aluguelMensal aluguel bruto mensal
 * @param {number} [entrada.despesasMensais] custos mensais além da vacância (IPTU, condomínio, manutenção)
 * @param {number} [entrada.valorizacaoAnualPct] valorização anual esperada (% a.a.)
 * @param {number} [entrada.anos] horizonte da projeção patrimonial
 * @param {number} [entrada.taxaVacanciaAdministracao] padrão 8%
 */
export function calcularRentabilidadeImovel({
  valorCompra = 0,
  aluguelMensal = 0,
  despesasMensais = 0,
  valorizacaoAnualPct = 6,
  anos = ANOS_PROJECAO_PADRAO,
  taxaVacanciaAdministracao = TAXA_VACANCIA_ADMINISTRACAO,
} = {}) {
  const compra = num(valorCompra);
  const aluguel = num(aluguelMensal);
  const despesas = num(despesasMensais);
  const valorizacao = Math.max(0, Number(valorizacaoAnualPct) || 0);
  const horizonte = Math.max(1, Math.floor(Number(anos) || ANOS_PROJECAO_PADRAO));
  const taxaVacancia = Math.min(1, Math.max(0, Number(taxaVacanciaAdministracao) || 0));

  const custoVacanciaAdministracao = duasCasas(aluguel * taxaVacancia);
  const receitaLiquidaMensal = Math.max(0, duasCasas(aluguel - custoVacanciaAdministracao - despesas));
  const receitaLiquidaAnual = duasCasas(receitaLiquidaMensal * 12);

  const yieldMensal = compra > 0 ? (receitaLiquidaMensal / compra) * 100 : 0;
  const yieldAnual = compra > 0 ? (receitaLiquidaAnual / compra) * 100 : 0;
  const retornoTotalAnual = yieldAnual + valorizacao;
  const paybackAnos = receitaLiquidaAnual > 0 ? compra / receitaLiquidaAnual : 0;

  const valorFuturo = compra * Math.pow(1 + valorizacao / 100, horizonte);
  const rendaAcumulada = receitaLiquidaAnual * horizonte;
  const patrimonioFinal = duasCasas(valorFuturo + rendaAcumulada);
  const lucroPatrimonial = duasCasas(valorFuturo - compra);
  const roiTotalPct = compra > 0 ? ((patrimonioFinal - compra) / compra) * 100 : 0;

  return {
    valorCompra: compra,
    aluguelMensal: aluguel,
    despesasMensais: despesas,
    taxaVacanciaAdministracao: taxaVacancia,
    custoVacanciaAdministracao,
    receitaLiquidaMensal,
    receitaLiquidaAnual,
    yieldMensal: duasCasas(yieldMensal),
    yieldAnual: duasCasas(yieldAnual),
    capRateAnual: duasCasas(yieldAnual),
    valorizacaoAnualPct: valorizacao,
    retornoTotalAnual: duasCasas(retornoTotalAnual),
    paybackAnos: duasCasas(paybackAnos),
    anos: horizonte,
    valorFuturo: duasCasas(valorFuturo),
    rendaAcumulada: duasCasas(rendaAcumulada),
    patrimonioFinal,
    /** Compatibilidade com a tela antiga do portal, que chamava o total de "5 anos". */
    patrimonio5Anos: patrimonioFinal,
    lucroPatrimonial,
    roiTotalPct: duasCasas(roiTotalPct),
  };
}
