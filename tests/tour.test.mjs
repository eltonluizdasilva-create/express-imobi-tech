/**
 * Tour guiado dinâmico — passos montados a partir das abas visíveis.
 * Bundla o .tsx com esbuild (stubs de firebase) e testa em Node.
 */
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { textoDor } from '../src/lib/copyAbas.js';

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
  chaveTour, lerTourConcluido, gravarTourConcluido, deveIniciarTour,
  textoBotaoPrimario, mostrarAnterior, rotuloProgresso, calcularPopover,
  montarPassosAbas, coletarAbasVisiveis, elementoVisivel, rotuloPadrao,
  TourPopover, default: OnboardingTour,
} = mod;

let falhas = 0;
const ok = (n, c, e = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${e ? ' — ' + e : ''}`); if (!c) falhas += 1; };

/* ----------------------- DOM falso para as pílulas ----------------------- */
const elo = (id, label, { visivel = true } = {}) => ({
  getAttribute: (n) => (n === 'data-tour' ? `tab-${id}` : null),
  getBoundingClientRect: () => (visivel ? { width: 90, height: 24, top: 10, left: 10 } : { width: 0, height: 0, top: 0, left: 0 }),
  querySelector: (sel) => (sel === 'span:last-child' ? { textContent: label } : null),
});
const docFalso = (els) => ({ querySelectorAll: () => els });

/* --------------------- coleta das abas visíveis -------------------------- */
const domCompleto = docFalso([
  elo('dashboard_imobi', ' Visão Geral'),
  elo('captacao_imobi', ' Captação & Imóveis'),
  elo('funil_leads', ' Leads & Funil CRM'),
  elo('credito', ' Correspondente / Crédito', { visivel: false }),
  elo('agentes_ia', ' 7 Agentes de IA'),
]);
const visiveis = coletarAbasVisiveis(domCompleto);
ok('coleta só as visíveis', visiveis.length === 4, String(visiveis.length));
ok('mantém a ordem do DOM', visiveis.map((a) => a.id).join() === 'dashboard_imobi,captacao_imobi,funil_leads,agentes_ia');
ok('remove espaços do rótulo', visiveis[0].label === 'Visão Geral', visiveis[0].label);
ok('ignora alvo oculto', !visiveis.some((a) => a.id === 'credito'));
ok('elementoVisivel detecta oculto', elementoVisivel(elo('x', 'X', { visivel: false })) === false);
ok('elementoVisivel aceita visível', elementoVisivel(elo('x', 'X')) === true);
ok('elementoVisivel tolera null', elementoVisivel(null) === false);
ok('coletar sem documento devolve []', coletarAbasVisiveis(null).length === 0);

/* ----------------------- montagem dos passos ----------------------------- */
const passos = montarPassosAbas(visiveis);
ok('um passo por aba visível', passos.length === visiveis.length);
ok('passo usa o rótulo da pílula', passos[0].titulo === 'Visão Geral');
ok('passo aponta para o data-tour da aba', passos[0].seletor === '[data-tour="tab-dashboard_imobi"]');
ok('texto vem do ganho da aba', passos[2].texto === textoDor('funil_leads').ganho, passos[2].texto);
ok('texto do WhatsApp é o ganho', montarPassosAbas([{ id: 'whatsapp_hub' }])[0].texto === textoDor('whatsapp_hub').ganho);
ok('rótulo ausente vira título legível', montarPassosAbas([{ id: 'funil_leads' }])[0].titulo === 'Funil Leads');
ok('ignora entrada sem id', montarPassosAbas([{ label: 'x' }, null, { id: 'config' }]).length === 1);
ok('rotuloPadrao capitaliza', rotuloPadrao('avaliacao_imovel') === 'Avaliacao Imovel');

/* modo enxuto: menos abas => menos passos => contador menor */
const enxuto = montarPassosAbas([
  { id: 'dashboard_imobi', label: 'Visão Geral' },
  { id: 'captacao_imobi', label: 'Captação & Imóveis' },
]);
ok('contador acompanha o total (2 passos)', rotuloProgresso(0, enxuto.length) === '1/2');
ok('último passo do enxuto é Começar agora', textoBotaoPrimario(1, enxuto.length) === 'Começar agora');

/* --------------------------- persistência -------------------------------- */
ok('chave inclui uid', chaveTour('abc123') === 'express_imobi_tour_done_abc123');
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

const base = { uid: 'u1', pronto: true, hasCompletedTour: false, jaConcluidoLocal: false, jaAbriuNaSessao: false };
ok('abre no primeiro acesso', deveIniciarTour(base) === true);
ok('não abre sem uid', deveIniciarTour({ ...base, uid: null }) === false);
ok('não abre antes do Firestore carregar', deveIniciarTour({ ...base, pronto: false }) === false);
ok('não abre se o tenant já marcou', deveIniciarTour({ ...base, hasCompletedTour: true }) === false);
ok('não abre se o localStorage marcou', deveIniciarTour({ ...base, jaConcluidoLocal: true }) === false);
ok('não reabre na mesma sessão', deveIniciarTour({ ...base, jaAbriuNaSessao: true }) === false);

/* ------------------------------ controles -------------------------------- */
ok('progresso 1/9', rotuloProgresso(0, 9) === '1/9');
ok('progresso 9/9', rotuloProgresso(8, 9) === '9/9');
ok('progresso não estoura', rotuloProgresso(20, 9) === '9/9');
ok('passo 1 sem Anterior', mostrarAnterior(0) === false);
ok('passo 2 com Anterior', mostrarAnterior(1) === true);
ok('Próximo antes do fim', textoBotaoPrimario(7, 9) === 'Próximo');
ok('último vira Começar agora', textoBotaoPrimario(8, 9) === 'Começar agora');

/* ----------------------------- posicionamento ---------------------------- */
const vp = { width: 1280, height: 800 };
const abaixo = calcularPopover({ rect: { top: 100, left: 600, width: 120, height: 32 }, largura: 360, altura: 210, viewport: vp });
ok('posiciona abaixo quando cabe', abaixo.colocacao === 'baixo' && abaixo.top > 132);
const acima = calcularPopover({ rect: { top: 700, left: 600, width: 120, height: 32 }, largura: 360, altura: 210, viewport: vp });
ok('vira para cima quando falta espaço', acima.colocacao === 'cima' && acima.top < 700);
ok('sem alvo centraliza', calcularPopover({ rect: null, largura: 360, altura: 210, viewport: vp }).colocacao === 'centro');
ok('não sai pela esquerda', calcularPopover({ rect: { top: 100, left: 0, width: 40, height: 30 }, largura: 360, altura: 210, viewport: vp }).left >= 12);
const dir = calcularPopover({ rect: { top: 100, left: 1270, width: 10, height: 30 }, largura: 360, altura: 210, viewport: vp });
ok('não sai pela direita', dir.left + 360 <= vp.width);

/* --------------------------------- SSR ---------------------------------- */
const pop1 = renderToStaticMarkup(React.createElement(TourPopover, {
  passo: passos[0], indice: 0, total: passos.length, rect: null, viewport: vp,
  onAnterior() {}, onProximo() {}, onIgnorar() {}, onFechar() {},
}));
ok('popover mostra contador dinâmico', pop1.includes('1/4'));
ok('popover mostra o título da aba', pop1.includes('Visão Geral'));
ok('popover mostra o ganho', pop1.includes(textoDor('dashboard_imobi').ganho.slice(0, 25)));
ok('passo 1 esconde Anterior', !pop1.includes('>Anterior<'));
ok('tem Ignorar apresentação', pop1.includes('Ignorar apresentação'));
ok('tem botão X acessível', pop1.includes('aria-label="Fechar tour"'));

const popFim = renderToStaticMarkup(React.createElement(TourPopover, {
  passo: passos[3], indice: 3, total: 4, rect: null, viewport: vp,
  onAnterior() {}, onProximo() {}, onIgnorar() {}, onFechar() {},
}));
ok('último passo mostra N/N', popFim.includes('4/4'));
ok('último passo tem Começar agora', popFim.includes('Começar agora') && !popFim.includes('>Próximo<'));
ok('último passo tem Anterior', popFim.includes('>Anterior<'));

const inativo = renderToStaticMarkup(React.createElement(OnboardingTour, {
  uid: 'u1', oficinaId: 'o1', pronto: false, hasCompletedTour: false,
}));
ok('inativo não renderiza nada', inativo === '');

/* ---------------------- conferência no código-fonte --------------------- */
const fonteTour = readFileSync(new URL('../src/components/OnboardingTour.tsx', import.meta.url), 'utf8');
const admin = readFileSync(new URL('../src/AdminNovo.jsx', import.meta.url), 'utf8');
const barra = readFileSync(new URL('../src/components/admin/BarraModulos.jsx', import.meta.url), 'utf8');

ok('sem roteiro fixo de 5 passos', !fonteTour.includes('PASSOS_TOUR') && !fonteTour.includes('TOTAL_PASSOS'));
ok('tour coleta as abas do DOM', fonteTour.includes('coletarAbasVisiveis(document)'));
ok('tour pula alvo invisível', fonteTour.includes('elementoVisivel(elemento)'));
ok('barra emite data-tour por aba', barra.includes('data-tour={`tab-${btn.id}`}'));
ok('barra aceita temaClaro', barra.includes('temaClaro = false'));
ok('barra tem classes claras nas inativas',
   barra.includes('border-slate-300 bg-white text-slate-800'));
ok('AdminNovo passa temaClaro para as três barras', (admin.match(/temaClaro=\{!isEscuro\}/g) || []).length === 3);
ok('AdminNovo alterna a visão', admin.includes('onClick={() => setModoPro(false)}') && admin.includes('onClick={() => setModoPro(true)}'));
ok('AdminNovo mantém o botão Refazer tour', admin.includes('setTourManual(true)'));
ok('AdminNovo renderiza o tour', admin.includes('<OnboardingTour') && admin.includes('hasCompletedTour={dadosImobiliaria?.hasCompletedTour}'));

// limpa o bundle temporário
try { (await import('node:fs')).unlinkSync(saida); } catch { /* já removido */ }

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
