/**
 * cockpit-visao-geral.test.mjs
 * ============================================================================
 * Validação do Cockpit Visual do Processo Imobiliário (D-23.36 / D-23.38):
 *   1. Presença e integridade das 7 etapas clicáveis (da entrada à saída);
 *   2. Gráficos determinísticos (Funil, Saúde da Carteira, Origem de Clientes);
 *   3. Radar de Mercado e Indicadores de Balcão (Selic, INCC-M, IGP-M, TR + 4 Notícias);
 *   4. Cold-Start Demo resiliente e conformidade com regras visuais e arquitetura.
 * ============================================================================
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  ETAPAS_PROCESSO_IMOBILIARIO,
  INDICES_MERCADO,
  TENDENCIAS_MERCADO,
  calcularCockpit,
  formatarMoeda,
  formatarValorAbreviado,
} from '../src/lib/cockpitImobiliario.js';

test('Trilho do Processo: exatamente 7 etapas ordenadas e clicáveis', () => {
  assert.equal(ETAPAS_PROCESSO_IMOBILIARIO.length, 7, 'Deve conter exatamente 7 etapas');

  // Passo 01: Entrada
  const etapa1 = ETAPAS_PROCESSO_IMOBILIARIO[0];
  assert.equal(etapa1.id, 'clientes_contatos');
  assert.equal(etapa1.passo, '01');
  assert.equal(etapa1.nome, 'Clientes & Contatos');
  assert.equal(etapa1.abaDestino, 'funil_leads');
  assert.equal(etapa1.badge, 'GRÁTIS');

  // Passo 02
  const etapa2 = ETAPAS_PROCESSO_IMOBILIARIO[1];
  assert.equal(etapa2.id, 'captacao_avaliacao');
  assert.equal(etapa2.passo, '02');
  assert.equal(etapa2.nome, 'Captação & Avaliação');
  assert.equal(etapa2.abaDestino, 'captacao_imobi');
  assert.equal(etapa2.badge, 'PRO');

  // Passo 03
  const etapa3 = ETAPAS_PROCESSO_IMOBILIARIO[2];
  assert.equal(etapa3.id, 'visitas_agendadas');
  assert.equal(etapa3.passo, '03');
  assert.equal(etapa3.nome, 'Visitas Agendadas');
  assert.equal(etapa3.abaDestino, 'visitas_imobi');
  assert.equal(etapa3.badge, 'GRÁTIS');

  // Passo 04
  const etapa4 = ETAPAS_PROCESSO_IMOBILIARIO[3];
  assert.equal(etapa4.id, 'propostas_credito');
  assert.equal(etapa4.passo, '04');
  assert.equal(etapa4.nome, 'Propostas & Crédito');
  assert.equal(etapa4.abaDestino, 'historico');
  assert.equal(etapa4.badge, 'PRO');

  // Passo 05
  const etapa5 = ETAPAS_PROCESSO_IMOBILIARIO[4];
  assert.equal(etapa5.id, 'cartorio_vistoria');
  assert.equal(etapa5.passo, '05');
  assert.equal(etapa5.nome, 'Cartório & Vistoria');
  assert.equal(etapa5.abaDestino, 'notafiscal');
  assert.equal(etapa5.badge, 'PLUS');

  // Passo 06
  const etapa6 = ETAPAS_PROCESSO_IMOBILIARIO[5];
  assert.equal(etapa6.id, 'repasse_comissao');
  assert.equal(etapa6.passo, '06');
  assert.equal(etapa6.nome, 'Repasse & Comissão');
  assert.equal(etapa6.abaDestino, 'notafiscal');
  assert.equal(etapa6.badge, 'PLUS');

  // Passo 07: Saída
  const etapa7 = ETAPAS_PROCESSO_IMOBILIARIO[6];
  assert.equal(etapa7.id, 'pos_venda_carteira');
  assert.equal(etapa7.passo, '07');
  assert.equal(etapa7.nome, 'Pós-Venda & Carteira');
  assert.equal(etapa7.abaDestino, 'pos_venda');
  assert.equal(etapa7.badge, 'PLUS');
});

test('Radar de Mercado: 4 índices oficiais de balcão configurados', () => {
  assert.equal(INDICES_MERCADO.length, 4, 'Deve conter os 4 índices de balcão');
  const ids = INDICES_MERCADO.map((i) => i.id);
  assert.ok(ids.includes('selic'), 'Falta taxa Selic');
  assert.ok(ids.includes('incc'), 'Falta taxa INCC-M');
  assert.ok(ids.includes('igpm'), 'Falta taxa IGP-M');
  assert.ok(ids.includes('tr'), 'Falta Taxa Referencial (TR)');

  for (const idx of INDICES_MERCADO) {
    assert.ok(idx.nome.length > 0, `Nome do índice ${idx.id} não pode ser vazio`);
    assert.ok(idx.valor.length > 0, `Valor do índice ${idx.id} não pode ser vazio`);
    assert.ok(idx.usoPratico.length > 15, `Uso prático do índice ${idx.id} deve ter explicação clara`);
  }
});

test('Tendências do Setor: 4 tópicos com argumento comercial prático para negociação', () => {
  assert.equal(TENDENCIAS_MERCADO.length, 4, 'Deve conter 4 tópicos de tendências');
  const titulos = TENDENCIAS_MERCADO.map((t) => t.titulo);
  assert.ok(titulos.some((t) => /Crédito Habitacional|Caixa/.test(t)), 'Falta Crédito Habitacional / Caixa');
  assert.ok(titulos.some((t) => /Minha Casa Minha Vida/.test(t)), 'Falta Minha Casa Minha Vida');
  assert.ok(titulos.some((t) => /Liquidez|Precificação/.test(t)), 'Falta Liquidez & Precificação');
  assert.ok(titulos.some((t) => /Locação|Garantias/.test(t)), 'Falta Locação & Garantias');

  for (const t of TENDENCIAS_MERCADO) {
    assert.ok(t.argumentoComercial.length > 25, `Argumento de ${t.titulo} deve ser substancial para o corretor`);
  }
});

test('Motor Determinístico: Cold Start injeta cenário demo sem requisições remotas', () => {
  const resultado = calcularCockpit({
    imoveis: [],
    leads: [],
    visitas: [],
    propostas: [],
  });

  assert.equal(resultado.emModoDemo, true, 'Deve ativar modo demo no cold-start');
  assert.equal(resultado.totais.imoveis, 5, 'Deve carregar 5 imóveis do cenário demo');
  assert.equal(resultado.totais.leads, 6, 'Deve carregar 6 leads do cenário demo');
  assert.ok(resultado.acoesUrgentes.length > 0, 'Deve gerar ações urgentes no cold-start');

  // Validação das categorias de ações urgentes
  const tiposAcoes = resultado.acoesUrgentes.map((a) => a.tipo);
  assert.ok(tiposAcoes.includes('lead_sem_resposta'), 'Deve ter leads sem resposta');
  assert.ok(tiposAcoes.includes('certidao_vencimento'), 'Deve ter certidões com alerta de vencimento');
  assert.ok(tiposAcoes.includes('imovel_parado'), 'Deve ter imóveis parados > 40 dias');
  assert.ok(tiposAcoes.includes('pos_venda_pendente'), 'Deve ter pendências de pós-venda');
});

test('Motor Determinístico: Métricas de Gráficos Executivos (Funil, Saúde da Carteira e Origem)', () => {
  const agora = Date.now();
  const diaMs = 24 * 60 * 60 * 1000;

  const resultado = calcularCockpit({
    imoveis: [
      { id: '1', titulo: 'Apto Novo', valor: 500000, diasParado: 10 },
      { id: '2', titulo: 'Casa Meia-Vida', valor: 800000, diasParado: 30 },
      { id: '3', titulo: 'Cobertura Parada', valor: 1500000, diasParado: 55 },
    ],
    leads: [
      { id: 'l1', nome: 'Lead Zap', origem: 'ZAP Imóveis', semResposta: false },
      { id: 'l2', nome: 'Lead Polen', origem: 'WhatsApp Pólen 24h', semResposta: true, horasSemResposta: 30 },
      { id: 'l3', nome: 'Lead Portal', origem: '/portal', semResposta: false },
      { id: 'l4', nome: 'Lead Amigo', origem: 'Indicação', semResposta: false },
    ],
    visitas: [
      { id: 'v1', status: 'Agendada' },
      { id: 'v2', status: 'Realizada' },
    ],
    propostas: [
      { id: 'p1', valorProposta: 780000, status: 'Em Análise' },
    ],
    cartorio: [
      { id: 'c1', valor: 500000, statusGeral: 'concluida' },
    ],
    posVenda: [
      { id: 'pv1', nomeComprador: 'João', diasEntrega: 30 },
    ],
    agora,
  });

  assert.equal(resultado.emModoDemo, false, 'Com dados reais, não deve marcar modo demo');

  // Funil
  assert.equal(resultado.funil.contatos.total, 4);
  assert.equal(resultado.funil.visitas.total, 2);
  assert.equal(resultado.funil.propostas.total, 1);
  assert.equal(resultado.funil.fechamentos.total, 1);
  assert.equal(resultado.funil.taxaConversaoGeral, 25); // 1 fechamento de 4 leads = 25%

  // Saúde da Carteira
  assert.equal(resultado.saudeCarteira.faixa0a20.quantidade, 1);
  assert.equal(resultado.saudeCarteira.faixa21a40.quantidade, 1);
  assert.equal(resultado.saudeCarteira.faixaMais40.quantidade, 1);
  assert.equal(resultado.saudeCarteira.precisaPrestacaoContas, true);

  // Origem dos Clientes
  assert.equal(resultado.origemClientes.whatsapp.total, 1);
  assert.equal(resultado.origemClientes.portal.total, 1);
  assert.equal(resultado.origemClientes.portais.total, 1);
  assert.equal(resultado.origemClientes.indicacao.total, 1);
});

test('Formatação Monetária e Abreviada', () => {
  assert.equal(formatarMoeda(1500000), 'R$\u00a01.500.000');
  assert.equal(formatarValorAbreviado(4800000), 'R$ 4,8M');
  assert.equal(formatarValorAbreviado(350000), 'R$ 350k');
});

test('Conferência de Código: AdminNovo e CockpitVisaoGeral', () => {
  const admin = readFileSync(new URL('../src/AdminNovo.jsx', import.meta.url), 'utf8');
  const cockpit = readFileSync(new URL('../src/components/imobi/CockpitVisaoGeral.jsx', import.meta.url), 'utf8');

  // AdminNovo integra CockpitVisaoGeral sob abaAtiva === 'dashboard_imobi'
  assert.ok(admin.includes("import CockpitVisaoGeral from './components/imobi/CockpitVisaoGeral'"));
  assert.ok(admin.includes('<CockpitVisaoGeral'));
  assert.ok(admin.indexOf('<CockpitVisaoGeral') > admin.indexOf("abaAtiva === 'dashboard_imobi'"));

  // Preserva OnboardingPrimeiroUso e onNovoImovel
  assert.ok(admin.includes('<OnboardingPrimeiroUso'));
  assert.ok(admin.includes('onNovoImovel={() => setModalNovoImovel(true)}'));

  // Regra Visual obrigatória: Fundo #020408 e Verde Esmeralda #10b981
  assert.ok(cockpit.includes('#020408'), 'CockpitVisaoGeral deve utilizar fundo #020408');
  assert.ok(cockpit.includes('#10b981'), 'CockpitVisaoGeral deve utilizar acento esmeralda #10b981');

  // Regras de títulos: Sem referências a Torre 360 ou Torre Imobiliária
  assert.ok(!cockpit.includes('Torre 360'), 'Não pode conter Torre 360');
  assert.ok(!cockpit.includes('Torre Imobiliária'), 'Não pode conter Torre Imobiliária');

  // 3 Faixas representadas no JSX do componente
  assert.ok(cockpit.includes('faixa-trilho-processo'), 'Falta Faixa 1 (trilho do processo)');
  assert.ok(cockpit.includes('faixa-graficos-executivos'), 'Falta Faixa 2 (gráficos executivos)');
  assert.ok(cockpit.includes('faixa-radar-mercado'), 'Falta Faixa 3 (radar de mercado)');
});
