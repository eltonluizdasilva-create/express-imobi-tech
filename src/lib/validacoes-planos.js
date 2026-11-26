/**
 * validacoes-planos.js — camada de compatibilidade.
 *
 * A FONTE ÚNICA de planos, preços, módulos e limites agora é `src/lib/planos.js`.
 * Este arquivo só re-exporta os nomes antigos para não quebrar imports legados
 * (ex.: src/components/admin/OS.jsx).
 */

export {
  LIMITES_PLANOS,
  PLANOS,
  PLANOS_PRO,
  MODULOS_GRATIS,
  MODULOS_PRO,
  MODULOS_PLUS,
  MODULOS_PROFISSIONAL,
  MODULOS_ESQUADRAO,
  normalizarPlano,
  isPlanoPro,
  temAcessoPro,
  temAcessoPlus,
  chaveCanonica,
  getPlano,
  getLimiteOS,
  getLimitesPlano,
  precoNoCiclo,
  limiteUsuariosDoPlano,
  precoUsuarioAdicional,
  rotuloUsuarios,
  WHATSAPP_COMERCIAL,
} from './planos';

/**
 * Conta quantas O.S. foram criadas no mês corrente.
 * Filtra pelo campo `data_registro` (ISO string).
 * @param {Array} listaOS
 * @returns {number}
 */
export function contarOSdoMes(listaOS = []) {
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  return listaOS.filter((os) => {
    const data = os?.data_registro ? new Date(os.data_registro) : null;
    if (!data || isNaN(data)) return false;
    return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
  }).length;
}
