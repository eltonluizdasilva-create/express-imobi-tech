/**
 * api/_gatilho.js — separa o handoff `[GATILHO_HERMES: {...}]` do texto da IA.
 * ============================================================================
 * O agente escreve a linha de handoff como instrução interna. Ela NUNCA pode
 * chegar ao cliente no WhatsApp e nunca pode quebrar o JSON de resposta.
 *
 *   separarGatilho('[GATILHO_HERMES: {"acao":"CHAMAR_IAGO","motivo":"apto 3Q"}]\nOlá!')
 *     -> { texto: 'Olá!', gatilho: { acao: 'CHAMAR_IAGO', motivo: 'apto 3Q' } }
 *
 * REGRAS
 *   - o bloco é removido SEMPRE, mesmo quando o JSON está inválido (é marcador
 *     interno; se sobrar no texto, vaza para o cliente);
 *   - JSON quebrado em várias linhas é aceito (regex não guloso + `s`);
 *   - `acao` só passa se casar com /^[A-Z][A-Z0-9_]{2,39}$/ — o resto vira null;
 *   - `motivo` é achatado e cortado em 160 caracteres.
 * ============================================================================
 */

export const RE_GATILHO = /\[GATILHO_HERMES\s*:?\s*(\{[\s\S]*?\})\s*\]/gi;

/** Mesmo bloco, mas ancorado na linha: evita deixar uma linha em branco órfã. */
const RE_LINHA = /^[ \t]*\[GATILHO_HERMES\s*:?\s*\{[\s\S]*?\}[ \t\r\n]{0,3}\]?[ \t]*\r?\n?/gim;

const RE_ACAO = /^[A-Z][A-Z0-9_]{2,39}$/;

function textoLimpo(valor) {
  return String(valor ?? '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string} textoBruto
 * @returns {{texto: string, gatilho: null | {acao: string, motivo: string}}}
 */
export function separarGatilho(textoBruto) {
  const texto = String(textoBruto ?? '');
  const partes = [...texto.matchAll(RE_GATILHO)];

  const limpo = texto
    .replace(RE_LINHA, '')
    .replace(RE_GATILHO, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!partes.length) return { texto: limpo, gatilho: null };

  let gatilho = null;
  for (const parte of partes) {
    try {
      const objeto = JSON.parse(parte[1]);
      const acao = textoLimpo(objeto?.acao).toUpperCase();
      if (RE_ACAO.test(acao)) {
        gatilho = { acao, motivo: textoLimpo(objeto?.motivo).slice(0, 160) };
        break;
      }
    } catch {
      // JSON inválido: o marcador já saiu do texto, segue sem gatilho.
    }
  }

  return { texto: limpo, gatilho };
}
