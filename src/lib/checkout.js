/**
 * checkout.js — destino do botão "Assinar Plano PRO"
 * ============================================================================
 * Regra: nenhum clique sem destino. Se VITE_CHECKOUT_PRO_URL existe, abre o
 * checkout em nova aba. Se está vazia (ou inválida), abre o WhatsApp comercial
 * com mensagem pronta contendo plano, ciclo, e-mail e ID da conta — o que o
 * comercial precisa para ativar sem pedir dado de novo.
 * ============================================================================
 */

import { WHATSAPP_SUPORTE } from './contato';

export const WHATSAPP_PADRAO = WHATSAPP_SUPORTE;

/** Remove tudo que não é dígito e prefixa 55 quando falta DDI. */
export function normalizarWhatsapp(numero) {
  const d = String(numero || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.length >= 12) return d;
  if (d.length === 11 || d.length === 10) return `55${d}`;
  return d;
}

/**
 * URL de pagamento do ciclo. O ciclo mensal é o padrão; o anual continua aceito
 * somente para compatibilidade com chamadores e links já configurados.
 *
 * Recebe VALORES, não o objeto `import.meta.env`: passar o ambiente inteiro
 * faz o Vite inlinar todas as VITE_* disponíveis e o bundle muda de máquina
 * para máquina (hash de build diferente do local). Assim é reprodutível.
 */
export function urlCheckoutPro(env = {}, ciclo = 'mensal') {
  const cicloKey = String(ciclo || 'mensal').toUpperCase() === 'ANUAL' ? 'ANUAL' : 'MENSAL';
  const candidatos = [
    env[`VITE_CHECKOUT_PRO_${cicloKey}_URL`],
    env[cicloKey === 'MENSAL' ? 'mensal' : 'anual'],
    env.VITE_CHECKOUT_PRO_URL,
    env.unico,
    env.checkoutProUrl,
  ];
  for (const bruto of candidatos) {
    const url = String(bruto || '').trim();
    if (url && /^https?:\/\//i.test(url)) return url;
  }
  return '';
}

/**
 * Links de pagamento públicos do Asaas — usados quando a variável de ambiente
 * do plano está vazia. São os mesmos links divulgados no site; existem para o
 * botão de upgrade nunca cair no WhatsApp por falta de configuração.
 */
export const LINK_ASAAS_PADRAO = Object.freeze({
  essencial_plus: 'https://www.asaas.com/000/c/62w4zie9tigrfj5w', // Alias legado do PRO — R$ 39,90/mês
  pro: 'https://www.asaas.com/000/c/62w4zie9tigrfj5w', // PRO — R$ 39,90/mês
});

/**
 * Link de pagamento (Asaas) do PRO único.
 * `essencial` é aceito como alias da variável usada pelo plano de R$ 39,90.
 *
 * Variável ausente ou inválida → `LINK_ASAAS_PADRAO` do plano. Só devolve
 * string vazia para planos/serviços consultivos, que continuam indo pelo
 * WhatsApp comercial.
 *
 * Recebe VALORES (nunca `import.meta.env` inteiro) pelo mesmo motivo de
 * `urlCheckoutPro`: o bundle não pode variar de máquina para máquina.
 */
export function urlAsaasLink({ essencial = '', pro = '' } = {}, plano = 'pro') {
  const alvo = String(plano || '').toLowerCase();
  const ehPro = ['essencial_plus', 'profissional', 'pro'].includes(alvo);
  if (!ehPro) return '';
  const candidatos = [pro, essencial];

  for (const bruto of candidatos) {
    const url = String(bruto || '').trim();
    if (/^https?:\/\//i.test(url)) return url;
  }
  return LINK_ASAAS_PADRAO.pro;
}

/**
 * Anexa os dados da conta ao link de pagamento: `email` e
 * `externalReference=<oficinaId>` (o campo que o webhook do Asaas lê).
 * Parâmetro já presente na URL é preservado — o link configurado no painel manda.
 */
export function comDadosDaConta(url, { email = '', oficinaId = '' } = {}) {
  const alvo = String(url || '').trim();
  if (!alvo) return '';
  try {
    const destino = new URL(alvo);
    const mail = String(email || '').trim();
    const oficina = String(oficinaId || '').trim();
    if (mail && !destino.searchParams.has('email')) destino.searchParams.set('email', mail);
    if (oficina && !destino.searchParams.has('externalReference')) {
      destino.searchParams.set('externalReference', oficina);
    }
    return destino.toString();
  } catch {
    return alvo;
  }
}

export function mensagemCheckout({ planoNome = 'Plano PRO', ciclo = 'mensal', email = '', uid = '', nomeOficina = '', valor = '' } = {}) {
  const valorTxt = valor ? ` (${valor})` : '';
  return [
    `Olá! Quero assinar o ${planoNome} do Express Imobi Tech no ciclo ${ciclo}${valorTxt}.`,
    nomeOficina ? `Imobiliária: ${nomeOficina}.` : '',
    email ? `E-mail da conta: ${email}.` : '',
    uid ? `ID da conta: ${uid}.` : '',
    'Pode liberar a ativação, por favor?',
  ].filter(Boolean).join('\n');
}

/**
 * @returns {{tipo:'checkout'|'whatsapp', url:string}}
 */
export function destinoCheckout({
  checkoutUrl = '',
  whatsapp = '',
  planoNome = 'Plano PRO',
  ciclo = 'mensal',
  email = '',
  uid = '',
  nomeOficina = '',
  valor = '',
} = {}) {
  if (checkoutUrl && /^https?:\/\//i.test(String(checkoutUrl).trim())) {
    return { tipo: 'checkout', url: String(checkoutUrl).trim() };
  }
  const zap = normalizarWhatsapp(whatsapp) || WHATSAPP_PADRAO;
  const texto = mensagemCheckout({ planoNome, ciclo, email, uid, nomeOficina, valor });
  return { tipo: 'whatsapp', url: `https://wa.me/${zap}?text=${encodeURIComponent(texto)}` };
}

/** Abre o destino e devolve false quando o navegador bloqueia o popup. */
export function abrirDestino(destino, abrir) {
  if (!destino?.url) return false;
  const fn = abrir || (typeof window !== 'undefined' ? window.open.bind(window) : null);
  if (!fn) return false;
  try {
    const janela = fn(destino.url, '_blank', 'noopener,noreferrer');
    return Boolean(janela);
  } catch {
    return false;
  }
}
