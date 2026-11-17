/**
 * documentos.js — checklist de documentos por perfil (Fase 3)
 * ============================================================================
 * PURO: sem Firestore, sem Storage. O checklist é uma LISTA DE STATUS — nenhum
 * arquivo é guardado (nem no Firestore, nem no Storage nesta fase).
 * ============================================================================
 */

export const BLOCOS = [
  { key: 'comprador', label: 'Comprador', icone: '👤' },
  { key: 'vendedor', label: 'Vendedor', icone: '🏷️' },
  { key: 'imovel', label: 'Imóvel', icone: '🏠' },
];

export const STATUS_DOC = [
  { key: 'pendente', label: 'Pendente', cor: '#eab308' },
  { key: 'recebido', label: 'Recebido', cor: '#10b981' },
  { key: 'vencido', label: 'Vencido', cor: '#ef4444' },
];

export const PERFIS_COMPRADOR = [
  { key: 'clt', label: 'CLT' },
  { key: 'autonomo', label: 'Autônomo / MEI' },
  { key: 'empresario', label: 'Empresário / Pró-labore' },
  { key: 'aposentado', label: 'Aposentado / Pensionista' },
];

/** Documentos comuns a qualquer comprador. */
const COMPRADOR_BASE = [
  { item: 'RG ou CNH (documento de identificação)', validadeMeses: null },
  { item: 'CPF — comprovante de situação cadastral', validadeMeses: null },
  { item: 'Comprovante de residência', validadeMeses: 3 },
  { item: 'Certidão de nascimento ou casamento', validadeMeses: 6 },
  { item: 'Comprovante de estado civil atualizado (se separado/divorciado)', validadeMeses: 6 },
];

const POR_PERFIL = {
  clt: [
    { item: 'CTPS digital (páginas de identificação e contrato)', validadeMeses: null },
    { item: 'Últimos 3 contracheques', validadeMeses: 1 },
    { item: 'Extrato analítico do FGTS', validadeMeses: 1 },
    { item: 'Declaração de Imposto de Renda + recibo (se declarante)', validadeMeses: 12 },
  ],
  autonomo: [
    { item: 'Cartão CNPJ ou DASN-SIMEI', validadeMeses: 12 },
    { item: 'Extrato bancário dos últimos 6 meses', validadeMeses: 1 },
    { item: 'Declaração de Imposto de Renda + recibo', validadeMeses: 12 },
    { item: 'Comprovação de faturamento (notas/emitente)', validadeMeses: 3 },
  ],
  empresario: [
    { item: 'Contrato social e última alteração', validadeMeses: null },
    { item: 'Pró-labore: 3 últimos holerites', validadeMeses: 1 },
    { item: 'Balanço patrimonial e DRE dos 2 últimos exercícios', validadeMeses: 12 },
    { item: 'Extrato bancário da empresa (6 meses)', validadeMeses: 1 },
  ],
  aposentado: [
    { item: 'Extrato de benefício do INSS', validadeMeses: 1 },
    { item: 'Extrato bancário dos últimos 3 meses', validadeMeses: 1 },
    { item: 'Declaração de Imposto de Renda ou comprovante de isenção', validadeMeses: 12 },
  ],
};

const VENDEDOR = [
  { item: 'RG/CPF do(s) vendedor(es)', validadeMeses: null },
  { item: 'Certidão de estado civil', validadeMeses: 6 },
  { item: 'Matrícula atualizada do imóvel', validadeMeses: 1 },
  { item: 'Certidão negativa de ônus reais', validadeMeses: 1 },
  { item: 'Comprovante de quitação do financiamento (se houver)', validadeMeses: null },
  { item: 'Dados bancários para recebimento', validadeMeses: null },
];

const IMOVEL = [
  { item: 'Matrícula atualizada (emitida nos últimos 30 dias)', validadeMeses: 1 },
  { item: 'IPTU do exercício + certidão negativa', validadeMeses: 12 },
  { item: 'Habite-se / averbação da construção', validadeMeses: null },
  { item: 'Certidão negativa de condomínio (se aplicável)', validadeMeses: 1 },
  { item: 'Contrato de locação vigente (se imóvel alugado)', validadeMeses: null },
  { item: 'Laudo de avaliação do banco', validadeMeses: 3 },
];

/**
 * Gera o checklist do processo.
 * @param {{perfil?: string, tipoImovel?: string, usaFgts?: boolean, imovelAlugado?: boolean}} cfg
 */
export function gerarChecklist({ perfil = 'clt', tipoImovel = 'usado', usaFgts = false, imovelAlugado = false } = {}) {
  const doPerfil = POR_PERFIL[perfil] || POR_PERFIL.clt;
  const linhas = [];

  const push = (bloco, lista) => {
    for (const d of lista) {
      linhas.push({
        bloco,
        item: d.item,
        obrigatorio: d.obrigatorio !== false,
        validadeMeses: d.validadeMeses ?? null,
      });
    }
  };

  push('comprador', COMPRADOR_BASE);
  push('comprador', doPerfil);
  if (usaFgts) push('comprador', [{ item: 'Autorização de consulta ao FGTS', validadeMeses: 1, obrigatorio: false }]);
  push('vendedor', VENDEDOR);
  push('imovel', IMOVEL.filter((d) => {
    if (d.item.startsWith('Certidão negativa de condomínio') && tipoImovel !== 'apartamento') return false;
    if (d.item.startsWith('Contrato de locação') && !imovelAlugado) return false;
    return true;
  }));

  return linhas.map((l, i) => ({
    ...l,
    chave: `${l.bloco}:${i}`,
    status: 'pendente',
    validadeEm: null,
    observacao: '',
  }));
}

/** Soma meses a uma data (aceita Date/ISO/Timestamp do Firestore). */
export function somarMeses(data, meses) {
  const base = data?.toDate ? data.toDate() : data instanceof Date ? data : new Date(data || Date.now());
  if (!meses) return null;
  const d = new Date(base.getTime());
  d.setMonth(d.getMonth() + Number(meses));
  return d;
}

/** Status efetivo: 'recebido' com validade estourada vira 'vencido'. */
export function statusEfetivo(doc, hoje = new Date()) {
  if (!doc) return 'pendente';
  if (doc.status !== 'recebido') return doc.status || 'pendente';
  if (!doc.validadeEm) return 'recebido';
  const validade = doc.validadeEm?.toDate ? doc.validadeEm.toDate() : new Date(doc.validadeEm);
  if (Number.isNaN(validade.getTime())) return 'recebido';
  return validade.getTime() < hoje.getTime() ? 'vencido' : 'recebido';
}

export function resumoChecklist(docs = []) {
  const total = docs.length;
  const recebidos = docs.filter((d) => statusEfetivo(d) === 'recebido').length;
  const vencidos = docs.filter((d) => statusEfetivo(d) === 'vencido').length;
  const pendentes = total - recebidos - vencidos;
  return {
    total, recebidos, vencidos, pendentes,
    percentual: total ? Math.round((recebidos / total) * 100) : 0,
  };
}

const fmtData = (v) => {
  if (!v) return '';
  const d = v?.toDate ? v.toDate() : new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR');
};

/**
 * Mensagem de WhatsApp com SOMENTE pendentes e vencidos, agrupada por bloco.
 * Nunca inclui CPF, valores de renda ou dados do cliente.
 */
export function pendenciasParaWhatsApp(docs = [], nomeCliente = '') {
  const faltando = docs.filter((d) => ['pendente', 'vencido'].includes(statusEfetivo(d)));
  if (!faltando.length) return 'Tudo certo: nenhum documento pendente no momento.';

  const linhas = [`*Documentos pendentes*${nomeCliente ? ` — ${nomeCliente}` : ''}`, ''];
  for (const bloco of BLOCOS) {
    const doBloco = faltando.filter((d) => d.bloco === bloco.key);
    if (!doBloco.length) continue;
    linhas.push(`*${bloco.label}*`);
    for (const d of doBloco) {
      const vencido = statusEfetivo(d) === 'vencido';
      const validade = vencido ? ` (venceu em ${fmtData(d.validadeEm)})` : '';
      linhas.push(`• ${d.item}${validade}`);
    }
    linhas.push('');
  }
  linhas.push('_Envie por foto ou PDF. Obrigado!_');
  return linhas.join('\n');
}

/** Nome do arquivo no Storage (Fase 3 futura) — nunca usado nesta fase. */
export function caminhoStorage(oficinaId, processoId, documentoId) {
  return `oficinas/${oficinaId}/credito/${processoId}/${documentoId}`;
}
