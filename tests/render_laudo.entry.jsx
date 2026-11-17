
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LaudoExecutivo from '../src/components/imobi/LaudoExecutivo.jsx';

const laudo = {
  scoreImobi: 72, classificacao: 'Preço Justo',
  resumoExecutivo: 'Imóvel bem posicionado, pedido 10% acima do justo.',
  agente1: { nota: 70, valorJustoRecomendado: 470000, faixaMinima: 440000, faixaMaxima: 505000, diferencaPercentualPedido: 10.64, analise: 'Comparáveis sustentam 470 mil.', padraoIdentificado: 'normal', estadoIdentificado: 'bom' },
  agente2: { nota: 65, aluguelMensal: 2350, capRateAnual: 4.85, roi5Anos: 42.5, comparativo: 'Cap rate abaixo do CDI.' },
  agente3: { nota: 85, notaVizinhanca: 90, destaques: ['Centro'], carencias: [], analise: 'Região muito servida.' },
  agente4: { nota: 60, diasNoPrecoPedido: 180, diasNoPrecoJusto: 95, analise: 'Ajuste reduz o encalhe.' },
  agente5: { nota: 80, anuncio: 'Casa no Centro de Uberlandia com 210m2.', argumentoProprietario: 'Ajustando para 470 mil voce vende em ~95 dias.', hashtags: [] },
};
const viz = {
  ok: true, nota: 90, classificacao: 'Localização premium', total: 104,
  contagem: { mercados: 4, escolas: 5, saude: 24, gastronomia: 49, lazer: 22 },
  pontos: [{ nome: 'Drogalider', categoria: 'saude', metros: 122 }, { nome: 'Pague Menos', categoria: 'saude', metros: 149 }],
};
const props = {
  laudo, meta: { modelo: 'gemini-3.5-flash-lite', cdi: 15, fii: 8.5 },
  vizinhanca: viz, analiseFotos: { padraoConstrutivo: 'normal', estadoConservacao: 'bom', confianca: 78 },
  avaliacao: { valorJusto: 470000, precoUnitario: 2238, unidade: 'm²', metodo: 'Comparativo direto', grauFundamentacao: 'Grau II' },
  valorPedido: 520000, dados: { cidade: 'Uberlandia', bairro: 'Centro', uf: 'MG', padrao: 'normal', estado: 'bom' },
  carregando: false, fase: '', erro: '',
};

const html = renderToStaticMarkup(React.createElement(LaudoExecutivo, props));
const checagens = {
  'score 72 presente': html.includes('>72<'),
  'selo Preço Justo': html.includes('Preço Justo'),
  'valor justo R$ 470.000': html.replace(/\u00a0/g, ' ').includes('R$ 470.000'),
  'dias pedido 180': html.includes('180 dias'),
  'dias justo 95': html.includes('95 dias'),
  'cap rate 4,85%': html.includes('4,85%'),
  'CDI 15,00%': html.includes('15,00%'),
  'nota vizinhança 90': html.includes('>90<'),
  'ponto real Drogalider': html.includes('Drogalider'),
  'anúncio renderizado': html.includes('Casa no Centro'),
  'botão PDF': html.includes('Exportar laudo'),
  'svg do anel': html.includes('<svg'),
};
for (const [nome, okv] of Object.entries(checagens)) console.log(`${okv ? 'PASS' : 'FAIL'}  ${nome}`);
console.log(`\nHTML gerado: ${html.length} caracteres`);
const falhas = Object.values(checagens).filter((v) => !v).length;
console.log(falhas === 0 ? 'RENDER OK' : `${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
