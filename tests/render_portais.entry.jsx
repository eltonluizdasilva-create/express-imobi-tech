
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import IntegracaoPortais from '../src/components/IntegracaoPortais.jsx';

const html = renderToStaticMarkup(React.createElement(IntegracaoPortais, {
  oficinaId: 'ofi_teste_123456',
  papelLogado: 'dono',
}));

const checagens = {
  'título da integração': html.includes('Integração com portais'),
  'URL do feed presente': html.includes('/api/xml-portais?oficinaId=ofi_teste_123456'),
  'botão copiar link': html.includes('Copiar Link XML'),
  'seção de webhook': html.includes('Webhook de leads'),
  'botão gerar token': html.includes('Gerar Token') || html.includes('Gerar Novo Token'),
  'botão copiar webhook': html.includes('Copiar URL Webhook'),
  'aviso do token protegido': html.includes('configuracoes/portais'),
  'guia ZAP/VivaReal': html.includes('ZAP / VivaReal'),
  'guia OLX': html.includes('OLX'),
  'extrator de e-mail': html.includes('Extrator rápido de e-mail'),
  'botão extrair': html.includes('Extrair dados'),
  'botão criar lead': html.includes('Criar lead no funil'),
  'portais listados': html.includes('ZAP Imóveis') && html.includes('VivaReal'),
};
for (const [nome, v] of Object.entries(checagens)) console.log(`${v ? 'PASS' : 'FAIL'}  ${nome}`);
console.log(`\nHTML: ${html.length} caracteres`);
const falhas = Object.values(checagens).filter((v) => !v).length;
console.log(falhas === 0 ? 'RENDER OK' : `${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
