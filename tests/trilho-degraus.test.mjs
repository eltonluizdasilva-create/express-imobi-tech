import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  ambienteDevLocal,
  liberacoesDoNivel,
  nivelAcesso,
  rotuloModo,
  rotuloPlano,
} from '../src/lib/acesso-plano.js';
import {
  idDaAbaDoItem,
  itensProprios,
  montarDegraus,
  selecionarItens,
} from '../src/components/admin/trilho-degraus.js';

const fonteAdmin = readFileSync(new URL('../src/AdminNovo.jsx', import.meta.url), 'utf8');

/** Conta os itens declarados em um bloco `const nome = [...]` do AdminNovo. */
function contarItensDoBloco(nome) {
  const inicio = fonteAdmin.indexOf(`const ${nome} =`);
  assert.ok(inicio >= 0, `bloco ${nome} não encontrado em AdminNovo.jsx`);
  const fim = fonteAdmin.indexOf('];', inicio);
  assert.ok(fim > inicio, `bloco ${nome} sem fechamento`);
  return (fonteAdmin.slice(inicio, fim).match(/\bid: '/g) || []).length;
}

test('catálogo mantém 3 pilares no PRO e 11 exclusivos no PLUS', () => {
  const catalogo = JSON.parse(
    readFileSync(new URL('../shared/planos.json', import.meta.url), 'utf8'),
  );
  const pro = new Set([
    ...catalogo.modulos.gratis,
    ...catalogo.modulos.essencial_plus_extra,
    ...catalogo.modulos.profissional_extra,
  ]);
  const plus = new Set([...pro, ...catalogo.modulos.plus_extra]);
  const exclusivos = [
    'credito',
    'radar_captacao',
    'administrador',
    'roleta_imobi',
    'notafiscal',
    'tarefa',
    'avaliacao_imovel',
    'contador',
    'juridico_imobi',
    'reunioes-atas',
    'pos_venda',
  ];

  // D-23.20: os quatro módulos que eram PRO agora são exclusivos do PLUS.
  assert.deepEqual([...catalogo.modulos.plus_extra].sort(), [...exclusivos].sort());
  assert.ok(exclusivos.every((id) => !pro.has(id) && plus.has(id)));
  // Os três pilares do PRO continuam no degrau e são herdados pelo PLUS.
  for (const id of ['captacao_imobi', 'historico', 'marketing']) {
    assert.ok(pro.has(id), `PRO perdeu o pilar ${id}`);
  }
  assert.ok(['contador', 'juridico_imobi', 'tarefa', 'avaliacao_imovel'].every((id) => pro.has(id) === false));
});

test('filtro visual PLUS mostra só os cinco módulos exclusivos e não mistura o PRO', () => {
  const grupos = montarDegraus([
    {
      id: 'pro',
      degrau: 'pro',
      itens: [
        { id: 'captacao_imobi' },
        { id: 'contador', tabId: 'contador' },
        { id: 'juridico_imobi', tabId: 'juridico_imobi' },
      ],
    },
    {
      id: 'plus',
      degrau: 'plus',
      herdaDe: 'pro',
      itens: [
        { id: 'credito', tabId: 'credito' },
        { id: 'radar_captacao', tabId: 'radar_captacao' },
        { id: 'administrador', tabId: 'administrador' },
        { id: 'roleta_imobi', tabId: 'roleta_imobi' },
        { id: 'notafiscal', tabId: 'notafiscal' },
      ],
    },
  ]);
  const itensPlus = selecionarItens(grupos, 'plus');
  const idsPro = selecionarItens(grupos, 'pro').map(({ id }) => id);

  assert.deepEqual(itensPlus.map(({ id }) => id), [
    'credito',
    'radar_captacao',
    'administrador',
    'roleta_imobi',
    'notafiscal',
  ]);
  assert.equal(itensPlus.length, 5);
  assert.ok(itensPlus.every(({ herdado }) => !herdado));
  // nenhum módulo PRO é misturado na pílula PLUS
  assert.ok(idsPro.every((id) => !itensPlus.some((item) => item.id === id)));
  assert.deepEqual(idsPro, ['captacao_imobi', 'contador', 'juridico_imobi']);
  assert.deepEqual(
    selecionarItens(grupos, 'todos').map(({ id }) => id),
    [
      'captacao_imobi',
      'contador',
      'juridico_imobi',
      'credito',
      'radar_captacao',
      'administrador',
      'roleta_imobi',
      'notafiscal',
    ],
  );
});

test('herança de módulos permanece nos dados do PLUS, fora da vitrine da pílula', () => {
  const [pro, plus] = montarDegraus([
    { id: 'pro', degrau: 'pro', itens: [{ id: 'captacao_imobi' }] },
    { id: 'plus', degrau: 'plus', herdaDe: 'pro', itens: [{ id: 'equipe' }] },
  ]);
  assert.deepEqual(plus.itens.map(({ id }) => id), ['equipe', 'captacao_imobi']);
  assert.equal(plus.itens[1].herdado, true);
  assert.deepEqual(pro.itens.map(({ id }) => id), ['captacao_imobi']);
  // O herdado continua disponível para acesso, mas não entra na contagem visual.
  assert.deepEqual(itensProprios(plus).map(({ id }) => id), ['equipe']);
  assert.deepEqual(selecionarItens([plus], 'plus').map(({ id }) => id), ['equipe']);
});

test('plano PLUS mantém o acesso aos módulos PRO e Grátis (herança comercial)', () => {
  const catalogo = JSON.parse(
    readFileSync(new URL('../shared/planos.json', import.meta.url), 'utf8'),
  );
  const pro = new Set([
    ...catalogo.modulos.gratis,
    ...catalogo.modulos.essencial_plus_extra,
    ...catalogo.modulos.profissional_extra,
  ]);
  const plus = new Set([...pro, ...catalogo.modulos.plus_extra]);
  const planoPlus = catalogo.planos.find((plano) => plano.key === 'plus');

  assert.ok([...pro].every((id) => plus.has(id)), 'PLUS perdeu módulo PRO/Grátis');
  // `planosPro` alimenta isPlanoPro() → contaPaga() → temAcessoPro(): o PLUS
  // continua derrubando o bloqueio PRO e abre as ferramentas do degrau anterior.
  assert.ok(catalogo.planosPro.includes('plus'));
  assert.ok(planoPlus?.preco?.mensal > 0);
});

test('contadores das pílulas: Grátis 10, PRO 3, PLUS 11', () => {
  assert.equal(contarItensDoBloco('botoesBloco1Essencial'), 10);
  assert.equal(contarItensDoBloco('botoesBlocoPro'), 3);
  assert.equal(contarItensDoBloco('itensTrilhoPlus'), 11);
});

test('GRÁTIS fecha PRO e PLUS: todo item dos dois degraus carrega cadeado', () => {
  // PRO: o bloco inteiro é mapeado com `bloqueado: bloqueioProAtivo`.
  assert.match(
    fonteAdmin,
    /filtrarPorPapel\(botoesBlocoPro\)\.map\(\(item\) => \(\{\s*\.\.\.item,\s*bloqueado: bloqueioProAtivo,/,
  );

  // PLUS: cada módulo exclusivo declara o próprio cadeado. Sem isso a pílula
  // PLUS misturava item travado com item aberto na conta Grátis.
  const inicio = fonteAdmin.indexOf('const itensTrilhoPlus =');
  assert.ok(inicio >= 0, 'bloco itensTrilhoPlus não encontrado');
  const fim = fonteAdmin.indexOf('];', inicio);
  const bloco = fonteAdmin.slice(inicio, fim);
  const ids = (bloco.match(/\bid: '/g) || []).length;
  const cadeados = (bloco.match(/bloqueado: bloqueioPlusAtivo/g) || []).length;
  assert.equal(ids, 11);
  assert.equal(cadeados, ids, 'módulo do PLUS sem cadeado: estado misto no trilho');
  // D-23.27 — Reuniões & Atas IA também abre para a IA Tom: o cadeado dela
  // depende de `brainLiberado`, igual à Sidebar e à guarda de aba.
  assert.match(bloco, /id: 'reunioes-atas'[\s\S]*?bloqueado: bloqueioPlusAtivo && !brainLiberado/);

  // E o crachá do topo usa o MESMO nível que trava o trilho.
  assert.match(fonteAdmin, /rotuloPlano\(\{/);
  assert.match(fonteAdmin, /const nivelVisao = ehMasterPlataforma/);
});

test('nível de acesso: Grátis só Grátis, PRO abre PRO, PLUS abre PRO + PLUS, Admin Total abre tudo', () => {
  assert.equal(nivelAcesso(), 'gratis');
  assert.equal(nivelAcesso({ pro: true }), 'pro');
  assert.equal(nivelAcesso({ plus: true }), 'plus');
  assert.equal(nivelAcesso({ master: true }), 'master');

  assert.deepEqual({ ...liberacoesDoNivel('gratis') }, { gratis: true, pro: false, plus: false });
  assert.deepEqual({ ...liberacoesDoNivel('pro') }, { gratis: true, pro: true, plus: false });
  assert.deepEqual({ ...liberacoesDoNivel('plus') }, { gratis: true, pro: true, plus: true });
  assert.deepEqual({ ...liberacoesDoNivel('master') }, { gratis: true, pro: true, plus: true });
  // Nível desconhecido nunca abre nada além do Grátis.
  assert.deepEqual({ ...liberacoesDoNivel('vip-total') }, { gratis: true, pro: false, plus: false });
});

test('crachá do plano reflete o nível real e marca a simulação do master', () => {
  assert.equal(rotuloPlano({ nivel: 'gratis' }), '⚡ Plano Gratuito');
  assert.equal(rotuloPlano({ nivel: 'pro' }), '✨ Plano PRO Ativo');
  assert.equal(rotuloPlano({ nivel: 'plus' }), '💎 Plano PLUS Ativo');
  assert.equal(rotuloPlano({ nivel: 'master' }), '👑 Admin Total');
  assert.equal(rotuloPlano({ nivel: 'pro', simulado: true }), '✨ Plano PRO Ativo · simulação');
  assert.equal(rotuloPlano({ nivel: 'gratis', simulado: true }), '⚡ Plano Gratuito · simulação');
  assert.equal(rotuloPlano({ nivel: 'gratis', trialDias: 3 }), '⏳ Teste PRO · 3 dias');
  assert.equal(rotuloPlano({ nivel: 'gratis', trialDias: 1 }), '⏳ Teste PRO · 1 dia');
});

test('itens PLUS navegam para conteúdo existente no painel', () => {
  assert.equal(idDaAbaDoItem({ id: 'equipe', tabId: 'equipe' }), 'equipe');
  assert.equal(idDaAbaDoItem({ id: 'credito', tabId: 'credito' }), 'credito');
  assert.equal(idDaAbaDoItem({ id: 'radar_captacao', tabId: 'radar_captacao' }), 'radar_captacao');
  assert.equal(idDaAbaDoItem({ id: 'administrador', tabId: 'administrador' }), 'administrador');
  assert.equal(idDaAbaDoItem({ id: 'roleta_imobi', tabId: 'roleta_imobi' }), 'roleta_imobi');
  assert.equal(idDaAbaDoItem({ id: 'notafiscal', tabId: 'notafiscal' }), 'notafiscal');
  assert.equal(idDaAbaDoItem({ id: 'contador', tabId: 'contador' }), 'contador');
  assert.equal(idDaAbaDoItem({ id: 'juridico_imobi', tabId: 'juridico_imobi' }), 'juridico_imobi');
  assert.equal(idDaAbaDoItem({ id: 'tarefa', tabId: 'tarefa' }), 'tarefa');
  assert.equal(idDaAbaDoItem({ id: 'avaliacao_imovel', tabId: 'avaliacao_imovel' }), 'avaliacao_imovel');
  assert.equal(idDaAbaDoItem({ id: 'pos_venda', tabId: 'pos_venda' }), 'pos_venda');
  assert.equal(idDaAbaDoItem({ id: 'captacao_imobi' }), 'captacao_imobi');
  assert.equal(idDaAbaDoItem({ id: 'agentes_ia' }), 'agentes_ia');
});

test('grupos com abaInicial identificam a tela aberta ao filtrar', () => {
  const grupos = montarDegraus([
    { id: 'plus', degrau: 'plus', abaInicial: 'equipe', itens: [{ id: 'equipe' }] },
    { id: 'zara', degrau: 'operacao', abaInicial: 'agentes_ia', itens: [{ id: 'agentes_ia' }] },
  ]);
  assert.equal(grupos[0].abaInicial, 'equipe');
  assert.equal(grupos[1].abaInicial, 'agentes_ia');
});

test('ambiente dev local abre o painel sem login; produção continua fechada', () => {
  // Fora do navegador (script Node, sem `import.meta.env.DEV`) não é dev local.
  assert.equal(ambienteDevLocal(), false);

  const janelaOriginal = globalThis.window;
  try {
    for (const host of ['localhost', 'LOCALHOST', '127.0.0.1', '::1', '[::1]']) {
      globalThis.window = { location: { hostname: host } };
      assert.equal(ambienteDevLocal(), true, `${host} deveria contar como máquina de desenvolvimento`);
    }
    for (const host of ['expressimobi.com.br', 'app.expressimobi.com.br', 'localhost.espiao.com', '']) {
      globalThis.window = { location: { hostname: host } };
      assert.equal(ambienteDevLocal(), false, `${host} não pode abrir o painel sem login`);
    }
  } finally {
    if (janelaOriginal === undefined) delete globalThis.window;
    else globalThis.window = janelaOriginal;
  }
});

test('pílula do cliente nunca diz "PRO Ativo" sem assinatura', () => {
  // Conta gratuita (ou deslogada) com rascunho de visão completa.
  assert.equal(rotuloModo({ master: false, modoPro: true, isProConta: false }), '⚡ Plano Gratuito');
  assert.equal(rotuloModo({ master: false, modoPro: false, isProConta: false }), '⚡ Plano Gratuito');
  assert.equal(rotuloModo({ master: false, modoPro: true, isProConta: true }), '✨ Plano PRO Ativo');
  // O master mantém o rótulo de modo do alternador de demonstração.
  assert.match(rotuloModo({ master: true, modoPro: true }), /MODO COMPLETO/);
  assert.match(rotuloModo({ master: true, modoPro: false }), /MODO GRÁTIS/);
});

test('Admin Total no dev local sai da mesma fonte do crachá, do trilho e do login', () => {
  // AdminNovo: atalho local, papel efetivo e gate de tela de login.
  assert.ok(fonteAdmin.includes('const ACESSO_LOCAL_DEV = ambienteDevLocal();'));
  assert.ok(
    fonteAdmin.includes(
      'const ehMasterPlataforma = ehMasterPlataformaFn(papelLogado, claimAdmin) || ACESSO_LOCAL_DEV;',
    ),
  );
  assert.ok(fonteAdmin.includes("const papelEfetivo = papelLogado || (ACESSO_LOCAL_DEV ? 'master' : null);"));
  assert.ok(fonteAdmin.includes("if (ACESSO_LOCAL_DEV && !logado) return 'master';"));
  assert.ok(fonteAdmin.includes('if (!logado && !ehMasterPlataforma) {'));
  // O menu continua filtrando pelo papel efetivo (dev local = master).
  assert.ok(fonteAdmin.includes('const ehGestorUI = ehGestorDoPapel(papelEfetivo);'));
  assert.ok(fonteAdmin.includes('filtrarModulos(itens, papelEfetivo)'));

  // App.jsx: a rota privada só abre sem sessão na máquina de desenvolvimento.
  const fonteApp = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.ok(fonteApp.includes("import { ambienteDevLocal } from './lib/acesso-plano';"));
  assert.ok(fonteApp.includes('const ACESSO_LOCAL_DEV = ambienteDevLocal();'));
  assert.ok(fonteApp.includes('if (ACESSO_LOCAL_DEV) return children;'));
});

