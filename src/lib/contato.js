/**
 * contato.js — CANAL ÚNICO DE CONTATO DA EXPRESS TECH
 * ============================================================================
 * Todo link de WhatsApp do produto (site, painel, suporte, checkout, e-mails
 * comerciais) aponta para AQUI. Trocar o número é editar uma linha neste
 * arquivo — nenhum componente deve voltar a escrever wa.me com dígitos soltos.
 *
 * Regra herdada (D-22.08): os números antigos +55 34 98827-3194 e
 * +55 34 99143-9845 estão CANCELADOS. Se algum aparecer em tela, é bug.
 *
 * O WhatsApp é o Business atual (número +856 20 9964 0154). O e-mail
 * institucional continua em `lib/appUrl.js` (EMAIL_INSTITUCIONAL) e é
 * reexportado aqui para quem só precisa do "contato".
 * ============================================================================
 */

import { EMAIL_INSTITUCIONAL } from './appUrl';

/** Número para `wa.me` — só dígitos, com DDI (USADO NO CÓDIGO). */
export const WHATSAPP_SUPORTE = '8562099640154';

/** Mesmo número legível para exibir na tela. */
export const WHATSAPP_SUPORTE_EXIBICAO = '+856 20 9964 0154';

/** E-mail de atendimento (mesma fonte do rodapé e dos documentos legais). */
export const EMAIL_SUPORTE = EMAIL_INSTITUCIONAL;

/** Números cancelados — usados só para barrar regressão em teste/grep. */
export const WHATSAPP_ANTIGOS = Object.freeze(['5534988273194', '5534991439845']);

/** Verdadeiro se o número informado é um dos antigos (não deve ser usado). */
export function ehNumeroAntigo(valor) {
  const digitos = String(valor || '').replace(/\D/g, '');
  return WHATSAPP_ANTIGOS.includes(digitos);
}

/**
 * Link pronto do WhatsApp de suporte.
 * @param {string} [mensagem] texto pré-preenchido
 * @param {string} [numero]   sobrescreve o número (ex.: corretor do imóvel)
 */
export function linkWhatsApp(mensagem = '', numero = WHATSAPP_SUPORTE) {
  const digits = String(numero || '').replace(/\D/g, '');
  const base = `https://wa.me/${digits}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

/** Link mailto: do atendimento, com assunto opcional. */
export function linkEmail(assunto = '') {
  return assunto
    ? `mailto:${EMAIL_SUPORTE}?subject=${encodeURIComponent(assunto)}`
    : `mailto:${EMAIL_SUPORTE}`;
}
