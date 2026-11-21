
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
const semNbsp = plano.replace(/\u00a0/g, ' ');

ok('3 degraus na tela',
   semNbsp.includes('Essencial') && semNbsp.includes('Completo PRO') && semNbsp.includes('Imobiliárias &amp; Automação WhatsApp 24/7'));
ok('selo Mais escolhido no PRO', plano.includes('Mais escolhido'));
ok('seletor Mensal | Anual', plano.includes('Mensal') && plano.includes('Anual'));
ok('selo de economia no seletor', plano.includes('Economize R$ 120'));
ok('mensal é o padrão (R$ 99,00 no PRO)', /R\$ ?99,00/.test(semNbsp));
ok('padrão mensal não cobra o pacote anual na tela', !/1\.068,00/.test(semNbsp));
ok('aviso de e-mail para ativação automática no Asaas',
   plano.includes('Importante: use no pagamento o mesmo e-mail cadastrado aqui para ativação automática imediata.'));
ok('aviso discreto fica entre o seletor e os cards',
   plano.indexOf('mesmo e-mail cadastrado aqui') > plano.indexOf('Cobrança mensal') &&
   plano.indexOf('mesmo e-mail cadastrado aqui') < plano.indexOf('Mais escolhido'));
ok('CTA do PRO', plano.includes('Assinar Plano PRO Agora'));
ok('card 3 com a partir de R$ 497', /A partir de R\$ ?497/.test(semNbsp));
ok('card 3 com taxa de implementação', plano.includes('Taxa única de implementação'));
ok('CTA da implantação', plano.includes('Solicitar Implantação / Falar com Especialista'));
ok('Essencial marcado como plano atual', plano.includes('Plano atual'));
ok('PRO cita PTAM, crédito e portais',
   plano.includes('Avaliação PTAM') && plano.includes('Correspondente / Crédito') && plano.includes('Portais XML'));
ok('automação cita a Sofia 24/7', plano.includes('Agente Sofia 24/7'));

const planoPro = renderToStaticMarkup(React.createElement(Meuplano, { dadosOficina: { plano: 'profissional' } }));
ok('quem já é PRO vê "Plano PRO ativo"', planoPro.includes('Plano PRO ativo'));
ok('quem já é PRO pode pedir downgrade', planoPro.includes('Falar sobre downgrade'));

console.log(`\n${falhas === 0 ? 'RENDER OK' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
