/**
 * tests/importacao-planilha.test.mjs — planilha, CSV e texto colado (D-23.16)
 * Execução: node --test tests/importacao-planilha.test.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mapearColunas,
  normalizarLeads,
  parseCSV,
  parseTextoRapido,
  prepararRegistros,
} from '../src/lib/importacao/planilha.js';

const AGORA = new Date(2026, 10, 25, 12, 0, 0);

test('cabeçalho reconhecido sem depender de acento, caixa ou sinônimo', () => {
  const mapa = mapearColunas([
    'Nome do Cliente',
    'WhatsApp',
    'Bairro de Interesse',
    'Imóvel',
    'Orçamento',
    'Situação',
    'Último Contato',
  ]);
  assert.equal(mapa.nome, 0);
  assert.equal(mapa.telefone, 1);
  assert.equal(mapa.bairro, 2);
  assert.equal(mapa.interesse, 3);
  assert.equal(mapa.orcamento, 4);
  assert.equal(mapa.status, 5);
  assert.equal(mapa.dataContato, 6);
});

test('coluna "Contato" guarda telefone, não nome', () => {
  const mapa = mapearColunas(['Contato', 'Bairro']);
  assert.equal(mapa.telefone, 0);
  assert.equal(mapa.nome, undefined);
});

test('CSV respeita aspas, ponto e vírgula e quebra de linha dentro do campo', () => {
  const csv = [
    'Nome;Telefone;Bairro;Interesse',
    '"Silva; João";(34) 99999-8888;Santa Mônica;Apartamento 2 quartos',
    '"Maria\nSouza";34 98888-7777;Centro;Casa',
  ].join('\n');

  const linhas = parseCSV(csv);
  assert.equal(linhas.length, 3);
  assert.equal(linhas[1][0], 'Silva; João');
  assert.equal(linhas[1][1], '(34) 99999-8888');
  assert.equal(linhas[2][0], 'Maria\nSouza');
});

test('planilha com cabeçalho vira lead com telefone, temperatura e mensagem', () => {
  const linhas = [
    ['Nome', 'Celular', 'Bairro', 'Interesse', 'Valor', 'Status', 'Data do contato'],
    ['João Silva', '(34) 99999-8888', 'Santa Mônica', 'Apartamento', 'R$ 350.000,00', 'Proposta', '20/11/2026'],
    ['Maria Souza', '34 98888-7777', 'Centro', 'Casa', '500000', '', '01/10/2026'],
  ];

  const pacote = normalizarLeads(linhas, { agora: AGORA, nomeImobiliaria: 'Imobiliária Horizonte' });

  assert.equal(pacote.total, 2);
  assert.equal(pacote.selecionados, 2);

  const joao = pacote.leads[0];
  assert.equal(joao.nome, 'João Silva');
  assert.equal(joao.telefone, '5534999998888');
  assert.equal(joao.telefoneExibicao, '(34) 99999-8888');
  assert.equal(joao.orcamento, 350000);
  assert.equal(joao.temperatura, 'quente');
  assert.equal(joao.temperaturaOrigem, 'status');
  assert.ok(joao.mensagem.includes('Imobiliária Horizonte'));

  const maria = pacote.leads[1];
  assert.equal(maria.temperatura, 'frio');
  assert.equal(maria.temperaturaOrigem, 'data');
  assert.ok(maria.diasSemContato >= 50);
});

test('planilha sem cabeçalho usa a ordem padrão (nome, telefone, ...)', () => {
  const pacote = normalizarLeads(
    [['Ana Paula', '34911112222', 'Tibery', 'Apartamento', '300000', 'Visita', '23/11/2026']],
    { agora: AGORA },
  );
  assert.equal(pacote.leads.length, 1);
  assert.equal(pacote.leads[0].telefone, '5534911112222');
  assert.equal(pacote.leads[0].temperatura, 'quente');
});

test('telefone repetido é desmarcado, não descartado em silêncio', () => {
  const pacote = normalizarLeads(
    [
      ['Nome', 'Telefone'],
      ['João', '34999998888'],
      ['João repetido', '(34) 99999-8888'],
      ['Sem telefone', ''],
    ],
    { agora: AGORA },
  );

  assert.equal(pacote.total, 3);
  assert.equal(pacote.selecionados, 1);
  assert.equal(pacote.duplicados, 1);
  assert.equal(pacote.leads[1].motivo, 'duplicado');
  assert.equal(pacote.leads[1].selecionado, false);
  assert.equal(pacote.leads[2].motivo, 'sem_telefone');
  assert.ok(pacote.avisos.some((aviso) => aviso.includes('repetido')));
});

test('telefone já existente no CRM também é marcado como duplicado', () => {
  const pacote = normalizarLeads([['Nome', 'Telefone'], ['João', '34999998888']], {
    agora: AGORA,
    telefonesExistentes: ['5534999998888'],
  });
  assert.equal(pacote.selecionados, 0);
  assert.equal(pacote.leads[0].duplicado, true);
});

test('texto colado por ";" e por " - " vira registros com bairro, interesse e status', () => {
  const { registros, ignoradas } = parseTextoRapido(
    [
      'João Silva; (34) 99999-8888; Santa Mônica; Apartamento 2 quartos',
      'Maria Souza - 34 98888-7777 - Proposta - Centro',
      'Lista de contatos do WhatsApp',
    ].join('\n'),
  );

  assert.equal(registros.length, 2);
  assert.equal(ignoradas.length, 1);
  assert.equal(registros[0].nome, 'João Silva');
  assert.equal(registros[0].bairro, 'Santa Mônica');
  assert.ok(registros[0].interesse.includes('Apartamento'));
  assert.equal(registros[1].status, 'Proposta');
  assert.equal(registros[1].bairro, 'Centro');

  const pacote = normalizarLeads(registros, { agora: AGORA });
  assert.equal(pacote.selecionados, 2);
  assert.equal(pacote.leads[1].temperatura, 'quente');
});

test('exportação de conversa do WhatsApp usa a data da mensagem e marca sem telefone', () => {
  const { registros } = parseTextoRapido('[20/11/2026, 10:32] Carlos Lima: quero uma casa no Centro');
  assert.equal(registros.length, 1);
  assert.equal(registros[0].nome, 'Carlos Lima');
  assert.equal(registros[0].dataContato, '20/11/2026 10:32');

  const pacote = normalizarLeads(registros, { agora: AGORA });
  assert.equal(pacote.leads[0].temperatura, 'quente');
  assert.equal(pacote.leads[0].motivo, 'sem_telefone');
});

test('registros prontos (IA) passam pelo mesmo normalizador', () => {
  const pacote = normalizarLeads(
    [{ nome: 'Ana', whatsapp: '(34) 98888-7777', bairro: 'Centro', status: 'Negociação' }],
    { agora: AGORA },
  );
  assert.equal(pacote.leads[0].telefone, '5534988887777');
  assert.equal(pacote.leads[0].temperatura, 'quente');
});

test('prepararRegistros devolve mapa e flag de cabeçalho', () => {
  const preparado = prepararRegistros([
    ['Nome', 'Telefone'],
    ['Ana', '34988887777'],
  ]);
  assert.equal(preparado.tinhaCabecalho, true);
  assert.equal(preparado.colunas.nome, 0);
  assert.equal(preparado.registros.length, 1);
  assert.equal(preparado.registros[0].nome, 'Ana');
});
