/**
 * permissoes-menu.js — quais abas do painel cada papel pode ver
 * ============================================================================
 * Espelho da política das Firestore Rules (ehGestor). Aqui é só navegação:
 * esconder não substitui a regra — o bloqueio real continua no servidor.
 * ============================================================================
 */

export const PAPEIS_GESTAO = ['dono', 'admin', 'master'];

/** Abas exclusivas de gestão (financeiro, fiscal, retaguarda e configurações). */
export const MODULOS_SO_GESTAO = new Set([
  'financeiro',
  'fechamentos_diarios',
  'notafiscal',
  'fornecedores',
  'patrimonio',
  'relatorios_mensais',
  'config',
]);

export function ehGestor(papel) {
  return PAPEIS_GESTAO.includes(String(papel || '').toLowerCase());
}

export function moduloPermitido(id, papel) {
  if (!id) return false;
  if (ehGestor(papel)) return true;
  return !MODULOS_SO_GESTAO.has(id);
}

/** Filtra a lista de botões do menu, preservando a ordem original. */
export function filtrarModulos(itens, papel) {
  if (!Array.isArray(itens)) return [];
  if (ehGestor(papel)) return itens;
  return itens.filter((item) => moduloPermitido(item?.id, papel));
}

/** Mensagem para explicar a um corretor por que a aba não aparece. */
export const AVISO_ABA_GESTAO = 'Área de gestão: pergunte ao dono da conta.';
