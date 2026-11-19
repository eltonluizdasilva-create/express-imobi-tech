/**
 * Tour guiado — regras de disparo único, textos e posicionamento.
 * Bundla o .tsx com esbuild (stubs de firebase) e testa em Node.
 */
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const raiz = process.cwd();
const saida = path.join(raiz, 'tests', '.tour.bundle.mjs');

const stubs = {
  name: 'stubs',
  setup(b) {
    b.onResolve({ filter: /^firebase\/firestore$/ }, () => ({ path: 'fs', namespace: 'stub' }));
    b.onResolve({ filter: /(^|\/)lib\/firebase(\.js)?$/ }, () => ({ path: 'fb', namespace: 'stub' }));
    b.onLoad({ filter: /^fs$/, namespace: 'stub' }, () => ({
      loader: 'js',
      contents: 'export const doc = () => ({}); export const updateDoc = async () => {};',
    }));
    b.onLoad({ filter: /^fb$/, namespace: 'stub' }, () => ({
      loader: 'js',
      contents: 'export const db = {};',
    }));
  },
};

await build({
  entryPoints: [path.join(raiz, 'src', 'components', 'OnboardingTour.tsx')],
  outfile: saida,
  bundle: true,
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  loader: { '.tsx': 'tsx', '.ts': 'ts' },
  external: ['react', 'react-dom', 'react-dom/server', 'react/jsx-runtime', 'lucide-react'],
  plugins: [stubs],
  logLevel: 'error',
});

const mod = await import(pathToFileURL(saida).href);
const React = (await import('react')).default;
const { renderToStaticMarkup } = await import('react-dom/server');

const {
  PASSOS_TOUR, TOTAL_PASSOS, chaveTour, lerTourConcluido, gravarTourConcluido,
  deveIniciarTour, textoBotaoPrimario, mostrarAnterior, rotuloProgresso,
  calcularPopover, TourPopover, default: OnboardingTour,
} = mod;

let falhas = 0;
const ok = (n, c, e = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${e ? ' — ' + e : ''}`); if (!c) falhas += 1; };

/* ------------------------------ roteiro --------------------------------- */
ok('5 passos', TOTAL_PASSOS === 5 && PASSOS_TOUR.length === 5);
const TITULOS = [
  '1. Conecte seu WhatsApp', '2. Seus Agentes Comerciais IA', '3. CRM e Carteira de Imóveis',
  '4. Fechamento Rápido na Visita', '5. Tudo pronto para vender mais',
];
ok('títulos na ordem', PASSOS_TOUR.map((p) => p.titulo).join('|') === TITULOS.join('|'));
ok('texto do passo 1 exato', PASSOS_TOUR[0].texto === 'Ligue seu número em segundos para os agentes de IA atenderem e qualificarem seus leads 24h por dia.');
ok('texto do passo 5 exato', PASSOS_TOUR[4].texto === 'Comece cadastrando seu primeiro imóvel ou ativando o atendimento automático no WhatsApp.');
ok('todo passo tem alvo', PASSOS_TOUR.every((p) => Array.isArray(p.alvos) && p.alvos.length > 0));
ok('alvos usam data-tour', PASSOS_TOUR.every((p) => p.alvos.every((a) => a.includes('data-tour'))));

/* --------------------------- persistência -------------------------------- */
ok('chave inclui uid', chaveTour('abc123') === 'express_imobi_tour_done_abc123');
ok('chave sem uid não quebra', chaveTour(null) === 'express_imobi_tour_done_anon');

const memoria = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
};
const s = memoria();
ok('começa não concluído', lerTourConcluido('u1', s) === false);
gravarTourConcluido('u1', s);
ok('grava com valor exato', s.getItem('express_imobi_tour_done_u1') === 'true');
ok('lê concluído', lerTourConcluido('u1', s) === true);
ok('outro uid não herda', lerTourConcluido('u2', s) === false);
ok('storage indisponível não quebra', lerTourConcluido('u1', { getItem() { throw new Error('x'); } }) === false);

/* ------------------------- regra de disparo único ------------------------ */
const base = { uid: 'u1', pronto: true, hasCompletedTour: false, jaConcluidoLocal: false, jaAbriuNaSessao: false };
ok('abre no primeiro acesso', deveIniciarTour(base) === true);
ok('não abre sem uid', deveIniciarTour({ ...base, uid: null }) === false);
ok('não abre antes do Firestore carregar', deveIniciarTour({ ...base, pronto: false }) === false);
ok('não abre se o tenant já marcou', deveIniciarTour({ ...base, hasCompletedTour: true }) === false);
ok('não abre se o localStorage marcou', deveIniciarTour({ ...base, jaConcluidoLocal: true }) === false);
ok('não reabre na mesma sessão', deveIniciarTour({ ...base, jaAbriuNaSessao: true }) === false);
ok('hasCompletedTour undefined não bloqueia', deveIniciarTour({ ...base, hasCompletedTour: undefined }) === true);

/* ------------------------------ controles -------------------------------- */
ok('progresso 1/5', rotuloProgresso(0) === '1/5');
ok('progresso 5/5', rotuloProgresso(4) === '5/5');
ok('progresso não estoura', rotuloProgresso(9) === '5/5');
ok('passo 1 sem Anterior', mostrarAnterior(0) === false);
ok('passo 2 com Anterior', mostrarAnterior(1) === true);
ok('Próximo até o 4', [0, 1, 2, 3].every((i) => textoBotaoPrimario(i) === 'Próximo'));
ok('passo 5 vira Começar agora', textoBotaoPrimario(4) === 'Começar agora');

/* ----------------------------- posicionamento ---------------------------- */
const vp = { width: 1280, height: 800 };
const abaixo = calcularPopover({ rect: { top: 100, left: 600, width: 120, height: 32 }, largura: 360, altura: 210, viewport: vp });
ok('posiciona abaixo quando cabe', abaixo.colocacao === 'baixo' && abaixo.top > 132);
const acima = calcularPopover({ rect: { top: 700, left: 600, width: 120, height: 32 }, largura: 360, altura: 210, viewport: vp });
ok('vira para cima quando falta espaço', acima.colocacao === 'cima' && acima.top < 700);
const centro = calcularPopover({ rect: null, largura: 360, altura: 210, viewport: vp });
ok('sem alvo centraliza', centro.colocacao === 'centro');
const esquerda = calcularPopover({ rect: { top: 100, left: 0, width: 40, height: 30 }, largura: 360, altura: 210, viewport: vp });
ok('não sai pela esquerda', esquerda.left >= 12);
const direita = calcularPopover({ rect: { top: 100, left: 1270, width: 10, height: 30 }, largura: 360, altura: 210, viewport: vp });
ok('não sai pela direita', direita.left + 360 <= vp.width);

/* --------------------------------- SSR ---------------------------------- */
const pop1 = renderToStaticMarkup(React.createElement(TourPopover, {
  passo: PASSOS_TOUR[0], indice: 0, rect: null, viewport: vp,
  onAnterior() {}, onProximo() {}, onIgnorar() {}, onFechar() {},
}));
ok('popover mostra contador', pop1.includes('1/5'));
ok('popover mostra título', pop1.includes('1. Conecte seu WhatsApp'));
ok('popover mostra texto', pop1.includes('Ligue seu número em segundos'));
ok('passo 1 esconde Anterior', !pop1.includes('>Anterior<'));
ok('tem Ignorar apresentação', pop1.includes('Ignorar apresentação'));
ok('tem botão X acessível', pop1.includes('aria-label="Fechar tour"'));
ok('tem Próximo', pop1.includes('>Próximo<'));

const pop5 = renderToStaticMarkup(React.createElement(TourPopover, {
  passo: PASSOS_TOUR[4], indice: 4, rect: null, viewport: vp,
  onAnterior() {}, onProximo() {}, onIgnorar() {}, onFechar() {},
}));
ok('passo 5 mostra 5/5', pop5.includes('5/5'));
ok('passo 5 tem Começar agora', pop5.includes('Começar agora') && !pop5.includes('>Próximo<'));
ok('passo 5 tem Anterior', pop5.includes('>Anterior<'));

const inativo = renderToStaticMarkup(React.createElement(OnboardingTour, {
  uid: 'u1', oficinaId: 'o1', pronto: false, hasCompletedTour: false,
}));
ok('inativo não renderiza nada', inativo === '');

/* ---------------------- conferência no código-fonte --------------------- */
const admin = readFileSync(new URL('../src/AdminNovo.jsx', import.meta.url), 'utf8');
const barra = readFileSync(new URL('../src/components/admin/BarraModulos.jsx', import.meta.url), 'utf8');
ok('AdminNovo importa o tour', admin.includes("import OnboardingTour from './components/OnboardingTour'"));
ok('AdminNovo renderiza com uid e oficinaId',
   admin.includes('<OnboardingTour') && admin.includes('hasCompletedTour={dadosImobiliaria?.hasCompletedTour}'));
ok('botão Refazer tour no cabeçalho', admin.includes('setTourManual(true)') && admin.includes('Refazer tour'));
ok('BarraModulos repassa data-tour', barra.includes('data-tour={dataTour}') && barra.includes('data-tour={btn.tour}'));
ok('4 abas marcadas no menu',
   ['tour: \'crm\'', "tour: 'agentes'", "tour: 'whatsapp'", "tour: 'fechamento'"].every((x) => admin.includes(x)));
ok('3 barras marcadas',
   ['dataTour="barra-essenciais"', 'dataTour="barra-pro"', 'dataTour="barra-ia"'].every((x) => admin.includes(x)));
ok('CTA central marcado como comecar', admin.includes('data-tour="comecar"'));

// não deixar bundle temporário na árvore de trabalho
try { (await import('node:fs')).unlinkSync(saida); } catch { /* já removido */ }

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
