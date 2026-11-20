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

/**
 * Modo efetivo do painel.
 * A visão do menu é uma preferência do usuário (Enxuta × Completa), igual para
 * todo mundo — inclusive para cliente que ainda não assina. O que continua
 * travado para quem não é PRO é o ACESSO ao módulo, não a lista de abas.
 *
 * Lote 4: plano pago SEMPRE abre a visão completa. Antes a função só olhava o
 * rascunho do nada (`isModoGratis`) e ignorava `isProConta`, então uma conta
 * PRO com `modoPainel = 'gratis'` no localStorage ficava com `modoPro = false`
 * — a pílula do topo dizia "Plano PRO Ativo" e os módulos PRO apareciam como
 * "MÓDULO PREMIUM" (Diretor Comercial IA).
 */
export function modoProEfetivo({ isModoGratis, isProConta }) {
  if (isProConta) return true;
  return !isModoGratis;
}

/** Rótulo do alternador de visão no cabeçalho. */
export function rotuloVisao(modoPro) {
  return modoPro ? 'Visão Completa (PRO)' : 'Visão Enxuta (Grátis)';
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
