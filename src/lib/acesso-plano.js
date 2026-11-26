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

/** Hosts que contam como máquina de desenvolvimento. */
const HOSTS_LOCAIS = Object.freeze(['localhost', '127.0.0.1', '::1', '[::1]']);

/**
 * Ambiente local de desenvolvimento?
 * ---------------------------------------------------------------------------
 * `npm run dev` (`import.meta.env.DEV`) ou acesso pelo host da máquina
 * (`http://localhost:5173`). Serve para o painel `/admin` abrir como Admin
 * Total sem login durante o desenvolvimento.
 *
 * Em produção — domínio real com bundle de produção — a resposta é `false`,
 * então a conta master (e-mail `VITE_SU` / claim `admin=true`) continua sendo
 * a única porta de administração. Não é atalho de permissão: é apenas a
 * máquina de quem desenvolve, sem autenticação no Firebase.
 */
export function ambienteDevLocal() {
  try {
    if (import.meta.env?.DEV === true) return true;
  } catch {
    /* runtime sem `import.meta.env` (scripts node): decide pelo host abaixo */
  }
  try {
    if (typeof window === 'undefined') return false;
    const host = String(window.location?.hostname || '').toLowerCase();
    return HOSTS_LOCAIS.includes(host);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* NÍVEL DE ACESSO DO PAINEL (/admin)                                  */
/* ------------------------------------------------------------------ */
/*
 * Regra única, usada pelo crachá do topo, pelo trilho de módulos e pela
 * guarda das abas:
 *   Grátis → abre só o Grátis
 *   PRO    → abre Grátis + PRO
 *   PLUS   → abre Grátis + PRO + PLUS
 *   master (Admin Total) → abre tudo
 *
 * O plano é SEMPRE o do catálogo (`shared/planos.json`). Booleanos legados
 * (`isPro`, `planoAssinante`) não criam um nível de acesso por si: era isso
 * que fazia o topo dizer "Plano PRO Ativo" enquanto Meu Plano mostrava o
 * Grátis.
 */

export const NIVEIS_ACESSO = Object.freeze(['gratis', 'pro', 'plus', 'master']);

/** Degraus que o master pode simular no topo do painel. */
export const NIVEIS_SIMULACAO = Object.freeze([
  { key: 'master', rotulo: 'Admin Total', descricao: 'Acesso de administração: libera todos os módulos.' },
  { key: 'gratis', rotulo: 'Simular Grátis', descricao: 'Vê o painel como conta gratuita: PRO e PLUS com cadeado.' },
  { key: 'pro', rotulo: 'Simular PRO', descricao: 'Vê o painel como PRO: libera o PRO e mantém o PLUS com cadeado.' },
  { key: 'plus', rotulo: 'Simular PLUS', descricao: 'Vê o painel como PLUS: libera PRO e PLUS.' },
]);

/**
 * Nível a partir de flags já resolvidas pelo catálogo (`temAcessoPlus`,
 * `isPlanoPro`). Nunca inventa nível: sem plano pago o resultado é `gratis`.
 */
export function nivelAcesso({ master = false, plus = false, pro = false } = {}) {
  if (master) return 'master';
  if (plus) return 'plus';
  if (pro) return 'pro';
  return 'gratis';
}

/** O que cada nível abre. GRÁTIS é sempre `true`. */
export function liberacoesDoNivel(nivel = 'gratis') {
  const atual = NIVEIS_ACESSO.includes(nivel) ? nivel : 'gratis';
  const pago = atual === 'pro' || atual === 'plus' || atual === 'master';
  return Object.freeze({
    gratis: true,
    pro: pago,
    plus: atual === 'plus' || atual === 'master',
  });
}

/** Rótulo do crachá do topo do /admin. `simulado` só existe para o master. */
export function rotuloPlano({ nivel = 'gratis', simulado = false, trialDias = 0 } = {}) {
  if (nivel === 'master') return '👑 Admin Total';
  const sufixo = simulado ? ' · simulação' : '';
  if (nivel === 'plus') return `💎 Plano PLUS Ativo${sufixo}`;
  if (nivel === 'pro') return `✨ Plano PRO Ativo${sufixo}`;
  if (trialDias > 0) return `⏳ Teste PRO · ${trialDias} dia${trialDias > 1 ? 's' : ''}`;
  return `⚡ Plano Gratuito${sufixo}`;
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
 * — a pílula do topo dizia "Plano PRO Ativo" e os módulos pagos apareciam como
 * "MÓDULO PREMIUM" (Diretor Comercial IA, agora exclusivo do PLUS).
 */
export function modoProEfetivo({ isModoGratis }) {
  return !isModoGratis;
}

/** Rótulo do alternador de visão no cabeçalho. */
export function rotuloVisao(modoPro) {
  return modoPro ? 'Visão Completa (PRO)' : 'Visão Enxuta (Grátis)';
}

/**
 * Texto da pílula do cabeçalho.
 * Delega para `rotuloPlano()` — é a MESMA fonte do crachá do /admin: sem
 * assinatura ativa (`isProConta` falso) a resposta é sempre "⚡ Plano
 * Gratuito", nunca "Plano PRO Ativo".
 */
export function rotuloModo({ master, modoPro, isProConta }) {
  if (master) {
    return modoPro ? '✨ MODO COMPLETO (PRO) ATIVO' : '⚡ MODO GRÁTIS ATIVO (Essencial)';
  }
  return rotuloPlano({ nivel: isProConta ? 'pro' : 'gratis' });
}

/** O alternador de demo aparece? */
export function mostrarAlternadorDemo(papelLogado, claimAdmin) {
  return ehMasterPlataforma(papelLogado, claimAdmin);
}

/** O botão "+ PRO" aparece? */
export function mostrarBotaoUpgrade({ master, isProConta }) {
  return !master && !isProConta;
}
