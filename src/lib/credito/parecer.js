/**
 * parecer.js — Parecer de viabilidade por IA (Fase 4)
 * ============================================================================
 * LGPD ESTRITA: este módulo só aceita um objeto com 8 campos numéricos/
 * categóricos. Nome, CPF, e-mail, telefone, endereço e qualquer texto livre
 * são DESCARTADOS antes de montar o prompt (lista branca, não lista negra).
 * ============================================================================
 */

/** Únicos campos que podem chegar ao modelo. */
export const CAMPOS_PERMITIDOS = [
  'rendaTotal',
  'idadeMaisVelho',
  'vinculo',
  'restricaoSerasa',
  'restricaoBacen',
  'restricaoRegistrato',
  'tipoRestricao',
  'fgts',
  'entradaDisponivel',
  'valorImovel',
  'numProponentes',
];

const VINCULOS = ['clt', 'autonomo', 'empresario', 'aposentado', 'servidor', 'outro'];

function numero(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function booleano(v) {
  return v === true || v === 'true' || v === 'sim' || v === 1;
}

/**
 * Lista branca rígida: monta o objeto que vai ao modelo.
 * Qualquer chave fora de CAMPOS_PERMITIDOS é ignorada.
 */
export function sanitizarEntrada(bruto = {}) {
  const vinculo = String(bruto.vinculo || 'outro').toLowerCase();
  return {
    rendaTotal: numero(bruto.rendaTotal),
    idadeMaisVelho: numero(bruto.idadeMaisVelho),
    vinculo: VINCULOS.includes(vinculo) ? vinculo : 'outro',
    restricaoSerasa: booleano(bruto.restricaoSerasa),
    restricaoBacen: booleano(bruto.restricaoBacen),
    restricaoRegistrato: booleano(bruto.restricaoRegistrato),
    // texto livre é o maior risco de PII: limitado e sem dígitos longos
    tipoRestricao: String(bruto.tipoRestricao || '').replace(/\d{5,}/g, '').slice(0, 120),
    fgts: numero(bruto.fgts),
    entradaDisponivel: numero(bruto.entradaDisponivel),
    valorImovel: numero(bruto.valorImovel),
    numProponentes: Math.max(1, Math.min(6, Math.trunc(numero(bruto.numProponentes)) || 1)),
  };
}

const brl = (v) => 'R$ ' + (Number(v) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 });

export function montarPromptParecer(dados) {
  const d = sanitizarEntrada(dados);
  const restricoes = [
    d.restricaoSerasa ? 'Serasa: SIM' : 'Serasa: não',
    d.restricaoBacen ? 'Bacen: SIM' : 'Bacen: não',
    d.restricaoRegistrato ? 'Registrato: SIM' : 'Registrato: não',
  ].join(' · ');

  return `Você é analista de crédito imobiliário de um correspondente bancário. Analise os dados AGREGADOS abaixo e responda APENAS com JSON válido, sem markdown.

DADOS (sem qualquer identificação pessoal):
  Renda bruta familiar: ${brl(d.rendaTotal)}
  Proponentes: ${d.numProponentes}
  Idade do proponente mais velho: ${d.idadeMaisVelho || 'não informada'} anos
  Vínculo do principal: ${d.vinculo}
  Restrições: ${restricoes}
  Tipo de restrição declarada: ${d.tipoRestricao || 'não informada'}
  Saldo de FGTS: ${brl(d.fgts)}
  Entrada disponível: ${brl(d.entradaDisponivel)}
  Valor do imóvel: ${brl(d.valorImovel)}

TAREFA: estime, para o mercado brasileiro (SBPE e MCMV), quais linhas têm MAIOR chance de aprovação, os riscos e o que fazer para viabilizar. Seja conservador: se a parcela estimada passar de 30% da renda, diga isso.

FORMATO OBRIGATÓRIO:
{"resumo":"até 400 caracteres","bancos":[{"banco":"","linha":"SBPE|MCMV|Pró-cotista","chance":"alta|media|baixa","justificativa":"até 240 caracteres"}],"riscos":[""],"acoes":[""],"comprometimentoEstimado":0}
Números como número, não string. Não invente dados que não estejam acima.`;
}

/** Extrai e valida o JSON devolvido pelo modelo. */
export function interpretarParecer(texto = '') {
  const limpo = String(texto).replace(/```json/gi, '').replace(/```/g, '').trim();
  const inicio = limpo.indexOf('{');
  const fim = limpo.lastIndexOf('}');
  if (inicio === -1 || fim <= inicio) return null;
  try {
    const d = JSON.parse(limpo.slice(inicio, fim + 1));
    return {
      resumo: String(d.resumo || '').slice(0, 800),
      bancos: Array.isArray(d.bancos)
        ? d.bancos.slice(0, 6).map((b) => ({
            banco: String(b?.banco || '').slice(0, 60),
            linha: String(b?.linha || '').slice(0, 40),
            chance: ['alta', 'media', 'baixa'].includes(String(b?.chance).toLowerCase())
              ? String(b.chance).toLowerCase() : 'media',
            justificativa: String(b?.justificativa || '').slice(0, 300),
          }))
        : [],
      riscos: Array.isArray(d.riscos) ? d.riscos.slice(0, 6).map((r) => String(r).slice(0, 240)) : [],
      acoes: Array.isArray(d.acoes) ? d.acoes.slice(0, 8).map((a) => String(a).slice(0, 240)) : [],
      comprometimentoEstimado: Number.isFinite(Number(d.comprometimentoEstimado))
        ? Number(d.comprometimentoEstimado) : null,
    };
  } catch {
    return null;
  }
}

/** Custo estimado em créditos de IA (1 chamada = 1 crédito). */
export const CREDITOS_POR_PARECER = 1;

export const AVISO_LEGAL_PARECER =
  'Parecer estimado por IA para apoio comercial. Não é decisão de crédito, não consulta birôs e não substitui a análise do banco.';
