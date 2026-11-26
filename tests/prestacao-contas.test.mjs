/**
 * Prestação de contas ao proprietário (sub-aba do Mapa de Inteligência).
 * ============================================================================
 * Node puro, sem navegador: exercita `src/lib/prestacaoContas.js` (o mesmo
 * módulo que a tela usa) e confere no código a fiação da sub-aba.
 *   1. dias na carteira + limite de 40 dias (regra da Zara);
 *   2. anúncio × valor justo pelo motor de avaliação;
 *   3. funil real (leads, visitas, propostas, objeções);
 *   4. texto de WhatsApp e dossiê com o aviso legal COFECI 1.066/2007;
 *   5. refino com IA só no clique (contrato de `/api/ai` e falhas);
 *   6. sub-aba ligada em MapaInteligenciaImobiliaria/AdminNovo e deep link
 *      da Captação por Nicho.
 * ============================================================================
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  LIMITE_DIAS_CARTEIRA,
  areaDoImovel,
  compararMercado,
  diasNaCarteira,
  dossieHtmlPrestacao,
  funilDoImovel,
  gerarPrestacao,
  montarCorpoRefinoPrestacao,
  refinarPrestacaoComIA,
  textoWhatsAppPrestacao,
} from '../src/lib/prestacaoContas.js';

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');

const AGORA = Date.parse('2026-11-26T12:00:00.000Z');
const diasAtras = (dias) => new Date(AGORA - dias * 86400000).toISOString();

const imovelCompleto = {
  id: 'imo1',
  codigo: 'CNAI 0099',
  titulo: 'Casa no Centro',
  tipo: 'Casa',
  finalidade: 'Venda',
  bairro: 'Centro',
  cidade: 'Patrocínio',
  uf: 'MG',
  quartos: 3,
  areaConstruida: 120,
  valor: 5000000,
  criadoEm: diasAtras(60),
  proprietarioNome: 'Maria Souza',
};

const leads = [
  { id: 'l1', nome: 'Ana', interesse: 'CNAI 0099', estagio: 'Visita agendada', horasSemContato: 30, objecao: 'Preço alto' },
  { id: 'l2', nome: 'Bruno', imovelCodigo: 'cnai 0099', estagio: 'novo', objecao: 'Preço alto' },
];

const visitas = [
  { id: 'v1', cliente: 'Ana', imovel: 'CNAI 0099', leadId: 'l1', objecao: 'Condomínio caro' },
];

const propostas = [
  { id: 'p1', codigoImovel: 'CNAI 0099', nomeCliente: 'Ana', valorProposta: 420000, leadId: 'l1' },
];

const prestacao = gerarPrestacao(imovelCompleto, {
  leads,
  visitas,
  propostas,
  uf: 'MG',
  nomeImobiliaria: 'Imobiliária Teste',
  corretor: 'Corretor Teste',
  agora: AGORA,
});

/* ----------------------------- 1. carteira ------------------------------ */

test('dias na carteira e alerta de limite', () => {
  assert.equal(LIMITE_DIAS_CARTEIRA, 40);
  assert.equal(diasNaCarteira(imovelCompleto, AGORA), 60);
  assert.equal(prestacao.carteira.dias, 60);
  assert.equal(prestacao.carteira.limite, 40);
  assert.equal(prestacao.carteira.alerta, true);
  assert.notEqual(prestacao.carteira.desde, 'não registrado');

  // Fixture sem data: número inventado aqui seria mentira no relatório.
  assert.equal(diasNaCarteira({ codigo: 'X1' }, AGORA), null);
  assert.equal(diasNaCarteira({ codigo: 'X1', diasParado: '12' }, AGORA), 12);
  assert.equal(gerarPrestacao({ codigo: 'X1' }, { agora: AGORA }).carteira.alerta, false);
});


/* ----------------------------- 2. mercado ------------------------------- */

test('anúncio acima do valor justo e a falta de área', () => {
  assert.deepEqual(areaDoImovel(imovelCompleto), {
    area: 120,
    unidade: 'm²',
    tipologia: 'urbano',
    areaTotal: 0,
    areaConstruida: 120,
  });

  const mercado = prestacao.mercado;
  assert.equal(mercado.ok, true);
  assert.equal(mercado.veredito, 'acima');
  assert.ok(mercado.deltaPct > 5, `deltaPct deveria passar de 5%, veio ${mercado.deltaPct}`);
  assert.equal(mercado.anuncio, 5000000);
  assert.equal(mercado.area, 120);
  assert.equal(mercado.unidade, 'm²');
  assert.ok(mercado.valorJusto > 0 && mercado.precoM2Referencia > 0);
  assert.ok(mercado.bandaMin < mercado.valorJusto && mercado.valorJusto < mercado.bandaMax);
  assert.ok(mercado.prazoMedioDias > 0);
  assert.equal(mercado.uf, 'MG');
  assert.ok(prestacao.recomendacoes.some((r) => /acima do valor justo/i.test(r.titulo)));

  // Sem área não existe comparativo de m²: a tela pede o cadastro, não estima.
  const semArea = compararMercado({ codigo: 'X1', valor: 300000 }, { uf: 'MG' });
  assert.equal(semArea.ok, false);
  assert.equal(semArea.motivo, 'sem_area');
  assert.match(semArea.instrucao, /metragem|Área/i);

  const semAreaPrestacao = gerarPrestacao({ codigo: 'X1', valor: 300000 }, { agora: AGORA });
  assert.equal(semAreaPrestacao.mercado.ok, false);
  assert.ok(semAreaPrestacao.recomendacoes.some((r) => /Metragem não cadastrada/i.test(r.titulo)));
  assert.ok(semAreaPrestacao.totalAlertas >= 1);
});

test('rural troca a unidade para hectare', () => {
  const rural = areaDoImovel({ codigo: 'FAZ1', tipo: 'Fazenda', hectares: 12 });
  assert.equal(rural.unidade, 'hectare');
  assert.equal(rural.area, 12);
  const mercadoRural = compararMercado({ codigo: 'FAZ1', tipo: 'Fazenda', hectares: 12, valor: 1800000 }, { uf: 'MG' });
  assert.equal(mercadoRural.ok, true);
  assert.equal(mercadoRural.unidade, 'hectare');
  assert.ok(mercadoRural.precoM2Anuncio > 0);
});

/* ------------------------------ 3. funil -------------------------------- */

test('funil cruza leads, visitas e propostas do imóvel', () => {
  const funil = prestacao.funil;
  assert.equal(funil.totalLeads, 2);
  assert.equal(funil.leadsSemResposta, 1);
  assert.equal(funil.visitasSolicitadas, 1);
  assert.equal(funil.totalVisitas, 1);
  assert.equal(funil.totalPropostas, 1);
  assert.equal(funil.melhorProposta, 420000);
  assert.equal(funil.objecoes[0].texto, 'Preço alto');
  assert.equal(funil.objecoes[0].total, 2);
  assert.ok(funil.objecoes.some((o) => o.texto === 'Condomínio caro'));

  // Lead de outro imóvel não entra na conta deste.
  const vazio = funilDoImovel(
    { codigo: 'CNAI 0099', titulo: 'Casa no Centro' },
    { leads: [{ id: 'z', interesse: 'Apartamento Loja 7' }] },
  );
  assert.equal(vazio.totalLeads, 0);
  assert.equal(vazio.melhorProposta, 0);
  assert.deepEqual(vazio.objecoes, []);
});

/* --------------------- 4. saídas: WhatsApp e dossiê --------------------- */

test('texto de WhatsApp traz o imóvel, os números e o aviso legal', () => {
  const texto = textoWhatsAppPrestacao(prestacao);
  assert.match(texto, /CNAI 0099/);
  assert.match(texto, /Casa no Centro/);
  assert.match(texto, /60 dia\(s\) na carteira/);
  assert.match(texto, /Leads vinculados a este imóvel: 2/);
  assert.match(texto, /Propostas registradas: 1/);
  assert.match(texto, /Preço alto \(2x\)/);
  assert.match(texto, /COFECI 1\.066\/2007/);
  assert.match(texto, /Resumo operacional de acompanhamento/);
  assert.match(texto, /Corretor Teste/);

  const semDados = textoWhatsAppPrestacao(gerarPrestacao({ codigo: '' }, { agora: AGORA }));
  assert.match(semDados, /sem código/);
  assert.match(semDados, /Data de captação não registrada/);
  assert.match(semDados, /COFECI 1\.066\/2007/);
});

test('dossiê A4 tem as cinco seções e não deixa HTML do tenant vazar', () => {
  const html = dossieHtmlPrestacao(gerarPrestacao(
    { ...imovelCompleto, titulo: 'Casa <script>alert(1)</script>' },
    { leads, visitas, propostas, uf: 'MG', corretor: 'Corretor Teste', agora: AGORA },
  ));
  for (const secao of ['1. Situação do imóvel', '2. Preço e mercado', '3. O que foi feito no período', '4. Objeções registradas', '5. Próximos passos']) {
    assert.ok(html.includes(secao), `dossiê sem a seção ${secao}`);
  }
  assert.match(html, /<!DOCTYPE html>/);
  assert.match(html, /@page \{ size: A4/);
  assert.match(html, /COFECI 1\.066\/2007/);
  assert.ok(!html.includes('<script>'), 'título do imóvel virou HTML executável');
  assert.match(html, /&lt;script&gt;/);

  const semArea = dossieHtmlPrestacao(gerarPrestacao({ codigo: 'X1' }, { agora: AGORA }));
  assert.match(semArea, /Comparativo de mercado/);
  assert.match(semArea, /Nenhuma objeção registrada no CRM/);
});

/* --------------------------- 5. refino com IA ---------------------------- */

test('corpo do refino é o payload do /api/ai, sem número novo', () => {
  const corpo = montarCorpoRefinoPrestacao(prestacao);
  assert.equal(corpo.provider, 'gemini');
  assert.match(corpo.systemPrompt, /ZERO NÚMERO NOVO/);
  assert.match(corpo.systemPrompt, /NÃO É LAUDO/);
  assert.equal(corpo.messages.length, 1);
  assert.equal(corpo.messages[0].role, 'user');
  assert.match(corpo.messages[0].content, /CNAI 0099/);
  assert.match(corpo.messages[0].content, /60 dia\(s\) na carteira/);
  assert.ok(corpo.messages[0].content.length <= 4000);
  // Texto de tenant é achatado: nenhuma quebra de linha vira instrução solta.
  assert.ok(!/\u0000/.test(corpo.messages[0].content));
});

test('refino com IA falha sem derrubar o texto calculado', async () => {
  const chamadas = [];
  const ok = await refinarPrestacaoComIA({
    prestacao,
    cabecalhos: { 'Content-Type': 'application/json', Authorization: 'Bearer teste' },
    fetchImpl: async (url, init) => {
      chamadas.push({ url, init });
      return { ok: true, status: 200, json: async () => ({ text: '  Olá, seu imóvel está há 60 dias na carteira.  ' }) };
    },
  });
  assert.equal(chamadas[0].url, '/api/ai');
  assert.equal(chamadas[0].init.method, 'POST');
  assert.equal(chamadas[0].init.headers.Authorization, 'Bearer teste');
  assert.equal(ok.ok, true);
  assert.equal(ok.texto, 'Olá, seu imóvel está há 60 dias na carteira.');

  const semSessao = await refinarPrestacaoComIA({
    prestacao,
    fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({ codigo: 'nao_autorizado' }) }),
  });
  assert.equal(semSessao.ok, false);
  assert.equal(semSessao.codigo, 'nao_autorizado');
  assert.match(semSessao.erro, /Sessão expirada/);

  const rede = await refinarPrestacaoComIA({
    prestacao,
    fetchImpl: async () => { throw new Error('sem rede'); },
  });
  assert.equal(rede.ok, false);
  assert.equal(rede.codigo, 'rede');
  assert.match(rede.erro, /falha de rede|sem rede/);

  const vazio = await refinarPrestacaoComIA({
    prestacao,
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ text: '   ' }) }),
  });
  assert.equal(vazio.ok, false);
  assert.equal(vazio.codigo, 'vazio');
  assert.match(vazio.erro, /texto calculado continua disponível/);
});

/* ------------------- 6. fiação da sub-aba no painel --------------------- */

test('sub-aba existe no módulo, sem aba nova na sidebar', () => {
  const admin = ler('src/AdminNovo.jsx');
  const mapa = ler('src/components/admin/MapaInteligenciaImobiliaria.jsx');
  const tela = ler('src/components/imobi/PrestacaoContasProprietario.jsx');

  assert.match(mapa, /import PrestacaoContasProprietario from '\.\.\/imobi\/PrestacaoContasProprietario'/);
  assert.match(mapa, /Prestação de contas/);
  assert.match(mapa, /<PrestacaoContasProprietario/);
  assert.match(mapa, /imoveis=\{imoveis\}/);
  assert.match(mapa, /imovelInicial=\{imovelPrestacao\}/);

  // AdminNovo entrega os documentos que a conta já carrega.
  assert.match(admin, /<MapaInteligenciaImobiliaria[\s\S]{0,400}imoveis=\{listaImoveis\}/);
  assert.match(admin, /leads=\{listaLeads\}/);
  assert.match(admin, /visitas=\{listaVisitas\}/);
  assert.match(admin, /propostas=\{listaPropostas\}/);
  assert.match(admin, /imovelPrestacao=\{prestacaoFoco\}/);

  // Nenhuma aba nova na sidebar do painel.
  const sidebar = ler('src/components/admin/SidebarAdmin.jsx');
  assert.ok(!/prestacao/i.test(sidebar), 'prestação de contas não deve virar aba da sidebar');

  // A tela calcula tudo localmente e não formata moeda sem helper.
  assert.match(tela, /const brl = \(v\) =>/);
  assert.match(tela, /gerarPrestacao\(/);
  assert.match(tela, /dossieHtmlPrestacao\(/);
  assert.match(tela, /refinarPrestacaoComIA\(/);
  assert.match(tela, /COFECI 1\.066\/2007/);
});

test('Captação por Nicho manda o imóvel para a prestação de contas', () => {
  const captacao = ler('src/components/imobi/CaptacaoNicho.jsx');
  const admin = ler('src/AdminNovo.jsx');

  assert.match(captacao, /export default function CaptacaoNicho\(\{ dadosOficina, setAbaAtiva, onAbrirPrestacao \}\)/);
  assert.match(captacao, /function paraPrestacao\(/);
  assert.match(captacao, /metragemTerreno: areaM2/);
  assert.match(captacao, /onAbrirPrestacao\(paraPrestacao\(/);
  assert.match(admin, /onAbrirPrestacao=\{\(imovel\) => \{/);
  assert.match(admin, /setAbaAtiva\('mapa_inteligencia'\)/);
});


