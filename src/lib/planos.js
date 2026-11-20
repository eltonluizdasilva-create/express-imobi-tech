/**
 * planos.js — FONTE ÚNICA DE VERDADE (camada de acesso).
 *
 * Os DADOS moram em `shared/planos.json` e são lidos por:
 *   - este arquivo (frontend, via Vite)
 *   - functions/index.js (backend, via cópia gerada em functions/planos.json)
 *
 * Consumidores: Meuplano.jsx, AuthContext.jsx, lib/validacoes-planos.js,
 *               Cloud Function ativarPlano / pagamentoWebhook.
 *
 * REGRA: não duplicar preço, módulo ou limite em componente nenhum.
 */

import dados from '../../shared/planos.json';

export const WHATSAPP_COMERCIAL = dados.whatsappComercial;

/* ------------------------------------------------------------------ */
/* MÓDULOS                                                             */
/* ------------------------------------------------------------------ */

export const MODULOS_GRATIS = Object.freeze([...dados.modulos.gratis]);
export const MODULOS_ESSENCIAL_PLUS = Object.freeze([
  ...dados.modulos.gratis,
  ...(dados.modulos.essencial_plus_extra || []),
]);
export const MODULOS_PROFISSIONAL = Object.freeze([
  ...dados.modulos.gratis,
  ...(dados.modulos.essencial_plus_extra || []),
  ...dados.modulos.profissional_extra,
]);
export const MODULOS_ESQUADRAO = Object.freeze([
  ...dados.modulos.gratis,
  ...(dados.modulos.essencial_plus_extra || []),
  ...dados.modulos.profissional_extra,
  ...dados.modulos.esquadrao_extra,
]);

const MODULOS_POR_PLANO = {
  gratis: MODULOS_GRATIS,
  essencial_plus: MODULOS_ESSENCIAL_PLUS,
  profissional: MODULOS_PROFISSIONAL,
  esquadrao_ia: MODULOS_ESQUADRAO,
};

/* ------------------------------------------------------------------ */
/* CATÁLOGO COMERCIAL                                                  */
/* ------------------------------------------------------------------ */

export const PLANOS = Object.freeze(
  dados.planos.map((plano) =>
    Object.freeze({ ...plano, modulos: MODULOS_POR_PLANO[plano.key] || MODULOS_GRATIS })
  )
);

export const DEFAULT_PLANO_KEY = 'gratis';

/* ------------------------------------------------------------------ */
/* LIMITES (O.S., funcionários, abas)                                  */
/* ------------------------------------------------------------------ */

const limites = {};
for (const [chave, valor] of Object.entries(dados.limites)) {
  limites[chave] = Object.freeze({
    funcionarios: valor.funcionarios === null ? Infinity : valor.funcionarios,
    abas: valor.abas === null ? Infinity : valor.abas,
    os_mes: valor.osMes === null ? Infinity : valor.osMes,
    descricao: valor.descricao,
  });
}
// Alias legado: documentos antigos gravam "GRATUITO" em maiúsculas
limites.GRATUITO = limites.gratis;

export const LIMITES_PLANOS = Object.freeze(limites);

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

export const PLANOS_PRO = new Set(dados.planosPro);

const ALIAS_GRATIS = new Set(['', 'gratis', 'grátis', 'gratuito', 'free', 'trial']);

export function normalizarPlano(plano) {
  return String(plano ?? '').trim().toLowerCase();
}

/** true quando o plano (nome cru do Firestore) representa assinatura paga */
export function isPlanoPro(plano) {
  const chave = normalizarPlano(plano);
  if (ALIAS_GRATIS.has(chave)) return false;
  return PLANOS_PRO.has(chave);
}

/** Chave canónica do catálogo ('gratis' | 'profissional' | 'esquadrao_ia' | ...) */
export function chaveCanonica(plano) {
  const chave = normalizarPlano(plano);
  if (ALIAS_GRATIS.has(chave)) return DEFAULT_PLANO_KEY;
  if (chave === 'pro') return 'profissional';
  return chave;
}

export function getPlano(plano) {
  const chave = chaveCanonica(plano);
  return PLANOS.find((p) => p.key === chave) || PLANOS[0];
}

/** Limite de O.S. por mês (Infinity quando ilimitado ou plano desconhecido) */
export function getLimiteOS(plano) {
  const chave = normalizarPlano(plano);
  return (
    LIMITES_PLANOS[chave]?.os_mes ??
    LIMITES_PLANOS[chaveCanonica(chave)]?.os_mes ??
    Infinity
  );
}

export function getLimitesPlano(plano) {
  const chave = normalizarPlano(plano);
  return LIMITES_PLANOS[chave] || LIMITES_PLANOS[chaveCanonica(chave)] || LIMITES_PLANOS.gratis;
}

/** Chaves de plano que a Cloud Function pode ativar diretamente */
export const PLANOS_ATIVAVEIS = Object.freeze(
  PLANOS.filter((p) => p.autoAtivavel).map((p) => p.key)
);

/** Preço no ciclo, já formatado em BRL */
export function precoNoCiclo(plano, ciclo = 'mensal') {
  const item = typeof plano === 'string' ? getPlano(plano) : plano;
  if (!item) return null;
  if (!item.preco) return item.precoLabel || null;
  const valor = item.preco[ciclo] ?? item.preco.mensal ?? 0;
  if (valor === 0) return 'R$ 0';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
}
