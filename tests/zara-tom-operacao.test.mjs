import assert from 'node:assert/strict';
import { REGRAS_TOM_PADRAO, salvarRegrasTom, carregarRegrasTom } from '../src/lib/regrasTom.js';
import { LIMITE_DEMO_TOM, restantesDemo, podeUsarDemo } from '../src/lib/limiteDemo.js';
import { carregarCenarioDemo } from '../src/lib/cenarioDemo.js';
import { extrairResumoCriticoOperacao, executarAuditoriaZara } from '../src/lib/auditoriaZara.js';

let totalPass = 0;

function test(descricao, fn) {
  try {
    fn();
    console.log(`PASS  ${descricao}`);
    totalPass++;
  } catch (err) {
    console.error(`FAIL  ${descricao}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Regras do Tom
test('Regras padrão do Tom possuem todos os 6 campos obrigatórios', () => {
  assert.equal(REGRAS_TOM_PADRAO.comissaoPadrao, 6);
  assert.equal(REGRAS_TOM_PADRAO.descontoMaximo, 5);
  assert.equal(typeof REGRAS_TOM_PADRAO.politicaPermuta, 'string');
  assert.equal(REGRAS_TOM_PADRAO.slaAtendimentoMinutos, 15);
  assert.equal(REGRAS_TOM_PADRAO.diasAlertaImovelParado, 30);
  assert.equal(typeof REGRAS_TOM_PADRAO.regrasEquipe, 'string');
});

test('Limite de consultas de teste do Tom foi elevado para 50', () => {
  assert.equal(LIMITE_DEMO_TOM, 50);
  assert.equal(restantesDemo('tom', LIMITE_DEMO_TOM), 50);
  assert.equal(podeUsarDemo('tom', { liberado: false, limite: LIMITE_DEMO_TOM }), true);
});

// 2. Cenário Demo (Cold Start)
test('Cenário Demo cria exatamente 5 imóveis e 6 leads', async () => {
  // Simulando Firestore mock em memória
  const documentosCriados = [];
  const dbMock = {};

  const resultado = await carregarCenarioDemo('tenant-teste-123', null, { force: true });
  assert.equal(resultado.sucesso, true);
  assert.equal(resultado.totalImoveis, 5);
  assert.equal(resultado.totalLeads, 6);

  // Validar os 2 imóveis parados > 40 dias
  const paradosMais40 = resultado.imoveis.filter((im) => im.diasParado > 40);
  assert.equal(paradosMais40.length >= 2, true, 'Deve conter pelo menos 2 imóveis parados > 40 dias');

  // Validar os 2 leads sem resposta > 24h
  const leadsMais24h = resultado.leads.filter((l) => l.horasSemContato >= 24);
  assert.equal(leadsMais24h.length >= 2, true, 'Deve conter pelo menos 2 leads sem resposta > 24h');
});

// 3. Extração e Filtro Crítico da Zara
test('Zara filtra corretamente leads atrasados e imóveis parados', () => {
  const agora = Date.now();
  const leads = [
    { id: 'l1', nome: 'Lead Atrasado 1', horasSemContato: 36, corretor: 'Carlos' },
    { id: 'l2', nome: 'Lead Atrasado 2', horasSemContato: 28, corretor: 'Mariana' },
    { id: 'l3', nome: 'Lead Recente', criadoEm: agora - 5 * 60 * 1000, corretor: 'Carlos' }, // 5 min atrás
  ];
  const imoveis = [
    { id: 'i1', titulo: 'Apto 1', codigo: 'IMB-101', diasParado: 48, corretorResponsavel: 'Carlos' },
    { id: 'i2', titulo: 'Casa 2', codigo: 'IMB-102', diasParado: 42, corretorResponsavel: 'Mariana' },
    { id: 'i3', titulo: 'Studio 3', codigo: 'IMB-105', diasParado: 3, corretorResponsavel: 'Mariana' },
  ];

  const regras = {
    slaAtendimentoMinutos: 15,
    diasAlertaImovelParado: 30,
  };

  const { leadsAtrasados, imoveisParados } = extrairResumoCriticoOperacao(leads, imoveis, regras);
  assert.equal(leadsAtrasados.length, 2);
  assert.equal(imoveisParados.length, 2);
  assert.equal(leadsAtrasados[0].nome, 'Lead Atrasado 1');
  assert.equal(imoveisParados[0].codigo, 'IMB-101');
});

// 4. Execução da Auditoria Zara com estrutura das 08:00
test('Auditoria da Zara gera relatório estruturado com os 4 tópicos obrigatórios', async () => {
  const leads = [
    { id: 'l1', nome: 'Ana Paula', horasSemContato: 36, corretor: 'Carlos Mendes' },
  ];
  const imoveis = [
    { id: 'i1', titulo: 'Apto Vista Mar', codigo: 'IMB-101', diasParado: 48, corretorResponsavel: 'Carlos Mendes' },
  ];

  const auditoria = await executarAuditoriaZara('tenant-teste-123', {
    db: null,
    leads,
    imoveis,
    regras: REGRAS_TOM_PADRAO,
  });

  assert.equal(typeof auditoria.relatorio, 'string');
  assert.equal(auditoria.relatorio.includes('1. **Resumo em 2 linhas**'), true);
  assert.equal(auditoria.relatorio.includes('2. **Urgências de Atendimento**'), true);
  assert.equal(auditoria.relatorio.includes('3. **Carteira Travada**'), true);
  assert.equal(auditoria.relatorio.includes('4. **Ação Prioritária do Gestor Hoje**'), true);
  assert.equal(auditoria.totalLeadsAtrasados, 1);
  assert.equal(auditoria.totalImoveisParados, 1);
});

// 5. Conta vazia sem dados injeta cenário demo em memória e não expõe placeholders
test('Conta sem histórico injeta cenário demo em memória e não expõe variáveis técnicas', async () => {
  const auditoria = await executarAuditoriaZara('tenant-novo-vazio', {
    db: null,
    leads: [],
    imoveis: [],
  });

  assert.equal(auditoria.cenarioDemoInjetado, true);
  assert.equal(auditoria.totalLeadsAtrasados >= 2, true);
  assert.equal(auditoria.totalImoveisParados >= 2, true);

  // Garantir que nenhum placeholder nem nota técnica de variáveis foi exposta
  assert.equal(auditoria.relatorio.includes('{{regras_tom_json}}'), false);
  assert.equal(auditoria.relatorio.includes('{{leads_atrasados_json}}'), false);
  assert.equal(auditoria.relatorio.includes('{{imoveis_parados_json}}'), false);
  assert.equal(auditoria.relatorio.includes('{{'), false);
  assert.equal(auditoria.relatorio.includes('(Nota:'), false);
});

console.log(`\nTODOS OS ${totalPass} TESTES PASSARAM COM SUCESSO!`);
