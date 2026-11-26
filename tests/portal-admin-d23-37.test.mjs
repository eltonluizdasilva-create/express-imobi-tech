/**
 * D-23.37 — crash React #310 no /admin, tela de login limpa e portal ligado
 * aos motores reais (vitrine com cidade, guia interno, vistoria por código+PIN,
 * simuladores com os mesmos cálculos do sistema).
 *
 * Testes de código-fonte (determinísticos, sem browser): garantem a ordem dos
 * hooks, a ausência do banner de vídeo e a fiação das coleções/motores.
 */
import { readFileSync } from 'node:fs';

let falhas = 0;
const ok = (nome, condicao, extra = '') => {
  console.log(`${condicao ? 'PASS' : 'FAIL'}  ${nome}${extra ? ' — ' + extra : ''}`);
  if (!condicao) falhas += 1;
};

const ler = (relativo) => readFileSync(new URL(`../${relativo}`, import.meta.url), 'utf8');

const admin = ler('src/AdminNovo.jsx');
const app = ler('src/App.jsx');
const login = ler('src/LoginAdmin.jsx');
const portal = ler('src/PortalCliente.jsx');
const vistoriaChaves = ler('src/lib/vistoriaChaves.js');
const vistoriaUi = ler('src/components/imobi/VistoriaEntregaChaves.jsx');

/* ------------------------- 1. crash React #310 -------------------------- */
const indiceMemoPilar = admin.indexOf('const pilarAbaAtiva = useMemo(');
const indicePrimeiroReturn = admin.indexOf('if (carregandoAuth || (logado && !dadosImobiliaria)) {');

ok('AdminNovo define pilarAbaAtiva com useMemo', indiceMemoPilar > 0);
ok(
  'useMemo(pilarAbaAtiva) fica ANTES do primeiro return condicional',
  indiceMemoPilar > 0 && indicePrimeiroReturn > 0 && indiceMemoPilar < indicePrimeiroReturn,
  `memo@${indiceMemoPilar} return@${indicePrimeiroReturn}`,
);

const trechoDepoisDosReturns = admin.slice(indicePrimeiroReturn);
ok(
  'nenhum hook é chamado depois do return de carregamento/login (ordem estável)',
  !/\b(useState|useEffect|useMemo|useCallback|useRef)\s*\(/.test(trechoDepoisDosReturns),
);
ok(
  'AdminNovo explica a causa no comentário (Rendered more hooks)',
  admin.includes('Rendered more hooks than during the previous render'),
);

/* --------------------------- 2. ErrorBoundary --------------------------- */
ok('ErrorBoundary não culpa a rede em erro de renderização', !app.includes('instabilidade na sua rede'));
ok('ErrorBoundary classifica o erro capturado', app.includes('function classificarErro('));
ok(
  'ErrorBoundary separa falha de módulo de exceção de render',
  app.includes("tipo: 'modulo'") && app.includes("tipo: 'render'"),
);
ok(
  'ErrorBoundary mostra título de erro de renderização e mantém o detalhe técnico',
  app.includes('Erro ao renderizar esta tela') && app.includes('Detalhe técnico:'),
);
ok('ErrorBoundary detecta a mensagem minificada do React', app.includes('Minified React error'));
ok('ErrorBoundary mantém o botão de recarregar', app.includes('Recarregar Página'));

/* ---------------------------- 3. /login-admin --------------------------- */
ok(
  'login-admin não tem mais o botão COMO USAR O SISTEMA',
  !login.includes('COMO USAR O SISTEMA') && !login.includes('u5ufl4IrzlA') && !login.includes('youtu'),
);
ok(
  'login-admin mantém o link discreto de volta ao portal',
  login.includes('← VOLTAR AO PORTAL DO CLIENTE') && login.includes('href="/portal"'),
);

/* ------------------------- 4. vitrine com cidade ------------------------ */
ok(
  'vitrine tem estado de cidade, busca e filtro por imobiliária',
  portal.includes("const [cidadeFiltro, setCidadeFiltro] = useState('Todas')") &&
    portal.includes('const [buscaVitrine, setBuscaVitrine] = useState') &&
    portal.includes('const [filtroImobiliaria, setFiltroImobiliaria] = useState'),
);
ok(
  'cidades são geradas dos imóveis publicados',
  portal.includes('const cidadesVitrine = Array.from(') && portal.includes('imovel?.cidade || imovel?.municipio'),
);
ok('busca filtra por título/bairro/código', portal.includes('const imoveisFiltrados = (imoveisVitrine || []).filter('));
ok(
  '?imob= restringe a vitrine à imobiliária do link',
  portal.includes("params.get('imob')") && portal.includes('setFiltroImobiliaria(imobiliariaIdDireto)'),
);
ok(
  'banner de demonstração desaparece com pelo menos 1 imóvel real',
  portal.includes('const temImovelRealPublicado = imoveisReaisPublicados.length > 0') &&
    portal.includes('vitrineEmDemonstracao && !temImovelRealPublicado'),
);
ok('vitrine com filtro de tenant não cai no cenário fictício', portal.includes('setImoveisVitrine(porImobiliaria)'));

/* ------------------- 5. guia reaproveita a base interna ----------------- */
ok(
  'portal importa o checklist interno de cartório',
  portal.includes("import { CHECKLIST_CERTIDOES, CHECKLIST_ESCRITURA } from './lib/cartorioEscritura'"),
);
ok(
  'guia monta os itens a partir das certidões e da escritura internas',
  portal.includes('function itensCertidoesInternas()') &&
    portal.includes('function itensEscrituraInternas()') &&
    portal.includes('itens: [...itensCertidoesInternas(), ...itensEscrituraInternas(), ...DOCUMENTOS_PESSOAIS]'),
);
ok(
  'locação usa os ambientes da vistoria interna',
  portal.includes("import { AMBIENTES_PADRAO, calcularResumoChecklist } from './lib/vistoriaChaves'") &&
    portal.includes('AMBIENTES_PADRAO.join'),
);
ok('guia antigo duplicado (GUIAS_DOCUMENTACAO) foi removido', !portal.includes('GUIAS_DOCUMENTACAO'));

/* ---------------- 6. vistoria/dossiê nas coleções reais ---------------- */
ok(
  'portal consulta acompanhamentos_publicos por código + PIN',
  portal.includes("doc(db, 'acompanhamentos_publicos', idPublico)") && portal.includes('docIdDe(cod, chave)'),
);
ok('portal consulta vistorias_chaves do tenant', portal.includes("doc(db, 'oficinas', imobiliariaId, 'vistorias_chaves', cod)"));
ok(
  'formulário de vistoria pede PIN de 4 dígitos',
  portal.includes('const [pinBusca, setPinBusca] = useState(pinInicial') && portal.includes('PIN de 4 dígitos *'),
);
ok(
  'resultado mostra progresso e laudo normalizados',
  portal.includes('function normalizarAcompanhamentoPublico(') &&
    portal.includes('function normalizarLaudoVistoria(') &&
    portal.includes('Conformidade do laudo'),
);
ok(
  'dossiê do portal inclui andamento e laudo por PIN',
  portal.includes("categoria: 'Andamento do Processo • Cartório & Crédito'") &&
    portal.includes("categoria: 'Laudo de Vistoria & Entrega de Chaves'"),
);
ok(
  'lib de vistoria publica o espelho em acompanhamentos_publicos',
  vistoriaChaves.includes('export async function publicarLaudoVistoria(') &&
    vistoriaChaves.includes("setDoc(doc(db, 'acompanhamentos_publicos', id)") &&
    vistoriaChaves.includes('export function docIdLaudoPublico('),
);
ok(
  'tela de vistoria do painel tem botão Publicar no Portal',
  vistoriaUi.includes('publicarNoPortal') && vistoriaUi.includes('Publicar no Portal'),
);

/* ---------------------- 7. simuladores com motor único ----------------- */
ok(
  'simulador usa parcelaPrice/parcelaSac do sistema',
  portal.includes("import { parcelaPrice, parcelaSac, prazoMaximoPorIdade } from './lib/travas-legais'") &&
    portal.includes('parcelaSac(financiado, taxaAnual, meses)') &&
    portal.includes('parcelaPrice(financiado, taxaAnual, meses)'),
);
ok(
  'ROI usa o motor de rentabilidade compartilhado',
  portal.includes("import { TAXA_VACANCIA_ADMINISTRACAO, calcularRentabilidadeImovel } from './lib/rentabilidade'") &&
    portal.includes('calcularRentabilidadeImovel({'),
);
ok(
  'captura de lead do CRM continua nos simuladores',
  (portal.match(/registrarLeadNoCRM\(\{/g) || []).length >= 4,
);

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
