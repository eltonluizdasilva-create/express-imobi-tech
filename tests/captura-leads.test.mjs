/**
 * captura-leads.test.mjs — contrato da captura de leads por região.
 * Roda o servico REAL (transpilado do .ts com esbuild) contra um fetch falso:
 * valida paginação, CSV, validação de entrada e a tradução de cada erro.
 */
import { readFileSync } from 'node:fs';
import { buildSync } from 'esbuild';

let falhas = 0;
const ok = (nome, condicao, extra = '') => {
  console.log(`${condicao ? 'PASS' : 'FAIL'}  ${nome}${extra ? ' — ' + extra : ''}`);
  if (!condicao) falhas += 1;
};

const raiz = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/* --------- transpila o servico .ts para ESM e importa de verdade --------- */
const fonte = readFileSync(`${raiz}/src/services/mapsScraperService.ts`, 'utf8');
const transpilado = buildSync({
  stdin: { contents: fonte, loader: 'ts', resolveDir: `${raiz}/src/services` },
  format: 'esm',
  platform: 'neutral',
  write: false,
  target: 'es2022',
}).outputFiles[0].text;

const svc = await import(
  `data:text/javascript;base64,${Buffer.from(transpilado, 'utf8').toString('base64')}`
);

/* ------------------------------ validação -------------------------------- */
ok('validação exige endereço com 3+ caracteres', svc.validarParams({ endereco: 'ab', raio: 500, objetivo: 'comercial' }) !== null);
ok('validação aceita busca normal', svc.validarParams({ endereco: 'Uberlândia - MG', raio: 1000, objetivo: 'comercial' }) === null);
ok('validação rejeita raio fora da faixa', svc.validarParams({ endereco: 'Uberlândia', raio: 99999, objetivo: 'entorno' }) !== null);
ok('validação rejeita objetivo inventado', svc.validarParams({ endereco: 'Uberlândia', raio: 500, objetivo: 'outro' }) !== null);

/* ------------------------------- endpoint -------------------------------- */
ok('endpoint padrão é /api/places', svc.resolverEndpoint() === '/api/places');
ok('modo webhook externo desligado por padrão', svc.usandoWebhookExterno() === false);

/* ------------------------------ paginação -------------------------------- */
const cem = Array.from({ length: 20 }, (_, i) => ({ placeId: `p${i}` }));
const pagina1 = svc.paginar(cem, 1, 8);
const pagina3 = svc.paginar(cem, 3, 8);
ok('paginação: 8 por página', pagina1.itens.length === 8);
ok('paginação: calcula total de páginas', pagina1.totalPaginas === 3, String(pagina1.totalPaginas));
ok('paginação: última página tem o resto', pagina3.itens.length === 4, String(pagina3.itens.length));
ok('paginação: corrige página alta', svc.paginar(cem, 99, 8).pagina === 3);
ok('paginação: corrige página zero', svc.paginar(cem, 0, 8).pagina === 1);
ok('paginação: lista vazia gera 1 página', svc.paginar([], 1, 8).totalPaginas === 1);

/* --------------------------------- CSV ----------------------------------- */
const amostra = [
  {
    placeId: 'x1',
    nome: 'Padaria "Pão Quente"',
    categoria: 'Padaria',
    endereco: 'Rua A, 10; Centro',
    avaliacao: 4.6,
    totalAvaliacoes: 120,
    status: 'OPERATIONAL',
    telefone: '(34) 99999-0000',
    site: 'https://pao.com.br',
    lat: -18.9,
    lng: -48.2,
  },
];
const csv = svc.exportarCsv(amostra);
ok('CSV começa com BOM (Excel pt-BR)', csv.charCodeAt(0) === 0xfeff);
ok('CSV usa ponto e vírgula', csv.includes('Padaria') && csv.includes(';'));
ok('CSV escapa aspas duplas', csv.includes('""Pão Quente""'));
ok('CSV preserva ponto e vírgula do endereço', csv.includes('"Rua A, 10; Centro"'));
ok('CSV tem cabeçalho completo', csv.includes('Nome;Categoria;Endereco') && csv.includes('Telefone;Site'));

/* ------------------------------ rótulos ---------------------------------- */
ok('rótulo de nota com contagem', svc.rotuloAvaliacao({ avaliacao: 4.5, totalAvaliacoes: 10 }) === '4.5 ★ (10)');
ok('rótulo sem nota', svc.rotuloAvaliacao({ avaliacao: null, totalAvaliacoes: 0 }) === 'Sem nota');
ok('status fechado permanente', svc.rotuloStatus({ status: 'CLOSED_PERMANENTLY' }) === 'Fechado');

/* --------------------- captura com fetch falso --------------------------- */
const itemBruto = {
  placeId: 'p1',
  nome: 'Mercado Central',
  categoria: 'Mercado',
  endereco: 'Av. B, 200',
  avaliacao: 4.2,
  totalAvaliacoes: 88,
  status: 'OPERATIONAL',
  telefone: '',
  site: '',
  lat: -18.9,
  lng: -48.2,
};

const respostaOk = {
  ok: true,
  centro: { enderecoFormatado: 'Uberlândia - MG', lat: -18.9, lng: -48.2 },
  raio: 1000,
  objetivo: 'comercial',
  tipos: ['store'],
  total: 1,
  encontrados: 1,
  truncado: false,
  buscas: [{ tipo: 'store', quantidade: 1 }],
  itens: [itemBruto],
  avisos: [],
};

const fetchOriginal = globalThis.fetch;

function comFetch(resposta, status = 200, corpoCustom) {
  globalThis.fetch = async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(corpoCustom ?? resposta),
  });
}

const params = { endereco: 'Uberlândia - MG', raio: 1000, objetivo: 'comercial' };

comFetch(respostaOk);
const sucesso = await svc.capturarLeads(params, { getToken: async () => 'token-falso' });
ok('captura devolve itens normalizados', sucesso.itens.length === 1 && sucesso.itens[0].nome === 'Mercado Central');
ok('captura expõe total e centro', sucesso.total === 1 && sucesso.centro.enderecoFormatado === 'Uberlândia - MG');

async function esperaErro(codigoEsperado, rotulo) {
  try {
    await svc.capturarLeads(params, {});
    ok(rotulo, false, 'não lançou erro');
  } catch (e) {
    ok(rotulo, e instanceof svc.CapturaError && e.codigo === codigoEsperado, `${e.codigo}`);
  }
}

comFetch({ ok: false, code: 'cota', error: 'sem cota' }, 429);
await esperaErro('cota', 'traduz 429 em erro de cota');

comFetch({ ok: false, code: 'nao_autorizado', error: 'sem sessao' }, 401);
await esperaErro('nao_autorizado', 'traduz 401 em sessão inválida');

comFetch({ ok: false, code: 'sem_config', error: 'sem chave' }, 503);
await esperaErro('sem_config', 'traduz 503 em falta de configuração');

comFetch({ ok: false, code: 'endereco_nao_encontrado' }, 422);
await esperaErro('sem_resultado', 'traduz 422 em endereço não localizado');

comFetch({ ...respostaOk, itens: [], total: 0 }, 200);
await esperaErro('sem_resultado', 'lista vazia vira sem_resultado');

globalThis.fetch = async () => {
  const erro = new Error('aborted');
  erro.name = 'AbortError';
  throw erro;
};
await esperaErro('tempo', 'abort/timeout vira erro de tempo');

globalThis.fetch = async () => {
  throw new Error('ECONNREFUSED');
};
await esperaErro('rede', 'falha de rede não quebra o estado global');

globalThis.fetch = fetchOriginal;

/* ------------------------------ estático --------------------------------- */
const api = readFileSync(`${raiz}/api/places.js`, 'utf8');
const auth = readFileSync(`${raiz}/api/_authToken.js`, 'utf8');
const wrapper = readFileSync(`${raiz}/src/components/prospeccao/CapturaLeadsMaps.jsx`, 'utf8');
const modal = readFileSync(`${raiz}/src/components/prospeccao/ModalCapturaLeads.jsx`, 'utf8');
const radar = readFileSync(`${raiz}/src/components/imobi/RadarCaptacao.jsx`, 'utf8');

ok('endpoint lê a chave do servidor', api.includes('process.env.GOOGLE_MAPS_API_KEY'));
ok('endpoint exige token do Firebase', api.includes('verificarIdToken(req.headers?.authorization)'));
ok('verificador usa certificados do Google', auth.includes('securetoken@system.gserviceaccount.com'));
ok('verificador confere audiência do projeto', auth.includes('claims.aud !== PROJETO'));
ok('endpoint usa Places API (New)', api.includes('places.googleapis.com/v1/places:searchNearby'));
ok('endpoint respeita o raio como círculo', api.includes('locationRestriction') && api.includes('circle'));

const semComentarios = fonte
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
ok('front (código, sem comentários) não toca em chave do Google', !/GOOGLE_MAPS_API_KEY|VITE_GOOGLE/.test(semComentarios));
ok('front não lê process.env', !/process\.env/.test(semComentarios));
ok('front usa o webhook configurável', readFileSync(`${raiz}/src/services/mapsScraperService.ts`, 'utf8').includes('VITE_MAPS_WEBHOOK_URL'));
ok('botão carrega o modal por lazy', wrapper.includes("lazy(() => import('./ModalCapturaLeads'))"));
ok('botão é memoizado', wrapper.includes('export default memo('));
ok('modal tem os dois objetivos', modal.includes('Prospecção comercial') && modal.includes('Entorno imobiliário'));
ok('modal executa varredura com loading', modal.includes('Executar Varredura') && modal.includes('Varrendo região'));
ok('modal salva no CRM', modal.includes("collection(db, 'oficinas', oficinaId, 'leads')"));
ok('modal exporta CSV', modal.includes('exportarCsv'));
ok('modal encerra por Esc e backdrop', modal.includes("e.key === 'Escape'") && modal.includes('e.target === e.currentTarget'));
ok('botão integrado ao Radar de Captação', radar.includes('<CapturaLeadsMaps oficinaId={tenantId}'));


/* ══════════ endpoint sem chave: OpenStreetMap (Nominatim + Overpass) ══════ */
process.env.GOOGLE_MAPS_API_KEY = '';
process.env.PLACES_REQUIRE_AUTH = 'false';

const apiFonte = readFileSync(`${raiz}/api/places.js`, 'utf8');
const apiBundle = buildSync({
  stdin: { contents: apiFonte, loader: 'js', resolveDir: `${raiz}/api` },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  target: 'es2022',
  external: ['node:crypto'],
}).outputFiles[0].text;

const { default: handlerPlaces, montarConsultaOverpass } = await import(
  `data:text/javascript;base64,${Buffer.from(apiBundle, 'utf8').toString('base64')}`
);

function respostaFalsa() {
  return {
    statusCode: 0,
    corpo: null,
    status(c) {
      this.statusCode = c;
      return this;
    },
    json(o) {
      this.corpo = o;
      return this;
    },
  };
}

function stubFetch(rotas) {
  globalThis.fetch = async (entrada) => {
    const url = String(entrada);
    for (const [chave, valor] of Object.entries(rotas)) {
      if (!url.includes(chave)) continue;
      const r = typeof valor === 'function' ? valor(url) : valor;
      const status = r.status ?? 200;
      return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => r.body,
        text: async () => JSON.stringify(r.body),
      };
    }
    return { ok: false, status: 404, json: async () => ({}), text: async () => '{}' };
  };
}

const consulta = montarConsultaOverpass(-18.9186, -48.2772, 1000, 'comercial');
ok('Overpass QL põe o filtro espacial antes da tag', consulta.includes('nwr(around:1000,-18.918600,-48.277200)["shop"='));
ok('Overpass QL não usa regex (índice, não varredura)', !consulta.includes('~"'));
ok('Overpass QL tem timeout e saída JSON', consulta.startsWith('[out:json][timeout:20]'));

/* (a) caminho feliz: Nominatim + Overpass */
stubFetch({
  'nominatim.openstreetmap.org': {
    body: [{ lat: '-18.9186', lon: '-48.2772', display_name: 'Av. Afonso Pena, Uberlândia - MG' }],
  },
  'api/interpreter': {
    body: {
      elements: [
        {
          type: 'node',
          id: 11,
          lat: -18.9188,
          lon: -48.2775,
          tags: { name: 'Padaria Pão Quente', shop: 'bakery', 'addr:street': 'Rua A', 'addr:housenumber': '10', phone: '34999990000' },
        },
        { type: 'way', id: 22, center: { lat: -18.919, lon: -48.278 }, tags: { name: 'Mercado Bom', shop: 'supermarket', 'addr:city': 'Uberlândia' } },
        { type: 'node', id: 33, lat: -18.92, lon: -48.28, tags: { shop: 'bakery' } },
      ],
    },
  },
});

const r1 = respostaFalsa();
await handlerPlaces({ method: 'POST', headers: {}, body: JSON.stringify({ endereco: 'Av. Afonso Pena, 1000, Uberlândia - MG', raio: 1000, objetivo: 'comercial' }) }, r1);

ok('sem chave: responde 200 pelo OpenStreetMap', r1.statusCode === 200 && r1.corpo?.ok === true, `HTTP ${r1.statusCode}`);
ok('sem chave: provedor marcado como openstreetmap', r1.corpo?.provedor === 'openstreetmap');
ok('sem chave: Overpass é a fonte principal', r1.corpo?.fonte?.nome?.includes('Overpass') && r1.corpo?.fonte?.usouFallback === false);
ok('sem chave: itens normalizados (padaria e mercado)', (r1.corpo?.itens || []).length === 2, String((r1.corpo?.itens || []).length));
const padaria = (r1.corpo?.itens || []).find((i) => i.nome === 'Padaria Pão Quente');
ok('categoria traduzida (bakery -> Padaria)', padaria?.categoria === 'Padaria');
ok('endereço montado com rua e número', padaria?.endereco === 'Rua A, 10');
ok('telefone do OSM preservado', padaria?.telefone === '34999990000');
ok('id no formato osm:tipo/id', padaria?.placeId === 'osm:node/11');
ok('sem nota no OSM (avaliacao null)', padaria?.avaliacao === null && padaria?.totalAvaliacoes === 0);
ok('item sem nome é descartado', !(r1.corpo?.itens || []).some((i) => i.placeId === 'osm:node/33'));
ok('aviso explica a fonte aberta', (r1.corpo?.avisos || []).some((a) => a.includes('OpenStreetMap')));

/* (b) Overpass fora: cai no Photon */
stubFetch({
  'nominatim.openstreetmap.org': { body: [{ lat: '-18.9186', lon: '-48.2772', display_name: 'Uberlândia - MG' }] },
  'api/interpreter': { status: 429, body: { remark: 'runtime error' } },
  'photon.komoot.io': {
    body: {
      features: [
        {
          properties: { osm_type: 'W', osm_id: 999, osm_key: 'shop', osm_value: 'supermarket', name: 'Supermercado BH', street: 'Av. Afonso Pena', district: 'Umuarama', city: 'Uberlândia' },
          geometry: { coordinates: [-48.2773, -18.9187] },
        },
        {
          properties: { osm_type: 'N', osm_id: 1000, osm_key: 'shop', osm_value: 'supermarket', name: 'Longe Demais' },
          geometry: { coordinates: [-48.40, -19.05] },
        },
      ],
    },
  },
});

const r2 = respostaFalsa();
await handlerPlaces({ method: 'POST', headers: {}, body: JSON.stringify({ endereco: 'Uberlândia - MG', raio: 1000, objetivo: 'comercial' }) }, r2);

ok('Overpass fora: ainda responde 200', r2.statusCode === 200 && r2.corpo?.ok === true, `HTTP ${r2.statusCode}`);
ok('Overpass fora: usa a alternativa Photon', r2.corpo?.fonte?.usouFallback === true && r2.corpo?.fonte?.nome?.includes('Photon'));
ok('Overpass fora: descarta POI fora do raio', (r2.corpo?.itens || []).length === 1 && r2.corpo.itens[0].nome === 'Supermercado BH');
ok('Overpass fora: avisa que a fonte foi alternativa', (r2.corpo?.avisos || []).some((a) => a.includes('busca alternativa')));

/* (c) endereço não encontrado */
stubFetch({ 'nominatim.openstreetmap.org': { body: [] } });
const r3 = respostaFalsa();
await handlerPlaces({ method: 'POST', headers: {}, body: JSON.stringify({ endereco: 'Rua Que Nao Existe, 999', raio: 500, objetivo: 'comercial' }) }, r3);
ok('endereço inexistente devolve 422 com código estável', r3.statusCode === 422 && r3.corpo?.code === 'endereco_nao_encontrado');

/* (d) espelho suíço não entra na lista (devolvia 0 resultados para o Brasil) */
ok('espelhos do Overpass são globais', !/osm\.ch/.test(apiFonte) && /kumi\.systems/.test(apiFonte));

/* (e) a chave nunca aparece na resposta */
process.env.GOOGLE_MAPS_API_KEY = 'chave-secreta-de-teste-123';
const bundleComChave = buildSync({
  stdin: { contents: readFileSync(`${raiz}/api/places.js`, 'utf8'), loader: 'js', resolveDir: `${raiz}/api` },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  target: 'es2022',
  external: ['node:crypto'],
}).outputFiles[0].text;
// o data: URL precisa ser único, senão o Node reaproveita o módulo já importado
const unico = `${bundleComChave}\n/* instancia ${Date.now()} */`;
const { default: handlerComChave } = await import(
  `data:text/javascript;base64,${Buffer.from(unico, 'utf8').toString('base64')}`
);
const rDiag = respostaFalsa();
await handlerComChave({ method: 'GET' }, rDiag);
ok('diagnóstico reconhece a chave', rDiag.corpo?.configurado === true && rDiag.corpo?.provedor === 'google');
ok('diagnóstico não revela a chave', !JSON.stringify(rDiag.corpo).includes('chave-secreta-de-teste-123'));
process.env.GOOGLE_MAPS_API_KEY = '';

globalThis.fetch = fetchOriginal;

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
