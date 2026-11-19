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
ok('endpoint não devolve a chave', !/json\([^)]*KEY[^)]*\)/.test(api.replace(/configurado: Boolean\(KEY\)/g, '')));
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

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
