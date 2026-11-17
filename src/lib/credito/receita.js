/**
 * receita.js — comissão de correspondente (Fase 5)
 * ============================================================================
 * PURO. Tabela padrão por banco + cálculos de comissão, recebido e conversão.
 * ============================================================================
 */

export const STATUS_RECEBIMENTO = [
  { key: 'a_receber', label: 'A receber', cor: '#eab308' },
  { key: 'faturado', label: 'Faturado', cor: '#0ea5e9' },
  { key: 'recebido', label: 'Recebido', cor: '#10b981' },
];

/** Tabela padrão de comissão do correspondente (% sobre o valor financiado). */
export const TABELA_COMISSAO_PADRAO = [
  { banco: 'Caixa', modalidade: 'SBPE', min: 1.0, max: 1.5, padrao: 1.2 },
  { banco: 'Caixa', modalidade: 'MCMV', min: 1.0, max: 1.4, padrao: 1.1 },
  { banco: 'Itaú', modalidade: 'SBPE', min: 1.0, max: 1.6, padrao: 1.3 },
  { banco: 'Bradesco', modalidade: 'SBPE', min: 1.0, max: 1.5, padrao: 1.2 },
  { banco: 'Santander', modalidade: 'SBPE', min: 1.1, max: 1.6, padrao: 1.35 },
  { banco: 'Inter', modalidade: 'SBPE', min: 0.9, max: 1.3, padrao: 1.0 },
];

/** Comissão sugerida para banco+modalidade (fallback: 1%). */
export function comissaoSugerida(banco, modalidade) {
  const achado = TABELA_COMISSAO_PADRAO.find(
    (t) => t.banco.toLowerCase() === String(banco || '').toLowerCase()
      && (!modalidade || t.modalidade.toLowerCase() === String(modalidade).toLowerCase()),
  ) || TABELA_COMISSAO_PADRAO.find((t) => t.banco.toLowerCase() === String(banco || '').toLowerCase());
  return achado ? achado.padrao : 1.0;
}

export function valorComissao(valorFinanciado, percentual) {
  const base = Number(valorFinanciado) || 0;
  const pct = Number(percentual);
  if (base <= 0 || !Number.isFinite(pct) || pct <= 0) return 0;
  return Number(((base * pct) / 100).toFixed(2));
}

/** Painel da aba Receita & Comissões. */
export function resumoReceita(processos = []) {
  const ativos = processos.filter((p) => p?.etapa !== 'reprovado');
  const totalFinanciado = ativos.reduce((a, p) => a + (Number(p?.valorFinanciado) || 0), 0);

  let prevista = 0;
  let recebida = 0;
  let faturada = 0;
  for (const p of ativos) {
    const comissao = Number(p?.comissaoValor)
      || valorComissao(p?.valorFinanciado, p?.comissaoPct || comissaoSugerida(p?.banco, p?.modalidade));
    if (p?.statusRecebimento === 'recebido') recebida += comissao;
    else if (p?.statusRecebimento === 'faturado') faturada += comissao;
    prevista += comissao;
  }

  return {
    totalFinanciado,
    prevista: Number(prevista.toFixed(2)),
    faturada: Number(faturada.toFixed(2)),
    recebida: Number(recebida.toFixed(2)),
    aReceber: Number((prevista - faturada - recebida).toFixed(2)),
    processosAtivos: ativos.length,
  };
}

/**
 * Conversão por etapa: quantos processos chegaram a cada fase.
 * Estados fora da linha (aprovado/reprovado/pendência) não dizem em que fase
 * o processo parou, então contam apenas como "chegou à simulação" — exceto
 * 'aprovado', que por definição passou por todas.
 */
export function conversaoPorEtapa(processos = []) {
  const base = processos.length;
  const ordem = ['simulacao', 'analise', 'engenharia', 'juridico', 'assinatura'];
  return ordem.map((etapa, i) => {
    const chegou = processos.filter((p) => {
      const idx = ordem.indexOf(p?.etapa);
      if (idx >= 0) return idx >= i;
      if (p?.etapa === 'aprovado') return true;
      return i === 0; // reprovado/pendência/condicionado: conta só a entrada
    }).length;
    return {
      etapa,
      chegou,
      percentual: base ? Math.round((chegou / base) * 100) : 0,
    };
  });
}

/** Comissão por banco, para a tabela da aba. */
export function receitaPorBanco(processos = []) {
  const mapa = new Map();
  for (const p of processos.filter((x) => x?.etapa !== 'reprovado')) {
    const banco = p?.banco || 'Não informado';
    const atual = mapa.get(banco) || { banco, financiado: 0, prevista: 0, recebida: 0, quantidade: 0 };
    const comissao = Number(p?.comissaoValor)
      || valorComissao(p?.valorFinanciado, p?.comissaoPct || comissaoSugerida(p?.banco, p?.modalidade));
    atual.financiado += Number(p?.valorFinanciado) || 0;
    atual.prevista += comissao;
    if (p?.statusRecebimento === 'recebido') atual.recebida += comissao;
    atual.quantidade += 1;
    mapa.set(banco, atual);
  }
  return [...mapa.values()].sort((a, b) => b.prevista - a.prevista);
}
