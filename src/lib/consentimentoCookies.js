/**
 * consentimentoCookies.js — registro único do consentimento de cookies.
 * ============================================================================
 * Guarda o que o usuário decidiu em `localStorage` e é a ÚNICA fonte que um
 * script de terceiro deve consultar antes de rodar. Regras:
 *
 *   1. **Essencial não pede consentimento** (sessão, tema, contador de
 *      demonstração). Sem isso a plataforma não funciona.
 *   2. **Análise/terceiros é opt-in**: ausência de decisão = negado. Script de
 *      pixel/analytics só pode ser injetado com `consentimentoPermiteAnalitico()`
 *      verdadeiro — nunca no carregamento da página.
 *   3. Compatibilidade: a versão anterior gravava a string 'true'/'false'.
 *      Ela é lida como consentimento v0 (true = analítico liberado).
 *   4. Nenhum dado pessoal vai para o registro — só a decisão e a data.
 *
 * Hoje o produto NÃO carrega analytics, pixel ou script de terceiros. O registro
 * existe para que a ativação futura já nasça sob consentimento (D-22.04).
 * ============================================================================
 */

export const CHAVE_CONSENTIMENTO = 'lgpdConsent';
export const VERSAO_CONSENTIMENTO = 1;

/** Evento usado por qualquer tela para reabrir o banner de preferências. */
export const EVENTO_ABRIR_COOKIES = 'express:abrir-preferencias-cookies';

/**
 * Decisão atual ou `null` quando o usuário ainda não escolheu.
 * @returns {null | {versao: number, essencial: true, analitico: boolean, quando: string|null}}
 */
export function lerConsentimento() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const bruto = localStorage.getItem(CHAVE_CONSENTIMENTO);
    if (!bruto) return null;

    // Formato legado (v0): string booleana.
    if (bruto === 'true') return { versao: 0, essencial: true, analitico: true, quando: null };
    if (bruto === 'false') return { versao: 0, essencial: true, analitico: false, quando: null };

    const dados = JSON.parse(bruto);
    if (!dados || typeof dados !== 'object') return null;
    return {
      versao: Number(dados.versao) || 0,
      essencial: true,
      analitico: dados.analitico === true,
      quando: typeof dados.quando === 'string' ? dados.quando : null,
    };
  } catch {
    return null;
  }
}

/**
 * Grava a decisão. `analitico: false` = só essenciais.
 * @returns {{versao: number, essencial: true, analitico: boolean, quando: string}}
 */
export function salvarConsentimento({ analitico = false } = {}) {
  const registro = {
    versao: VERSAO_CONSENTIMENTO,
    essencial: true,
    analitico: analitico === true,
    quando: new Date().toISOString(),
  };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CHAVE_CONSENTIMENTO, JSON.stringify(registro));
    }
  } catch {
    /* modo privado / cota cheia: a decisão vale só nesta sessão */
  }
  return registro;
}

/** `true` só quando o usuário liberou análise/terceiros de forma explícita. */
export function consentimentoPermiteAnalitico() {
  return lerConsentimento()?.analitico === true;
}

/** Abre o banner novamente (usado no rodapé e na Política de Privacidade). */
export function abrirPreferenciasCookies() {
  try {
    window.dispatchEvent(new CustomEvent(EVENTO_ABRIR_COOKIES));
  } catch {
    /* ambiente sem window (SSR/teste) */
  }
}
