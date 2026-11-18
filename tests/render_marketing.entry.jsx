
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import EstudioPosts from '../src/components/marketing/EstudioPosts.jsx';
import AbaMarketing from '../src/Marketing.jsx';

const imoveis = [
  { id: 'i1', titulo: 'Apto 302 Santa Mônica', bairro: 'Santa Mônica', cidade: 'Uberlândia', quartos: 3, valor: 450000, fotos: [], metragemTerreno: 92 },
  { id: 'i2', titulo: 'Casa Jardim Europa', bairro: 'Jardim Europa', cidade: 'Uberlândia', quartos: 4, valor: 780000, fotos: [] },
];

const html = renderToStaticMarkup(React.createElement(EstudioPosts, {
  config: { whatsapp: '5534991439845', creci: 'MG 12345', logoUrl: '' },
  listaImoveis: imoveis,
}));

// A aba Marketing inteira (com o seletor de vista) precisa continuar válida:
// o conteúdo legado foi envolvido por uma div de exibição condicional.
const htmlAba = renderToStaticMarkup(React.createElement(AbaMarketing, {
  config: { whatsapp: '5534991439845', creci: 'MG 12345' },
  listaImoveis: imoveis,
}));

const checagens = {
  // o "&" sai escapado no HTML (Campanhas &amp; Copies), então busca só o prefixo
  'aba: seletor Campanhas': htmlAba.includes('Campanhas'),
  'aba: seletor Estúdio': htmlAba.includes('Estúdio de Posts'),
  'aba: legado continua presente': htmlAba.includes('ADS &') && htmlAba.includes('CAPTAÇÃO DE TRÁFEGO'),
  'aba: estúdio oculto por padrão': !htmlAba.includes('Estúdio de posts sociais'),
  'título do estúdio': html.includes('Estúdio de posts sociais'),
  'modo A (imóvel real)': html.includes('Imóvel real'),
  'modo B (conceitual)': html.includes('Campanha conceitual'),
  'select de imóveis': html.includes('Apto 302 Santa Mônica') && html.includes('Casa Jardim Europa'),
  'upload local': html.includes('Escolher imagem'),
  'campo selo': html.includes('Selo superior'),
  'formato feed': html.includes('Feed 1080×1080'),
  'formato story': html.includes('Stories/Reels 1080×1920'),
  'botão gerar IA': html.includes('Gerar com IA'),
  'botão prévia': html.includes('Prévia'),
  'download PNG': html.includes('Baixar PNG'),
  'baixar os dois': html.includes('Baixar os dois'),
  'estado inicial sem pacote': html.includes('Legenda, roteiro e tráfego'),
  '3 campos de bullet': (html.match(/Bullet [123]/g) || []).length === 3,
};
for (const [nome, v] of Object.entries(checagens)) console.log(`${v ? 'PASS' : 'FAIL'}  ${nome}`);
console.log(`\nHTML: ${html.length} caracteres`);
const falhas = Object.values(checagens).filter((v) => !v).length;
console.log(falhas === 0 ? 'RENDER OK' : `${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
