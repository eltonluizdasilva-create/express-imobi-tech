/**
 * acesso-plano.js — quem pode ver o alternador de DEMO e qual plano está ativo
 * ============================================================================
 * Regra comercial: o seletor "Modo Grátis | Modo Completo (PRO)" é ferramenta
 * de demonstração da conta MASTER. Para cliente final o painel mostra o plano
 * REAL — e o modo do painel segue o plano, não o rascunho salvo no navegador.
 * ============================================================================
 */

/** MASTER = VITE_SU (papel 'master') ou custom claim admin=true. */
export function ehMasterPlataforma(papelLogado, claimAdmin) {
  return papelLogado === 'master' || claimAdmin === true;
}

/** Modo efetivo do painel. */
export function modoProEfetivo({ master, isModoGratis, isProConta }) {
  if (master) return !isModoGratis;
  return Boolean(isProConta);
}

/** Texto da pílula do cabeçalho. */
export function rotuloModo({ master, modoPro, isProConta }) {
  if (master) {
    return modoPro ? '✨ MODO COMPLETO (PRO) ATIVO' : '⚡ MODO GRÁTIS ATIVO (Essencial)';
  }
  return isProConta ? '✨ Plano PRO Ativo' : '⚡ Plano Gratuito';
}

/** O alternador de demo aparece? */
export function mostrarAlternadorDemo(papelLogado, claimAdmin) {
  return ehMasterPlataforma(papelLogado, claimAdmin);
}

/** O botão "+ PRO" aparece? */
export function mostrarBotaoUpgrade({ master, isProConta }) {
  return !master && !isProConta;
}
