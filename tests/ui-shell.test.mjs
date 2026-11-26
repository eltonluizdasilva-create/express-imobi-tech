/** Casca do painel: logo, distribuição dos botões flutuantes e contraste. */
import { readFileSync } from 'node:fs';

let falhas = 0;
const ok = (n, c, e = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${e ? ' — ' + e : ''}`); if (!c) falhas += 1; };

const admin = readFileSync(new URL('../src/AdminNovo.jsx', import.meta.url), 'utf8');
const flutuantes = readFileSync(new URL('../src/components/FloatingButtons.jsx', import.meta.url), 'utf8');
const barra = readFileSync(new URL('../src/components/admin/BarraModulos.jsx', import.meta.url), 'utf8');
const logo = readFileSync(new URL('../src/components/ui/LogoExpress.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

/* ------------------------------- logo ----------------------------------- */
ok('AdminNovo usa o LogoExpress', admin.includes("import LogoExpress from './components/ui/LogoExpress'") && admin.includes('<LogoExpress />'));
ok('header não usa mais o quadrado com Building2', !/style=\{\{ backgroundColor: '#10b981' \}\} className="w-9 h-9 rounded-xl/.test(admin));
ok('logo tem glifo próprio (svg)', logo.includes('<svg') && logo.includes('viewBox="0 0 24 24"'));
ok('logo usa gradiente da marca', logo.includes('linear-gradient(135deg, #34d399'));
ok('logo tem wordmark em três pesos', logo.includes('EXPRESS') && logo.includes('Imobi') && logo.includes('Tech'));
ok('wordmark tem classe para o tema claro', logo.includes('logo-accent'));
ok('CSS escurece o degradê no tema claro', /\.tema-claro \.logo-accent\s*\{[\s\S]{0,200}#047857/.test(css));
ok('logo escala pequeno/grande', logo.includes("tamanho === 'sm'") && logo.includes("tamanho === 'lg'"));

/* --------------------- hub flutuante unificado (sofia • zara • tom) ------- */
ok('hub tem botão único no canto inferior direito',
   flutuantes.includes('bottom-4 right-4') && flutuantes.includes('md:bottom-6 md:right-6'));
ok('rótulo do botão destaca Sofia • Zara • Tom',
   flutuantes.includes('Sofia • Zara • Tom'));
ok('possui as 3 personas configuradas',
   flutuantes.includes("id: 'sofia'") && flutuantes.includes("id: 'zara'") && flutuantes.includes("id: 'tom'"));
ok('sofia tem foco em suporte e guia da plataforma',
   flutuantes.includes('Suporte & Guia da Plataforma') && flutuantes.includes('Suporte 100% Liberado'));
ok('zara tem auditoria de rotina e precificação',
   flutuantes.includes('Agentes Operacionais & Funil') && flutuantes.includes('349'));
ok('tom tem segundo cérebro e precificação',
   flutuantes.includes('Segundo Cérebro da Imobiliária') && flutuantes.includes('197'));
ok('possui controle de modo demonstração (limite 5)',
   flutuantes.includes('Modo Demonstração') && flutuantes.includes('5'));
ok('sofia integra guia contextual da aba ativa',
   flutuantes.includes('guiaAbaAberto') && flutuantes.includes('dorGanhoAbaAtual'));

/* ------------------- espaço no fim da página (mobile) ------------------- */
ok('conteúdo não fica embaixo dos botões',
   admin.includes('pb-40 md:pb-24') && !admin.includes("paddingBottom: '90px'"));

/* --------------------- contraste das pílulas (tema claro) ---------------- */
ok('pílula inativa clara tem fundo branco e texto escuro',
   barra.includes('border-slate-300 bg-white text-slate-800'));
ok('pílula ativa clara inverte o contraste',
   barra.includes('border-slate-900 bg-slate-900 text-white'));
ok('barra muda de superfície no tema claro', barra.includes("temaClaro ? 'border-slate-200 bg-slate-50'"));

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
