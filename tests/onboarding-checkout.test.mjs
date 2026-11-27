/** Onboarding de 3 passos + checkout do PRO. */
import {
  PASSOS, CHAVE_OCULTO, CHAVE_PASSO3, marcaConfigurada, avaliarPassos, progresso,
  deveExibir, proximoPasso, linkVitrine, lerOculto, salvarOculto, lerPasso3, marcarPasso3,
} from '../src/lib/onboarding.js';
import {
  normalizarWhatsapp, urlCheckoutPro, mensagemCheckout, destinoCheckout, abrirDestino, WHATSAPP_PADRAO,
} from '../src/lib/checkout.js';
import {
  DEGRAUS, ECONOMIA_ANUAL, TOTAL_ANUAL, precoMensal, detalheCiclo, rotuloEconomia, degrauPorKey,
} from '../src/lib/planosComerciais.js';

let falhas = 0;
const ok = (n, c, e = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${e ? ' — ' + e : ''}`); if (!c) falhas += 1; };

const memoria = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
};

/* ------------------------------ onboarding ------------------------------- */
ok('3 passos definidos', PASSOS.length === 3);
ok('passos na ordem 1,2,3', PASSOS.map((p) => p.numero).join() === '1,2,3');

ok('config completa conta', marcaConfigurada({ nome: 'Imobiliária X', whatsapp: '34999998888' }));
ok('nomeOficina também vale', marcaConfigurada({ nomeOficina: 'X', telefone: '(34) 99999-8888' }));
ok('só nome não conta', !marcaConfigurada({ nome: 'X' }));
ok('só whatsapp não conta', !marcaConfigurada({ whatsapp: '34999998888' }));
ok('whatsapp curto não conta', !marcaConfigurada({ nome: 'X', whatsapp: '123' }));
ok('config vazia não conta', !marcaConfigurada(null) && !marcaConfigurada({}));

const p0 = avaliarPassos({ config: null, imoveis: [], passo3Feito: false });
ok('tudo pendente no zero', p0.every((p) => !p.concluido));
ok('rotulo 0 de 3', progresso(p0).rotulo === '0 de 3 concluídos');
ok('pct 0', progresso(p0).pct === 0);

const p1 = avaliarPassos({ config: { nome: 'X', whatsapp: '34999998888' }, imoveis: [], passo3Feito: false });
ok('passo 1 concluído', p1[0].concluido && !p1[1].concluido);
ok('progresso 1 de 3', progresso(p1).rotulo === '1 de 3 concluídos' && progresso(p1).pct === 33);

const p3 = avaliarPassos({ config: { nome: 'X', whatsapp: '34999998888' }, imoveis: [{ id: 1 }], passo3Feito: true });
ok('tudo concluído', p3.every((p) => p.concluido));
ok('rotulo 3 de 3', progresso(p3).rotulo === '3 de 3 concluídos' && progresso(p3).pct === 100);
ok('some em 3/3', !deveExibir({ passos: p3, oculto: false }));
ok('aparece com 0/3', deveExibir({ passos: p0, oculto: false }));
ok('oculto esconde mesmo pendente', !deveExibir({ passos: p0, oculto: true }));
ok('próximo passo é o 1', proximoPasso(p0)?.id === 'marca');
ok('próximo passo após 1', proximoPasso(p1)?.id === 'imovel');
ok('sem próximo em 3/3', proximoPasso(p3) === null);

const store = memoria();
ok('oculto começa falso', lerOculto(store) === false);
salvarOculto(store);
ok('oculto persiste', lerOculto(store) === true && store.getItem(CHAVE_OCULTO) === '1');
ok('passo3 começa falso', lerPasso3(store) === false);
marcarPasso3(store);
ok('passo3 persiste', lerPasso3(store) === true && store.getItem(CHAVE_PASSO3) === '1');
ok('storage indisponível não quebra', lerOculto({ getItem() { throw new Error('x'); } }) === false);
ok('link da vitrine', linkVitrine('https://app.vercel.app') === 'https://app.vercel.app/portal');
ok('link com barra final', linkVitrine('https://app.vercel.app/') === 'https://app.vercel.app/portal');

/* -------------------------------- checkout ------------------------------- */
ok('whatsapp 11 dígitos ganha 55', normalizarWhatsapp('(34) 99999-8888') === '5534999998888');
ok('whatsapp com DDI mantém', normalizarWhatsapp('5534991439845') === '5534991439845');
ok('whatsapp vazio', normalizarWhatsapp('') === '');

ok('sem URL de checkout → vazio', urlCheckoutPro({}) === '');
ok('URL sem protocolo é descartada', urlCheckoutPro({ VITE_CHECKOUT_PRO_URL: 'pay.exemplo.com/x' }) === '');
ok('URL válida passa', urlCheckoutPro({ VITE_CHECKOUT_PRO_URL: 'https://pay.exemplo.com/pro' }) === 'https://pay.exemplo.com/pro');
ok('URL com espaço é aparada', urlCheckoutPro({ VITE_CHECKOUT_PRO_URL: '  https://pagar.io/pro  ' }) === 'https://pagar.io/pro');

const msg = mensagemCheckout({ planoNome: 'PRO', ciclo: 'mensal', email: 'a@b.com', uid: 'UID123', nomeOficina: 'Imob X', valor: 'R$ 39,90/mês' });
ok('mensagem cita plano', msg.includes('PRO'));
ok('mensagem cita ciclo', msg.includes('mensal'));
ok('mensagem cita e-mail', msg.includes('a@b.com'));
ok('mensagem cita UID', msg.includes('UID123'));
ok('mensagem cita imobiliária', msg.includes('Imob X'));
ok('mensagem cita valor', msg.includes('R$ 39,90'));
ok('mensagem sem campo vazio sobrando', !mensagemCheckout({}).includes('E-mail'));

const dCheckout = destinoCheckout({ checkoutUrl: 'https://pay.io/pro', whatsapp: '5534991439845', email: 'a@b.com', uid: 'U1' });
ok('com URL usa checkout', dCheckout.tipo === 'checkout' && dCheckout.url === 'https://pay.io/pro');

const dZap = destinoCheckout({ checkoutUrl: '', whatsapp: '34999998888', email: 'a@b.com', uid: 'U1', planoNome: 'Plano Profissional', ciclo: 'mensal' });
ok('sem URL usa WhatsApp', dZap.tipo === 'whatsapp' && dZap.url.startsWith('https://wa.me/5534999998888?text='));
ok('link do WhatsApp decodifica com os dados', decodeURIComponent(dZap.url).includes('a@b.com') && decodeURIComponent(dZap.url).includes('U1'));
ok('sem whatsapp configurado cai no padrão', destinoCheckout({}).url.includes(WHATSAPP_PADRAO));

ok('URL mensal escolhida pelo ciclo',
   urlCheckoutPro({ VITE_CHECKOUT_PRO_MENSAL_URL: 'https://pay.io/m', VITE_CHECKOUT_PRO_ANUAL_URL: 'https://pay.io/a' }, 'mensal') === 'https://pay.io/m');
ok('URL anual escolhida pelo ciclo',
   urlCheckoutPro({ VITE_CHECKOUT_PRO_MENSAL_URL: 'https://pay.io/m', VITE_CHECKOUT_PRO_ANUAL_URL: 'https://pay.io/a' }, 'anual') === 'https://pay.io/a');
ok('ciclo sem especificação usa o preço mensal unificado',
   urlCheckoutPro({ VITE_CHECKOUT_PRO_MENSAL_URL: 'https://pay.io/m', VITE_CHECKOUT_PRO_ANUAL_URL: 'https://pay.io/a' }) === 'https://pay.io/m');
ok('ciclo sem URL própria cai na antiga', urlCheckoutPro({ VITE_CHECKOUT_PRO_URL: 'https://pay.io/old' }, 'anual') === 'https://pay.io/old');
ok('sem nenhuma URL devolve vazio', urlCheckoutPro({}, 'mensal') === '');
ok('abrirDestino abre', abrirDestino({ url: 'https://x' }, () => ({})) === true);
ok('abrirDestino detecta bloqueio', abrirDestino({ url: 'https://x' }, () => null) === false);
ok('abrirDestino sem url', abrirDestino({ url: '' }, () => ({})) === false);
ok('abrirDestino trata exceção', abrirDestino({ url: 'https://x' }, () => { throw new Error('popup'); }) === false);

/* -------------------------- 3 degraus comerciais ------------------------- */
ok('degraus presentes', DEGRAUS.length >= 3);
ok('ordem inicial: essencial, pro', DEGRAUS[0].key === 'essencial' && DEGRAUS[1].key === 'pro');
ok('só o PRO é destaque', DEGRAUS.filter((d) => d.destaque).map((d) => d.key).join() === 'pro');
ok('PRO tem selo Mais escolhido', DEGRAUS.find((d) => d.key === 'pro').selo === 'Mais escolhido');
ok('Essencial é grátis', precoMensal(degrauPorKey('essencial'), 'mensal').replace(/\u00a0/g, ' ') === 'R$ 0,00');
ok('PRO mensal = preço único do catálogo', precoMensal(degrauPorKey('pro'), 'mensal').replace(/\u00a0/g, ' ') === 'R$ 39,90', precoMensal(degrauPorKey('pro'), 'mensal'));
ok('anual legado formata preço', typeof precoMensal(degrauPorKey('pro'), 'anual') === 'string');
ok('detalhe anual exibe total anual', /Cobrado/.test(detalheCiclo(degrauPorKey('pro'), 'anual')) || /478,80/.test(detalheCiclo(degrauPorKey('pro'), 'anual')));
ok('detalhe mensal sem fidelidade', detalheCiclo(degrauPorKey('pro'), 'mensal') === 'Sem fidelidade, cancele quando quiser');
ok('catálogo unificado consistente', typeof TOTAL_ANUAL === 'number');
ok('seletor de ciclo consistente', typeof rotuloEconomia('anual') === 'string');
ok('Operação IA inclui os dois módulos a partir de R$ 450',
   (degrauPorKey('esquadrao_ia') || degrauPorKey('automacao')).detalhePreco.includes('450') &&
   (degrauPorKey('esquadrao_ia') || degrauPorKey('automacao')).recursos.some((r) => /WhatsApp/.test(r)));
ok('PRO lista os recursos principais',
   ['Captação', 'Portais XML'].every((termo) =>
     degrauPorKey('pro').recursos.some((r) => r.includes(termo))));

/* --------------------- conferência no código da tela --------------------- */
import { readFileSync } from 'node:fs';
const planoJa = readFileSync(new URL('../src/components/Meuplano.jsx', import.meta.url), 'utf8');
ok('Meuplano usa planosComerciais', planoJa.includes("from '../lib/planosComerciais'"));
ok('Meuplano não auto-ativa plano pago', !planoJa.includes('httpsCallable') && !planoJa.includes('ativarPlano'));
const admin = readFileSync(new URL('../src/AdminNovo.jsx', import.meta.url), 'utf8');
ok('Meuplano usa destinoCheckout', planoJa.includes('destinoCheckout({'));
ok('CTA do PRO vem do catálogo', degrauPorKey('pro').cta === 'Assinar PRO');
ok('CTA da Operação IA vem do catálogo',
   (degrauPorKey('esquadrao_ia') || degrauPorKey('automacao')).cta.includes('Pólen') || (degrauPorKey('esquadrao_ia') || degrauPorKey('automacao')).cta.includes('Operação IA'));
ok('Meuplano renderiza o CTA do degrau', planoJa.includes('rotuloCta(degrau)'));
ok('Meuplano desenha os 3 degraus', planoJa.includes('DEGRAUS.map'));
ok('Meuplano não mostra seletor de ciclo anual', !planoJa.includes("setCiclo('anual')") && !planoJa.includes('rotuloEconomia'));
ok('Meuplano avisa que o e-mail do Asaas tem de ser o do cadastro',
   planoJa.includes('Importante: use no pagamento o mesmo e-mail cadastrado aqui para ativação automática imediata.'));
ok('aviso fica acima dos degraus de assinatura',
   planoJa.indexOf('mesmo e-mail cadastrado aqui') < planoJa.indexOf('DEGRAUS.map'));
ok('Meuplano abre o WhatsApp na implantação', planoJa.includes('falarEspecialista'));
ok('assinatura do PRO vai pelo checkout', (planoJa.includes('assinarPro') || planoJa.includes('assinar(') || planoJa.includes('const assinar =')) && planoJa.includes('destinoCheckout('));
ok('onboarding abre o modal de imóvel', admin.includes('onNovoImovel={() => setModalNovoImovel(true)}'));
ok('AdminNovo renderiza o onboarding na Visão Geral',
   admin.includes('<OnboardingPrimeiroUso') && admin.indexOf('<OnboardingPrimeiroUso') > admin.indexOf("abaAtiva === 'dashboard_imobi'"));

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
