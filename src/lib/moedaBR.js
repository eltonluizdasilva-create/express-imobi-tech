/**
 * Máscara de moeda brasileira para campos de digitação (R$ 350.000,00).
 *
 * Contrato: o estado do campo guarda **texto mascarado** (o que o corretor vê) e o
 * Firestore recebe **número limpo** por `parseMoedaBR()` (src/hooks/useQuickActions.js),
 * que já entende "350.000,00", "350.000" e "R$ 350.000,00". Nenhum dado é salvo com
 * ponto de milhar ou vírgula — o banco guarda `350000` como Number.
 *
 * Módulo puro (sem React, sem Firebase) para poder ser exercitado em Node puro.
 */

/** Placeholder padrão dos campos monetários. */
export const PLACEHOLDER_MOEDA = 'R$ 0,00';

/**
 * Converte texto mascarado ("350.000,00", "350.000", "R$ 350.000,00") em Number limpo
 * para o Firestore. Fonte única — `src/hooks/useQuickActions.js` reexporta esta função para
 * os chamadores antigos (AdminNovo, Financeiro, LeadsPage), então o contrato público segue igual.
 */
export function parseMoedaBR(valorInput) {
  if (typeof valorInput === 'number') return Number.isFinite(valorInput) ? valorInput : 0;
  const str = String(valorInput || '').trim();
  if (!str) return 0;
  // Se tiver vírgula como separador decimal (ex: "1.500,50" ou "450.000,00")
  if (str.includes(',')) {
    const limpo = str.replace(/[^\d,-]/g, '').replace(/\./g, '').replace(',', '.');
    return Math.abs(parseFloat(limpo)) || 0;
  }
  // Se tiver pontos de milhar sem vírgula (ex: "450.000" -> 450000)
  const partesPonto = str.replace(/[^\d.]/g, '').split('.');
  if (partesPonto.length > 1 && partesPonto[partesPonto.length - 1].length === 3) {
    return Math.abs(parseFloat(partesPonto.join(''))) || 0;
  }
  return Math.abs(parseFloat(str.replace(/[^\d.]/g, ''))) || 0;
}

/** Agrupa a parte inteira com ponto de milhar: 350000 -> "350.000". */
function agruparMilhar(inteiro) {
  const semZeroEsquerda = inteiro.replace(/^0+(?=\d)/, '');
  return semZeroEsquerda.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Formata o texto digitado para o padrão brasileiro, mantendo o cursor coerente
 * quando o usuário digita, apaga ou cola um valor.
 * - "350000"        -> "350.000"
 * - "350000,5"      -> "350.000,5"
 * - "R$ 350.000,00" -> "350.000,00" (cola com prefixo/símbolo é aceita)
 */
export function mascararMoedaBR(texto) {
  const limpo = String(texto ?? '').replace(/[^\d,]/g, '');
  if (!/\d/.test(limpo)) return '';
  const [inteira = '', ...resto] = limpo.split(',');
  const temVirgula = limpo.includes(',');
  const inteiraFormatada = agruparMilhar(inteira);
  if (!temVirgula) return inteiraFormatada;
  const centavos = resto.join('').slice(0, 2);
  return `${inteiraFormatada || '0'},${centavos}`;
}

/**
 * Fecha o valor quando o campo perde o foco: garante os centavos (,00) e devolve
 * "" para campo vazio — campo vazio continua sendo "sem valor", não R$ 0,00.
 */
export function finalizarMoedaBR(texto) {
  const mascarado = mascararMoedaBR(texto);
  if (!mascarado) return '';
  if (mascarado.includes(',')) {
    const [inteira, centavos = ''] = mascarado.split(',');
    return `${inteira},${centavos.padEnd(2, '0').slice(0, 2)}`;
  }
  return `${mascarado},00`;
}
