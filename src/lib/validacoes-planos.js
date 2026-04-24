/**
 * validacoes-planos.js
 * ====================
 * Fonte única da verdade para limites por plano.
 * Altere APENAS aqui para refletir em todo o sistema.
 */

export const LIMITES_PLANOS = {
  GRATUITO: {
    funcionarios: 1,
    abas: 1,
    os_mes: 1,          // ← máximo de O.S. por mês no plano grátis
    alerta_em: 1,       // ← avisa quando a oficina abrir a 2ª O.S.
    descricao: 'Até 1 Ordem de Serviço por mês',
  },
  essencial: {
    funcionarios: 1,
    abas: 3,
    os_mes: Infinity,
    descricao: 'O.S. ilimitadas',
  },
  profissional: {
    funcionarios: 3,
    abas: 5,
    os_mes: Infinity,
    descricao: 'O.S. ilimitadas',
  },
  especialista: {
    funcionarios: 5,
    abas: 8,
    os_mes: Infinity,
    descricao: 'O.S. ilimitadas',
  },
  master: {
    funcionarios: Infinity,
    abas: Infinity,
    os_mes: Infinity,
    descricao: 'Acesso total',
  },
  planoPrimeIA: {
    funcionarios: Infinity,
    abas: Infinity,
    os_mes: Infinity,
    descricao: 'Acesso total + IA Prime',
  },
};

/**
 * Retorna o limite de O.S. por mês para um plano.
 * @param {string} plano - ex: 'GRATUITO', 'essencial'
 * @returns {number}
 */
export function getLimiteOS(plano) {
  return LIMITES_PLANOS[plano]?.os_mes ?? Infinity;
}

/**
 * Retorna o número de O.S. criadas no mês atual.
 * Filtra listaOS pelo campo data_registro (ISO string).
 * @param {Array} listaOS
 * @returns {number}
 */
export function contarOSdoMes(listaOS = []) {
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  return listaOS.filter((os) => {
    const data = os.data_registro ? new Date(os.data_registro) : null;
    if (!data || isNaN(data)) return false;
    return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
  }).length;
}
