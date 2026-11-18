/** Copy comercial + gate do alternador de demo. */
import { readFileSync } from 'node:fs';
import { DOR_SOLUCAO, DOR_PADRAO, textoDor, ABAS_COM_COPY, VERSAO_COPY as VERSAO_SELO } from '../src/lib/copyAbas.js';
import {
  ehMasterPlataforma, modoProEfetivo, rotuloModo, mostrarAlternadorDemo, mostrarBotaoUpgrade,
} from '../src/lib/acesso-plano.js';
import { HERO_ABAS, heroDaAba } from '../src/lib/coresAbas.js';

let falhas = 0;
const ok = (n, c, e = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${e ? ' — ' + e : ''}`); if (!c) falhas += 1; };

const COBERTURA = [
  ['dashboard_imobi', 'Visão Geral'],
  ['captacao_imobi', 'Captação & Imóveis'],
  ['funil_leads', 'Leads & Funil'],
  ['visitas_imobi', 'Agenda'],
  ['financeiro', 'Financeiro'],
  ['historico', 'Propostas'],
  ['marketing', 'Meta Ads & Criativos'],
  ['tarefa', 'Vistoria IA'],
  ['notafiscal', 'Repasses'],
  ['avaliacao_imovel', 'Avaliação PTAM'],
  ['credito', 'Correspondente/Crédito'],
  ['agentes_ia', 'Esquadrão de IA'],
];

/* ------------------------- 1. cobertura e forma -------------------------- */
for (const [aba, nome] of COBERTURA) {
  ok(`cobre ${nome}`, Boolean(DOR_SOLUCAO[aba]), aba);
}
ok('12 abas cobertas', COBERTURA.every(([a]) => DOR_SOLUCAO[a]));
ok('nenhuma entrada vazia', Object.values(DOR_SOLUCAO).every((v) => v.dor?.trim() && v.ganho?.trim()));
ok('rodapé é 2 linhas no celular (dor ≤ 95)', Object.values(DOR_SOLUCAO).every((v) => v.dor.length <= 95),
   String(Math.max(...Object.values(DOR_SOLUCAO).map((v) => v.dor.length))));
ok('ganho ≤ 120', Object.values(DOR_SOLUCAO).every((v) => v.ganho.length <= 120),
   String(Math.max(...Object.values(DOR_SOLUCAO).map((v) => v.ganho.length))));

// Cada aba principal precisa de hero próprio — senão cai no texto genérico
// da descricao e a copy de dor não aparece onde o corretor olha.
for (const [aba, nome] of COBERTURA) {
  ok(`hero próprio em ${nome}`, Boolean(HERO_ABAS[aba]), aba);
}
ok('funil: hero com a dor do lead esfriando',
   HERO_ABAS.funil_leads?.subtitulo?.includes('Nenhum lead esfria'),
   HERO_ABAS.funil_leads?.subtitulo);
ok('nenhum hero principal repete texto antigo',
   !Object.values(HERO_ABAS).some((h) => h.subtitulo?.includes('Arraste o card conforme o cliente avança')));
ok('selo de build exposto', Boolean(VERSAO_SELO) && /^v\d{4}\.\d{2}\.\d{2}/.test(VERSAO_SELO), VERSAO_SELO);

const JARGAO = ['NBR', 'PTAM', 'SICAQ', 'IBS', 'CBS', 'ADN', 'NFS-e', 'multitenant', 'schema', 'split'];
const temJargao = Object.entries(DOR_SOLUCAO).flatMap(([k, v]) =>
  JARGAO.filter((j) => `${v.dor} ${v.ganho}`.includes(j)).map((j) => `${k}:${j}`));
ok('sem jargão técnico no rodapé', temJargao.length === 0, temJargao.join(', '));

ok('fallback para aba desconhecida', textoDor('aba_inexistente') === DOR_PADRAO);
ok('textoDor devolve a aba certa', textoDor('credito').dor === DOR_SOLUCAO.credito.dor);

/* ------------------------- 2. gate do alternador ------------------------- */
ok('MASTER por papel', ehMasterPlataforma('master', false));
ok('MASTER por claim admin', ehMasterPlataforma('dono', true));
ok('dono NÃO é master', !ehMasterPlataforma('dono', false));
ok('admin do tenant NÃO é master', !ehMasterPlataforma('admin', false));
ok('corretor NÃO é master', !ehMasterPlataforma('corretor', false));
ok('mostrarAlternadorDemo espelha a regra', mostrarAlternadorDemo('corretor', false) === false && mostrarAlternadorDemo('master', false));

ok('modo demo: master em grátis = grátis', modoProEfetivo({ master: true, isModoGratis: true, isProConta: true }) === false);
ok('modo demo: master em PRO = PRO', modoProEfetivo({ master: true, isModoGratis: false, isProConta: true }) === true);
ok('cliente PRO ignora localStorage "gratis"', modoProEfetivo({ master: false, isModoGratis: true, isProConta: true }) === true);
ok('cliente gratuito ignora localStorage "completo"', modoProEfetivo({ master: false, isModoGratis: false, isProConta: false }) === false);

ok('rótulo MASTER em demo', rotuloModo({ master: true, modoPro: false, isProConta: true }).includes('MODO GRÁTIS'));
ok('rótulo cliente PRO', rotuloModo({ master: false, modoPro: true, isProConta: true }) === '✨ Plano PRO Ativo');
ok('rótulo cliente gratuito', rotuloModo({ master: false, modoPro: false, isProConta: false }) === '⚡ Plano Gratuito');
ok('cliente não vê "MODO" no rótulo', !/MODO (GRÁTIS|COMPLETO)/.test(rotuloModo({ master: false, modoPro: false, isProConta: false })));

ok('+ PRO aparece só no gratuito', mostrarBotaoUpgrade({ master: false, isProConta: false }) && !mostrarBotaoUpgrade({ master: false, isProConta: true }));
ok('MASTER não vê + PRO', !mostrarBotaoUpgrade({ master: true, isProConta: false }));

/* ------------------- 3. conferência no código da tela -------------------- */
const admin = readFileSync(new URL('../src/AdminNovo.jsx', import.meta.url), 'utf8');
ok('AdminNovo usa a lib de gate', admin.includes('ehMasterPlataformaFn(papelLogado, claimAdmin)'));
ok('AdminNovo usa modoProEfetivo', admin.includes('modoProEfetivo({'));
ok('AdminNovo usa rotuloModo', admin.includes('rotuloModo({'));
ok('alternador dentro do if de MASTER', /\{ehMasterPlataforma \? \([\s\S]{0,1800}?Modo Grátis/.test(admin));
ok('"Modo Completo (PRO)" aparece 1x só', (admin.match(/Modo Completo \(PRO\)/g) || []).length === 1);
ok('badge real do plano para cliente', admin.includes("'Plano PRO Ativo' : 'Plano Gratuito'"));
ok('botão + PRO presente', admin.includes('+ PRO'));
ok('faixa DorESolucao no TOPO da aba (antes do conteúdo)',
   admin.indexOf('<DorESolucao abaAtiva={abaAtiva} />') > admin.indexOf('<main className=') &&
   admin.indexOf('<DorESolucao abaAtiva={abaAtiva} />') < admin.indexOf("abaAtiva === 'dashboard_imobi'"));
ok('faixa saiu do rodapé (não fica mais junto do copyright)',
   admin.indexOf('<DorESolucao abaAtiva={abaAtiva} />') < admin.indexOf('<RodapeLegal />'));
ok('faixa aparece uma única vez', (admin.match(/<DorESolucao /g) || []).length === 1);

// ---- espaçamento: separação vem de gap/shrink, não de margem no texto ----
const dor = readFileSync(new URL('../src/components/ui/DorESolucao.jsx', import.meta.url), 'utf8');
ok('chip e texto separados por gap', dor.includes('gap-2') && dor.includes('items-start gap-2'));
ok('chip não encolhe nem quebra', dor.includes('shrink-0') && dor.includes('whitespace-nowrap'));
ok('sem margem frágil no texto (mr-1 antigo)', !dor.includes('mr-1 '));
ok('desktop 1 linha / mobile 2 linhas', dor.includes('md:flex-row') && dor.includes('flex-col'));

// ---- cobertura: toda aba do painel tem copy própria (zero fallback) ----
const idsApp = new Set([
  ...[...admin.matchAll(/\{ id: '([a-z_]+)'/g)].map((m) => m[1]),
  ...[...admin.matchAll(/abaAtiva === '([a-z_]+)'/g)].map((m) => m[1]),
]);
const semCopy = [...idsApp].filter((id) => !DOR_SOLUCAO[id]);
ok(`todas as ${idsApp.size} abas do painel têm copy`, semCopy.length === 0, semCopy.join(', '));

// ---- textos pedidos para o Esquadrão de IA Elite (verbatim) ----
const ESPERADOS = {
  administrador: ['Equipe travada, estoque encalhado ou dúvida sobre onde investir em tráfego?',
                  'Um diretor comercial 24h analisando sua carteira e montando planos prontos para bater meta.'],
  contador: ['Medo de errar cálculo de imposto, ganho de capital ou emissão de nota na venda?',
             'Orientação tributária imobiliária na hora para fechar negócios sem susto com a Receita.'],
  juridico_imobi: ['Contrato travado por cláusula duvidosa ou insegurança na documentação do imóvel?',
                   'Análise rápida de cláusulas, distrato e matrícula para dar segurança jurídica ao fechamento.'],
  copiloto: ['Perde tempo caçando dados no sistema ou redigindo mensagens do zero para cada cliente?',
             'Seu copiloto operacional que executa tarefas, resume fichas e acelera seu atendimento.'],
  secretaria: ['Lead manda mensagem fora de hora e fecha com o concorrente que respondeu primeiro?',
               'Atendimento imediato no WhatsApp 24/7 que qualifica o cliente e agenda a visita para você.'],
  whatsapp_hub: ['Lead manda mensagem fora de hora e fecha com o concorrente que respondeu primeiro?',
                 'Atendimento imediato no WhatsApp 24/7 que qualifica o cliente e agenda a visita para você.'],
};
for (const [aba, [d, g]] of Object.entries(ESPERADOS)) {
  ok(`texto verbatim de ${aba}`, DOR_SOLUCAO[aba]?.dor === d && DOR_SOLUCAO[aba]?.ganho === g);
}

// ---- headers inline das abas não voltam ao texto técnico ----
ok('captação: header sem "compressão em canvas"', !admin.includes('upload com compressão em canvas'));
ok('funil: header inline com a copy de dor', admin.includes('Nenhum lead esfria por falta de retorno: cada cliente tem dono, etapa e prazo — e o card mostra quem está parado há mais tempo.'));
ok('agenda: header sem "automatize confirmações"', !admin.includes('automatize confirmações de presença'));

const nicho = readFileSync(new URL('../src/components/imobi/CaptacaoNicho.jsx', import.meta.url), 'utf8');
ok('novo subtítulo de Captação por Nicho',
   nicho.includes('Cadastre em 1 minuto sem esquecer nenhum detalhe: os campos se adaptam sozinhos para Minha Casa Minha Vida,'));
ok('subtítulo antigo removido', !nicho.includes('Cada nicho carrega as exigências do seu mercado'));

ok('descrições técnicas antigas sumiram do menu',
   !admin.includes('Dashboard principal com resumo em tempo real do dia') &&
   !admin.includes('Motor comparativo direto (ABNT NBR 14.653)'));

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
