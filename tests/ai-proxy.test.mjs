/**
 * tests/ai-proxy.test.mjs — harness de api/ai.js sem rede e sem token.
 * ============================================================================
 * Execução: node tests/ai-proxy.test.mjs
 *
 * Cobre: exigência de auth (401), teto total de caracteres (413), maxTokens
 * padrão seguro, remoção do bloco [GATILHO_HERMES: ...] antes de devolver o
 * texto, e envio de mídia (imagem/áudio/PDF) na cadeia Gemini.
 *
 * `global.fetch` é substituído: nenhuma chamada real, nenhuma chave necessária.
 * ============================================================================
 */

import assert from 'node:assert/strict';

process.env.GEMINI_API_KEY = 'chave-de-teste';
process.env.DEEPSEEK_API_KEY = 'chave-de-teste';
delete process.env.AI_REQUIRE_AUTH; // padrão = exigir

let passou = 0;
function ok(nome, fn) {
  try {
    fn();
    passou += 1;
    console.log(`PASS  ${nome}`);
  } catch (erro) {
    console.error(`FAIL  ${nome}\n      ${erro.message}`);
    process.exitCode = 1;
  }
}

/* ------------------------------- stub de res ------------------------------ */

function mockRes() {
  const res = {
    statusCode: 0,
    body: null,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(codigo) { this.statusCode = codigo; return this; },
    json(corpo) { this.body = corpo; return this; },
  };
  return res;
}

function chamar(handler, req) {
  const res = mockRes();
  return Promise.resolve(handler(req, res)).then(() => res);
}

/** Captura o corpo enviado ao provedor e devolve uma resposta fake. */
function stubFetch(respostaBruta) {
  const chamadas = [];
  global.fetch = async (url, init) => {
    chamadas.push({ url: String(url), init });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify(respostaBruta),
      json: async () => respostaBruta,
    };
  };
  return chamadas;
}

const RESPOSTA_GEMINI = (texto) => ({
  candidates: [{ content: { parts: [{ text: texto }] } }],
});
const RESPOSTA_OPENAI = (texto) => ({ choices: [{ message: { content: texto } }] });

const DATA_URL_PDF = 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCg==';
const DATA_URL_AUDIO = 'data:audio/ogg;base64,T2dnUwACAAAAAAAAAAA=';
const DATA_URL_IMG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==';

/* --------------------------------- testes -------------------------------- */

// Módulos separados por query: as constantes de ambiente são lidas no load.
const semAuth = (await import('../api/ai.js?auth=padrao')).default;

process.env.AI_REQUIRE_AUTH = 'false';
const livre = (await import('../api/ai.js?auth=livre')).default;

/* 1. autenticação */
stubFetch(RESPOSTA_GEMINI('oi'));
const r401 = await chamar(semAuth, {
  method: 'POST',
  headers: {},
  body: { provider: 'gemini', prompt: 'oi' },
});
ok('sem token → 401 nao_autorizado', () => {
  assert.equal(r401.statusCode, 401);
  assert.equal(r401.body.codigo, 'nao_autorizado');
  assert.match(String(r401.body.motivo), /ausente/);
});

const r401Get = await chamar(semAuth, { method: 'GET', headers: {}, query: { provider: 'gemini' } });
ok('GET diagnóstico também exige token', () => assert.equal(r401Get.statusCode, 401));

const r401Mal = await chamar(semAuth, {
  method: 'POST',
  headers: { authorization: 'Bearer nao.e.um.jwt' },
  body: { provider: 'gemini', prompt: 'oi' },
});
ok('token malformado → 401', () => {
  assert.equal(r401Mal.statusCode, 401);
  assert.equal(r401Mal.body.motivo, 'token malformado');
});

const r401Lixo = await chamar(semAuth, {
  method: 'POST',
  headers: { authorization: 'txt' },
  body: { provider: 'gemini', prompt: 'oi' },
});
ok('token sem 3 partes → 401', () => assert.equal(r401Lixo.statusCode, 401));

/* 2. teto total de caracteres */
let chamadas = stubFetch(RESPOSTA_GEMINI('ok'));
const gigante = 'a'.repeat(41000);
const r413 = await chamar(livre, {
  method: 'POST',
  headers: {},
  body: { provider: 'gemini', messages: [{ role: 'user', content: gigante }] },
});
ok('payload > 40k caracteres → 413 payload_grande', () => {
  assert.equal(r413.statusCode, 413);
  assert.equal(r413.body.codigo, 'payload_grande');
  assert.equal(r413.body.limite, 40000);
  assert.equal(chamadas.length, 0, 'não pode chamar o provedor');
});

/* 3. maxTokens padrão seguro */
chamadas = stubFetch(RESPOSTA_GEMINI('resposta curta'));
const r200 = await chamar(livre, {
  method: 'POST',
  headers: {},
  body: { provider: 'gemini', prompt: 'oi' },
});
ok('sem maxTokens → usa 800 (não deixa o provedor solto)', () => {
  assert.equal(r200.statusCode, 200);
  const corpo = JSON.parse(chamadas[0].init.body);
  assert.equal(corpo.generationConfig.maxOutputTokens, 800);
});

const chamadasTopo = stubFetch(RESPOSTA_GEMINI('x'));
await chamar(livre, {
  method: 'POST', headers: {},
  body: { provider: 'gemini', prompt: 'oi', maxTokens: 99999 },
});
ok('maxTokens acima do teto é limitado a 4096', () => {
  const corpo = JSON.parse(chamadasTopo[0].init.body);
  assert.equal(corpo.generationConfig.maxOutputTokens, 4096);
});

/* 4. gatilho */
stubFetch(RESPOSTA_GEMINI('Claro, tenho 2 opções.\n[GATILHO_HERMES: {"acao":"CHAMAR_IAGO","motivo":"apto 3Q até 450k"}]\nQual bairro você prefere?'));
const rGatilho = await chamar(livre, {
  method: 'POST', headers: {},
  body: { provider: 'gemini', prompt: 'quero apto' },
});
ok('gatilho sai do texto e volta em `gatilho`', () => {
  assert.equal(rGatilho.statusCode, 200);
  assert.equal(rGatilho.body.text.includes('GATILHO_HERMES'), false);
  assert.equal(rGatilho.body.text, 'Claro, tenho 2 opções.\nQual bairro você prefere?');
  assert.deepEqual(rGatilho.body.gatilho, { acao: 'CHAMAR_IAGO', motivo: 'apto 3Q até 450k' });
});

stubFetch(RESPOSTA_GEMINI('Beleza!\n[GATILHO_HERMES:\n{"acao": "CHAMAR_CORRETOR",\n "motivo": "pediu visita"}\n]'));
const rGatilhoMulti = await chamar(livre, {
  method: 'POST', headers: {}, body: { provider: 'gemini', prompt: 'visita' },
});
ok('gatilho quebrado em várias linhas também é parseado', () => {
  assert.equal(rGatilhoMulti.body.text, 'Beleza!');
  assert.equal(rGatilhoMulti.body.gatilho.acao, 'CHAMAR_CORRETOR');
});

stubFetch(RESPOSTA_GEMINI('Certo.\n[GATILHO_HERMES: {quebrado}]'));
const rGatilhoRuim = await chamar(livre, {
  method: 'POST', headers: {}, body: { provider: 'gemini', prompt: 'x' },
});
ok('JSON inválido: marcador some e nenhum gatilho é devolvido', () => {
  assert.equal(rGatilhoRuim.body.text, 'Certo.');
  assert.equal(rGatilhoRuim.body.gatilho, undefined);
});

/* 5. mídia */
chamadas = stubFetch(RESPOSTA_GEMINI('recebi'));
const rMidia = await chamar(livre, {
  method: 'POST', headers: {},
  body: {
    provider: 'gemini',
    messages: [{ role: 'user', content: 'analise esses anexos' }],
    arquivos: [
      { mimeType: 'audio/ogg', data: DATA_URL_AUDIO },
      DATA_URL_PDF,
      { type: 'image/jpeg', base64: DATA_URL_IMG },
    ],
  },
});
ok('imagem + áudio + PDF vão como inline_data no último turno do usuário', () => {
  assert.equal(rMidia.statusCode, 200);
  assert.equal(rMidia.body.arquivosEnviados, 3);
  const enviado = JSON.parse(chamadas[0].init.body);
  const partes = enviado.contents.at(-1).parts;
  const inline = partes.filter((p) => p.inline_data);
  assert.equal(inline.length, 3);
  assert.deepEqual(inline.map((p) => p.inline_data.mime_type), ['audio/ogg', 'application/pdf', 'image/jpeg']);
  assert.equal(Boolean(enviado.systemInstruction), false);
});

chamadas = stubFetch(RESPOSTA_GEMINI('ok'));
const rMidiaSo = await chamar(livre, {
  method: 'POST', headers: {},
  body: { provider: 'gemini', systemPrompt: 'seja breve', arquivos: [DATA_URL_IMG] },
});
ok('mídia sem turno de usuário não quebra a requisição', () => {
  assert.equal(rMidiaSo.statusCode, 200);
  const enviado = JSON.parse(chamadas[0].init.body);
  assert.ok(Array.isArray(enviado.contents) && enviado.contents.length === 1);
  assert.ok(enviado.contents[0].parts.some((p) => p.inline_data));
});

chamadas = stubFetch(RESPOSTA_OPENAI('texto'));
const rOutro = await chamar(livre, {
  method: 'POST', headers: {},
  body: { provider: 'deepseek', prompt: 'oi', arquivos: [DATA_URL_AUDIO] },
});
ok('provedor OpenAI-compatível descarta mídia com aviso explícito', () => {
  assert.equal(rOutro.statusCode, 200);
  assert.equal(rOutro.body.arquivosEnviados, undefined);
  assert.match(rOutro.body.avisos.join(' '), /gemini/);
  const enviado = JSON.parse(chamadas[0].init.body);
  assert.equal(JSON.stringify(enviado).includes('inline_data'), false);
});

chamadas = stubFetch(RESPOSTA_GEMINI('ok'));
const rTipoRuim = await chamar(livre, {
  method: 'POST', headers: {},
  body: { provider: 'gemini', prompt: 'oi', arquivos: ['data:text/plain;base64,b2k='] },
});
ok('tipo não suportado é descartado com aviso', () => {
  assert.equal(rTipoRuim.body.arquivosEnviados, undefined);
  assert.match(rTipoRuim.body.avisos.join(' '), /não suportado/);
});

/* 6. guarda de método continua valendo */
const r405 = await chamar(livre, { method: 'PUT', headers: {} });
ok('método não suportado → 405', () => assert.equal(r405.statusCode, 405));

/* 7. injeção dinâmica de {{periodo_dia}} no horário de Brasília */
chamadas = stubFetch(RESPOSTA_GEMINI('Olá!'));
const rPeriodo = await chamar(livre, {
  method: 'POST',
  headers: {},
  body: {
    provider: 'gemini',
    systemPrompt: 'Saudação: {{periodo_dia}}! Sou a Pólen.',
    prompt: 'Olá',
  },
});
ok('api/ai substitui {{periodo_dia}} pelo horário de Brasília', () => {
  assert.equal(rPeriodo.statusCode, 200);
  const enviado = JSON.parse(chamadas[0].init.body);
  const instrucao = enviado.systemInstruction?.parts?.[0]?.text || '';
  assert.match(instrucao, /Bom dia|Boa tarde|Boa noite/);
  assert.equal(instrucao.includes('{{periodo_dia}}'), false);
});

console.log(`\n${passou} verificações PASS${process.exitCode ? ' — COM FALHAS' : ''}`);
