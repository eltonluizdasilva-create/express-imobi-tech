/* Smoke de render (fora do navegador) da sub-aba Prestação de Contas. */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MapaInteligenciaImobiliaria from '../src/components/admin/MapaInteligenciaImobiliaria.jsx';
import PrestacaoContasProprietario from '../src/components/imobi/PrestacaoContasProprietario.jsx';

let falhas = 0;
const ok = (nome, condicao, extra = '') => {
  console.log(`${condicao ? 'PASS' : 'FAIL'}  ${nome}${extra ? ' — ' + extra : ''}`);
  if (!condicao) falhas += 1;
};

const imoveis = [{
  id: 'imo1',
  codigo: 'CNAI 0099',
  titulo: 'Casa no Centro',
  tipo: 'Casa',
  finalidade: 'Venda',
  bairro: 'Centro',
  cidade: 'Patrocínio',
  quartos: 3,
  areaConstruida: 120,
  valor: 780000,
  criadoEm: new Date(Date.now() - 60 * 86400000).toISOString(),
}];

const leads = [{ id: 'l1', nome: 'Ana', interesse: 'CNAI 0099', estagio: 'Visita agendada', horasSemContato: 30 }];
const visitas = [{ id: 'v1', cliente: 'Ana', imovel: 'CNAI 0099', leadId: 'l1', objecao: 'Preço alto' }];
const propostas = [{ id: 'p1', codigoImovel: 'CNAI 0099', valorProposta: 720000, leadId: 'l1' }];

/* --------------------- módulo: abas e deep link ------------------------- */
const mapa = renderToStaticMarkup(React.createElement(MapaInteligenciaImobiliaria, { temaClaro: false }));
ok('módulo mostra a sub-aba do mapa', mapa.includes('Mapa do ecossistema'));
ok('módulo mostra a sub-aba de prestação', mapa.includes('Prestação de contas'));
ok('módulo abre no mapa por padrão', mapa.includes('Mapa interativo de ferramentas'));

const mapaComFoco = renderToStaticMarkup(React.createElement(MapaInteligenciaImobiliaria, {
  temaClaro: true,
  imoveis,
  imovelPrestacao: imoveis[0],
}));
ok('deep link abre direto na prestação', mapaComFoco.includes('Prestação de contas ao proprietário'));
ok('deep link não perde a aba do mapa', mapaComFoco.includes('Prestação de contas'));

/* ----------------------------- estado vazio ---------------------------- */
const vazio = renderToStaticMarkup(React.createElement(PrestacaoContasProprietario, {
  onAbrirCaptacao: () => {},
}));
ok('estado vazio explica de onde vêm os dados', vazio.includes('carteira real'));
ok('estado vazio oferece a demonstração', vazio.includes('Ver com dados de demonstração'));
ok('estado vazio leva para a captação', vazio.includes('Cadastrar imóvel em Captação'));

/* --------------------------- relatório real ---------------------------- */
const html = renderToStaticMarkup(React.createElement(PrestacaoContasProprietario, {
  imoveis, leads, visitas, propostas,
  nomeImobiliaria: 'Imobiliária Teste',
  corretor: 'Corretor Teste',
  imovelInicial: imoveis[0],
}));
ok('relatório identifica o imóvel', html.includes('CNAI 0099') && html.includes('Casa no Centro'));
ok('relatório mostra dias na carteira', /\d+ d/.test(html) && html.includes('limite de 40 dias'));
ok('relatório traz preço e mercado', html.includes('2. Preço e mercado') && html.includes('Valor justo de mercado'));
ok('relatório traz o funil', html.includes('3. O que foi feito no período') && html.includes('Leads vinculados ao imóvel'));
ok('relatório traz objeções', html.includes('4. Objeções registradas') && html.includes('Preço alto'));
ok('relatório traz próximos passos', html.includes('5. Próximos passos'));
ok('relatório formata moeda em BRL', /R\$\s?[\d.]+/.test(html));
ok('relatório tem o texto para o proprietário', html.includes('Mensagem para o proprietário') && html.includes('Copiar WhatsApp'));
ok('relatório imprime o aviso legal', html.includes('COFECI 1.066/2007'));
ok('relatório não imprime undefined/NaN', !html.includes('undefined') && !html.includes('NaN'), `${html.length} chars`);

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
