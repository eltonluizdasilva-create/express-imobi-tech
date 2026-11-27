/**
 * tests/simulador-sofia.test.mjs — simulador do painel falando com a Sofia real.
 * Execução: node tests/simulador-sofia.test.mjs
 * Nenhuma rede, nenhuma chave: o fetch é injetado.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  AVISO_CATALOGO_VAZIO,
  AVISO_SEM_DISPONIVEIS,
  descreverHandoff,
  filtrarCatalogoDisponivel,
  historicoParaMensagens,
  normalizarGatilho,
  responderSofiaSimulacao,
} from '../src/lib/simuladorSofia.js';

let passou = 0;
async function ok(nome, fn) {
  try {
    await fn();
    passou += 1;
    console.log(`PASS  ${nome}`);
  } catch (erro) {
    console.error(`FAIL  ${nome}\n      ${erro.message}`);
    process.exitCode = 1;
  }
}

const IMOVEL = {
  codigo: 'IMB-1234',
  titulo: 'Apartamento 3 quartos no Tibery',
  tipo: 'Apartamento',
  finalidade: 'venda',
  bairro: 'Tibery',
  quartos: '3',
  valor: 350000,
};

/** fetch falso que registra a chamada e devolve `resposta`. */
function fakeFetch(resposta) {
  const chamadas = [];
  const fn = async (url, opcoes) => {
    chamadas.push({ url, opcoes, corpo: JSON.parse(opcoes.body) });
    if (typeof resposta === 'function') return resposta(url, opcoes);
    return resposta;
  };
  fn.chamadas = chamadas;
  return fn;
}

const respJson = (corpo, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => corpo,
});

const BASE = {
  mensagem: 'Procuro apartamento de 3 quartos no Tibery até 350 mil',
  catalogoImoveis: [IMOVEL],
  nomeImobiliaria: 'Imobiliária Teste',
  nomeCorretor: 'Ana Corretora',
};

await ok('corpo enviado ao /api/ai: modo simulacao, catálogo real, histórico + mensagem', async () => {
  const fetchFalso = fakeFetch(respJson({ text: 'Temos 2 opções no Tibery, quer ver?' }));
  const resultado = await responderSofiaSimulacao({
    ...BASE,
    historico: [
      { autor: 'ia', texto: 'Olá! Sou a Sofia.' },
      { autor: 'cliente', texto: 'Boa tarde' },
    ],
    cabecalhos: { 'Content-Type': 'application/json', Authorization: 'Bearer token-fake' },
    fetchImpl: fetchFalso,
  });

  assert.equal(resultado.ok, true);
  assert.equal(fetchFalso.chamadas.length, 1);
  const { url, opcoes, corpo } = fetchFalso.chamadas[0];
  assert.equal(url, '/api/ai');
  assert.equal(opcoes.method, 'POST');
  assert.equal(opcoes.headers.Authorization, 'Bearer token-fake', 'Bearer de cabecalhosIA chega ao proxy');
  assert.equal(corpo.provider, 'gemini');
  assert.equal('model' in corpo, false);
  assert.match(corpo.systemPrompt, /MODO ATUAL: SIMULACAO/);
  assert.match(corpo.systemPrompt, /IMB-1234/);
  assert.match(corpo.systemPrompt, /Valor: R\$ 350\.000/);
  assert.equal(corpo.messages.length, 3);
  assert.deepEqual(corpo.messages[0], { role: 'assistant', content: 'Olá! Sou a Sofia.' });
  assert.deepEqual(corpo.messages[2], { role: 'user', content: BASE.mensagem });
  assert.equal(resultado.texto, 'Temos 2 opções no Tibery, quer ver?');
  assert.equal(resultado.gatilho, null);
});

await ok('handoff é removido do texto e volta na badge (CHAMAR_IAGO)', async () => {
  const fetchFalso = fakeFetch(
    respJson({
      text:
        'Temos 2 opções no Tibery dentro de 350 mil. Quer ver as fotos?\n[GATILHO_HERMES: {"acao":"CHAMAR_IAGO","motivo":"perfil completo"}]\n',
    })
  );
  const resultado = await responderSofiaSimulacao({ ...BASE, fetchImpl: fetchFalso });

  assert.equal(resultado.ok, true);
  assert.equal(resultado.texto.includes('GATILHO_HERMES'), false, 'a tag nunca vai para a tela como texto');
  assert.equal(resultado.texto, 'Temos 2 opções no Tibery dentro de 350 mil. Quer ver as fotos?');
  assert.deepEqual(resultado.gatilho, { acao: 'CHAMAR_IAGO', motivo: 'perfil completo' });
  assert.equal(descreverHandoff(resultado.gatilho).acao, 'CHAMAR_IAGO');
  assert.match(descreverHandoff(resultado.gatilho).rotulo, /Iago/);
});

await ok('proxy que já separou: usa o campo gatilho (CHAMAR_CORRETOR)', async () => {
  const fetchFalso = fakeFetch(
    respJson({ text: 'Perfeito, já passei para o corretor.', gatilho: { acao: 'CHAMAR_CORRETOR', motivo: 'pediu visita' } })
  );
  const resultado = await responderSofiaSimulacao({ ...BASE, fetchImpl: fetchFalso });
  assert.equal(resultado.texto, 'Perfeito, já passei para o corretor.');
  assert.deepEqual(resultado.gatilho, { acao: 'CHAMAR_CORRETOR', motivo: 'pediu visita' });
});

await ok('gatilho inválido é ignorado (não vira badge)', async () => {
  assert.equal(normalizarGatilho({ acao: 'x', motivo: 'y' }), null);
  assert.equal(normalizarGatilho({ acao: '<script>' }), null);
  assert.equal(normalizarGatilho(null), null);
  const fetchFalso = fakeFetch(respJson({ text: 'Oi!', gatilho: { acao: 'DROP TABLE' } }));
  const resultado = await responderSofiaSimulacao({ ...BASE, fetchImpl: fetchFalso });
  assert.equal(resultado.gatilho, null);
  assert.equal(resultado.texto, 'Oi!');
});

await ok('catálogo vazio NÃO chama a IA e pede o primeiro imóvel', async () => {
  const fetchFalso = fakeFetch(respJson({ text: 'não deveria ser chamado' }));
  const resultado = await responderSofiaSimulacao({ ...BASE, catalogoImoveis: [], fetchImpl: fetchFalso });
  assert.equal(resultado.ok, false);
  assert.equal(resultado.codigo, 'catalogo_vazio');
  assert.equal(resultado.erro, AVISO_CATALOGO_VAZIO);
  assert.match(resultado.erro, /Cadastre o primeiro imóvel/);
  assert.equal(fetchFalso.chamadas.length, 0);
});

await ok('só imóveis disponíveis vão para a Sofia (vendido/alugado/inativo saem)', async () => {
  const catalogo = [
    { ...IMOVEL, codigo: 'IMB-ATIVO', status: 'Ativo' },
    { ...IMOVEL, codigo: 'IMB-RESERVADO', status: 'Reservado' },
    { ...IMOVEL, codigo: 'IMB-SEMSTATUS' },
    { ...IMOVEL, codigo: 'IMB-VENDIDO', status: 'Vendido' },
    { ...IMOVEL, codigo: 'IMB-ALUGADO', status: 'alugado' },
    { ...IMOVEL, codigo: 'IMB-LOCADO', status: 'Locado' },
    { ...IMOVEL, codigo: 'IMB-INATIVO', status: 'Inativo' },
    { ...IMOVEL, codigo: 'IMB-INDISP', status: 'Indisponível' },
  ];

  const disponiveis = filtrarCatalogoDisponivel(catalogo);
  assert.deepEqual(
    disponiveis.map((i) => i.codigo),
    ['IMB-ATIVO', 'IMB-RESERVADO', 'IMB-SEMSTATUS']
  );

  const fetchFalso = fakeFetch(respJson({ text: 'Temos opções no Tibery.' }));
  await responderSofiaSimulacao({ ...BASE, catalogoImoveis: catalogo, fetchImpl: fetchFalso });
  const { systemPrompt } = fetchFalso.chamadas[0].corpo;
  assert.match(systemPrompt, /IMB-ATIVO/);
  assert.match(systemPrompt, /IMB-RESERVADO/);
  assert.equal(systemPrompt.includes('IMB-VENDIDO'), false);
  assert.equal(systemPrompt.includes('IMB-ALUGADO'), false);
  assert.equal(systemPrompt.includes('IMB-INATIVO'), false);

  // catálogo só com indisponíveis: não chama a IA e aponta o motivo certo
  const fetchNada = fakeFetch(respJson({ text: 'não deveria ser chamado' }));
  const resultado = await responderSofiaSimulacao({
    ...BASE,
    catalogoImoveis: [{ ...IMOVEL, status: 'Vendido' }, { ...IMOVEL, status: 'Inativo' }],
    fetchImpl: fetchNada,
  });
  assert.equal(resultado.ok, false);
  assert.equal(resultado.codigo, 'sem_disponiveis');
  assert.equal(resultado.erro, AVISO_SEM_DISPONIVEIS);
  assert.equal(fetchNada.chamadas.length, 0);
});

await ok('mensagem vazia não gasta token', async () => {
  const fetchFalso = fakeFetch(respJson({ text: 'x' }));
  const resultado = await responderSofiaSimulacao({ ...BASE, mensagem: '   ', fetchImpl: fetchFalso });
  assert.equal(resultado.ok, false);
  assert.equal(resultado.codigo, 'mensagem_vazia');
  assert.equal(fetchFalso.chamadas.length, 0);
});

await ok('401 do proxy vira orientação de login, sem texto inventado', async () => {
  const fetchFalso = fakeFetch(respJson({ codigo: 'nao_autorizado', motivo: 'sem token' }, 401));
  const resultado = await responderSofiaSimulacao({ ...BASE, fetchImpl: fetchFalso });
  assert.equal(resultado.ok, false);
  assert.equal(resultado.codigo, 'nao_autorizado');
  assert.match(resultado.erro, /entre novamente/i);
  assert.equal('texto' in resultado, false);
});

await ok('falha de rede é reportada como rede', async () => {
  const fetchFalso = fakeFetch(() => {
    throw new Error('offline');
  });
  const resultado = await responderSofiaSimulacao({ ...BASE, fetchImpl: fetchFalso });
  assert.equal(resultado.ok, false);
  assert.equal(resultado.codigo, 'rede');
  assert.match(resultado.erro, /offline/);
});

await ok('IA sem texto devolve erro vazio em vez de balão em branco', async () => {
  const fetchFalso = fakeFetch(respJson({ text: '   ' }));
  const resultado = await responderSofiaSimulacao({ ...BASE, fetchImpl: fetchFalso });
  assert.equal(resultado.ok, false);
  assert.equal(resultado.codigo, 'vazio');
});

await ok('histórico do painel vira papéis do provedor', async () => {
  const mensagens = historicoParaMensagens([
    { autor: 'ia', texto: 'Olá' },
    { autor: 'cliente', texto: 'Oi' },
    { autor: 'cliente', texto: '  ' },
    { autor: 'cliente' },
  ]);
  assert.deepEqual(mensagens, [
    { role: 'assistant', content: 'Olá' },
    { role: 'user', content: 'Oi' },
  ]);
});

await ok('AdminNovo usa a Sofia real e não tem mais taxa/ficha inventada', async () => {
  const fonte = readFileSync(new URL('../src/components/imobi/AbaAgentesZara.jsx', import.meta.url), 'utf8');
  assert.match(fonte, /responderSofiaSimulacao/);
  assert.match(fonte, /cabecalhosIA\(\)/);
  assert.match(fonte, /AVISO_CATALOGO_VAZIO/);
  assert.match(fonte, /filtrarCatalogoDisponivel\(listaImoveis\)/);
  assert.match(fonte, /caixa final não vê|cliente final não vê/);
  assert.equal(/8,99/.test(fonte), false, 'taxa de juros inventada removida');
  assert.equal(/3 melhores fichas/.test(fonte), false, 'fichas fictícias removidas');
  assert.equal(/Sofia • Triagem 24h/.test(fonte), false, 'roteiro fixo removido');
  assert.equal(/contextoSimuladorIA/.test(fonte), false, 'máquina de estados removida');
  assert.equal(/simularRespostaAgente = \(e\) =>/.test(fonte), false, 'handler virou async');
});

await ok('.env.example documenta AI_REQUIRE_AUTH e PLACES_REQUIRE_AUTH', async () => {
  const env = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
  assert.match(env, /AI_REQUIRE_AUTH=true/);
  assert.match(env, /PLACES_REQUIRE_AUTH=true/);
  assert.match(env, /401/);
  assert.match(env, /NUNCA deixe false em produção|NUNCA deixe como false/i);
});

// Caminho real: fetch global + servidor HTTP local imitando o /api/ai.
await ok('HTTP real (localhost): Bearer chega no header e a tag não volta para a tela', async () => {
  const { createServer } = await import('node:http');
  const capturado = {};
  const servidor = createServer((req, res) => {
    let corpo = '';
    req.on('data', (parte) => (corpo += parte));
    req.on('end', () => {
      capturado.url = req.url;
      capturado.metodo = req.method;
      capturado.authorization = req.headers.authorization || '';
      capturado.corpo = JSON.parse(corpo || '{}');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          text: 'Temos 2 opções no Tibery. Quer ver as fotos?\n[GATILHO_HERMES: {"acao":"CHAMAR_CORRETOR","motivo":"pediu fotos"}]',
          provider: 'gemini',
          model: 'gemini-3.5-flash-lite',
        })
      );
    });
  });

  await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
  const { port } = servidor.address();
  try {
    const fetchReal = (url, opcoes) => fetch(`http://127.0.0.1:${port}${url}`, opcoes);
    const resultado = await responderSofiaSimulacao({
      ...BASE,
      cabecalhos: { 'Content-Type': 'application/json', Authorization: 'Bearer token-http' },
      fetchImpl: fetchReal,
    });

    assert.equal(capturado.metodo, 'POST');
    assert.equal(capturado.url, '/api/ai');
    assert.equal(capturado.authorization, 'Bearer token-http');
    assert.match(capturado.corpo.systemPrompt, /MODO ATUAL: SIMULACAO/);
    assert.equal(capturado.corpo.messages.at(-1).content, BASE.mensagem);
    assert.equal(resultado.ok, true);
    assert.equal(resultado.texto, 'Temos 2 opções no Tibery. Quer ver as fotos?');
    assert.equal(resultado.texto.includes('[GATILHO'), false);
    assert.deepEqual(resultado.gatilho, { acao: 'CHAMAR_CORRETOR', motivo: 'pediu fotos' });
  } finally {
    await new Promise((resolve) => servidor.close(resolve));
  }
});

console.log(`\n${passou} verificações PASS${process.exitCode ? ' — COM FALHAS' : ''}`);
