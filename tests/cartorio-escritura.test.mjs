/**
 * Esteira de Cartório & Escritura (dentro de Repasses & NF, plano PLUS).
 * ============================================================================
 * Node puro, sem navegador e sem Firestore: exercita o mesmo
 * `src/lib/cartorioEscritura.js` que a tela usa.
 *   1. checklist das etapas 1 e 2 com os prazos padrão;
 *   2. cálculo de dias restantes e alerta âmbar/vermelho (≤ 5 dias / vencida);
 *   3. trava pré-repasse + liberação manual com justificativa;
 *   4. mensagem de WhatsApp para comprador/vendedor/correspondente;
 *   5. cenário demo com as três vendas (travada / aguardando registro / liberada);
 *   6. fiação em AdminNovo (dentro de Repasses & NF), sem aba nova e sem IA.
 * ============================================================================
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  CHECKLIST_CERTIDOES,
  CHECKLIST_ESCRITURA,
  ETAPA_CERTIDOES,
  ETAPA_ESCRITURA,
  JUSTIFICATIVA_MINIMA,
  LIMITE_ALERTA_DIAS,
  STATUS_EMITIDA,
  STATUS_PENDENTE,
  alertasVencimento,
  atualizarItem,
  criarNegociacaoDeProposta,
  dataISO,
  diasRestantes,
  ehPropostaFechada,
  liberarComJustificativa,
  mensagemWhatsAppCartorio,
  mesclarNegociacoes,
  negociacaoVazia,
  negociacoesDemoCartorio,
  pendenciasCartorio,
  podeLiberarRepasse,
  progressoNegociacao,
  revogarLiberacaoManual,
  rotuloItem,
  somarDias,
  statusCertidao,
} from '../src/lib/cartorioEscritura.js';

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');

const AGORA = Date.parse('2026-11-26T12:00:00.000Z');
const HOJE = dataISO(AGORA);

/** Negociação com todas as etapas 1 e 2 concluídas e válidas. */
function completar(negociacao) {
  let neg = negociacao;
  for (const definicao of CHECKLIST_CERTIDOES) {
    neg = atualizarItem(neg, ETAPA_CERTIDOES, definicao.id, {
      status: STATUS_EMITIDA,
      emitidaEm: HOJE,
      validadeAte: somarDias(HOJE, 20),
    }, { agora: AGORA });
  }
  for (const definicao of CHECKLIST_ESCRITURA) {
    neg = atualizarItem(neg, ETAPA_ESCRITURA, definicao.id, {
      status: STATUS_EMITIDA,
      emitidaEm: HOJE,
    }, { agora: AGORA });
  }
  return neg;
}

/* ------------------------- 1. checklist e prazos ------------------------ */

test('etapa 1 cobre matrícula, CNDs, ônus reais e condomínio/IPTU', () => {
  const ids = CHECKLIST_CERTIDOES.map((item) => item.id);
  assert.deepEqual(ids, [
    'matricula',
    'cnd_trabalhista',
    'cnd_federal',
    'cnd_estadual',
    'cnd_municipal',
    'onus_reais',
    'condominio_iptu',
  ]);

  const matricula = CHECKLIST_CERTIDOES.find((item) => item.id === 'matricula');
  assert.equal(matricula.validadeDias, 30);
  assert.equal(CHECKLIST_CERTIDOES.find((item) => item.id === 'onus_reais').validadeDias, 30);
  assert.equal(CHECKLIST_CERTIDOES.find((item) => item.id === 'condominio_iptu').validadeDias, 30);
  for (const id of ['cnd_trabalhista', 'cnd_federal', 'cnd_estadual', 'cnd_municipal']) {
    assert.equal(CHECKLIST_CERTIDOES.find((item) => item.id === id).validadeDias, 90, id);
  }
  assert.ok(CHECKLIST_CERTIDOES.every((item) => item.critico === true));
});

test('etapa 2 cobre ITBI, escritura, protocolo e conclusão do RGI', () => {
  assert.deepEqual(CHECKLIST_ESCRITURA.map((item) => item.id), [
    'itbi_guia',
    'itbi_pago',
    'escritura',
    'registro_protocolo',
    'registro_concluido',
  ]);
});

test('negociação vazia já nasce com todos os itens pendentes', () => {
  const neg = negociacaoVazia({ id: 'n1', codigoImovel: 'IMB-1' });
  assert.equal(Object.keys(neg.certidoes).length, CHECKLIST_CERTIDOES.length);
  assert.equal(Object.keys(neg.escritura).length, CHECKLIST_ESCRITURA.length);
  assert.ok(Object.values(neg.certidoes).every((item) => item.status === STATUS_PENDENTE));
  assert.equal(neg.liberacaoManual, null);
});

/* ------------------- 2. vencimento: âmbar e vermelho -------------------- */

test('dias restantes contam dias de calendário', () => {
  assert.equal(diasRestantes(somarDias(HOJE, 3), AGORA), 3);
  assert.equal(diasRestantes(HOJE, AGORA), 0);
  assert.equal(diasRestantes(somarDias(HOJE, -2), AGORA), -2);
  assert.equal(diasRestantes('', AGORA), null);
});

test('certidão a vencer em até 5 dias acende alerta âmbar', () => {
  const neg = atualizarItem(negociacaoVazia({ id: 'n2' }), ETAPA_CERTIDOES, 'matricula', {
    status: STATUS_EMITIDA,
    emitidaEm: somarDias(HOJE, -27),
    validadeAte: somarDias(HOJE, LIMITE_ALERTA_DIAS),
  }, { agora: AGORA });

  const situacao = statusCertidao(neg.certidoes.matricula, AGORA);
  assert.equal(situacao.chave, 'a_vencer');
  assert.equal(situacao.severidade, 'atencao');
  assert.equal(situacao.aVencer, true);
  assert.equal(situacao.travada, false);
  assert.equal(situacao.dias, LIMITE_ALERTA_DIAS);

  const alertas = alertasVencimento(neg, AGORA);
  assert.equal(alertas.length, 1);
  assert.equal(alertas[0].id, 'matricula');
  assert.equal(alertas[0].severidade, 'atencao');
});

test('certidão fora do prazo fica vencida, vermelha e trava o repasse', () => {
  const neg = atualizarItem(negociacaoVazia({ id: 'n3' }), ETAPA_CERTIDOES, 'cnd_federal', {
    status: STATUS_EMITIDA,
    emitidaEm: somarDias(HOJE, -95),
    validadeAte: somarDias(HOJE, -5),
  }, { agora: AGORA });

  const situacao = statusCertidao(neg.certidoes.cnd_federal, AGORA);
  assert.equal(situacao.chave, 'vencida');
  assert.equal(situacao.severidade, 'critica');
  assert.equal(situacao.vencida, true);
  assert.equal(situacao.travada, true);
  assert.match(situacao.rotulo, /Vencida há 5 dia/);

  const alertas = alertasVencimento(neg, AGORA);
  assert.equal(alertas[0].severidade, 'critica');
  assert.ok(pendenciasCartorio(neg, AGORA).some((pendencia) => pendencia.id === 'cnd_federal'));
});

test('marcar Emitida preenche emissão e validade padrão do item', () => {
  let neg = negociacaoVazia({ id: 'n4' });
  neg = atualizarItem(neg, ETAPA_CERTIDOES, 'matricula', { status: STATUS_EMITIDA }, { agora: AGORA });
  assert.equal(neg.certidoes.matricula.emitidaEm, HOJE);
  assert.equal(neg.certidoes.matricula.validadeAte, somarDias(HOJE, 30));

  neg = atualizarItem(neg, ETAPA_CERTIDOES, 'cnd_trabalhista', { status: STATUS_EMITIDA }, { agora: AGORA });
  assert.equal(neg.certidoes.cnd_trabalhista.validadeAte, somarDias(HOJE, 90));

  neg = atualizarItem(neg, ETAPA_CERTIDOES, 'matricula', { status: STATUS_PENDENTE }, { agora: AGORA });
  assert.equal(neg.certidoes.matricula.emitidaEm, '');
  assert.equal(neg.certidoes.matricula.validadeAte, '');
});

/* ------------------- 3. trava pré-repasse e liberação ------------------- */

test('sem certidões, o repasse fica travado com o selo de cartório', () => {
  const neg = negociacaoVazia({ id: 'n5', valor: 850000 });
  const situacao = podeLiberarRepasse(neg, AGORA);

  assert.equal(situacao.liberado, false);
  assert.equal(situacao.status, 'travado');
  assert.equal(situacao.trava, 'aguardando_cartorio');
  assert.equal(situacao.selo, 'Aguardando Cartório (Trava Pré-Repasse)');
  assert.equal(situacao.pendencias.length, CHECKLIST_CERTIDOES.length + CHECKLIST_ESCRITURA.length);
  assert.equal(progressoNegociacao(neg, AGORA).pct, 0);
});

test('checklist completo libera o repasse sem liberação manual', () => {
  const neg = completar(negociacaoVazia({ id: 'n6', valor: 1200000 }));
  const situacao = podeLiberarRepasse(neg, AGORA);

  assert.equal(situacao.liberado, true);
  assert.equal(situacao.status, 'liberado');
  assert.equal(situacao.trava, null);
  assert.equal(situacao.selo, 'Liberado para repasse e NF');
  assert.equal(situacao.pendencias.length, 0);
  assert.equal(progressoNegociacao(neg, AGORA).pct, 100);
});

test('liberação manual exige justificativa com conteúdo', () => {
  const neg = negociacaoVazia({ id: 'n7' });

  const curta = liberarComJustificativa(neg, { justificativa: 'ok', agora: AGORA });
  assert.equal(curta.ok, false);
  assert.match(curta.erro, new RegExp(String(JUSTIFICATIVA_MINIMA)));
  assert.equal(podeLiberarRepasse(curta.negociacao, AGORA).status, 'travado');

  const valida = liberarComJustificativa(neg, {
    justificativa: 'Comissão paga na assinatura do contrato, cláusula 7.',
    por: 'Gestor Teste',
    agora: AGORA,
  });
  assert.equal(valida.ok, true);

  const situacao = podeLiberarRepasse(valida.negociacao, AGORA);
  assert.equal(situacao.liberado, true);
  assert.equal(situacao.status, 'liberado_manual');
  assert.equal(situacao.trava, null);
  assert.equal(situacao.selo, 'Liberado manualmente com justificativa');
  assert.equal(situacao.liberacaoManual.por, 'Gestor Teste');
  assert.ok(situacao.pendencias.length > 0, 'a pendência continua registrada no dossiê');
});

test('revogar a liberação manual devolve a negociação à trava', () => {
  const neg = negociacaoVazia({ id: 'n8' });
  const liberada = liberarComJustificativa(neg, {
    justificativa: 'Comissão paga na assinatura do contrato.',
    agora: AGORA,
  }).negociacao;

  const revogada = revogarLiberacaoManual(liberada, { agora: AGORA });
  assert.equal(revogada.liberacaoManual, null);
  assert.equal(podeLiberarRepasse(revogada, AGORA).status, 'travado');
});

/* ------------------- 4. resumo pronto para o WhatsApp ------------------- */

test('mensagem de WhatsApp resume etapas, valores e a trava', () => {
  const neg = atualizarItem(negociacaoVazia({
    id: 'n9',
    codigoImovel: 'IMB-4092',
    imovelTitulo: 'Apto Jardins 110 m²',
    comprador: 'Fernanda Ribeiro',
    vendedor: 'Carlos Mendes',
    corretor: 'Camila Rocha',
    valor: 850000,
    sinal: 85000,
    origemCredito: true,
    banco: 'Itaú',
  }), ETAPA_CERTIDOES, 'matricula', {
    status: STATUS_EMITIDA,
    emitidaEm: somarDias(HOJE, -27),
    validadeAte: somarDias(HOJE, 3),
  }, { agora: AGORA });

  const texto = mensagemWhatsAppCartorio(neg, { agora: AGORA, nomeImobiliaria: 'Imobiliária Teste' });

  assert.match(texto, /Cartório & Escritura — IMB-4092/);
  assert.match(texto, /Imobiliária: Imobiliária Teste/);
  assert.match(texto, /Comprador: Fernanda Ribeiro/);
  assert.match(texto, /Sinal: R\$\s?85\.000/);
  assert.match(texto, /Crédito: Itaú/);
  assert.match(texto, /Etapa 1 — Matrícula & Certidões/);
  assert.match(texto, /Etapa 2 — ITBI, Escritura & Registro/);
  assert.match(texto, /Etapa 3 — Repasse & NF/);
  assert.match(texto, /AGUARDANDO CARTÓRIO \(TRAVA PRÉ-REPASSE\)/);
  assert.match(texto, /VENCE EM 3 DIA\(S\)/);
  assert.match(texto, /Contrato com força de escritura/);
  assert.doesNotMatch(texto, /undefined|NaN/);
});

test('mensagem de negociação liberada anuncia o repasse', () => {
  const texto = mensagemWhatsAppCartorio(completar(negociacaoVazia({ id: 'n10' })), { agora: AGORA });
  assert.match(texto, /Liberado para repasse e emissão da NF\./);
  assert.doesNotMatch(texto, /TRAVA PRÉ-REPASSE/);
});

/* --------------------------- 5. cenário demo --------------------------- */

test('cenário demo traz travada, aguardando registro e liberada', () => {
  const demo = negociacoesDemoCartorio(AGORA);
  assert.equal(demo.length, 3);

  assert.equal(podeLiberarRepasse(demo[0], AGORA).status, 'travado');
  assert.equal(podeLiberarRepasse(demo[1], AGORA).status, 'travado');
  assert.equal(podeLiberarRepasse(demo[2], AGORA).status, 'liberado');

  const alertas = alertasVencimento(demo[0], AGORA);
  assert.ok(alertas.some((alerta) => alerta.id === 'matricula' && alerta.severidade === 'atencao'));
  assert.ok(pendenciasCartorio(demo[0], AGORA).some((pendencia) => pendencia.id === 'cnd_trabalhista'));

  assert.equal(demo[1].escritura.itbi_pago.status, STATUS_EMITIDA);
  assert.equal(demo[1].escritura.registro_protocolo.protocolo, 'RGI-2026-0091');
  assert.equal(demo[1].escritura.registro_concluido.status, STATUS_PENDENTE);

  assert.equal(demo[2].escritura.registro_concluido.status, STATUS_EMITIDA);
  assert.equal(progressoNegociacao(demo[2], AGORA).pct, 100);
});

/* --------------------- 6. propostas fechadas → esteira ----------------- */

test('proposta só entra na esteira depois de aprovada', () => {
  assert.equal(ehPropostaFechada({ status: 'Aceita / Em Contrato' }), true);
  assert.equal(ehPropostaFechada({ status: 'Proposta Aprovada' }), true);
  assert.equal(ehPropostaFechada({ status: 'Em Análise' }), false);
  assert.equal(ehPropostaFechada({}), false);
});

test('venda com crédito cruza o sinal e usa o contrato do banco', () => {
  const neg = criarNegociacaoDeProposta({
    id: 'prop1',
    codigoImovel: 'IMB-3041',
    imovelTitulo: 'Apartamento Jardins',
    nomeCliente: 'Marcelo Vasconcelos',
    valorProposta: 740000,
    sinalEntrada: 150000,
    corretor: 'Rodrigo Almeida',
    modalidade: 'Financiamento SBPE + FGTS',
    banco: 'Itaú',
    status: 'Aceita / Em Contrato',
  }, { agora: AGORA });

  assert.equal(neg.id, 'cartorio-prop1');
  assert.equal(neg.valor, 740000);
  assert.equal(neg.sinal, 150000);
  assert.equal(neg.origemCredito, true);
  assert.equal(rotuloItem('escritura', neg), 'Contrato com força de escritura (banco)');
  assert.match(mensagemWhatsAppCartorio(neg, { agora: AGORA }), /Sinal: R\$\s?150\.000/);
});

test('mesclar preserva o andamento salvo e os dados da proposta', () => {
  const proposta = {
    id: 'p2',
    codigoImovel: 'IMB-8000',
    valorProposta: 500000,
    sinalEntrada: 50000,
    status: 'Aceita',
  };
  const salva = {
    id: 'cartorio-p2',
    propostaId: 'p2',
    certidoes: {
      matricula: { status: STATUS_EMITIDA, emitidaEm: HOJE, validadeAte: somarDias(HOJE, 20) },
    },
    liberacaoManual: null,
  };

  const [neg] = mesclarNegociacoes({ persistidas: [salva], propostas: [proposta], agora: AGORA });
  assert.equal(neg.codigoImovel, 'IMB-8000');
  assert.equal(neg.valor, 500000);
  assert.equal(neg.certidoes.matricula.status, STATUS_EMITIDA);
  assert.equal(neg.certidoes.cnd_federal.status, STATUS_PENDENTE);

  const fora = mesclarNegociacoes({
    persistidas: [],
    propostas: [{ id: 'p3', status: 'Em Análise' }],
    agora: AGORA,
  });
  assert.equal(fora.length, 0);
});

/* ------------------ 7. fiação dentro de Repasses & NF ------------------ */

test('esteira mora no Repasses & NF, sem aba nova e sem IA automática', () => {
  const admin = ler('src/AdminNovo.jsx');
  const tela = ler('src/components/imobi/EsteiraCartorioEscritura.jsx');
  const sidebar = ler('src/components/admin/SidebarAdmin.jsx');
  const planos = ler('shared/planos.json');
  const rules = ler('firestore.rules');
  const demo = ler('src/lib/cenarioDemo.js');

  assert.match(admin, /import EsteiraCartorioEscritura from '\.\/components\/imobi\/EsteiraCartorioEscritura'/);

  const inicio = admin.indexOf('const childrenAssistenteFiscal');
  const esteira = admin.indexOf('<EsteiraCartorioEscritura');
  const notaFiscal = admin.indexOf('<Comp', esteira);
  assert.ok(inicio > 0, 'childrenAssistenteFiscal existe');
  assert.ok(esteira > inicio, 'esteira entra no bloco do Repasses & NF');
  assert.ok(notaFiscal > esteira, 'esteira fica no topo, acima da emissão de NF');
  assert.match(admin, /propostas=\{listaPropostas\}/);
  assert.match(admin, /oficinaId=\{oficinaAtualId\}/);

  // Nenhuma aba nova na sidebar e nenhuma linha nova no catálogo comercial.
  // (a palavra "cartório" já existe na descrição do módulo contador; o que não
  // pode existir é um item de menu/rota novo.)
  assert.ok(!/id:\s*'cart[oó]rio/i.test(sidebar), 'cartório não pode virar aba da sidebar');
  assert.ok(!/cart[oó]rio_negociacoes/i.test(sidebar), 'nenhuma rota nova na sidebar');
  assert.ok(!/cart[oó]rio/i.test(planos), 'shared/planos.json permanece intacto');

  // Persistência no tenant + regra de acesso de gestão.
  assert.match(tela, /collection\(db, 'oficinas', oficinaId, 'cartorio_negociacoes'\)/);
  assert.match(tela, /setDoc\(/);
  assert.match(rules, /match \/oficinas\/\{oid\}\/cartorio_negociacoes\/\{docId\}/);
  assert.match(rules, /cartorio_negociacoes[\s\S]{0,220}ehGestor\(oid\)/);

  // Zero token: nenhuma requisição de IA nesta tela.
  assert.ok(!/fetch\(|axios|XMLHttpRequest/.test(tela), 'esteira não faz requisição externa');
  assert.ok(!/api\/ai/.test(tela), 'esteira não chama a API de IA');
  assert.ok(!/deepseek/i.test(tela), 'esteira não chama provedor de IA');
  assert.ok(!/cabecalhosIA/.test(tela), 'esteira não autentica IA');

  // Cold start: o cenário demo alimenta a esteira e grava na subcoleção.
  assert.match(demo, /export function obterCenarioCartorioDemo/);
  assert.match(demo, /cartorio_negociacoes/);
});

test('tela expõe alerta de prazo, trava e cópia para WhatsApp', () => {
  const tela = ler('src/components/imobi/EsteiraCartorioEscritura.jsx');

  assert.match(tela, /Aguardando Cartório \(Trava Pré-Repasse\)/);
  assert.match(tela, /Liberar manualmente com justificativa/);
  assert.match(tela, /Copiar Status do Cartório \(WhatsApp\)/);
  assert.match(tela, /Liberar repasse com justificativa/);
  assert.match(tela, /LIMITE_ALERTA_DIAS/);
  assert.match(tela, /STATUS_OPCOES/);
  // Contrato com força de escritura aparece quando a venda vem do crédito.
  assert.match(tela, /contrato com força de escritura/i);
  // Nada de `undefined`/`NaN` fabricado à mão no texto da tela.
  assert.match(tela, /não registrado/);
});
