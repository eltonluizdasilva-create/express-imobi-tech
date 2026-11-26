/* global process */
/* Smoke de render (fora do navegador) da Esteira de Cartório & Escritura. */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import EsteiraCartorioEscritura from '../src/components/imobi/EsteiraCartorioEscritura.jsx';
import {
  liberarComJustificativa,
  negociacoesDemoCartorio,
} from '../src/lib/cartorioEscritura.js';

let falhas = 0;
const ok = (nome, condicao, extra = '') => {
  console.log(`${condicao ? 'PASS' : 'FAIL'}  ${nome}${extra ? ' — ' + extra : ''}`);
  if (!condicao) falhas += 1;
};

const AGORA = Date.parse('2026-11-26T12:00:00.000Z');
const demo = negociacoesDemoCartorio(AGORA);

/* --------------------- esteira com as três negociações ------------------ */
const html = renderToStaticMarkup(React.createElement(EsteiraCartorioEscritura, {
  negociacoesIniciais: demo,
  agora: AGORA,
  nomeImobiliaria: 'Imobiliária Teste',
  propostas: [],
}));

ok('mostra o título da esteira', html.includes('Esteira pós-venda · Cartório &amp; Escritura'));
ok(
  'mostra as três etapas',
  html.includes('Matrícula &amp; Certidões (CNDs)')
    && html.includes('ITBI, Escritura &amp; Registro')
    && html.includes('Liberação de Repasse &amp; NF'),
);
ok('mostra as três negociações', html.includes('IMB-8120') && html.includes('IMB-4092') && html.includes('IMB-7301'));
ok('mostra valor em BRL', /R\$\s?1\.180\.000/.test(html));
ok('mostra o selo da trava pré-repasse', html.includes('Aguardando Cartório (Trava Pré-Repasse)'));
ok('mostra liberação manual com justificativa', html.includes('Liberar manualmente com justificativa'));
ok('mostra o botão de cópia para WhatsApp', html.includes('Copiar Status do Cartório (WhatsApp)'));
ok('mostra o resumo para WhatsApp', html.includes('Resumo para WhatsApp') && html.includes('Etapa 3 — Repasse &amp; NF'));
ok('mostra o alerta de vencimento', html.includes('Vence em 3 dia(s)'), 'matrícula do cenário 1');
ok('mostra o progresso do checklist', html.includes('docs do checklist') || html.includes('documentos concluídos'));
ok('mostra o cruzamento com crédito', html.includes('Contrato com força de escritura'));
ok('não imprime undefined/NaN', !html.includes('undefined') && !html.includes('NaN'), `${html.length} chars`);

/* ----------------- negociação aguardando o registro (RGI) --------------- */
const aguardandoRegistro = renderToStaticMarkup(React.createElement(EsteiraCartorioEscritura, {
  negociacoesIniciais: [demo[1]],
  agora: AGORA,
}));
ok('mostra o protocolo do RGI', aguardandoRegistro.includes('RGI-2026-0091'));
ok('mostra o ITBI pago', aguardandoRegistro.includes('ITBI pago'));
ok('aguardando registro segue travada', aguardandoRegistro.includes('Aguardando Cartório (Trava Pré-Repasse)'));

/* ------------------------- negociação já liberada ---------------------- */
const liberada = renderToStaticMarkup(React.createElement(EsteiraCartorioEscritura, {
  negociacoesIniciais: [demo[2]],
  agora: AGORA,
}));
ok('negociação completa anuncia o repasse', liberada.includes('Liberado para repasse e NF'));
ok('negociação completa esconde a trava', !liberada.includes('Aguardando Cartório (Trava Pré-Repasse)'));
ok('negociação completa não imprime undefined/NaN', !liberada.includes('undefined') && !liberada.includes('NaN'));

/* ---------------------- liberação manual registrada -------------------- */
const manual = liberarComJustificativa(demo[0], {
  justificativa: 'Comissão paga na assinatura do contrato, cláusula 7.',
  por: 'Gestor Teste',
  agora: AGORA,
});
const comManual = renderToStaticMarkup(React.createElement(EsteiraCartorioEscritura, {
  negociacoesIniciais: [manual.negociacao],
  agora: AGORA,
}));
ok('liberação manual aparece com a justificativa', comManual.includes('Liberado manualmente com justificativa')
  && comManual.includes('Comissão paga na assinatura do contrato'));
ok('liberação manual oferece revogar', comManual.includes('Revogar liberação manual'));

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
