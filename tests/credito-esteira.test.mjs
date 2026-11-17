/** Testes da esteira de crédito (funções puras). */
import {
  ETAPAS, ETAPAS_LATERAIS, TODAS_ETAPAS, etapaPorKey, proximaEtapa, etapaAnterior,
  diasNaEtapa, situacaoSla, mascararCpf, mascararTelefone, registroHistorico,
  prazoDaEtapa, contarPorEtapa, totalFinanciado,
} from '../src/lib/credito/esteira.js';

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas += 1;
};

ok('5 etapas principais', ETAPAS.length === 5, ETAPAS.map((e) => e.key).join(' → '));
ok('4 etapas de exceção', ETAPAS_LATERAIS.length === 4, ETAPAS_LATERAIS.map((e) => e.key).join(', '));
ok('9 etapas no total', TODAS_ETAPAS.length === 9);

ok('avança simulacao → analise', proximaEtapa('simulacao') === 'analise');
ok('avança em cadeia até assinatura', proximaEtapa('juridico') === 'assinatura');
ok('última etapa não estoura', proximaEtapa('assinatura') === 'assinatura');
ok('volta analise → simulacao', etapaAnterior('analise') === 'simulacao');
ok('primeira etapa não estoura', etapaAnterior('simulacao') === 'simulacao');
ok('etapa desconhecida cai na primeira', proximaEtapa('xyz') === 'simulacao');
ok('etapaPorKey devolve label', etapaPorKey('analise').label === 'Análise de Crédito');

/* SLA */
const tresDiasAtras = { etapa: 'analise', etapaDesde: { toDate: () => new Date(Date.now() - 3 * 86400000) } };
ok('diasNaEtapa com Timestamp', diasNaEtapa(tresDiasAtras) === 3, String(diasNaEtapa(tresDiasAtras)) + 'd');
ok('SLA da análise é 5 dias', etapaPorKey('analise').sla === 5);
ok('3 de 5 dias = ok', situacaoSla(tresDiasAtras).estado === 'ok', situacaoSla(tresDiasAtras).estado);

const quatroDias = { etapa: 'analise', etapaDesde: { toDate: () => new Date(Date.now() - 4 * 86400000) } };
ok('4 de 5 dias = atenção (80%)', situacaoSla(quatroDias).estado === 'atencao', situacaoSla(quatroDias).estado);

const dezDias = { etapa: 'analise', etapaDesde: { toDate: () => new Date(Date.now() - 10 * 86400000) } };
ok('10 de 5 dias = estourado', situacaoSla(dezDias).estado === 'estourado', situacaoSla(dezDias).estado);

ok('etapa terminal não tem SLA', situacaoSla({ etapa: 'aprovado' }).estado === 'sem-sla');

/* LGPD */
ok('CPF mascarado preserva 6 dígitos', mascararCpf('12345678901') === '***.456.789-**', mascararCpf('12345678901'));
ok('CPF mascarado com pontuação', mascararCpf('123.456.789-01') === '***.456.789-**');
ok('CPF inválido vira máscara total', mascararCpf('123') === '***.***.***-**');
ok('telefone mascarado', mascararTelefone('34991439845') === '(34) *****-9845', mascararTelefone('34991439845'));
ok('CPF não aparece cru em nenhuma máscara', !mascararCpf('12345678901').includes('123'));

/* histórico */
const h = registroHistorico({ etapa: 'analise' }, 'engenharia', 'Elton', 'uid1', 'ok do banco');
ok('histórico registra de/para', h.de === 'analise' && h.para === 'engenharia');
ok('histórico registra autor e motivo', h.autor === 'Elton' && h.motivo === 'ok do banco');
ok('histórico tem data ISO', !Number.isNaN(Date.parse(h.em)));

const prazo = prazoDaEtapa('engenharia');
ok('prazoDaEtapa soma o SLA (10d)', prazo instanceof Date && Math.round((prazo - Date.now()) / 86400000) === 10);
ok('prazoDaEtapa de etapa terminal é nulo', prazoDaEtapa('aprovado') === null);

/* agregações */
const processos = [
  { etapa: 'simulacao', valorFinanciado: 300000 },
  { etapa: 'analise', valorFinanciado: 450000 },
  { etapa: 'aprovado', valorFinanciado: 200000 },
  { etapa: 'reprovado', valorFinanciado: 999999 },
];
const contagem = contarPorEtapa(processos);
ok('contagem por etapa', contagem.simulacao === 1 && contagem.analise === 1 && contagem.aprovado === 1 && contagem.reprovado === 1);
ok('total financiado ignora reprovado', totalFinanciado(processos) === 950000, String(totalFinanciado(processos)));
ok('lista vazia retorna 0', totalFinanciado([]) === 0);

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
