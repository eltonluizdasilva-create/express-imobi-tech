/**
 * tests/importacao-temperatura.test.mjs — régua de leads da Migração (D-23.16)
 * Execução: node --test tests/importacao-temperatura.test.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LIMITE_MORNO_DIAS,
  LIMITE_QUENTE_DIAS,
  REGUA_TEMPERATURA,
  classificarTemperatura,
  formatarTelefone,
  linkWhatsApp,
  mensagemPorTemperatura,
  normalizarTelefone,
  parseDataContato,
  parseValorMoeda,
  statusParaTemperatura,
} from '../src/lib/importacao/temperatura.js';

const AGORA = new Date(2026, 10, 25, 12, 0, 0); // 25/11/2026
const diasAtras = (dias) => {
  const data = new Date(AGORA);
  data.setDate(data.getDate() - dias);
  return data;
};

test('régua publicada tem os três degraus na ordem', () => {
  assert.deepEqual(REGUA_TEMPERATURA.map((item) => item.id), ['quente', 'morno', 'frio']);
  assert.deepEqual(REGUA_TEMPERATURA.map((item) => item.emoji), ['🔥', '🌤️', '❄️']);
  assert.equal(LIMITE_QUENTE_DIAS, 5);
  assert.equal(LIMITE_MORNO_DIAS, 10);
});

test('data do contato define 0-5 quente, 6-10 morno e 11+ frio', () => {
  const casos = [
    [0, 'quente'],
    [5, 'quente'],
    [6, 'morno'],
    [10, 'morno'],
    [11, 'frio'],
    [90, 'frio'],
  ];
  for (const [dias, esperado] of casos) {
    const resultado = classificarTemperatura({ dataContato: diasAtras(dias) }, AGORA);
    assert.equal(resultado.temperatura, esperado, `${dias} dia(s) deveria ser ${esperado}`);
    assert.equal(resultado.diasSemContato, dias);
    assert.equal(resultado.origem, 'data');
  }
});

test('data futura conta como hoje, não como negativo', () => {
  const amanha = new Date(AGORA);
  amanha.setDate(amanha.getDate() + 3);
  const resultado = classificarTemperatura({ dataContato: amanha }, AGORA);
  assert.equal(resultado.temperatura, 'quente');
  assert.equal(resultado.diasSemContato, 0);
});

test('sem data vai para reativação (frio)', () => {
  assert.deepEqual(classificarTemperatura({}, AGORA), {
    temperatura: 'frio',
    origem: 'sem-data',
    diasSemContato: null,
  });
  assert.equal(classificarTemperatura({ dataContato: 'data inválida' }, AGORA).temperatura, 'frio');
});

test('status explícito manda mais que a data', () => {
  assert.equal(statusParaTemperatura('Proposta'), 'quente');
  assert.equal(statusParaTemperatura('Visita Agendada'), 'quente');
  assert.equal(statusParaTemperatura('Negociação'), 'quente');
  assert.equal(statusParaTemperatura('Perdido'), 'frio');
  assert.equal(statusParaTemperatura('Sem interesse'), 'frio');
  assert.equal(statusParaTemperatura('Novo Lead'), null);

  const antigoComProposta = classificarTemperatura(
    { dataContato: diasAtras(120), status: 'Proposta' },
    AGORA,
  );
  assert.equal(antigoComProposta.temperatura, 'quente');
  assert.equal(antigoComProposta.origem, 'status');
  assert.equal(antigoComProposta.diasSemContato, 120);

  const recentePerdido = classificarTemperatura({ dataContato: diasAtras(1), status: 'Perdido' }, AGORA);
  assert.equal(recentePerdido.temperatura, 'frio');
});

test('datas de planilha em dd/mm/aaaa, ISO e serial do Excel', () => {
  assert.equal(parseDataContato('05/11/2026').getDate(), 5);
  assert.equal(parseDataContato('05/11/2026').getMonth(), 10);
  assert.equal(parseDataContato('2026-11-05').getDate(), 5);
  assert.equal(parseDataContato('05/11/26').getFullYear(), 2026);
  // Serial 46331 = 05/11/2026 (base 30/12/1899)
  const serial = parseDataContato(46331);
  assert.equal(serial.getUTCDate(), 5);
  assert.equal(serial.getUTCMonth(), 10);
  assert.equal(parseDataContato(''), null);
});

test('telefone brasileiro vira wa.me com DDD e nono dígito', () => {
  assert.equal(normalizarTelefone('(34) 99999-8888'), '5534999998888');
  assert.equal(normalizarTelefone('34 99999 8888'), '5534999998888');
  assert.equal(normalizarTelefone('+55 34 99999-8888'), '5534999998888');
  assert.equal(normalizarTelefone('034 99999-8888'), '5534999998888');
  assert.equal(normalizarTelefone('1234'), '');
  assert.equal(formatarTelefone('34999998888'), '(34) 99999-8888');
  assert.equal(formatarTelefone('3433334444'), '(34) 3333-4444');

  const link = linkWhatsApp('(34) 99999-8888', 'Oi João');
  assert.ok(link.startsWith('https://wa.me/5534999998888?text='));
  assert.ok(link.includes(encodeURIComponent('Oi João')));
  assert.equal(linkWhatsApp('', 'x'), '');
});

test('mensagem sugerida muda conforme a temperatura e não inventa dado', () => {
  const base = { nome: 'João Silva', bairro: 'Santa Mônica' };
  const quente = mensagemPorTemperatura({ ...base, temperatura: 'quente' });
  assert.ok(quente.includes('Oi João!'));
  assert.ok(quente.includes('Santa Mônica'));
  assert.ok(quente.includes('fotos e os valores'));

  const morno = mensagemPorTemperatura({ ...base, temperatura: 'morno', diasSemContato: 8 });
  assert.ok(morno.includes('há 8 dias'));

  const frio = mensagemPorTemperatura({ ...base, temperatura: 'frio' });
  assert.ok(frio.includes('ainda está procurando'));

  const semDados = mensagemPorTemperatura({ temperatura: 'quente' });
  assert.ok(semDados.startsWith('Oi!'));
});

test('valores em real da planilha viram número', () => {
  assert.equal(parseValorMoeda('R$ 350.000,00'), 350000);
  assert.equal(parseValorMoeda('350.000'), 350000);
  assert.equal(parseValorMoeda('1.200.000,50'), 1200000.5);
  assert.equal(parseValorMoeda('350000'), 350000);
  assert.equal(parseValorMoeda(''), 0);
  assert.equal(parseValorMoeda(null), 0);
});
