/**
 * src/lib/limiteDemo.js — limite de uso dos simuladores de demonstração.
 * ============================================================================
 * Regra comercial (D-22.02): a demonstração da Pólen e do Tom tem **5
 * interações gratuitas** para contas que ainda NÃO contrataram o módulo.
 * Quem já contratou usa sem contador.
 *
 * O contador vive em `localStorage` (`expressdemo:<modulo>`), não no Firestore:
 * é limite de demonstração comercial, não trava de segurança. Limpar o
 * navegador zera o contador — risco aceito e conhecido; o custo real de 5
 * mensagens por visitante é tratado pelo `cfo-compliance`.
 *
 * Funções puras o suficiente para rodar em Node (teste sem navegador).
 * ============================================================================
 */

export const LIMITE_DEMO = 5;
export const LIMITE_DEMO_TOM = 50;

const PREFIXO = 'expressdemo';

/** Chave de storage do módulo ('polen' | 'tom'). */
export function chaveDemo(modulo = 'polen') {
  const slug = String(modulo || 'polen')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/gi, '')
    .toLowerCase();
  return `${PREFIXO}:${slug || 'polen'}`;
}

function storage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

/** Quantas interações de demonstração já foram usadas (0 se não houver storage). */
export function lerUsoDemo(modulo = 'polen') {
  const store = storage();
  if (!store) return 0;
  try {
    const bruto = Number(store.getItem(chaveDemo(modulo)));
    return Number.isFinite(bruto) && bruto > 0 ? Math.floor(bruto) : 0;
  } catch {
    return 0;
  }
}

/** Soma 1 e devolve o total usado. */
export function registrarUsoDemo(modulo = 'polen') {
  const total = lerUsoDemo(modulo) + 1;
  const store = storage();
  if (store) {
    try {
      store.setItem(chaveDemo(modulo), String(total));
    } catch {
      /* modo privado / cota cheia: o limite só vale nesta sessão */
    }
  }
  return total;
}

/** Interações gratuitas que ainda restam. */
export function restantesDemo(modulo = 'polen', limite = LIMITE_DEMO) {
  return Math.max(0, limite - lerUsoDemo(modulo));
}

/**
 * Pode enviar mais uma mensagem?
 * `liberado = true` (módulo contratado) nunca é limitado.
 */
export function podeUsarDemo(modulo = 'polen', { liberado = false, limite = LIMITE_DEMO } = {}) {
  return liberado === true ? true : restantesDemo(modulo, limite) > 0;
}

/** Zera o contador (usado no "reiniciar" e nos testes). */
export function limparUsoDemo(modulo = 'polen') {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(chaveDemo(modulo));
  } catch {
    /* ignora */
  }
}
