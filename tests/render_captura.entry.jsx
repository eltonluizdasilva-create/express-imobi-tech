import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ModalCapturaLeads from '../src/components/prospeccao/ModalCapturaLeads.jsx';
import CapturaLeadsMaps from '../src/components/prospeccao/CapturaLeadsMaps.jsx';

let falhas = 0;
const ok = (nome, condicao, extra = '') => {
  console.log(`${condicao ? 'PASS' : 'FAIL'}  ${nome}${extra ? ' — ' + extra : ''}`);
  if (!condicao) falhas += 1;
};

/* ------------------------------ modal ----------------------------------- */
const html = renderToStaticMarkup(
  React.createElement(ModalCapturaLeads, { oficinaId: 'ofi_1', cor: '#10b981', onFechar: () => {} })
);

ok('modal renderiza o título', html.includes('Capturar leads por região'));
ok('modal tem campo de endereço', html.includes('Endereço, bairro ou cidade'));
ok('modal tem campo com placeholder de exemplo', html.includes('Uberlândia - MG'));
ok('modal oferece raio de 500 m', html.includes('500 m'));
ok('modal oferece raio de 1 km', html.includes('1 km'));
ok('modal oferece raio de 3 km', html.includes('3 km'));
ok('modal oferece os dois objetivos', html.includes('Prospecção comercial') && html.includes('Entorno imobiliário'));
ok('modal tem o botão de varredura', html.includes('Executar Varredura'));
ok('modal avisa que a chave fica no servidor', html.includes('Nenhuma chave do Google passa pelo navegador'));
ok('modal começa no estado vazio', html.includes('Nenhuma varredura ainda'));
ok('modal tem dialog acessível', html.includes('role="dialog"') && html.includes('aria-modal="true"'));
ok('modal usa a cor da aba', html.includes('#10b981'));
ok('modal não imprime undefined/NaN', !html.includes('undefined') && !html.includes('NaN'), `${html.length} chars`);

/* ------------------------- botão (sem abrir) ---------------------------- */
const botao = renderToStaticMarkup(React.createElement(CapturaLeadsMaps, { oficinaId: 'ofi_1' }));
ok('botão mostra rótulo curto', botao.includes('Capturar leads'));
ok('botão exibe o selo Maps', botao.includes('Maps'));
ok('botão não monta o modal antes do clique', !botao.includes('Executar Varredura'), `${botao.length} chars`);

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
