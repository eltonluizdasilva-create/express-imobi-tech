/**
 * avaliacao.js — motor de avaliação mercadológica com padrão COFECI.
 *
 * Base legal:
 *  - Lei 6.530/78 (regulamenta a profissão de corretor de imóveis)
 *  - Resolução COFECI nº 1.066/2007 (PTAM — Parecer Técnico de Avaliação
 *    Mercadológica como prerrogativa do corretor inscrito no CRECI)
 *  - ABNT NBR 14.653-2 (método comparativo direto de dados de mercado)
 *
 * O que o corretor emite é PTAM. Laudo de engenharia estrutural exige
 * ART (CREA) ou RRT (CAU) — o parecer diz isso em letras claras.
 */

import { regraUF } from './regrasEstaduais.js';

/* ----------------------- regiões e fatores ----------------------- */

const REGIAO_POR_UF = {
  AC: 'N', AM: 'N', AP: 'N', PA: 'N', RO: 'N', RR: 'N', TO: 'N',
  AL: 'NE', BA: 'NE', CE: 'NE', MA: 'NE', PB: 'NE', PE: 'NE', PI: 'NE', RN: 'NE', SE: 'NE',
  DF: 'CO', GO: 'CO', MT: 'CO', MS: 'CO',
  ES: 'SE', MG: 'SE', RJ: 'SE', SP: 'SE',
  PR: 'S', RS: 'S', SC: 'S',
};

const FATOR_REGIAO = { N: 0.80, NE: 0.85, CO: 0.95, SE: 1.15, S: 1.05 };

export const TIPOLOGIAS = [
  { key: 'urbano', label: 'Urbano', unidade: 'm²', precoBase: 4200, prazoBase: 60 },
  { key: 'rural', label: 'Rural', unidade: 'hectare', precoBase: 18000, prazoBase: 150 },
  { key: 'loteamento', label: 'Loteamento', unidade: 'm²', precoBase: 1200, prazoBase: 90 },
  { key: 'alto_padrao', label: 'Alto Padrão', unidade: 'm²', precoBase: 9800, prazoBase: 120 },
  { key: 'mcmv', label: 'MCMV', unidade: 'm²', precoBase: 2600, prazoBase: 45 },
];

export const PADROES = [
  { key: 'popular', label: 'Popular', fator: 0.80 },
  { key: 'simples', label: 'Simples', fator: 0.92 },
  { key: 'normal', label: 'Normal', fator: 1.00 },
  { key: 'alto', label: 'Alto', fator: 1.22 },
  { key: 'luxo', label: 'Luxo', fator: 1.55 },
];

export const ESTADOS_CONSERVACAO = [
  { key: 'novo', label: 'Novo / recém-entregue', fator: 1.05 },
  { key: 'otimo', label: 'Ótimo', fator: 1.00 },
  { key: 'bom', label: 'Bom', fator: 0.95 },
  { key: 'regular', label: 'Regular (precisa de pintura)', fator: 0.88 },
  { key: 'reparos', label: 'Necessita reparos', fator: 0.78 },
  { key: 'ruina', label: 'Ruim / condenado', fator: 0.62 },
];

/** Topografia do terreno — fator de homogeneização (NBR 14.653). */
export const TOPOGRAFIAS = [
  { key: 'plano', label: 'Plano (nível da rua)', fator: 1.00, efeito: 0, nota: 'Sem ajuste' },
  { key: 'aclive', label: 'Aclive (subida)', fator: 0.95, efeito: -5, nota: 'Acesso em subida reduz liquidez' },
  { key: 'declive_leve', label: 'Declive leve', fator: 0.92, efeito: -8, nota: 'Exige contenção simples' },
  { key: 'declive_acentuado', label: 'Declive acentuado', fator: 0.85, efeito: -15, nota: 'Exige arrimo/aterro — obra de contenção' },
];

/** Condições da testada / terreno — pílulas cumulativas. */
export const CONDICOES_TESTADA = [
  { key: 'poste', label: '⚡ Poste na frente / garagem', fator: 0.96, efeito: -4, nota: 'Restringe entrada de veículo e recuo' },
  { key: 'bueiro', label: '🕳️ Bueiro / boca de lobo na testada', fator: 0.95, efeito: -5, nota: 'Risco de odores, ruído e manutenção' },
  { key: 'arrimo', label: '🧱 Necessita muro de arrimo', fator: 0.93, efeito: -7, nota: 'Custo de contenção a ser descontado' },
  { key: 'esquina', label: '📐 Terreno de esquina', fator: 1.08, efeito: 8, nota: 'Dupla frente — valoriza exposição' },
];

export const FINALIDADES_PTAM = [
  { key: 'venda', label: 'Venda' },
  { key: 'locacao', label: 'Locação' },
  { key: 'inventario', label: 'Inventário / Partilha' },
  { key: 'tributaria', label: 'Revisão Tributária' },
];

export function fatorUF(uf) {
  const regiao = REGIAO_POR_UF[String(uf || 'MG').toUpperCase()] || 'SE';
  return { regiao, fator: FATOR_REGIAO[regiao] };
}

function acha(lista, key, fallback) {
  return lista.find((i) => i.key === key) || lista.find((i) => i.key === fallback) || lista[0];
}

/* ------------------- homogeneização dos comparáveis ------------------- */

/** Cada comparável: { valor, area, distanciaKm, oferta } (valores em reais). */
export function homogeneizarComparaveis(comparaveis = []) {
  const validos = (comparaveis || [])
    .map((c) => ({
      valor: Number(c?.valor) || 0,
      area: Number(c?.area) || 0,
      distanciaKm: Number(c?.distanciaKm) || 0,
      oferta: c?.oferta !== false,
    }))
    .filter((c) => c.valor > 0 && c.area > 0);

  if (!validos.length) return { n: 0, precoM2Medio: 0, precoM2Ponderado: 0, dispersao: 0, itens: [] };

  const itens = validos.map((c, i) => {
    const bruto = c.valor / c.area;
    const fatorOferta = c.oferta ? 0.90 : 1;
    const peso = Math.max(0.5, 1 - Math.min(c.distanciaKm, 10) / 20);
    return {
      ...c,
      amostra: i + 1,
      precoM2Bruto: round2(bruto),
      fatorOferta,
      precoM2Ajustado: round2(bruto * fatorOferta),
      peso,
    };
  });

  const somaPesos = itens.reduce((s, i) => s + i.peso, 0);
  const ponderado = itens.reduce((s, i) => s + i.precoM2Ajustado * i.peso, 0) / somaPesos;
  const media = itens.reduce((s, i) => s + i.precoM2Ajustado, 0) / itens.length;
  const variancia = itens.reduce((s, i) => s + (i.precoM2Ajustado - media) ** 2, 0) / itens.length;

  return {
    n: itens.length,
    precoM2Medio: round2(media),
    precoM2Ponderado: round2(ponderado),
    dispersao: round2(media ? (Math.sqrt(variancia) / media) * 100 : 0),
    itens,
  };
}

/* ------------------------- motor de avaliação ------------------------- */

export function avaliarImovel({
  uf = 'MG',
  cidade = '',
  bairro = '',
  tipologia = 'urbano',
  padrao = 'normal',
  estado = 'bom',
  topografia = 'plano',
  condicoes = [],
  areaTotal = 0,
  areaConstruida = 0,
  comparaveis = [],
} = {}) {
  const tipo = acha(TIPOLOGIAS, tipologia, 'urbano');
  const pad = acha(PADROES, padrao, 'normal');
  const cons = acha(ESTADOS_CONSERVACAO, estado, 'bom');
  const topo = acha(TOPOGRAFIAS, topografia, 'plano');
  const { regiao, fator } = fatorUF(uf);

  const condicoesMarcadas = (Array.isArray(condicoes) ? condicoes : [])
    .map((k) => CONDICOES_TESTADA.find((c) => c.key === k))
    .filter(Boolean);
  const fatorTestada = condicoesMarcadas.reduce((acc, c) => acc * c.fator, 1);

  const areaTot = Math.max(0, Number(areaTotal) || 0);
  const areaCon = Math.max(0, Number(areaConstruida) || 0);
  const areaRef = tipo.key === 'rural' || tipo.key === 'loteamento'
    ? areaTot
    : (areaCon || areaTot);

  const hom = homogeneizarComparaveis(comparaveis);
  const precoUnitarioBase = round2(tipo.precoBase * fator * pad.fator * cons.fator);

  // 1o) valor de mercado: comparaveis (75%) + parametro regional (25%)
  const precoMercado = hom.n > 0
    ? round2(hom.precoM2Ponderado * 0.75 + precoUnitarioBase * 0.25)
    : precoUnitarioBase;

  // 2o) ajuste fisico sobre 100% do m2 de mercado (topografia x testada)
  const fatorFisico = round4(topo.fator * fatorTestada);
  const precoUnitario = round2(precoMercado * fatorFisico);
  const precoComFisicos = precoUnitario;

  const valorJusto = round2(precoUnitario * areaRef);

  const cenarios = [
    { key: 'liquidez', label: 'Liquidez Rápida', fator: 0.92, valor: round2(valorJusto * 0.92), objetivo: 'Vender em semanas — preço de anúncio agressivo' },
    { key: 'justo', label: 'Valor Justo de Mercado', fator: 1, valor: valorJusto, objetivo: 'Preço de tabela com margem de negociação saudável' },
    { key: 'teto', label: 'Teto de Negociação', fator: 1.08, valor: round2(valorJusto * 1.08), objetivo: 'Abrir alto para negociar — exige imóvel diferenciado e tempo' },
  ];

  const prazoMedio = Math.round(
    tipo.prazoBase
    * (cons.fator < 0.9 ? 1.35 : 1)
    * (tipo.key === 'alto_padrao' ? 1.2 : 1)
    * (topo.fator < 0.95 ? 1.15 : 1),
  );

  const grauFundamentacao = hom.n >= 3 ? 'III (3 ou mais comparáveis)' : hom.n === 2 ? 'II (2 comparáveis)' : hom.n === 1 ? 'I (1 comparável)' : 'sem comparáveis — estimativa paramétrica';

  const alertas = [];
  if (hom.n === 0) alertas.push('Sem comparáveis: o valor é estimativa paramétrica, não avaliação por dados de mercado.');
  if (hom.n > 0 && hom.dispersao > 25) alertas.push(`Comparáveis dispersos (${hom.dispersao}%): revise imóveis fora do mesmo padrão/localização.`);
  if (areaRef <= 0) alertas.push('Informe a área para calcular o valor.');
  if (tipo.key === 'rural') alertas.push('Rural usa hectare como unidade: confira a área em hectares, não em m².');
  if (topo.key === 'declive_acentuado') alertas.push('Declive acentuado aplicado (-15%): anexe orçamento de contenção/arrimo ao parecer.');
  if (condicoesMarcadas.some((c) => c.key === 'arrimo')) alertas.push('Muro de arrimo marcado (-7%): desconto representa custo de execução.');

  return {
    uf: regraUF(uf).uf,
    cidade: cidade || '—',
    bairro: bairro || '—',
    tipologia: tipo,
    padrao: pad,
    estado: cons,
    topografia: topo,
    condicoes: condicoesMarcadas,
    regiao,
    fatorRegiao: fator,
    fatores: {
      regiao: fator,
      padrao: pad.fator,
      conservacao: cons.fator,
      topografia: topo.fator,
      testada: round4(fatorTestada),
      testadaPct: round1((fatorTestada - 1) * 100),
    },
    areaReferencia: areaRef,
    areaTotal: areaTot,
    areaConstruida: areaCon,
    unidade: tipo.unidade,
    homogeneizacao: hom,
    precoUnitarioBase,
    precoMercado,
    fatorFisico,
    precoComFisicos,
    precoUnitario,
    valorJusto,
    cenarios,
    prazoMedioDias: prazoMedio,
    grauFundamentacao,
    alertas,
    metodo: 'Comparativo direto de dados de mercado (ABNT NBR 14.653-2)',
  };
}

/* --------------------- resumo comercial (WhatsApp) --------------------- */

const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/** Aceita "CNAI 0099" ou "0099" e imprime sempre "CNAI 0099". */
export function formatarCnai(valor) {
  const bruto = String(valor || '').trim();
  if (!bruto) return '';
  return `CNAI ${bruto.replace(/^CNAI\s*/i, '')}`;
}

function justificativasFisicas(av = {}) {
  const linhas = [];
  const topo = av.topografia;
  if (topo && Number(topo.efeito) !== 0) {
    const rotulo = topo.label.charAt(0).toUpperCase() + topo.label.slice(1).toLowerCase();
    linhas.push(`Topografia ${rotulo}: ${topo.efeito}% (${topo.nota.toLowerCase()}).`);
  }
  for (const c of av.condicoes || []) {
    linhas.push(`${c.label}: ${c.efeito > 0 ? `+${c.efeito}%` : `${c.efeito}%`} — ${c.nota.toLowerCase()}.`);
  }
  return linhas;
}

export function gerarResumoComercial(dados = {}, av = {}) {
  const imovel = [av.tipologia?.label, av.bairro, av.cidade].filter(Boolean).join(' · ');
  const fisicos = justificativasFisicas(av);

  return [
    `Avaliação do imóvel — ${imovel}`,
    `Área de referência: ${av.areaReferencia} ${av.unidade} · padrão ${(av.padrao?.label || '').toLowerCase()} · conservação ${(av.estado?.label || '').toLowerCase()}.`,
    '',
    `Referência de mercado: ${brl(av.precoUnitario)}/${av.unidade}.`,
    av.homogeneizacao?.n
      ? `Baseada em ${av.homogeneizacao.n} comparável(is) da região (média homogeneizada ${brl(av.homogeneizacao.precoM2Ponderado)}/${av.unidade}).`
      : 'Baseada em parâmetros de mercado da região, sem comparáveis específicos.',
    '',
    'CENÁRIOS',
    `• Venda rápida: ${brl(av.cenarios?.[0]?.valor)}`,
    `• Valor justo: ${brl(av.cenarios?.[1]?.valor)}`,
    `• Teto de negociação: ${brl(av.cenarios?.[2]?.valor)}`,
    '',
    `Prazo médio estimado de venda: ${av.prazoMedioDias} dias no valor justo.`,
    ...(fisicos.length ? ['', 'AJUSTES APLICADOS', ...fisicos.map((f) => `• ${f}`)] : []),
    '',
    `Para vender dentro do prazo da região, o anúncio deve ficar entre ${brl(av.cenarios?.[0]?.valor)} e ${brl(av.cenarios?.[1]?.valor)}. Acima de ${brl(av.cenarios?.[2]?.valor)} o imóvel compete com opções melhores e tende a parar.`,
    '',
    'Posso te enviar o parecer completo (PTAM) com as amostras e os fatores aplicados?',
  ].join('\n');
}

/* --------------------- documento oficial (PTAM) --------------------- */

export function gerarPTAM(dados = {}, av = {}) {
  const hoje = new Date().toLocaleDateString('pt-BR');
  const finalidade = (FINALIDADES_PTAM.find((f) => f.key === dados.finalidade) || FINALIDADES_PTAM[0]).label;
  const amostras = av.homogeneizacao?.itens || [];

  return [
    'PARECER TÉCNICO DE AVALIAÇÃO MERCADOLÓGICA — PTAM',
    'Resolução COFECI nº 1.066/2007 · ABNT NBR 14.653-2',
    '',
    '1. IDENTIFICAÇÃO DAS PARTES',
    `Avaliador: ${dados.corretorNome || '—'}`,
    `CRECI: ${dados.creci || '—'}${formatarCnai(dados.cnai) ? ` · ${formatarCnai(dados.cnai)}` : ''}`,
    `Solicitante / Proprietário: ${dados.solicitante || '—'}`,
    `Finalidade da avaliação: ${finalidade}`,
    '',
    '2. CARACTERIZAÇÃO DO IMÓVEL',
    `Tipo: ${av.tipologia?.label} · Cidade: ${av.cidade} · Bairro: ${av.bairro} · UF: ${av.uf}`,
    `Matrícula (CRI): ${dados.matricula || 'não informada'}`,
    `Área total: ${dados.areaTotal || av.areaTotal || 0} · Área construída: ${dados.areaConstruida || av.areaConstruida || 0} · Área de referência: ${av.areaReferencia} ${av.unidade}`,
    `Padrão construtivo: ${av.padrao?.label} · Estado de conservação: ${av.estado?.label}`,
    `Topografia: ${av.topografia?.label} (fator ${av.topografia?.fator})`,
    `Condições da testada: ${(av.condicoes || []).length ? av.condicoes.map((c) => `${c.label} (${c.efeito > 0 ? '+' : ''}${c.efeito}%)`).join('; ') : 'sem ocorrências'}`,
    '',
    '3. METODOLOGIA',
    `${av.metodo}. Grau de fundamentação: ${av.grauFundamentacao}.`,
    amostras.length
      ? `Foram utilizadas ${amostras.length} amostras de mercado, homogeneizadas com desconto de oferta de 10% e peso por distância.`
      : 'Não foram apresentadas amostras de mercado; adotados parâmetros de referência da região.',
    '',
    '4. FATORES DE HOMOGENEIZAÇÃO APLICADOS',
    `Região (${av.regiao}): ${av.fatores?.regiao}`,
    `Padrão construtivo: ${av.fatores?.padrao}`,
    `Estado de conservação: ${av.fatores?.conservacao}`,
    `Topografia: ${av.fatores?.topografia}`,
    `Testada/terreno: ${av.fatores?.testada} (${av.fatores?.testadaPct > 0 ? '+' : ''}${av.fatores?.testadaPct}%)`,
    `Valor unitário base: ${brl(av.precoUnitarioBase)}/${av.unidade}`,
    `Valor de mercado ponderado (comparáveis 75% + parâmetro regional 25%): ${brl(av.precoMercado)}/${av.unidade}`,
    `Fator físico aplicado (topografia × testada): ${av.fatorFisico}`,
    `Valor unitário final: ${brl(av.precoUnitario)}/${av.unidade}`,
    '',
    '5. TABELA DE AMOSTRAS',
    ...(amostras.length
      ? amostras.map((a) => `Amostra ${a.amostra}: ${brl(a.valor)} · ${a.area} ${av.unidade} · ${brl(a.precoM2Bruto)}/${av.unidade} · ajustado ${brl(a.precoM2Ajustado)} · distância ${a.distanciaKm} km`)
      : ['Sem amostras declaradas.']),
    amostras.length ? `Dispersão das amostras: ${av.homogeneizacao.dispersao}%` : '',
    '',
    '6. VALOR FINAL DE MERCADO',
    `Valor de mercado adotado: ${brl(av.valorJusto)}`,
    `Faixa de liquidez: ${brl(av.cenarios?.[0]?.valor)} a ${brl(av.cenarios?.[2]?.valor)}`,
    `Prazo estimado de venda: ${av.prazoMedioDias} dias`,
    '',
    '7. RESSALVAS',
    'Este parecer é mercadológico, emitido por corretor de imóveis regular no CRECI, no exercício da prerrogativa da Lei 6.530/78 e da Resolução COFECI 1.066/2007.',
    'Não substitui laudo de avaliação de engenharia, que exige ART (CREA) ou RRT (CAU), nem vistoria estrutural.',
    ...(av.alertas || []).map((a) => `• ${a}`),
    '',
    `${dados.cidade || av.cidade}, ${hoje}.`,
    '',
    '_______________________________________',
    `${dados.corretorNome || 'Corretor de Imóveis'}`,
    `CRECI ${dados.creci || '—'}${formatarCnai(dados.cnai) ? ` · ${formatarCnai(dados.cnai)}` : ''}`,
  ].filter((l) => l !== null).join('\n');
}

/** HTML limpo do documento (para imprimir/PDF). */
export function gerarDocumentoHtmlPTAM(dados = {}, av = {}) {
  const texto = gerarPTAM(dados, av);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>PTAM — ${esc(dados.solicitante || 'Imóvel')}</title>
<style>
  @page { size: A4; margin: 22mm 18mm; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #111; line-height: 1.55; font-size: 12pt; }
  pre { white-space: pre-wrap; font-family: inherit; margin: 0; }
  .rodape { margin-top: 18px; font-size: 9pt; color: #555; border-top: 1px solid #ccc; padding-top: 6px; }
</style></head>
<body><pre>${esc(texto)}</pre>
<div class="rodape">Documento gerado pelo Express Imobi Tech · PTAM conforme Resolução COFECI 1.066/2007 · ABNT NBR 14.653</div>
</body></html>`;
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function round4(n) {
  return Math.round((Number(n) || 0) * 10000) / 10000;
}

function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}
