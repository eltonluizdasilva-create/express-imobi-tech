/**
 * preferencias.js — UF e porte do município da imobiliária.
 *
 * Persistência simples em localStorage (chave versionada) + evento para o
 * componente que estiver montado reagir na hora, sem recarregar a página.
 */

import { UF_PADRAO, PORTE_PADRAO, porteValido, UFS } from './regrasEstaduais.js';

const CHAVE = 'express_imobi_preferencias_v1';
const EVENTO = 'express:preferencias';

const padrao = () => ({ ufPadrao: UF_PADRAO, porteMunicipioPadrao: PORTE_PADRAO });

export function lerPreferencias() {
  if (typeof window === 'undefined') return padrao();
  try {
    const bruto = JSON.parse(window.localStorage.getItem(CHAVE) || '{}');
    const ufPadrao = UFS.includes(String(bruto.ufPadrao || '').toUpperCase())
      ? String(bruto.ufPadrao).toUpperCase()
      : UF_PADRAO;
    return {
      ufPadrao,
      porteMunicipioPadrao: porteValido(bruto.porteMunicipioPadrao) ? bruto.porteMunicipioPadrao : PORTE_PADRAO,
    };
  } catch {
    return padrao();
  }
}

export function salvarPreferencias(parcial) {
  if (typeof window === 'undefined') return padrao();
  const atuais = lerPreferencias();
  const novas = { ...atuais, ...(parcial || {}) };
  if (!UFS.includes(novas.ufPadrao)) novas.ufPadrao = UF_PADRAO;
  if (!porteValido(novas.porteMunicipioPadrao)) novas.porteMunicipioPadrao = PORTE_PADRAO;
  window.localStorage.setItem(CHAVE, JSON.stringify(novas));
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: novas }));
  return novas;
}

export function assinarPreferencias(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = (e) => callback(e.detail || lerPreferencias());
  window.addEventListener(EVENTO, handler);
  return () => window.removeEventListener(EVENTO, handler);
}

export const EVENTO_PREFERENCIAS = EVENTO;
