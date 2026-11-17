/**
 * esteira.js — etapas, SLA e helpers da esteira de crédito
 * ============================================================================
 * Funções puras: nada de Firestore aqui (testável em Node).
 * ============================================================================
 */

export const ETAPAS = [
  { key: 'simulacao',      label: 'Simulação',            sla: 2,  cor: '#0ea5e9', ordem: 1 },
  { key: 'analise',        label: 'Análise de Crédito',   sla: 5,  cor: '#8b5cf6', ordem: 2, sigla: 'SICAQ' },
  { key: 'engenharia',     label: 'Engenharia/Avaliação', sla: 10, cor: '#f59e0b', ordem: 3 },
  { key: 'juridico',       label: 'Jurídico/Contrato',    sla: 7,  cor: '#ec4899', ordem: 4 },
  { key: 'assinatura',     label: 'Assinatura e Registro', sla: 15, cor: '#10b981', ordem: 5 },
];

export const ETAPAS_LATERAIS = [
  { key: 'pendencia',   label: 'Pendência',   sla: 3,  cor: '#eab308', terminal: false },
  { key: 'condicionado', label: 'Condicionado', sla: 5, cor: '#f97316', terminal: false },
  { key: 'aprovado',    label: 'Aprovado',    sla: null, cor: '#22c55e', terminal: true },
  { key: 'reprovado',   label: 'Reprovado',   sla: null, cor: '#ef4444', terminal: true },
];

export const TODAS_ETAPAS = [...ETAPAS, ...ETAPAS_LATERAIS];

export const BANCOS = ['Caixa', 'Itaú', 'Bradesco', 'Santander', 'Inter', 'Outro'];

export const ESTADOS_CIVIS = ['solteiro', 'casado', 'divorciado', 'viúvo', 'união estável'];
export const REGIMES_BENS = ['comunhão parcial', 'comunhão universal', 'separação total', 'participação final nos aquestos', 'não se aplica'];

export function etapaPorKey(key) {
  return TODAS_ETAPAS.find((e) => e.key === key) || ETAPAS[0];
}

export function proximaEtapa(key) {
  const atual = ETAPAS.findIndex((e) => e.key === key);
  if (atual === -1) return ETAPAS[0].key;
  return ETAPAS[Math.min(atual + 1, ETAPAS.length - 1)].key;
}

export function etapaAnterior(key) {
  const atual = ETAPAS.findIndex((e) => e.key === key);
  if (atual <= 0) return ETAPAS[0].key;
  return ETAPAS[atual - 1].key;
}

/** Dias corridos desde a última mudança de etapa. */
export function diasNaEtapa(processo) {
  const referencia = processo?.etapaDesde?.toDate
    ? processo.etapaDesde.toDate()
    : processo?.etapaDesde instanceof Date
      ? processo.etapaDesde
      : processo?.criadoEm?.toDate
        ? processo.criadoEm.toDate()
        : processo?.criadoEm instanceof Date
          ? processo.criadoEm
          : null;
  if (!referencia) return null;
  return Math.max(0, Math.floor((Date.now() - referencia.getTime()) / 86400000));
}

/** Situação do SLA: ok / atenção (>=80%) / estourado. */
export function situacaoSla(processo) {
  const etapa = etapaPorKey(processo?.etapa);
  if (!etapa.sla) return { estado: 'sem-sla', dias: diasNaEtapa(processo), limite: null };
  const dias = diasNaEtapa(processo);
  if (dias == null) return { estado: 'sem-data', dias: null, limite: etapa.sla };
  const uso = dias / etapa.sla;
  return {
    estado: uso > 1 ? 'estourado' : uso >= 0.8 ? 'atencao' : 'ok',
    dias,
    limite: etapa.sla,
    uso: Number(uso.toFixed(2)),
  };
}

/** CPF só aparece mascarado em qualquer lista (LGPD). */
export function mascararCpf(cpf) {
  const d = String(cpf || '').replace(/\D/g, '');
  if (d.length !== 11) return '***.***.***-**';
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

export function mascararTelefone(tel) {
  const d = String(tel || '').replace(/\D/g, '');
  if (d.length < 10) return '—';
  return `(${d.slice(0, 2)}) *****-${d.slice(-4)}`;
}

/** Cria o registro de histórico de uma mudança de etapa. */
export function registroHistorico(processo, novaEtapa, autor, autorId, motivo = '') {
  return {
    de: processo?.etapa || 'simulacao',
    para: novaEtapa,
    em: new Date().toISOString(),
    autor: autor || 'sistema',
    autorId: autorId || null,
    motivo: motivo || null,
  };
}

/** Prazo (Date) da etapa atual, para gravar em sla.prazoEm. */
export function prazoDaEtapa(etapaKey, dias = null) {
  const etapa = etapaPorKey(etapaKey);
  const limite = dias ?? etapa.sla;
  if (!limite) return null;
  return new Date(Date.now() + limite * 86400000);
}

/** Contagem por etapa, para o cabeçalho do kanban. */
export function contarPorEtapa(processos = []) {
  const mapa = Object.fromEntries(TODAS_ETAPAS.map((e) => [e.key, 0]));
  for (const p of processos) {
    const k = p?.etapa && mapa[p.etapa] !== undefined ? p.etapa : 'simulacao';
    mapa[k] += 1;
  }
  return mapa;
}

/** Valor total financiado dos processos ainda ativos (não reprovados). */
export function totalFinanciado(processos = []) {
  return processos
    .filter((p) => p?.etapa !== 'reprovado')
    .reduce((acc, p) => acc + (Number(p?.valorFinanciado) || 0), 0);
}
