/** Motores financeiros reaproveitados pelo portal (D-23.37). */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parcelaPrice, parcelaSac, prazoMaximoPorIdade } from '../src/lib/travas-legais.js';
import {
  ANOS_PROJECAO_PADRAO,
  TAXA_VACANCIA_ADMINISTRACAO,
  calcularRentabilidadeImovel,
} from '../src/lib/rentabilidade.js';

test('parcelaSac: amortização constante, prestação decrescente', () => {
  const r = parcelaSac(360000, 10, 360);
  assert.equal(r.amortizacao, 1000);
  assert.equal(r.primeira, 4000); // 1000 + 360000 * (10%/12)
  assert.equal(r.ultima, 1008.33);
  assert.ok(r.primeira > r.ultima);
});

test('parcelaSac sem valor financiado devolve zeros', () => {
  assert.deepEqual(parcelaSac(0, 10, 360), { primeira: 0, ultima: 0, amortizacao: 0 });
});

test('parcelaPrice: tabela francesa com prestação fixa', () => {
  const parcela = parcelaPrice(360000, 10, 360);
  // referência ~R$ 3.159,60/mês
  assert.ok(parcela > 3100 && parcela < 3200, `parcela fora da faixa: ${parcela}`);
  assert.equal(parcelaPrice(0, 10, 360), 0);
});

test('parcelaPrice com juros zero divide o principal pelo prazo', () => {
  assert.equal(parcelaPrice(120000, 0, 120), 1000);
});

test('prazoMaximoPorIdade respeita idade + prazo <= 80,5 anos e o teto de 35', () => {
  assert.equal(prazoMaximoPorIdade(30), 35);
  assert.equal(prazoMaximoPorIdade(70), 10);
  assert.equal(prazoMaximoPorIdade(18), 35);
  assert.equal(prazoMaximoPorIdade(80), 1);
});

test('rentabilidade: 8% de vacância/administração é a regra do sistema', () => {
  assert.equal(TAXA_VACANCIA_ADMINISTRACAO, 0.08);
  assert.equal(ANOS_PROJECAO_PADRAO, 5);

  const r = calcularRentabilidadeImovel({
    valorCompra: 450000,
    aluguelMensal: 3200,
    despesasMensais: 350,
    valorizacaoAnualPct: 6,
  });

  assert.equal(r.custoVacanciaAdministracao, 256);
  assert.equal(r.receitaLiquidaMensal, 2594);
  assert.equal(r.receitaLiquidaAnual, 31128);
  assert.equal(r.yieldMensal, 0.58);
  assert.equal(r.yieldAnual, 6.92);
  assert.equal(r.capRateAnual, r.yieldAnual);
  assert.equal(r.retornoTotalAnual, 12.92);
  assert.equal(r.paybackAnos, 14.46);
  assert.equal(r.patrimonioFinal, 757841.51);
  assert.equal(r.patrimonio5Anos, r.patrimonioFinal);
  assert.equal(r.roiTotalPct, 68.41);
  assert.equal(r.anos, 5);
});

test('rentabilidade não gera NaN nem divisão por zero', () => {
  const vazio = calcularRentabilidadeImovel({});
  assert.equal(vazio.yieldAnual, 0);
  assert.equal(vazio.yieldMensal, 0);
  assert.equal(vazio.paybackAnos, 0);
  assert.equal(vazio.patrimonioFinal, 0);
  assert.ok(Number.isFinite(vazio.roiTotalPct));
});

test('rentabilidade aceita horizonte e vacância alternativos', () => {
  const r = calcularRentabilidadeImovel({
    valorCompra: 100000,
    aluguelMensal: 1000,
    despesasMensais: 0,
    valorizacaoAnualPct: 0,
    anos: 10,
    taxaVacanciaAdministracao: 0,
  });
  assert.equal(r.receitaLiquidaAnual, 12000);
  assert.equal(r.paybackAnos, 8.33);
  assert.equal(r.patrimonioFinal, 220000);
  assert.equal(r.anos, 10);
});
