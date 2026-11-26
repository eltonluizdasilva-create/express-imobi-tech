/**
 * tests/importacao-xml-proxy.test.mjs — api/importar-xml.js sem rede (D-23.16)
 * Execução: node --test tests/importacao-xml-proxy.test.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';

process.env.XML_IMPORT_REQUIRE_AUTH = 'false';
const modulo = await import('../api/importar-xml.js');
const handler = modulo.default;
const { validarUrlXml } = modulo;

function mockRes() {
  return {
    statusCode: 0,
    body: null,
    headers: {},
    setHeader(chave, valor) {
      this.headers[chave] = valor;
    },
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(corpo) {
      this.body = corpo;
      return this;
    },
  };
}

async function chamar(req) {
  const res = mockRes();
  await handler(req, res);
  return res;
}

const XML = '<?xml version="1.0"?><Imoveis><Imovel><CodigoImovel>1</CodigoImovel></Imovel></Imoveis>';

test('validação bloqueia protocolo, credenciais e endereço interno (SSRF)', () => {
  assert.equal(validarUrlXml('https://www.zapimoveis.com.br/feed.xml').ok, true);
  assert.equal(validarUrlXml('file:///etc/passwd').ok, false);
  assert.equal(validarUrlXml('ftp://portal.com/feed.xml').ok, false);
  assert.equal(validarUrlXml('https://user:senha@portal.com/feed.xml').ok, false);
  assert.equal(validarUrlXml('http://localhost:8080/feed.xml').ok, false);
  assert.equal(validarUrlXml('http://127.0.0.1/feed.xml').ok, false);
  assert.equal(validarUrlXml('http://192.168.0.10/feed.xml').ok, false);
  assert.equal(validarUrlXml('http://169.254.169.254/latest/meta-data').ok, false);
  assert.equal(validarUrlXml('http://servidor.local/feed.xml').ok, false);
  assert.equal(validarUrlXml('não é url').ok, false);
});

test('GET devolve diagnóstico sem buscar nada', async () => {
  const res = await chamar({ method: 'GET', headers: {} });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.endpoint, 'importar-xml');
  assert.equal(res.body.limiteMb, 5);
});

test('POST com link público devolve o XML cru para o front parsear', async () => {
  const original = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    headers: { get: (nome) => (nome === 'content-type' ? 'application/xml' : null) },
    arrayBuffer: async () => Buffer.from(XML, 'utf8'),
  });

  try {
    const res = await chamar({ method: 'POST', headers: {}, body: { url: 'https://portal.com/feed.xml' } });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.conteudo, XML);
    assert.equal(res.body.contentType, 'application/xml');
    assert.equal(res.body.tamanho, Buffer.byteLength(XML));
  } finally {
    global.fetch = original;
  }
});

test('POST sem link ou com link interno responde 400', async () => {
  const semUrl = await chamar({ method: 'POST', headers: {}, body: {} });
  assert.equal(semUrl.statusCode, 400);

  const interno = await chamar({ method: 'POST', headers: {}, body: { url: 'http://10.0.0.5/feed.xml' } });
  assert.equal(interno.statusCode, 400);
  assert.ok(interno.body.error.includes('interno'));
});

test('redirecionamento para endereço interno é barrado no segundo salto', async () => {
  const original = global.fetch;
  let chamadas = 0;
  global.fetch = async () => {
    chamadas += 1;
    return {
      ok: false,
      status: 302,
      headers: { get: (nome) => (nome === 'location' ? 'http://192.168.1.1/feed.xml' : null) },
      arrayBuffer: async () => Buffer.from(''),
    };
  };

  try {
    const res = await chamar({ method: 'POST', headers: {}, body: { url: 'https://portal.com/feed.xml' } });
    assert.equal(res.statusCode, 400);
    assert.equal(chamadas, 1);
    assert.ok(res.body.error.includes('interno'));
  } finally {
    global.fetch = original;
  }
});

test('erro do portal vira 502 com motivo legível', async () => {
  const original = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 404,
    headers: { get: () => null },
    arrayBuffer: async () => Buffer.from(''),
  });

  try {
    const res = await chamar({ method: 'POST', headers: {}, body: { url: 'https://portal.com/feed.xml' } });
    assert.equal(res.statusCode, 502);
    assert.ok(res.body.error.includes('404'));
  } finally {
    global.fetch = original;
  }
});

test('feed acima de 5 MB é recusado (413)', async () => {
  const original = global.fetch;
  const grande = Buffer.alloc(5 * 1024 * 1024 + 10, 60);
  global.fetch = async () => ({
    ok: true,
    status: 200,
    headers: { get: () => 'application/xml' },
    arrayBuffer: async () => grande,
  });

  try {
    const res = await chamar({ method: 'POST', headers: {}, body: { url: 'https://portal.com/grande.xml' } });
    assert.equal(res.statusCode, 413);
    assert.ok(res.body.error.includes('5 MB'));
  } finally {
    global.fetch = original;
  }
});

test('conteúdo que não é XML é recusado (422)', async () => {
  const original = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    headers: { get: () => 'text/html' },
    arrayBuffer: async () => Buffer.from('<!doctype html><html><body>sem feed</body></html>'),
  });

  try {
    const res = await chamar({ method: 'POST', headers: {}, body: { url: 'https://portal.com/pagina' } });
    assert.equal(res.statusCode, 422);
    assert.ok(res.body.error.includes('HTML'));
  } finally {
    global.fetch = original;
  }
});

test('método diferente de GET/POST responde 405', async () => {
  const res = await chamar({ method: 'PUT', headers: {} });
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, 'GET, POST');
});
