/**
 * modoLite.js — Regras e utilitários do alternador "Modo Lite / Modo Completo".
 *
 * Modo Lite (express_imobi_modo_lite):
 * - Simplifica a interface para corretores autônomos e equipes enxutas.
 * - Exibe apenas os pilares comerciais "Grátis" e "PRO".
 * - Oculta os pilares e módulos exclusivos do "PLUS" (Simuladores, Assistente Legal,
 *   Due Diligence, Esteira Cartório, Radar de Entorno, Diretor Comercial IA, Roleta,
 *   Repasses & NF) e os badges avulsos de IA Pólen / Tom.
 * - Quando desativado (Modo Completo), mantém 100% da interface original.
 */

export const CHAVE_MODO_LITE = 'express_imobi_modo_lite';

export const PILARES_MODO_LITE = ['gratis', 'pro'];

export const MODULOS_EXCLUSIVOS_PLUS = [
  'credito',
  'radar_captacao',
  'administrador',
  'roleta_imobi',
  'notafiscal',
  'contador',
  'juridico_imobi',
  'tarefa',
  'avaliacao_imovel',
  'reunioes-atas',
  'pos_venda',
  'agentes_ia',
  'sofia_whatsapp',
  'nucleo_tom',
  'mapa_inteligencia',
];

/**
 * Retorna se o Modo Lite está ativado a partir do storage.
 */
export function lerEstadoModoLite() {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(CHAVE_MODO_LITE) === 'true';
    }
  } catch {
    // fallback se localStorage bloqueado
  }
  return false;
}

/**
 * Persiste o estado do Modo Lite no localStorage.
 */
export function gravarEstadoModoLite(ativo) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CHAVE_MODO_LITE, String(Boolean(ativo)));
    }
  } catch {
    // fallback
  }
  return Boolean(ativo);
}

/**
 * Filtra as seções/pilares da navegação baseado no estado do Modo Lite.
 */
export function filtrarSecoesModoLite(secoes = [], modoLite = false) {
  if (!modoLite) return secoes;
  return secoes.filter((secao) => PILARES_MODO_LITE.includes(secao.key));
}

/**
 * Verifica se um módulo específico deve ser ocultado no Modo Lite.
 */
export function moduloOcultoNoModoLite(moduloId) {
  return MODULOS_EXCLUSIVOS_PLUS.includes(moduloId);
}
