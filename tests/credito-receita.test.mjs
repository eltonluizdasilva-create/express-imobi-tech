/** Fase 5 — receita e comissões (funções puras). */
import {
  STATUS_RECEBIMENTO, TABELA_COMISSAO_PADRAO, comissaoSugerida, valorComissao,
  resumoReceita, conversaoPorEtapa, receitaPorBanco,
} from '../src/lib/credito/receita.js';

let falhas = 0;
const ok = (n, c, e = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${e ? ' — ' + e : ''}`); if (!c) falhas += 1; };

ok('3 status de recebimento', STATUS_RECEBIMENTO.map((s) => s.key).join() === 'a_receber,faturado,recebido');
ok('tabela tem Caixa 1,0–1,5%', TABELA_COMISSAO_PADRAO.some((t) => t.banco === 'Caixa' && t.min === 1.0 && t.max === 1.5));

ok('sugestão Caixa SBPE', comissaoSugerida('Caixa', 'SBPE') === 1.2);
ok('sugestão Caixa MCMV', comissaoSugerida('Caixa', 'MCMV') === 1.1);
ok('banco desconhecido = 1%', comissaoSugerida('Banco X', 'SBPE') === 1.0);
ok('comissão 1,2% de 400k', valorComissao(400000, 1.2) === 4800, String(valorComissao(400000, 1.2)));
ok('comissão zero sem percentual', valorComissao(400000, 0) === 0);
ok('comissão zero sem valor', valorComissao(0, 1.2) === 0);

const processos = [
  { etapa: 'assinatura', banco: 'Caixa', modalidade: 'SBPE', valorFinanciado: 400000, comissaoPct: 1.2, comissaoValor: 4800, statusRecebimento: 'recebido' },
  { etapa: 'analise', banco: 'Caixa', modalidade: 'MCMV', valorFinanciado: 250000, comissaoPct: 1.1, comissaoValor: 2750, statusRecebimento: 'faturado' },
  { etapa: 'simulacao', banco: 'Itaú', modalidade: 'SBPE', valorFinanciado: 350000, comissaoPct: 1.3, comissaoValor: 4550, statusRecebimento: 'a_receber' },
  { etapa: 'reprovado', banco: 'Itaú', modalidade: 'SBPE', valorFinanciado: 900000, comissaoPct: 1.3, comissaoValor: 11700, statusRecebimento: 'a_receber' },
];

const r = resumoReceita(processos);
ok('total financiado ignora reprovado', r.totalFinanciado === 1000000, String(r.totalFinanciado));
ok('comissão prevista soma ativos', r.prevista === 12100, String(r.prevista));
ok('recebida = 4800', r.recebida === 4800);
ok('faturada = 2750', r.faturada === 2750);
ok('a receber = 4550', r.aReceber === 4550);
ok('processos ativos = 3', r.processosAtivos === 3);

// comissão sem valor gravado é calculada pelo percentual
const semValor = [{ etapa: 'analise', banco: 'Bradesco', modalidade: 'SBPE', valorFinanciado: 300000, comissaoPct: 1.5, statusRecebimento: 'a_receber' }];
ok('calcula comissão quando o valor está ausente', resumoReceita(semValor).prevista === 4500, String(resumoReceita(semValor).prevista));

const conv = conversaoPorEtapa(processos);
ok('conversão tem 5 etapas', conv.length === 5);
ok('todos passam por simulação', conv[0].chegou === 4, `${conv[0].chegou}/4`);
ok('2 chegam ao jurídico?', conv[3].chegou === 1, String(conv[3].chegou));
ok('percentual calculado', conv[0].percentual === 100, `${conv[0].percentual}%`);

const bancos = receitaPorBanco(processos);
ok('agrupa por banco', bancos.length === 2, bancos.map((b) => b.banco).join());
ok('Caixa lidera prevista', bancos[0].banco === 'Caixa' && bancos[0].prevista === 7550, `${bancos[0].banco}: ${bancos[0].prevista}`);
ok('conta processos por banco', bancos[0].quantidade === 2);

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
