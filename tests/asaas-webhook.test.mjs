/** Webhook do Asaas: leitura do evento + links de pagamento do Meu Plano.
 *  Roda sem credencial e sem Firestore: só lógica pura (api/_asaas.js e
 *  src/lib/checkout.js).  `node tests/asaas-webhook.test.mjs`
 */
import {
  valorEmReais, planoPorValor, planoPorTexto, lerPlanoDoEvento, ehPayloadAsaas,
  eventoAtivaPlano, extrairEmail, extrairOficinaId, EVENTOS_ASAAS_QUE_ATIVAM,
} from '../api/_asaas.js';
import { urlAsaasLink, comDadosDaConta, destinoCheckout, urlCheckoutPro, LINK_ASAAS_PADRAO } from '../src/lib/checkout.js';

let falhas = 0;
const ok = (n, c, e = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${e ? ' — ' + e : ''}`); if (!c) falhas += 1; };

/* ------------------------------- valores --------------------------------- */
ok('valor "39,90" vira 39.9', valorEmReais('39,90') === 39.9, String(valorEmReais('39,90')));
ok('valor "R$ 99,00" vira 99', valorEmReais('R$ 99,00') === 99, String(valorEmReais('R$ 99,00')));
ok('valor numérico passa', valorEmReais(39.9) === 39.9);
ok('valor vazio é null', valorEmReais('') === null && valorEmReais(null) === null);
ok('valor zero/negativo é null', valorEmReais(0) === null && valorEmReais(-5) === null);

ok('39,90 → essencial_plus mensal',
  planoPorValor(39.9)?.plano === 'essencial_plus' && planoPorValor(39.9)?.ciclo === 'mensal',
  JSON.stringify(planoPorValor(39.9)));
ok('"39.90" em texto → essencial_plus', planoPorValor('39.90')?.plano === 'essencial_plus');
ok('99 → profissional mensal',
  planoPorValor(99)?.plano === 'profissional' && planoPorValor(99)?.ciclo === 'mensal',
  JSON.stringify(planoPorValor(99)));
ok('99.00 com centavos → profissional', planoPorValor(99.0)?.plano === 'profissional');
ok('3990 (centavos) → essencial_plus', planoPorValor(3990)?.plano === 'essencial_plus');
ok('89 → profissional anual',
  planoPorValor(89)?.plano === 'profissional' && planoPorValor(89)?.ciclo === 'anual',
  JSON.stringify(planoPorValor(89)));
ok('1068 (ano inteiro) → profissional anual', planoPorValor(1068)?.plano === 'profissional');
ok('valor fora do catálogo não casa', planoPorValor(12.34) === null && planoPorValor(450) === null);

/* -------------------------------- textos --------------------------------- */
ok('texto "Essencial Plus"', planoPorTexto('Essencial Plus') === 'essencial_plus');
ok('texto "essencial_plus"', planoPorTexto('plano essencial_plus') === 'essencial_plus');
ok('texto "PRO"', planoPorTexto('PRO mensal') === 'profissional');
ok('texto "Profissional"', planoPorTexto('Plano Profissional anual') === 'profissional');
ok('texto com "promoção" não vira PRO', planoPorTexto('promoção de inverno') === null, String(planoPorTexto('promoção de inverno')));
ok('texto vazio é null', planoPorTexto('') === null && planoPorTexto(undefined) === null);

/* --------------------------- formato do payload --------------------------- */
const eventoRecebido = {
  id: 'evt_123',
  event: 'PAYMENT_RECEIVED',
  dateCreated: '2026-11-20 10:00:00',
  account: { id: 'acc' },
  payment: {
    object: 'payment', id: 'pay_1', customer: 'cus_1', subscription: 'sub_1',
    paymentLink: '123', value: 39.9, description: 'Assinatura Essencial Plus',
    externalReference: 'BrN6hBtoDBPrPYcWmvHPodcgxvZ2', billingType: 'PIX', status: 'RECEIVED',
  },
};
ok('payload do Asaas é reconhecido', ehPayloadAsaas(eventoRecebido));
ok('JSON direto não é confundido com Asaas', !ehPayloadAsaas({ plano: 'profissional', status: 'pago' }));
ok('evento em minúsculas sem payment não é Asaas', !ehPayloadAsaas({ event: 'pago', valor: 39.9 }));
ok('body vazio não é Asaas', !ehPayloadAsaas({}) && !ehPayloadAsaas(null) && !ehPayloadAsaas('x'));

const lido = lerPlanoDoEvento(eventoRecebido);
ok('evento completo → essencial_plus/mensal', lido.plano === 'essencial_plus' && lido.ciclo === 'mensal', JSON.stringify(lido));
ok('conflito sinalizado quando valor e texto divergem',
  lerPlanoDoEvento({ event: 'PAYMENT_RECEIVED', payment: { value: 99, description: 'Essencial Plus' } }).conflito === true);
ok('sem valor e sem texto → plano null',
  lerPlanoDoEvento({ event: 'PAYMENT_RECEIVED', payment: {} }).plano === null);

ok('só dois eventos ativam', EVENTOS_ASAAS_QUE_ATIVAM.length === 2 &&
  eventoAtivaPlano('PAYMENT_CONFIRMED') && eventoAtivaPlano('payment_received'));
ok('PAYMENT_OVERDUE não ativa', !eventoAtivaPlano('PAYMENT_OVERDONE') && !eventoAtivaPlano('PAYMENT_OVERDUE'));
ok('PAYMENT_REFUNDED não ativa', !eventoAtivaPlano('PAYMENT_REFUNDED'));

/* ------------------------- oficina na descrição -------------------------- */
ok('e-mail extraído da descrição',
  extrairEmail('Pagamento da imobiliária elton.luizdasilva@gmail.com no plano PRO') === 'elton.luizdasilva@gmail.com');
ok('sem e-mail → null', extrairEmail('Pedido 056984') === null);
ok('oficinaId extraído da descrição',
  extrairOficinaId('oficinaId=BrN6hBtoDBPrPYcWmvHPodcgxvZ2') === 'BrN6hBtoDBPrPYcWmvHPodcgxvZ2');
ok('oficinaId com dois pontos', extrairOficinaId('imob: oficina_id: abc12345x') === 'abc12345x');
ok('descrição sem oficinaId → null', extrairOficinaId('Pedido 123') === null);

/* --------------------------- links do Meu Plano --------------------------- */
ok('Essencial usa VITE_ASAAS_LINK_ESSENCIAL',
  urlAsaasLink({ essencial: 'https://www.asaas.com/i/ess', pro: 'https://www.asaas.com/i/pro' }, 'essencial_plus', 'mensal')
    === 'https://www.asaas.com/i/ess');
ok('PRO usa VITE_ASAAS_LINK_PRO',
  urlAsaasLink({ essencial: 'https://www.asaas.com/i/ess', pro: 'https://www.asaas.com/i/pro' }, 'pro', 'mensal')
    === 'https://www.asaas.com/i/pro');
ok('PRO anual usa link próprio quando existe',
  urlAsaasLink({ pro: 'https://x/i/pro', proAnual: 'https://x/i/pro-anual' }, 'pro', 'anual') === 'https://x/i/pro-anual');
ok('PRO anual cai no link mensal quando não há anual',
  urlAsaasLink({ pro: 'https://x/i/pro' }, 'pro', 'anual') === 'https://x/i/pro');

ok('os dois links públicos do Asaas estão publicados no código',
  LINK_ASAAS_PADRAO.essencial_plus === 'https://www.asaas.com/000/c/62w4zie9tigrfj5w' &&
  LINK_ASAAS_PADRAO.pro === 'https://www.asaas.com/000/c/xioo567rm50hn601',
  JSON.stringify(LINK_ASAAS_PADRAO));
ok('sem variável do Essencial usa o link público',
  urlAsaasLink({}, 'essencial_plus', 'mensal') === LINK_ASAAS_PADRAO.essencial_plus);
ok('sem variável do PRO usa o link público',
  urlAsaasLink({}, 'pro', 'mensal') === LINK_ASAAS_PADRAO.pro);
ok('PRO anual sem nenhuma variável também usa o link público',
  urlAsaasLink({}, 'pro', 'anual') === LINK_ASAAS_PADRAO.pro);
ok('variável sem protocolo cai no link público',
  urlAsaasLink({ pro: 'asaas.com/i/pro' }, 'pro', 'mensal') === LINK_ASAAS_PADRAO.pro);
ok('variável em branco cai no link público',
  urlAsaasLink({ essencial: '   ', pro: '   ', proAnual: '   ' }, 'essencial_plus', 'anual') === LINK_ASAAS_PADRAO.essencial_plus);
ok('plano sem link público devolve vazio',
  urlAsaasLink({}, 'automacao', 'mensal') === '' && urlAsaasLink({}, 'presenca_digital', 'mensal') === '');

const comDados = new URL(comDadosDaConta('https://www.asaas.com/i/pro', { email: 'a@b.com', oficinaId: 'OFI123' }));
ok('e-mail anexado ao link', comDados.searchParams.get('email') === 'a@b.com');
ok('oficinaId vai em externalReference', comDados.searchParams.get('externalReference') === 'OFI123');
ok('query existente é preservada',
  new URL(comDadosDaConta('https://x/p?utm_source=site', { email: 'a@b.com' })).searchParams.get('utm_source') === 'site');
ok('parâmetro já presente não é sobrescrito',
  new URL(comDadosDaConta('https://x/p?externalReference=FIXO', { oficinaId: 'OUTRO' })).searchParams.get('externalReference') === 'FIXO');
ok('sem dados não inventa parâmetro', comDadosDaConta('https://x/p', {}) === 'https://x/p');
ok('URL inválida devolve o que veio', comDadosDaConta('nao-e-url', { email: 'a@b.com' }) === 'nao-e-url');

const comLink = destinoCheckout({
  checkoutUrl: comDadosDaConta(urlAsaasLink({ pro: 'https://www.asaas.com/i/pro' }, 'pro', 'mensal'), { email: 'a@b.com' }),
  whatsapp: '5534991439845',
});
ok('clique com link do Asaas abre o pagamento', comLink.tipo === 'checkout' && comLink.url.includes('asaas.com/i/pro'));
ok('sem link nenhum cai no WhatsApp', 
  destinoCheckout({ checkoutUrl: '', whatsapp: '5534991439845', email: 'a@b.com' }).tipo === 'whatsapp');
ok('clique do PRO e do Essencial nunca fica sem destino',
  destinoCheckout({ checkoutUrl: urlAsaasLink({}, 'pro'), whatsapp: '5534991439845' }).url.startsWith('https://www.asaas.com/') &&
  destinoCheckout({ checkoutUrl: urlAsaasLink({}, 'essencial_plus'), whatsapp: '5534991439845' }).url.startsWith('https://www.asaas.com/'));
ok('link público do Essencial sai com e-mail e oficinaId',
  (() => {
    const u = new URL(comDadosDaConta(urlAsaasLink({}, 'essencial_plus', 'mensal'), { email: 'a@b.com', oficinaId: 'OFI123' }));
    return u.searchParams.get('email') === 'a@b.com' && u.searchParams.get('externalReference') === 'OFI123';
  })());
ok('variáveis antigas do checkout seguem funcionando',
  urlCheckoutPro({ VITE_CHECKOUT_PRO_URL: 'https://pay.io/old' }, 'mensal') === 'https://pay.io/old');

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
