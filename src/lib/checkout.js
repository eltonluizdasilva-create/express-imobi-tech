/**
 * checkout.js — destino do botão "Assinar Plano PRO"
 * ============================================================================
 * Regra: nenhum clique sem destino. Se VITE_CHECKOUT_PRO_URL existe, abre o
 * checkout em nova aba. Se está vazia (ou inválida), abre o WhatsApp comercial
 * com mensagem pronta contendo plano, ciclo, e-mail e ID da conta — o que o
 * comercial precisa para ativar sem pedir dado de novo.
 * ============================================================================
 */

export const WHATSAPP_PADRAO = '5534991439845';

/** Remove tudo que não é dígito e prefixa 55 quando falta DDI. */
export function normalizarWhatsapp(numero) {
  const d = String(numero || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.length >= 12) return d;
  if (d.length === 11 || d.length === 10) return `55${d}`;
  return d;
}

export function urlCheckoutPro(env = {}) {
  const bruto = String(env.VITE_CHECKOUT_PRO_URL || env.checkoutProUrl || '').trim();
  if (!bruto) return '';
  return /^https?:\/\//i.test(bruto) ? bruto : '';
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
