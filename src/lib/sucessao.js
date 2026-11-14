/**
 * sucessao.js — inventário, partilha e ITCMD por UF.
 *
 * Resolução CNJ nº 571/2024: o inventário extrajudicial em cartório passou a
 * admitir herdeiros menores de idade e demais incapazes, desde que:
 *   1. o quinhão do incapaz esteja garantido e discriminado na escritura;
 *   2. haja parecer favorável do Ministério Público;
 *   3. todos os interessados sejam capazes civilmente ou representados;
 *   4. o ato seja consensual (sem litígio) e os interessados estejam assistidos.
 *
 * A sigla do imposto muda por estado (ITCMD / ITCD / ITD) e o checklist
 * acompanha a UF selecionada.
 */

import { aliquotaHeranca, prazoInventario, siglaImposto, regraUF } from './regrasEstaduais.js';

export const REQUISITOS_EXTRAJUDICIAL = [
  {
    key: 'consensual',
    label: 'Partilha consensual',
    detalhe: 'Todos os herdeiros de acordo com a divisão dos bens',
    obrigatorio: true,
  },
  {
    key: 'capacidade',
    label: 'Interessados capazes ou representados',
    detalhe: 'Incapaz representado por tutor/curator, com autorização judicial quando exigida',
    obrigatorio: true,
  },
  {
    key: 'quinhaoGarantido',
    label: 'Quinhão do menor garantido',
    detalhe: 'Resolução CNJ 571/2024: quinhão discriminado e preservado na escritura',
    obrigatorio: false, // passa a obrigatório quando há menor
  },
  {
    key: 'avalMP',
    label: 'Parecer favorável do Ministério Público',
    detalhe: 'Exigido quando houver herdeiro menor ou incapaz',
    obrigatorio: false, // idem
  },
  {
    key: 'advogado',
    label: 'Advogado em comum',
    detalhe: 'Assistência jurídica única para todos os interessados',
    obrigatorio: true,
  },
  {
    key: 'certidoes',
    label: 'Certidões negativas',
    detalhe: 'Tributos, FGTS e dívidas do espólio',
    obrigatorio: true,
  },
];

/**
 * Valida a via extrajudicial para um caso concreto.
 * @param {object} caso
 * @param {string} caso.uf
 * @param {boolean} caso.temMenor
 * @param {boolean} caso.quinhaoGarantido
 * @param {boolean} caso.avalMP
 * @param {boolean} caso.consensual
 * @param {boolean} caso.todosCapazes
 * @param {string} caso.signatarios  'todos' | 'parcial'
 */
export function validarInventarioExtrajudicial({
  uf = 'MG',
  temMenor = false,
  quinhaoGarantido = false,
  avalMP = false,
  consensual = true,
  todosCapazes = true,
  signatarios = 'todos',
} = {}) {
  const bloqueios = [];
  const alertas = [];

  if (!consensual) {
    bloqueios.push('Inventário extrajudicial exige consenso entre os herdeiros. Caso litigioso vai para a via judicial.');
  }
  if (signatarios !== 'todos') {
    bloqueios.push('Todos os herdeiros e o inventariante precisam assinar a escritura.');
  }
  if (!todosCapazes && !temMenor) {
    alertas.push('Interessado incapaz: verifique autorização judicial e representação legal antes do cartório.');
  }

  if (temMenor) {
    if (!quinhaoGarantido) {
      bloqueios.push('Resolução CNJ 571/2024: com herdeiro menor, o quinhão precisa estar garantido e discriminado na escritura.');
    }
    if (!avalMP) {
      bloqueios.push('Resolução CNJ 571/2024: com herdeiro menor, é exigido parecer favorável do Ministério Público.');
    }
    if (quinhaoGarantido && avalMP) {
      alertas.push('Via extrajudicial permitida mesmo com menor: quinhão garantido + aval do MP atendidos.');
    }
  }

  const prazo = prazoInventario(uf);
  const diasDesdeAbertura = null;

  return {
    uf: regraUF(uf).uf,
    impostoSigla: siglaImposto(uf),
    permitido: bloqueios.length === 0,
    bloqueios,
    alertas,
    prazoDias: prazo.dias,
    prazoResumo: prazo.resumo,
    desconto: prazo.desconto,
    multa: prazo.multa,
    diasDesdeAbertura,
    observacao: 'Resolução CNJ nº 571/2024 (alterou o art. 19 da Resolução 35/2007 do CNJ).',
  };
}

/** Checklist adaptado à UF: sigla do imposto muda, prazo é o do CPC. */
export function checklistInventario(uf = 'MG') {
  const r = regraUF(uf);
  const prazo = prazoInventario(uf);
  return {
    uf: r.uf,
    impostoSigla: r.imposto,
    itens: [
      { key: 'abertura', label: `Abertura do inventário em até ${prazo.dias} dias`, detalhe: 'CPC, art. 611 — conta do prazo a partir da ciência do falecimento' },
      { key: 'docs', label: 'Documentos do falecido e herdeiros', detalhe: 'RG, CPF, certidões, pacto antenupcial e testamento, se houver' },
      { key: 'bens', label: 'Rol de bens e direitos', detalhe: 'Imóveis com CIB/matrícula, veículos, contas e participações' },
      { key: 'avaliacao', label: 'Avaliação dos bens', detalhe: 'Base de cálculo do imposto estadual' },
      { key: 'imposto', label: `${r.imposto} — guia estadual`, detalhe: `Alíquotas de ${r.aliquotaMin}% a ${r.aliquotaMax}%${r.aliquotaUnica ? ' (alíquota única)' : ' (progressivas)'}` },
      { key: 'partilha', label: 'Formal de partilha / escritura', detalhe: 'Definir via judicial ou extrajudicial conforme o caso' },
      { key: 'registro', label: 'Registro e transferência', detalhe: 'Averbação na matrícula e atualização cadastral (CIB)' },
    ],
    desconto: prazo.desconto,
    multa: prazo.multa,
  };
}

/** Simulação do imposto na sucessão, já com a sigla do estado. */
export function simularItcmdSucessao({ uf = 'MG', valorBens = 0 } = {}) {
  const info = aliquotaHeranca(uf, valorBens);
  const prazo = prazoInventario(uf);
  const comDesconto = prazo.desconto
    ? Math.round(info.imposto * (1 - prazo.desconto.pct / 100) * 100) / 100
    : null;
  return {
    ...info,
    prazoResumo: prazo.resumo,
    impostoComDesconto: comDesconto,
    economiaComDesconto: comDesconto != null ? Math.round((info.imposto - comDesconto) * 100) / 100 : null,
  };
}
