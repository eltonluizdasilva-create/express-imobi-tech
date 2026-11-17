/**
 * simulador.js — pré-simulação de financiamento habitacional
 * ============================================================================
 * Funções PURAS, sem Firestore e sem rede (testáveis em Node).
 *
 * AVISO LEGAL: isto é uma PRÉ-SIMULAÇÃO ESTIMADA, sujeita à análise do banco.
 * Não aprova crédito, não consulta sistemas do banco e não substitui o
 * simulador oficial da Caixa.
 * ============================================================================
 */

export const SISTEMAS = [
  { key: 'sac', label: 'SAC (parcela decrescente)' },
  { key: 'price', label: 'Price (parcela fixa)' },
];

export const TIPOS_IMOVEL = [
  { key: 'novo', label: 'Novo' },
  { key: 'usado', label: 'Usado' },
  { key: 'planta', label: 'Na planta' },
];

export const PERFIS_DOCUMENTO = [
  { key: 'clt', label: 'CLT' },
  { key: 'autonomo', label: 'Autônomo / MEI' },
  { key: 'empresario', label: 'Empresário / Pró-labore' },
  { key: 'aposentado', label: 'Aposentado / Pensionista' },
];

export const UF_NORTE = new Set(['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO']);

/** Taxa mensal equivalente a partir da taxa anual nominal. */
export function taxaMensal(taxaAnualPct) {
  const i = (Number(taxaAnualPct) || 0) / 100;
  if (i <= 0) return 0;
  return Math.pow(1 + i, 1 / 12) - 1;
}

/** SAC: amortização constante, parcela inicial e final. */
export function parcelaSAC(valorFinanciado, taxaAnualPct, meses) {
  const n = Math.max(1, Math.trunc(meses));
  const i = taxaMensal(taxaAnualPct);
  const amortizacao = valorFinanciado / n;
  const primeira = amortizacao + valorFinanciado * i;
  const ultima = amortizacao + amortizacao * i;
  const total = (valorFinanciado * i * (n + 1)) / 2 + valorFinanciado;
  return { primeira, ultima, total, amortizacao, meses: n };
}

/** Price: parcela fixa. */
export function parcelaPrice(valorFinanciado, taxaAnualPct, meses) {
  const n = Math.max(1, Math.trunc(meses));
  const i = taxaMensal(taxaAnualPct);
  const pmt = i === 0 ? valorFinanciado / n : (valorFinanciado * i) / (1 - Math.pow(1 + i, -n));
  return { primeira: pmt, ultima: pmt, total: pmt * n, meses: n };
}

export function idadeEmAnos(dataNascimento) {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento);
  if (Number.isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade -= 1;
  return idade >= 0 ? idade : null;
}

/** Prazo máximo pela regra de idade (idade + prazo <= 80 anos e 420 meses). */
export function prazoMaximoPorIdade(idade, prazoPedido) {
  const pedido = Math.max(12, Math.trunc(Number(prazoPedido) || 360));
  if (!Number.isFinite(idade)) return Math.min(pedido, 420);
  const porIdade = Math.max(12, (80 - idade) * 12);
  return Math.min(pedido, porIdade, 420);
}

/**
 * Define o enquadramento (MCMV faixa X ou SBPE) com o MOTIVO explícito.
 * @returns {{linha:string, faixa:string|null, motivos:string[], alertas:string[]}}
 */
export function enquadrar(entrada, params) {
  const renda = Number(entrada.rendaTotal) || 0;
  const valor = Number(entrada.valorImovel) || 0;
  const mcmv = params.mcmv;
  const motivos = [];
  const alertas = [];

  const ehNorte = UF_NORTE.has(String(entrada.uf || '').toUpperCase());
  const tetoSubsidio = ehNorte ? mcmv.subsidioMaxNorte : mcmv.subsidioMax;

  if (!renda || !valor) {
    alertas.push('Informe renda e valor do imóvel para enquadrar.');
    return { linha: 'indefinido', faixa: null, motivos, alertas, tetoSubsidio };
  }

  if (renda <= mcmv.faixa1Renda) {
    motivos.push(`Renda de ${fmt(renda)} está no limite da Faixa 1 (até ${fmt(mcmv.faixa1Renda)}).`);
    return { linha: 'MCMV', faixa: 'Faixa 1', motivos, alertas, tetoSubsidio };
  }
  if (renda <= mcmv.faixa2Renda) {
    motivos.push(`Renda acima da Faixa 1 e até o teto provisório da Faixa 2 (${fmt(mcmv.faixa2Renda)}).`);
    alertas.push('Teto da Faixa 2 é PROVISÓRIO (CONFERIR).');
    return { linha: 'MCMV', faixa: 'Faixa 2', motivos, alertas, tetoSubsidio };
  }
  if (renda <= mcmv.faixa3Renda) {
    if (valor <= mcmv.faixa3Imovel) {
      motivos.push(`Renda até ${fmt(mcmv.faixa3Renda)} e imóvel até ${fmt(mcmv.faixa3Imovel)}.`);
      alertas.push('Teto de renda da Faixa 3 é PROVISÓRIO (CONFERIR).');
      return { linha: 'MCMV', faixa: 'Faixa 3', motivos, alertas, tetoSubsidio };
    }
    motivos.push(`Renda cabe na Faixa 3, mas o imóvel (${fmt(valor)}) passa do teto de ${fmt(mcmv.faixa3Imovel)}.`);
    // cai para avaliação da Faixa 4
  } else {
    motivos.push(`Renda de ${fmt(renda)} acima do teto das Faixas 1–3 (${fmt(mcmv.faixa3Renda)}).`);
  }

  if (renda <= mcmv.faixa4Renda && valor <= mcmv.faixa4Imovel) {
    motivos.push(`Faixa 4: renda até ${fmt(mcmv.faixa4Renda)} e imóvel até ${fmt(mcmv.faixa4Imovel)}.`);
    return { linha: 'MCMV', faixa: 'Faixa 4', motivos, alertas, tetoSubsidio: 0 };
  }

  if (renda <= mcmv.faixa4Renda && valor > mcmv.faixa4Imovel) {
    motivos.push(`Renda cabe na Faixa 4, mas o imóvel (${fmt(valor)}) excede ${fmt(mcmv.faixa4Imovel)}.`);
  }
  if (valor > params.sbpe.tetoSFH) {
    alertas.push(`Imóvel acima do teto do SFH (${fmt(params.sbpe.tetoSFH)}) — fora das condições SBPE padrão.`);
  }
  motivos.push('Não se enquadra no MCMV: segue por SBPE (cota e comprometimento do SFH).');
  return { linha: 'SBPE', faixa: null, motivos, alertas, tetoSubsidio: 0 };
}

function fmt(v) {
  return (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

/**
 * Simulação completa. Entrada esperada:
 * { valorImovel, tipo, uf, cidade, rendas[], nascimentoMaisVelho, numProponentes,
 *   fgts, usaFgts, entradaDinheiro, sistema, prazo, taxaAnual, primeiroImovel }
 */
export function simular(entradaBruta, params) {
  const rendas = (entradaBruta.rendas || []).map((r) => Number(r) || 0).filter((r) => r > 0);
  const rendaTotal = rendas.reduce((a, b) => a + b, 0);
  const valorImovel = Number(entradaBruta.valorImovel) || 0;
  const entradaDinheiro = Number(entradaBruta.entradaDinheiro) || 0;
  const fgts = Number(entradaBruta.fgts) || 0;
  const usaFgts = entradaBruta.usaFgts !== false;
  const sistema = entradaBruta.sistema === 'price' ? 'price' : 'sac';
  const idade = idadeEmAnos(entradaBruta.nascimentoMaisVelho);

  const entrada = {
    ...entradaBruta,
    rendaTotal,
    numProponentes: Number(entradaBruta.numProponentes) || rendas.length || 1,
  };

  const enq = enquadrar(entrada, params);
  const ehMcmv = enq.linha === 'MCMV';

  // Cota de financiamento
  let cota = ehMcmv ? params.mcmv.cotaMaxima : (sistema === 'sac' ? params.sbpe.cotaSAC : params.sbpe.cotaPrice);
  if (entradaBruta.tipo === 'planta') cota = Math.min(cota, 0.80);

  const entradaTotal = entradaDinheiro + (usaFgts ? fgts : 0);
  const tetoPorCota = valorImovel * cota;
  let financiavel = Math.max(0, Math.min(tetoPorCota, valorImovel - entradaTotal));

  // Subsídio (só MCMV faixas 1-3), estimativa interna limitada ao teto da região
  let subsidio = 0;
  if (ehMcmv && enq.faixa !== 'Faixa 4' && enq.tetoSubsidio > 0) {
    const pct = params.estimativaSubsidio[
      enq.faixa === 'Faixa 1' ? 'faixa1' : enq.faixa === 'Faixa 2' ? 'faixa2' : 'faixa3'
    ] || 0;
    subsidio = Math.min(enq.tetoSubsidio, financiavel * pct);
    financiavel = Math.max(0, financiavel - subsidio);
  }

  const entradaNecessaria = Math.max(0, valorImovel - financiavel - subsidio - (usaFgts ? fgts : 0));

  // Taxa
  let taxaAnual = Number(entradaBruta.taxaAnual);
  if (!Number.isFinite(taxaAnual) || taxaAnual <= 0) {
    if (ehMcmv && enq.faixa !== 'Faixa 4') taxaAnual = params.mcmv.jurosFaixa1a3;
    else if (ehMcmv) taxaAnual = params.mcmv.jurosFaixa4Min;
    else taxaAnual = params.sbpe.taxaPadrao;
  }

  const prazoPedido = Number(entradaBruta.prazo) || 360;
  const prazo = prazoMaximoPorIdade(idade, prazoPedido);
  const calc = sistema === 'sac'
    ? parcelaSAC(financiavel, taxaAnual, prazo)
    : parcelaPrice(financiavel, taxaAnual, prazo);

  const comprometimento = rendaTotal > 0 ? calc.primeira / rendaTotal : 0;
  const limiteComprometimento = params.sbpe.comprometimentoMax;

  const alertas = [...enq.alertas];
  if (comprometimento > limiteComprometimento) {
    alertas.push(`Parcela inicial compromete ${(comprometimento * 100).toFixed(1)}% da renda (limite ${(limiteComprometimento * 100).toFixed(0)}%).`);
  }
  if (idade != null && prazo < prazoPedido) {
    alertas.push(`Prazo reduzido de ${prazoPedido} para ${prazo} meses pela idade (${idade} anos; limite 80 anos).`);
  }
  if (!idade) alertas.push('Data de nascimento do proponente mais velho não informada — prazo não foi limitado por idade.');
  if (!financiavel) alertas.push('Valor financiável zerado: entrada cobre o imóvel ou faltam dados.');
  if (entradaBruta.tipo === 'planta') alertas.push('Imóvel na planta: bancos costumam exigir cota menor e medição de obra.');

  return {
    entrada,
    enquadramento: { ...enq, ehMcmv },
    rendaTotal,
    entradaTotal,
    cota: Number(cota.toFixed(4)),
    financiavel,
    subsidio,
    entradaNecessaria,
    taxaAnual,
    sistema,
    prazoSolicitado: prazoPedido,
    prazo,
    idade,
    parcelaInicial: calc.primeira,
    parcelaFinal: calc.ultima,
    totalPago: calc.total,
    comprometimento,
    limiteComprometimento,
    alertas,
    avisoLegal: 'Pré-simulação estimada, sujeita à análise do banco.',
  };
}

/** Texto pronto para WhatsApp (sem CPF, sem dados sensíveis). */
export function resumoWhatsApp(sim, nomeCliente = '') {
  const e = sim.entrada;
  const linhas = [
    `*Pré-simulação de financiamento*${nomeCliente ? ` — ${nomeCliente}` : ''}`,
    `Imóvel: ${fmt(e.valorImovel)} (${e.tipo || 'usado'}) — ${e.cidade || ''}/${e.uf || ''}`.trim(),
    `Renda considerada: ${fmt(sim.rendaTotal)} (${e.numProponentes} proponente${e.numProponentes > 1 ? 's' : ''})`,
    `Enquadramento sugerido: ${sim.enquadramento.linha}${sim.enquadramento.faixa ? ' ' + sim.enquadramento.faixa : ''}`,
    `Valor financiável: ${fmt(sim.financiavel)}`,
    sim.subsidio > 0 ? `Subsídio estimado: ${fmt(sim.subsidio)}` : null,
    `Entrada necessária: ${fmt(sim.entradaNecessaria)}`,
    `Parcela inicial: ${fmt(sim.parcelaInicial)} · final: ${fmt(sim.parcelaFinal)}`,
    `Sistema ${sim.sistema.toUpperCase()} · ${sim.prazo} meses · taxa ${sim.taxaAnual.toFixed(2)}% a.a.`,
    `Comprometimento da renda: ${(sim.comprometimento * 100).toFixed(1)}%`,
    '',
    '_Pré-simulação estimada, sujeita à análise do banco. Não é aprovação de crédito._',
  ];
  return linhas.filter(Boolean).join('\n');
}
