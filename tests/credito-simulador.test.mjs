/** Teste do simulador de crédito (funções puras — roda em Node sem browser). */
import { PARAMETROS_PADRAO, avisoDeParametros } from '../src/lib/credito/parametrosPadrao.js';
import {
  simular, enquadrar, parcelaSAC, parcelaPrice, prazoMaximoPorIdade,
  idadeEmAnos, resumoWhatsApp, taxaMensal,
  nominalParaEfetiva, efetivaParaNominal,
} from '../src/lib/credito/simulador.js';

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas += 1;
};
const P = PARAMETROS_PADRAO;
const brl = (v) => 'R$ ' + v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

/* ---------- matemática ---------- */
const sac = parcelaSAC(400000, 10.5, 360);
const price = parcelaPrice(400000, 10.5, 360);
ok('SAC parcela inicial > final', sac.primeira > sac.ultima, `${brl(sac.primeira)} → ${brl(sac.ultima)}`);
ok('SAC primeira parcela plausível (300-500k p/ 400k em 360m a 10,5%)',
   sac.primeira > 3000 && sac.primeira < 5000, brl(sac.primeira));
ok('SAC total > principal', sac.total > 400000, brl(sac.total));
ok('Price parcela fixa', Math.abs(price.primeira - price.ultima) < 0.01, brl(price.primeira));
// SAC amortiza mais rápido no início: a PRIMEIRA parcela do SAC é maior que a
// parcela fixa do Price; em compensação o SAC custa menos no total.
ok('Price parcela fixa < primeira parcela do SAC', price.primeira < sac.primeira,
   `${brl(price.primeira)} < ${brl(sac.primeira)}`);
ok('Price custa mais no total que SAC', price.total > sac.total,
   `${brl(price.total)} > ${brl(sac.total)}`);
ok('taxa mensal de 12% a.a. ≈ 0,9489%', Math.abs(taxaMensal(12) * 100 - 0.9489) < 0.001, (taxaMensal(12) * 100).toFixed(4));
ok('taxa 0 não explode', parcelaPrice(100000, 0, 100).primeira === 1000);

/* ---------- nominal vs efetiva ---------- */
ok('nominal 12% a.a. → 1% ao mês', Math.abs(taxaMensal(12, 'nominal') * 100 - 1) < 1e-9, (taxaMensal(12, 'nominal') * 100).toFixed(4));
ok('nominal 12% → efetiva 12,6825%', Math.abs(nominalParaEfetiva(12) - 12.6825) < 0.001, nominalParaEfetiva(12).toFixed(4) + '%');
ok('efetiva 12,6825% → nominal 12%', Math.abs(efetivaParaNominal(12.6825) - 12) < 0.01, efetivaParaNominal(12.6825).toFixed(4) + '%');
const parcNominal = parcelaSAC(400000, 10.5, 360, 'nominal');
const parcEfetiva = parcelaSAC(400000, 10.5, 360, 'efetiva');
// Com a MESMA taxa anual de 10,5%: nominal = 0,875%/mês, efetiva = 0,8354%/mês.
// Ou seja, "10,5% nominal" custa MAIS que "10,5% efetiva" — é por isso que o
// rótulo do tipo de taxa precisa aparecer na tela.
ok('nominal rende parcela MAIOR que efetiva (mesma taxa anual)',
   parcNominal.primeira > parcEfetiva.primeira,
   `${brl(parcNominal.primeira)} > ${brl(parcEfetiva.primeira)}`);

/* ---------- enquadramento ---------- */
const e1 = enquadrar({ rendaTotal: 3000, valorImovel: 250000, uf: 'MG' }, P);
ok('renda 3.000 → MCMV Faixa 1', e1.faixa === 'Faixa 1', e1.motivos[0]);

const e2 = enquadrar({ rendaTotal: 4800, valorImovel: 300000, uf: 'MG' }, P);
ok('renda 4.800 → Faixa 2 (provisória)', e2.faixa === 'Faixa 2' && e2.alertas.some((a) => a.includes('PROVISÓRIO')));

const e3 = enquadrar({ rendaTotal: 8500, valorImovel: 380000, uf: 'MG' }, P);
ok('renda 8.500 + imóvel 380k → Faixa 3', e3.faixa === 'Faixa 3');

const e3b = enquadrar({ rendaTotal: 8500, valorImovel: 450000, uf: 'MG' }, P);
ok('renda 8.500 + imóvel 450k → não é Faixa 3', e3b.faixa !== 'Faixa 3', e3b.faixa || e3b.linha);

const e4 = enquadrar({ rendaTotal: 12000, valorImovel: 550000, uf: 'MG' }, P);
ok('renda 12k + imóvel 550k → Faixa 4', e4.faixa === 'Faixa 4');

const e5 = enquadrar({ rendaTotal: 20000, valorImovel: 900000, uf: 'MG' }, P);
ok('renda 20k → SBPE', e5.linha === 'SBPE' && e5.faixa === null);

const norte = enquadrar({ rendaTotal: 3000, valorImovel: 250000, uf: 'AM' }, P);
ok('UF Norte eleva teto de subsídio para 65k', norte.tetoSubsidio === 65000);

/* ---------- simulação completa ---------- */
const s = simular({
  valorImovel: 450000, tipo: 'usado', uf: 'MG', cidade: 'Uberlândia',
  rendas: [6000, 2500], nascimentoMaisVelho: '1988-05-10', numProponentes: 2,
  fgts: 20000, usaFgts: true, entradaDinheiro: 40000,
  sistema: 'sac', prazo: 360, taxaAnual: 10.5, primeiroImovel: true,
}, P);

ok('renda somada dos proponentes', s.rendaTotal === 8500, brl(s.rendaTotal));
ok('cota 80% (SBPE SAC)', s.cota === 0.8, String(s.cota));
ok('financiável = 80% de 450k', Math.round(s.financiavel) === 360000, brl(s.financiavel));
ok('entrada exigida = 450k - 360k financiados', Math.round(s.entradaNecessaria) === 90000, brl(s.entradaNecessaria));
ok('disponível = 40k dinheiro + 20k FGTS', Math.round(s.entradaDisponivel) === 60000, brl(s.entradaDisponivel));
ok('déficit de entrada = 30k', Math.round(s.deficitEntrada) === 30000, brl(s.deficitEntrada));
ok('parcela inicial calculada', s.parcelaInicial > 1000, brl(s.parcelaInicial));
ok('parcela com seguros > sem seguros', s.parcelaComSeguros > s.parcelaSemSeguros,
   `${brl(s.parcelaComSeguros)} > ${brl(s.parcelaSemSeguros)}`);
ok('encargos = MIP + DFI + tarifa', Math.abs(s.encargos.total - (s.encargos.mip + s.encargos.dfi + s.encargos.tarifa)) < 1e-9,
   `MIP ${brl(s.encargos.mip)} + DFI ${brl(s.encargos.dfi)} + tarifa ${brl(s.encargos.tarifa)}`);
ok('MIP = 0,05% do financiável', Math.abs(s.encargos.mip - 360000 * 0.0005) < 0.01, brl(s.encargos.mip));
ok('DFI = 0,015% do valor do imóvel', Math.abs(s.encargos.dfi - 450000 * 0.00015) < 0.01, brl(s.encargos.dfi));
ok('taxa nominal informada vira efetiva no retorno', Math.abs(s.taxaEfetiva - nominalParaEfetiva(10.5)) < 1e-9,
   `${s.taxaNominal.toFixed(2)}% nominal = ${s.taxaEfetiva.toFixed(2)}% efetiva`);
ok('rótulo do tipo de taxa', s.taxaTipo === 'nominal', s.taxaTipo);
ok('comprometimento coerente', Math.abs(s.comprometimento - s.parcelaInicial / 8500) < 1e-9,
   (s.comprometimento * 100).toFixed(1) + '%');
ok('alerta legal presente', s.avisoLegal.includes('sujeita à análise do banco'));

// caso que estoura o comprometimento
const apertado = simular({
  valorImovel: 600000, tipo: 'usado', uf: 'MG', rendas: [4000],
  nascimentoMaisVelho: '1970-01-01', sistema: 'price', prazo: 360, taxaAnual: 10.5,
}, P);
ok('comprometimento > 30% gera alerta', apertado.alertas.some((a) => a.includes('compromete')),
   (apertado.comprometimento * 100).toFixed(1) + '%');

// MCMV com subsídio
const mcmv = simular({
  valorImovel: 250000, tipo: 'novo', uf: 'MG', rendas: [3000],
  nascimentoMaisVelho: '1995-03-01', sistema: 'sac', prazo: 360,
}, P);
ok('MCMV Faixa 1 aplica subsídio', mcmv.subsidio > 0, brl(mcmv.subsidio));
ok('subsídio limitado ao teto de 55k', mcmv.subsidio <= 55000, brl(mcmv.subsidio));
ok('taxa default MCMV vem dos parâmetros', mcmv.taxaAnual === P.mcmv.jurosFaixa1a3, String(mcmv.taxaAnual));

/* ---------- idade / prazo ---------- */
ok('idade calculada de 1988', idadeEmAnos('1988-05-10') === 37 || idadeEmAnos('1988-05-10') === 38,
   String(idadeEmAnos('1988-05-10')));
ok('prazo limitado por idade (70 anos → 120 meses)', prazoMaximoPorIdade(70, 360) === 120,
   String(prazoMaximoPorIdade(70, 360)));
ok('prazo máximo 420 meses', prazoMaximoPorIdade(20, 500) === 420);

/* ---------- WhatsApp ---------- */
const wpp = resumoWhatsApp(s, 'João');
ok('resumo cita enquadramento', wpp.includes('Enquadramento sugerido'));
ok('resumo tem aviso legal', wpp.includes('sujeita à análise do banco'));
ok('resumo NÃO contém CPF', !/\d{3}\.\d{3}\.\d{3}-\d{2}/.test(wpp));
ok('resumo separa parcela com/sem seguros', wpp.includes('com seguros') && wpp.includes('sem seguros'));
ok('resumo diz se a taxa é nominal', wpp.includes('nominal'));

/* ---------- aviso de parâmetros ---------- */
ok('defaults não validados exibem aviso', String(avisoDeParametros(P)).includes('não validados'));
ok('parametros validados silenciam aviso', avisoDeParametros({ ...P, validado: true }) === null);

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
