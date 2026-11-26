/**
 * src/lib/cartorioEscritura.js — Esteira de Cartório & Escritura (PLUS).
 * ============================================================================
 * Vive DENTRO de `Repasses & NF` (`NotaFiscal.jsx`), como pré-requisito da
 * liberação da comissão. Não é aba nova, não é módulo novo no catálogo.
 *
 * ZERO TOKENS: tudo aqui é determinístico. Nenhuma função deste arquivo chama
 * IA, `/api/ai` ou DeepSeek — checklist, prazos e trava são cálculo local.
 *
 * REGRAS DE NEGÓCIO (o que a esteira garante)
 *   1. Etapa 1 — Matrícula e certidões: cada certidão tem prazo próprio
 *      (matrícula/ônus/IPTU: 30 dias; CNDs: 90 dias). Item emitido e fora do
 *      prazo vira VENCIDO e volta a travar o repasse.
 *   2. Etapa 2 — ITBI, escritura e registro: guia emitida e paga, escritura
 *      lavrada (ou contrato com força de escritura quando a venda vem de
 *      Correspondente & Crédito, cruzando o sinal), protocolo e conclusão no RGI.
 *   3. Etapa 3 — Liberação: com qualquer pendência crítica, o selo é
 *      "Aguardando Cartório (Trava Pré-Repasse)". A gestão pode liberar
 *      manualmente com justificativa registrada (comissão paga na assinatura).
 *      Sem pendência, o repasse e a NF ficam liberados.
 * ============================================================================
 */

import { linhaSegura } from '../agent/sofiaPrompt.js';
import { normalizarTexto, paraData } from './prestacaoContas.js';

/* ------------------------------- constantes ------------------------------- */

/** Certidão emitida com 5 dias ou menos para vencer entra em alerta âmbar. */
export const LIMITE_ALERTA_DIAS = 5;

/** Justificativa mínima para destravar o repasse na mão. */
export const JUSTIFICATIVA_MINIMA = 10;

export const ETAPA_CERTIDOES = 'certidoes';
export const ETAPA_ESCRITURA = 'escritura';
export const ETAPA_REPASSE = 'repasse';

export const STATUS_PENDENTE = 'pendente';
export const STATUS_EMITIDA = 'emitida';
export const STATUS_VENCIDA = 'vencida';

export const TRAVA_CARTORIO = 'aguardando_cartorio';

/** Rótulos que a interface usa nos selects (Pendente / Emitida / Vencida). */
export const STATUS_OPCOES = [
  { valor: STATUS_PENDENTE, rotulo: 'Pendente' },
  { valor: STATUS_EMITIDA, rotulo: 'Emitida' },
  { valor: STATUS_VENCIDA, rotulo: 'Vencida' },
];

/**
 * Etapa 1 — Matrícula e CNDs.
 * `validadeDias` é o prazo usual aceito por tabelionato/registro; o corretor
 * pode ajustar a data na tela (cada cartório emite com prazo diferente).
 */
export const CHECKLIST_CERTIDOES = [
  {
    id: 'matricula',
    rotulo: 'Matrícula atualizada do imóvel',
    detalhe: 'Registro de Imóveis, emitida nos últimos 30 dias.',
    validadeDias: 30,
    critico: true,
  },
  {
    id: 'cnd_trabalhista',
    rotulo: 'CND Trabalhista (vendedores)',
    detalhe: 'Certidão Negativa de Débitos Trabalhistas — TST.',
    validadeDias: 90,
    critico: true,
  },
  {
    id: 'cnd_federal',
    rotulo: 'CND Federal (RFB / PGFN)',
    detalhe: 'Receita Federal e Dívida Ativa da União, por CPF/CNPJ do vendedor.',
    validadeDias: 90,
    critico: true,
  },
  {
    id: 'cnd_estadual',
    rotulo: 'CND Estadual',
    detalhe: 'Débitos estaduais do vendedor (SEFAZ da UF do imóvel).',
    validadeDias: 90,
    critico: true,
  },
  {
    id: 'cnd_municipal',
    rotulo: 'CND Municipal',
    detalhe: 'Débitos mobiliários do vendedor na prefeitura do imóvel.',
    validadeDias: 90,
    critico: true,
  },
  {
    id: 'onus_reais',
    rotulo: 'Ônus Reais e Ações Reipersecutórias',
    detalhe: 'Certidão de ônus, gravames e ações que acompanham o imóvel.',
    validadeDias: 30,
    critico: true,
  },
  {
    id: 'condominio_iptu',
    rotulo: 'Negativa de Débitos de Condomínio e IPTU',
    detalhe: 'Declaração do síndico/administradora + certidão do IPTU.',
    validadeDias: 30,
    critico: true,
  },
];

/** Etapa 2 — ITBI, escritura e registro. Sem prazo de validade: é etapa. */
export const CHECKLIST_ESCRITURA = [
  {
    id: 'itbi_guia',
    rotulo: 'Guia de ITBI emitida',
    detalhe: 'Guia lançada pela prefeitura com o valor de transmissão.',
    critico: true,
  },
  {
    id: 'itbi_pago',
    rotulo: 'ITBI pago',
    detalhe: 'Comprovante de pagamento anexado ao dossiê da escritura.',
    critico: true,
  },
  {
    id: 'escritura',
    rotulo: 'Escritura pública lavrada',
    detalhe: 'Lavrada no tabelionato de notas da comarca do imóvel.',
    critico: true,
  },
  {
    id: 'registro_protocolo',
    rotulo: 'Registro protocolado no RGI',
    detalhe: 'Protocolo de registro no Cartório de Registro de Imóveis.',
    critico: true,
  },
  {
    id: 'registro_concluido',
    rotulo: 'Registro concluído (matrícula no nome do comprador)',
    detalhe: 'Matrícula averbada: a propriedade passou para o comprador.',
    critico: true,
  },
];

const TODOS_ITENS = [...CHECKLIST_CERTIDOES, ...CHECKLIST_ESCRITURA];

const definicaoDoItem = (itemId) => TODOS_ITENS.find((item) => item.id === itemId) || null;

const MS_DIA = 24 * 60 * 60 * 1000;

/* ------------------------------ datas (puras) ----------------------------- */

const doisDigitos = (n) => String(n).padStart(2, '0');

/**
 * 'YYYY-MM-DD' é data de calendário (não instante): converte no fuso local.
 * Sem isso, `new Date('2026-12-01')` cai em 30/11 em fusos negativos e o
 * cálculo de dias restantes erra por um dia.
 */
const ISO_SO_DATA = /^\d{4}-\d{2}-\d{2}$/;

function paraDataLocal(valor) {
  if (typeof valor === 'string' && ISO_SO_DATA.test(valor)) {
    const [ano, mes, dia] = valor.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    return Number.isNaN(data.getTime()) ? null : data;
  }
  return paraData(valor);
}

/** Date/Timestamp/ISO/'YYYY-MM-DD' → 'YYYY-MM-DD' (fuso local) ou ''. */
export function dataISO(valor) {
  const data = paraDataLocal(valor);
  if (!data) return '';
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

/** 'YYYY-MM-DD' + n dias → 'YYYY-MM-DD'. Data inválida devolve ''. */
export function somarDias(iso, dias) {
  const base = paraDataLocal(iso);
  if (!base) return '';
  const alvo = new Date(base.getFullYear(), base.getMonth(), base.getDate() + Number(dias || 0));
  return dataISO(alvo);
}

/** Diferença em dias de calendário entre a validade e o "hoje". */
export function diasRestantes(validadeAte, agora = Date.now()) {
  const alvo = paraDataLocal(validadeAte);
  const referencia = paraDataLocal(agora);
  if (!alvo || !referencia) return null;
  const diaAlvo = Date.UTC(alvo.getFullYear(), alvo.getMonth(), alvo.getDate());
  const diaHoje = Date.UTC(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
  return Math.round((diaAlvo - diaHoje) / MS_DIA);
}

/** 'YYYY-MM-DD' → 'DD/MM/AAAA' (sem depender do locale do navegador). */
export function dataBR(valor) {
  const iso = dataISO(valor);
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

/** Data e hora completas (ISO) para auditoria; '' quando a data é inválida. */
export function dataHoraISO(valor) {
  const data = paraData(valor);
  return data ? data.toISOString() : '';
}

/* ------------------------------ modelo puro ------------------------------- */

const numero = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = Number(String(v ?? '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

/** Item de checklist no formato guardado (status + datas + protocolo). */
export function criarItem(status = STATUS_PENDENTE) {
  const valido = STATUS_OPCOES.some((o) => o.valor === status) ? status : STATUS_PENDENTE;
  return { status: valido, emitidaEm: '', validadeAte: '', protocolo: '', valor: 0, observacao: '' };
}

function normalizarItem(item) {
  const dados = item && typeof item === 'object' ? item : {};
  return {
    status: STATUS_OPCOES.some((o) => o.valor === dados.status) ? dados.status : STATUS_PENDENTE,
    emitidaEm: dataISO(dados.emitidaEm),
    validadeAte: dataISO(dados.validadeAte),
    protocolo: linhaSegura(dados.protocolo, 60),
    valor: numero(dados.valor),
    observacao: linhaSegura(dados.observacao, 200),
  };
}

/**
 * Documento da esteira → formato canônico.
 * Garante TODOS os itens dos dois checklists: documento antigo/parcial abre
 * completo na tela em vez de sumir com um item.
 */
export function normalizarNegociacao(negociacao = {}) {
  const dados = negociacao && typeof negociacao === 'object' ? negociacao : {};

  const certidoes = {};
  for (const item of CHECKLIST_CERTIDOES) certidoes[item.id] = normalizarItem(dados.certidoes?.[item.id]);

  const escritura = {};
  for (const item of CHECKLIST_ESCRITURA) escritura[item.id] = normalizarItem(dados.escritura?.[item.id]);

  const manual = dados.liberacaoManual;
  const liberacaoManual = manual && manual.liberado
    ? {
      liberado: true,
      justificativa: linhaSegura(manual.justificativa, 400),
      por: linhaSegura(manual.por, 80),
      em: dataHoraISO(manual.em) || '',
    }
    : null;

  return {
    id: String(dados.id || ''),
    propostaId: String(dados.propostaId || ''),
    codigoImovel: linhaSegura(dados.codigoImovel, 24),
    codigoRastreio: linhaSegura(dados.codigoRastreio || dados.codigoImovel || 'IMB-1001', 24),
    senhaRastreio: linhaSegura(dados.senhaRastreio || (dados.codigoImovel ? dados.codigoImovel.replace(/\D/g, '').slice(-4) : '1234'), 10),
    imovelTitulo: linhaSegura(dados.imovelTitulo || dados.titulo, 120),
    comprador: linhaSegura(dados.comprador || dados.nomeCliente, 80),
    vendedor: linhaSegura(dados.vendedor || dados.proprietario, 80),
    corretor: linhaSegura(dados.corretor, 80),
    valor: numero(dados.valor ?? dados.valorProposta),
    sinal: numero(dados.sinal ?? dados.sinalEntrada),
    origemCredito: Boolean(dados.origemCredito),
    banco: linhaSegura(dados.banco, 60),
    criadoEm: dataHoraISO(dados.criadoEm) || '',
    atualizadoEm: dataHoraISO(dados.atualizadoEm) || '',
    certidoes,
    escritura,
    liberacaoManual,
  };
}

/** Negociação nova a partir de um imóvel/proposta (checklist todo pendente). */
export function negociacaoVazia(base = {}) {
  return normalizarNegociacao(base);
}

/**
 * Atualiza um item do checklist sem sair do determinístico.
 * Marcar como Emitida já preenche a data de emissão e a validade padrão do
 * item (matrícula/ônus/IPTU: 30 dias; CNDs: 90 dias). Voltar para Pendente
 * limpa as datas para não deixar prazo fantasma na tela.
 */
export function atualizarItem(negociacao, etapa, itemId, dados = {}, { agora = Date.now() } = {}) {
  const base = normalizarNegociacao(negociacao);
  const chave = etapa === ETAPA_ESCRITURA ? 'escritura' : 'certidoes';
  const definicao = definicaoDoItem(itemId);
  const atual = base[chave]?.[itemId];
  if (!definicao || !atual) return base;

  const proximo = { ...atual, ...dados };

  if (proximo.status === STATUS_EMITIDA) {
    if (!proximo.emitidaEm) proximo.emitidaEm = dataISO(agora);
    if (definicao.validadeDias && !proximo.validadeAte) {
      proximo.validadeAte = somarDias(proximo.emitidaEm, definicao.validadeDias);
    }
  }

  if (proximo.status === STATUS_PENDENTE) {
    proximo.emitidaEm = '';
    proximo.validadeAte = '';
  }

  return normalizarNegociacao({
    ...base,
    [chave]: { ...base[chave], [itemId]: proximo },
    atualizadoEm: new Date(Number(agora)).toISOString(),
  });
}

/* --------------------- pendências, trava e liberação ---------------------- */

/** Pendências CRÍTICAS das etapas 1 e 2 (item pendente ou prazo vencido). */
export function pendenciasCartorio(negociacao, agora = Date.now()) {
  const neg = normalizarNegociacao(negociacao);
  const pendencias = [];

  const varrer = (etapa, chave, lista) => {
    for (const definicao of lista) {
      if (!definicao.critico) continue;
      const item = neg[chave]?.[definicao.id];
      const situacao = statusCertidao(item, agora);
      if (!situacao.travada) continue;
      const pendente = situacao.chave === STATUS_PENDENTE;
      pendencias.push({
        etapa,
        id: definicao.id,
        rotulo: rotuloItem(definicao.id, neg),
        motivo: pendente ? 'pendente' : 'vencida',
        detalhe: pendente
          ? 'Documento ainda não emitido.'
          : `Prazo vencido em ${dataBR(item?.validadeAte)} — peça a 2ª via.`,
        dias: situacao.dias,
      });
    }
  };

  varrer(ETAPA_CERTIDOES, 'certidoes', CHECKLIST_CERTIDOES);
  varrer(ETAPA_ESCRITURA, 'escritura', CHECKLIST_ESCRITURA);

  return pendencias;
}

/** Certidões vencidas ou vencendo em até `LIMITE_ALERTA_DIAS` dias. */
export function alertasVencimento(negociacao, agora = Date.now()) {
  const neg = normalizarNegociacao(negociacao);
  const alertas = [];

  for (const definicao of CHECKLIST_CERTIDOES) {
    const item = neg.certidoes[definicao.id];
    const situacao = statusCertidao(item, agora);
    if (!situacao.vencida && !situacao.aVencer) continue;
    alertas.push({
      id: definicao.id,
      rotulo: rotuloItem(definicao.id, neg),
      chave: situacao.chave,
      rotuloStatus: situacao.rotulo,
      dias: situacao.dias,
      validadeAte: item.validadeAte || '',
      severidade: situacao.vencida ? 'critica' : 'atencao',
    });
  }

  return alertas.sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0));
}

/**
 * Trava pré-repasse.
 *   status `liberado`        → sem pendência crítica: segue para NF/repasse.
 *   status `liberado_manual` → pendência existe, mas a gestão justificou
 *                              (ex.: comissão paga na assinatura do contrato).
 *   status `travado`         → selo "Aguardando Cartório (Trava Pré-Repasse)".
 */
export function podeLiberarRepasse(negociacao, agora = Date.now()) {
  const neg = normalizarNegociacao(negociacao);
  const pendencias = pendenciasCartorio(neg, agora);
  const alertas = alertasVencimento(neg, agora);
  const manual = neg.liberacaoManual;
  const manualValida = Boolean(
    manual && manual.liberado && String(manual.justificativa || '').trim().length >= JUSTIFICATIVA_MINIMA,
  );

  let status = 'travado';
  if (pendencias.length === 0) status = 'liberado';
  else if (manualValida) status = 'liberado_manual';

  const selo = status === 'travado'
    ? 'Aguardando Cartório (Trava Pré-Repasse)'
    : status === 'liberado_manual'
      ? 'Liberado manualmente com justificativa'
      : 'Liberado para repasse e NF';

  return {
    liberado: status !== 'travado',
    status,
    trava: status === 'travado' ? TRAVA_CARTORIO : null,
    selo,
    pendencias,
    alertas,
    liberacaoManual: manual,
    progresso: progressoNegociacao(neg, agora),
  };
}

/** Liberação manual com justificativa obrigatória (registrada no documento). */
export function liberarComJustificativa(negociacao, { justificativa = '', por = '', agora = Date.now() } = {}) {
  const neg = normalizarNegociacao(negociacao);
  const texto = linhaSegura(justificativa, 400).trim();

  if (texto.length < JUSTIFICATIVA_MINIMA) {
    return {
      ok: false,
      erro: `Explique a origem da comissão em pelo menos ${JUSTIFICATIVA_MINIMA} caracteres.`,
      negociacao: neg,
    };
  }

  const atualizada = normalizarNegociacao({
    ...neg,
    liberacaoManual: {
      liberado: true,
      justificativa: texto,
      por: linhaSegura(por, 80),
      em: new Date(Number(agora)).toISOString(),
    },
    atualizadoEm: new Date(Number(agora)).toISOString(),
  });

  return { ok: true, erro: '', negociacao: atualizada };
}

/** Desfaz a liberação manual: a negociação volta a respeitar a trava. */
export function revogarLiberacaoManual(negociacao, { agora = Date.now() } = {}) {
  const neg = normalizarNegociacao(negociacao);
  return normalizarNegociacao({
    ...neg,
    liberacaoManual: null,
    atualizadoEm: new Date(Number(agora)).toISOString(),
  });
}

/* --------------------------- saída para WhatsApp -------------------------- */

const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
});

const linhaDoItem = (itemId, item, situacao, negociacao) => {
  const nome = rotuloItem(itemId, negociacao);
  if (situacao.chave === STATUS_PENDENTE) return `• ${nome}: PENDENTE`;
  if (situacao.vencida) return `• ${nome}: VENCIDA${item?.validadeAte ? ` (${dataBR(item.validadeAte)})` : ''}`;
  if (situacao.aVencer) {
    return `• ${nome}: ${situacao.rotulo.toUpperCase()}${item?.validadeAte ? ` (validade ${dataBR(item.validadeAte)})` : ''}`;
  }
  return `• ${nome}: OK${item?.validadeAte ? ` até ${dataBR(item.validadeAte)}` : ''}`;
};

/**
 * Mensagem objetiva para comprador, vendedor ou correspondente bancário.
 * Determinística: mesma negociação + mesmo dia → mesmo texto.
 */
export function mensagemWhatsAppCartorio(negociacao, { agora = Date.now(), nomeImobiliaria = '' } = {}) {
  const neg = normalizarNegociacao(negociacao);
  const trava = podeLiberarRepasse(neg, agora);
  const linhas = [];

  const codigo = neg.codigoImovel || 'sem código';
  linhas.push(`*Cartório & Escritura — ${codigo}${neg.imovelTitulo ? ` · ${neg.imovelTitulo}` : ''}*`);
  if (nomeImobiliaria) linhas.push(`Imobiliária: ${linhaSegura(nomeImobiliaria, 80)}`);

  const partes = [];
  if (neg.comprador) partes.push(`Comprador: ${neg.comprador}`);
  if (neg.vendedor) partes.push(`Vendedor: ${neg.vendedor}`);
  if (neg.corretor) partes.push(`Corretor: ${neg.corretor}`);
  if (partes.length) linhas.push(partes.join(' · '));

  linhas.push(`Valor: ${brl(neg.valor)}${neg.sinal ? ` · Sinal: ${brl(neg.sinal)}` : ''}`);
  if (neg.origemCredito) {
    linhas.push(`Crédito: ${neg.banco || 'Correspondente & Crédito'} — escritura por contrato com força de escritura.`);
  }
  linhas.push('');

  linhas.push('*Etapa 1 — Matrícula & Certidões (CNDs)*');
  for (const definicao of CHECKLIST_CERTIDOES) {
    const item = neg.certidoes[definicao.id];
    linhas.push(linhaDoItem(definicao.id, item, statusCertidao(item, agora), neg));
  }
  linhas.push('');

  linhas.push('*Etapa 2 — ITBI, Escritura & Registro*');
  for (const definicao of CHECKLIST_ESCRITURA) {
    const item = neg.escritura[definicao.id];
    const base = linhaDoItem(definicao.id, item, statusCertidao(item, agora), neg);
    const extra = item.protocolo ? ` — protocolo ${item.protocolo}` : '';
    linhas.push(`${base}${extra}`);
  }
  linhas.push('');

  linhas.push('*Etapa 3 — Repasse & NF*');
  if (trava.status === 'travado') {
    linhas.push(`• AGUARDANDO CARTÓRIO (TRAVA PRÉ-REPASSE) — ${trava.pendencias.length} pendência(s)`);
    for (const pendencia of trava.pendencias) {
      linhas.push(`   – ${pendencia.rotulo}: ${pendencia.motivo === 'pendente' ? 'pendente' : 'prazo vencido'}`);
    }
  } else if (trava.status === 'liberado_manual') {
    linhas.push('• Liberado manualmente para repasse e emissão da NF.');
    linhas.push(`   Motivo: ${trava.liberacaoManual.justificativa}${trava.liberacaoManual.por ? ` — ${trava.liberacaoManual.por}` : ''}`);
    if (trava.pendencias.length) linhas.push(`   Pendências ainda abertas: ${trava.pendencias.length}`);
  } else {
    linhas.push('• Liberado para repasse e emissão da NF.');
  }

  if (trava.alertas.length) {
    linhas.push('');
    linhas.push('*Atenção de prazo*');
    for (const alerta of trava.alertas) {
      linhas.push(`• ${alerta.rotulo}: ${alerta.rotuloStatus}${alerta.validadeAte ? ` (validade ${dataBR(alerta.validadeAte)})` : ''}`);
    }
  }

  linhas.push('');
  linhas.push('Checklist operacional de acompanhamento. A conferência final é do tabelionato e do registro de imóveis.');
  linhas.push(`Atualizado em ${dataBR(agora)}.`);

  return linhas.join('\n');
}

/* ----------------------- propostas fechadas → esteira --------------------- */

/** Status de proposta que já entrou na fase de cartório. */
export function ehPropostaFechada(proposta = {}) {
  const status = normalizarTexto(proposta?.status || proposta?.situacao || '');
  return [
    'aceit', 'contrato', 'fechad', 'aprovad', 'vendid', 'assinad', 'conclu',
  ].some((termo) => status.includes(termo));
}

/**
 * Proposta aprovada/fechada → negociação da esteira.
 * Venda com financiamento (`SBPE`, `FGTS`, `banco`, `Correspondente & Crédito`)
 * já nasce marcada como `origemCredito`, porque a escritura vira contrato com
 * força de escritura e o sinal precisa aparecer no resumo.
 */
export function criarNegociacaoDeProposta(proposta = {}, { agora = Date.now() } = {}) {
  const dados = proposta && typeof proposta === 'object' ? proposta : {};
  const idProposta = String(dados.id || dados.propostaId || '');
  const modalidade = `${dados.modalidade || ''} ${dados.banco || ''}`;
  const origemCredito = Boolean(dados.origemCredito)
    || /financ|sbpe|fgts|banco|credito|correspondente/i.test(modalidade);
  const agoraISO = new Date(Number(agora)).toISOString();

  return normalizarNegociacao({
    id: idProposta ? `cartorio-${idProposta}` : '',
    propostaId: idProposta,
    codigoImovel: dados.codigoImovel || dados.codigo || '',
    imovelTitulo: dados.imovelTitulo || dados.imovel || '',
    comprador: dados.nomeCliente || dados.comprador || '',
    vendedor: dados.vendedor || dados.proprietario || '',
    corretor: dados.corretor || '',
    valor: dados.valorProposta ?? dados.valor,
    sinal: dados.sinalEntrada ?? dados.sinal,
    origemCredito,
    banco: dados.banco || (origemCredito ? 'Correspondente & Crédito' : ''),
    criadoEm: agoraISO,
    atualizadoEm: agoraISO,
  });
}

/**
 * Junta o que está salvo no Firestore com as propostas fechadas do CRM.
 * A proposta manda nos dados comerciais; o documento salvo manda no andamento
 * (checklist, datas e liberação manual) — ninguém perde o que já foi marcado.
 */
export function mesclarNegociacoes({ persistidas = [], propostas = [], agora = Date.now() } = {}) {
  const salvas = (Array.isArray(persistidas) ? persistidas : [])
    .filter(Boolean)
    .map((item) => normalizarNegociacao(item));

  const porProposta = new Map(salvas.filter((n) => n.propostaId).map((n) => [n.propostaId, n]));
  const porId = new Map(salvas.filter((n) => n.id).map((n) => [n.id, n]));

  const resultado = [];
  const vistos = new Set();

  for (const proposta of Array.isArray(propostas) ? propostas : []) {
    if (!ehPropostaFechada(proposta)) continue;

    const base = criarNegociacaoDeProposta(proposta, { agora });
    if (!base.id) continue; // proposta sem id não tem como ser salva sem duplicar

    const salva = porProposta.get(base.propostaId) || porId.get(base.id) || null;

    const mesclada = salva
      ? normalizarNegociacao({
        ...base,
        ...salva,
        codigoImovel: base.codigoImovel || salva.codigoImovel,
        imovelTitulo: base.imovelTitulo || salva.imovelTitulo,
        comprador: base.comprador || salva.comprador,
        vendedor: base.vendedor || salva.vendedor,
        corretor: base.corretor || salva.corretor,
        valor: base.valor || salva.valor,
        sinal: base.sinal || salva.sinal,
        origemCredito: base.origemCredito || salva.origemCredito,
        banco: base.banco || salva.banco,
        certidoes: { ...base.certidoes, ...salva.certidoes },
        escritura: { ...base.escritura, ...salva.escritura },
        atualizadoEm: salva.atualizadoEm || base.atualizadoEm,
      })
      : base;

    resultado.push(mesclada);
    vistos.add(mesclada.id);
    if (salva?.id) vistos.add(salva.id);
    if (salva?.propostaId) vistos.add(salva.propostaId);
  }

  for (const salva of salvas) {
    const chave = salva.id || salva.propostaId;
    if (!chave || vistos.has(chave)) continue;
    resultado.push(salva);
    vistos.add(chave);
  }

  return resultado;
}

/* ----------------------------- cenário demo ------------------------------ */

const emitidoDiasAtras = (dias, validadeDias, agora, extra = {}) => {
  const emitidaEm = somarDias(dataISO(agora), -Math.abs(Number(dias) || 0));
  return {
    status: STATUS_EMITIDA,
    emitidaEm,
    validadeAte: validadeDias ? somarDias(emitidaEm, validadeDias) : '',
    ...extra,
  };
};

/**
 * Três negociações de exemplo usadas no cold start/demonstração:
 *   1. travada, com CND pendente e matrícula vencendo em 3 dias (alerta âmbar);
 *   2. etapa 1 e ITBI/escritura prontos, aguardando a conclusão do registro;
 *   3. liberada para repasse e emissão da NF.
 * Nada aqui é gravado por si só: quem persiste é `cenarioDemo.js`.
 */
export function negociacoesDemoCartorio(agora = Date.now()) {
  const criadoEm = new Date(Number(agora)).toISOString();

  return [
    normalizarNegociacao({
      id: 'cartorio-demo-1',
      propostaId: 'prop_demo_cartorio_1',
      codigoImovel: 'IMB-8120',
      codigoRastreio: 'IMB-8120',
      senhaRastreio: '8120',
      imovelTitulo: 'Cobertura Duplex Vila Nova',
      comprador: 'Marcos Silva',
      vendedor: 'Espólio Almeida',
      corretor: 'Rodrigo Almeida',
      valor: 1180000,
      sinal: 118000,
      origemCredito: true,
      banco: 'Itaú',
      criadoEm,
      atualizadoEm: criadoEm,
      certidoes: {
        matricula: emitidoDiasAtras(27, 30, agora), // vence em 3 dias
        cnd_trabalhista: criarItem(), // pendente — trava o repasse
        cnd_federal: emitidoDiasAtras(18, 90, agora),
        cnd_estadual: emitidoDiasAtras(12, 90, agora),
        cnd_municipal: emitidoDiasAtras(9, 90, agora),
        onus_reais: emitidoDiasAtras(11, 30, agora),
        condominio_iptu: emitidoDiasAtras(6, 30, agora),
      },
      escritura: {
        itbi_guia: emitidoDiasAtras(4, 0, agora, { valor: 35400 }),
        itbi_pago: criarItem(),
        escritura: criarItem(),
        registro_protocolo: criarItem(),
        registro_concluido: criarItem(),
      },
    }),
    normalizarNegociacao({
      id: 'cartorio-demo-2',
      propostaId: 'prop_demo_cartorio_2',
      codigoImovel: 'IMB-4092',
      codigoRastreio: 'IMB-4092',
      senhaRastreio: '4092',
      imovelTitulo: 'Apartamento Jardins 110 m²',
      comprador: 'Fernanda Ribeiro',
      vendedor: 'Carlos Eduardo Mendes',
      corretor: 'Camila Rocha',
      valor: 850000,
      sinal: 85000,
      origemCredito: false,
      banco: '',
      criadoEm,
      atualizadoEm: criadoEm,
      certidoes: {
        matricula: emitidoDiasAtras(8, 30, agora),
        cnd_trabalhista: emitidoDiasAtras(6, 90, agora),
        cnd_federal: emitidoDiasAtras(6, 90, agora),
        cnd_estadual: emitidoDiasAtras(5, 90, agora),
        cnd_municipal: emitidoDiasAtras(5, 90, agora),
        onus_reais: emitidoDiasAtras(8, 30, agora),
        condominio_iptu: emitidoDiasAtras(3, 30, agora),
      },
      escritura: {
        itbi_guia: emitidoDiasAtras(3, 0, agora, { valor: 25500 }),
        itbi_pago: emitidoDiasAtras(2, 0, agora),
        escritura: emitidoDiasAtras(1, 0, agora),
        registro_protocolo: emitidoDiasAtras(1, 0, agora, { protocolo: 'RGI-2026-0091' }),
        registro_concluido: criarItem(), // aguardando o RGI concluir
      },
    }),
    normalizarNegociacao({
      id: 'cartorio-demo-3',
      propostaId: 'prop_demo_cartorio_3',
      codigoImovel: 'IMB-7301',
      codigoRastreio: 'IMB-7301',
      senhaRastreio: '7301',
      imovelTitulo: 'Casa em Condomínio Alphaville',
      comprador: 'Bruno Albuquerque',
      vendedor: 'Mariana Souza',
      corretor: 'Carlos Mendes',
      valor: 1950000,
      sinal: 390000,
      origemCredito: true,
      banco: 'Caixa Econômica Federal',
      criadoEm,
      atualizadoEm: criadoEm,
      certidoes: {
        matricula: emitidoDiasAtras(12, 30, agora),
        cnd_trabalhista: emitidoDiasAtras(20, 90, agora),
        cnd_federal: emitidoDiasAtras(20, 90, agora),
        cnd_estadual: emitidoDiasAtras(15, 90, agora),
        cnd_municipal: emitidoDiasAtras(15, 90, agora),
        onus_reais: emitidoDiasAtras(12, 30, agora),
        condominio_iptu: emitidoDiasAtras(10, 30, agora),
      },
      escritura: {
        itbi_guia: emitidoDiasAtras(9, 0, agora, { valor: 58500 }),
        itbi_pago: emitidoDiasAtras(8, 0, agora),
        escritura: emitidoDiasAtras(6, 0, agora),
        registro_protocolo: emitidoDiasAtras(5, 0, agora, { protocolo: 'RGI-2026-0044' }),
        registro_concluido: emitidoDiasAtras(2, 0, agora),
      },
    }),
  ];
}


/* ------------------------- status e alertas de prazo ---------------------- */

/**
 * Situação exibida de uma certidão.
 * `pendente` e `vencida` travam; `a_vencer` (≤ 5 dias) só acende o alerta
 * âmbar — a certidão ainda vale para o tabelionato.
 */
export function statusCertidao(certidao = {}, agora = Date.now()) {
  const item = certidao && typeof certidao === 'object' ? certidao : {};

  if (item.status === STATUS_VENCIDA) {
    return {
      chave: STATUS_VENCIDA,
      rotulo: 'Vencida',
      dias: diasRestantes(item.validadeAte, agora),
      severidade: 'critica',
      vencida: true,
      aVencer: false,
      travada: true,
    };
  }

  if (item.status !== STATUS_EMITIDA) {
    return {
      chave: STATUS_PENDENTE,
      rotulo: 'Pendente',
      dias: null,
      severidade: 'critica',
      vencida: false,
      aVencer: false,
      travada: true,
    };
  }

  const dias = diasRestantes(item.validadeAte, agora);

  if (dias === null) {
    return {
      chave: STATUS_EMITIDA,
      rotulo: 'Emitida',
      dias: null,
      severidade: 'ok',
      vencida: false,
      aVencer: false,
      travada: false,
    };
  }

  if (dias < 0) {
    return {
      chave: STATUS_VENCIDA,
      rotulo: `Vencida há ${Math.abs(dias)} dia(s)`,
      dias,
      severidade: 'critica',
      vencida: true,
      aVencer: false,
      travada: true,
    };
  }

  if (dias <= LIMITE_ALERTA_DIAS) {
    return {
      chave: 'a_vencer',
      rotulo: dias === 0 ? 'Vence hoje' : `Vence em ${dias} dia(s)`,
      dias,
      severidade: 'atencao',
      vencida: false,
      aVencer: true,
      travada: false,
    };
  }

  return {
    chave: STATUS_EMITIDA,
    rotulo: `Emitida · vence em ${dias} dia(s)`,
    dias,
    severidade: 'ok',
    vencida: false,
    aVencer: false,
    travada: false,
  };
}

/**
 * Rótulo do item na tela. A escritura muda de nome quando a venda vem de
 * Correspondente & Crédito: nesse caso o banco entrega contrato com força de
 * escritura, não escritura pública — e o sinal da proposta entra no resumo.
 */
export function rotuloItem(itemId, negociacao = {}) {
  const definicao = definicaoDoItem(itemId);
  const base = definicao?.rotulo || itemId;
  if (itemId === 'escritura' && negociacao?.origemCredito) {
    return 'Contrato com força de escritura (banco)';
  }
  return base;
}

/** Item marcado e ainda válido (a vencer conta como concluído). */
export function itemConcluido(item, agora = Date.now()) {
  return statusCertidao(item, agora).chave === STATUS_EMITIDA;
}

/** Progresso das duas etapas operacionais (a etapa 3 é a trava). */
export function progressoNegociacao(negociacao, agora = Date.now()) {
  const neg = normalizarNegociacao(negociacao);

  const contar = (chave, lista) => {
    const total = lista.length;
    const concluidos = lista.filter((item) => itemConcluido(neg[chave]?.[item.id], agora)).length;
    return { total, concluidos, pendentes: total - concluidos };
  };

  const certidoes = contar('certidoes', CHECKLIST_CERTIDOES);
  const escritura = contar('escritura', CHECKLIST_ESCRITURA);
  const total = certidoes.total + escritura.total;
  const concluidos = certidoes.concluidos + escritura.concluidos;

  return {
    certidoes,
    escritura,
    total,
    concluidos,
    pct: total ? Math.round((concluidos / total) * 100) : 0,
  };
}
