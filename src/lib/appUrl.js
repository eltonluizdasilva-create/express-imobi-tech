/**
 * appUrl.js — endereço público do painel e contato institucional.
 * ============================================================================
 * Fonte única para tudo que aparece ao usuário (link copiado, QR Code, rodapé,
 * termos e política). A ordem é:
 *   1. VITE_PUBLIC_APP_URL  (defina na Vercel quando o domínio próprio entrar)
 *   2. origem da aba atual  (funciona hoje, em produção e em preview)
 *   3. domínio oficial      (fallback seguro para render no servidor)
 * Assim nenhum link gerado aponta para domínio morto.
 * ============================================================================
 */

export const EMAIL_INSTITUCIONAL = 'contato@expresstech.com.br';
export const SITE_INSTITUCIONAL = 'https://expresstech.com.br';
export const DOMINIO_OFICIAL = 'https://imobi.expresstech.com.br';

/** Origem pública sem barra no fim. */
export function origemPublica() {
  const doEnv = typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_PUBLIC_APP_URL
    : '';
  const limpa = String(doEnv || '').trim().replace(/\/$/, '');
  if (limpa) return limpa;

  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return String(window.location.origin).replace(/\/$/, '');
  }
  return DOMINIO_OFICIAL;
}

/** Só o host, para exibir em texto (ex.: imobi.expresstech.com.br). */
export function hostPublico() {
  return origemPublica().replace(/^https?:\/\//, '');
}

/** URL completa de um caminho interno ("/portal", "/status/..." etc.). */
export function urlPublica(caminho = '') {
  const base = origemPublica();
  if (!caminho) return base;
  return `${base}${String(caminho).startsWith('/') ? '' : '/'}${caminho}`;
}
