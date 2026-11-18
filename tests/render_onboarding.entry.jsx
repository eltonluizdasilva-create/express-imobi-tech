
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import OnboardingPrimeiroUso from '../src/components/onboarding/OnboardingPrimeiroUso.jsx';
import Meuplano from '../src/components/Meuplano.jsx';

let falhas = 0;
const ok = (n, c, extra = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? ' — ' + extra : ''}`); if (!c) falhas += 1; };

/* ---------------------------- onboarding ---------------------------- */
const r0 = renderToStaticMarkup(React.createElement(OnboardingPrimeiroUso, { config: null, imoveis: [], onIrPara() {} }));
ok('card aparece com 0 de 3', r0.includes('Primeiros passos') && r0.includes('0 de 3 concluídos'));
ok('mostra os três passos', r0.includes('Configure logo, CRECI e WhatsApp') && r0.includes('Cadastre seu 1º imóvel') && r0.includes('Gere sua 1ª arte'));
ok('botões de ação presentes', r0.includes('Configurar') && r0.includes('Cadastrar') && r0.includes('Abrir Estúdio'));
ok('tem copiar link da vitrine', r0.includes('Copiar link'));
ok('tem fechar guia', r0.includes('Já sei usar, fechar guia'));

const r1 = renderToStaticMarkup(React.createElement(OnboardingPrimeiroUso, {
  config: { nome: 'Imob X', whatsapp: '34999998888' }, imoveis: [{ id: 1 }], onIrPara() {},
}));
ok('2 de 3 depois de configurar e cadastrar', r1.includes('2 de 3 concluídos'));
ok('passo concluído perde o botão Configurar', !r1.includes('>Configurar<'));

// o passo 3 vive no localStorage — simula o navegador antes de renderizar
const memoria = new Map([['imobi:onboarding:passo3', '1']]);
globalThis.localStorage = {
  getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
  setItem: (k, v) => memoria.set(k, String(v)),
  removeItem: (k) => memoria.delete(k),
};
const r3 = renderToStaticMarkup(React.createElement(OnboardingPrimeiroUso, {
  config: { nome: 'Imob X', whatsapp: '34999998888' }, imoveis: [{ id: 1 }], onIrPara() {},
}));
ok('some em 3/3 (render vazio)', r3 === '', String(r3.length) + ' chars');

/* ------------------------------ Meuplano ---------------------------- */
const plano = renderToStaticMarkup(React.createElement(Meuplano, { dadosOficina: { plano: 'gratis' } }));
ok('comparativo na tela', plano.includes('Modo Grátis × Plano PRO'));
ok('botão pedido presente', plano.includes('Assinar Plano PRO Agora'));
ok('linhas do comparativo', plano.includes('Corretores na equipe') && plano.includes('Vistoria com laudo por IA'));
ok('explica o destino do clique', plano.includes('WhatsApp comercial') || plano.includes('ambiente seguro'));
ok('mostra o preço do PRO', /R\$\s?99/.test(plano));
ok('mantém os cards de plano', plano.includes('Plano Profissional') && plano.includes('Esquadrão de IA'));

const planoPro = renderToStaticMarkup(React.createElement(Meuplano, { dadosOficina: { plano: 'profissional' } }));
ok('quem já é PRO não vê CTA ativo', planoPro.includes('Plano PRO ativo'));

console.log(`\n${falhas === 0 ? 'RENDER OK' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
