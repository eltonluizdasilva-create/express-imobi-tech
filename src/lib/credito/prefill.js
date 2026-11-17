/**
 * prefill.js — ponte entre o card de lead/imóvel e a aba Correspondente/Crédito.
 * Usa sessionStorage para sobreviver ao clique de navegação sem precisar
 * levantar estado no AdminNovo (que deve permanecer com mudanças mínimas).
 */
const CHAVE = 'imobi:credito:prefill';

export function setCreditoPrefill(dados) {
  const payload = { ...dados, em: new Date().toISOString() };
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(payload));
  } catch {
    // navegador bloqueou storage: mantém em memória do módulo
    memória = payload;
  }
  memória = payload;
  return payload;
}

let memória = null;

export function consumeCreditoPrefill() {
  let bruto = null;
  try {
    bruto = sessionStorage.getItem(CHAVE);
    if (bruto) sessionStorage.removeItem(CHAVE);
  } catch {
    bruto = null;
  }
  const payload = bruto ? safeParse(bruto) : memória;
  memória = null;
  return payload || null;
}

function safeParse(texto) {
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}
