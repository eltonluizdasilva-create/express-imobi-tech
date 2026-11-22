/**
 * agendaEspecialista.js — REGRA DE DISPONIBILIDADE DA AGENDA DE SUPORTE
 * ============================================================================
 * O painel não tem calendário no servidor: a agenda é uma vitrine que monta a
 * mensagem e abre o WhatsApp. Portanto é AQUI que se bloqueia dia — este arquivo
 * é o único lugar a editar.
 *
 * Como bloquear:
 *   1. Um dia solto (feriado, viagem, compromisso): acrescente a data em
 *      `DATAS_BLOQUEADAS` no formato 'AAAA-MM-DD'.
 *   2. Um período (férias): acrescente as datas do período, uma por linha,
 *      ou use `PERIODOS_BLOQUEADOS` com início e fim.
 *   3. Um dia da semana inteiro: tire o número de `DIAS_ATENDIDOS`
 *      (0 = domingo, 1 = segunda ... 6 = sábado).
 *   4. Antecedência mínima: `ANTECEDENCIA_MINIMA_DIAS` (1 = não aceita hoje).
 * ============================================================================
 */

/** Dias da semana com atendimento. 0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sáb */
export const DIAS_ATENDIDOS = [1, 2, 3, 4, 5];

/** Datas avulsas bloqueadas — 'AAAA-MM-DD'. */
export const DATAS_BLOQUEADAS = [
  // '2026-12-24', // véspera de Natal
  // '2026-12-25', // Natal
  // '2027-01-01', // Ano Novo
];

/** Bloqueios por período (férias, Congresso, etc.). */
export const PERIODOS_BLOQUEADOS = [
  // { de: '2026-12-20', ate: '2027-01-05', motivo: 'Recesso de fim de ano' },
];

/**
 * JANELA DE ATENDIMENTO — horário de BRASÍLIA (UTC-3).
 * Só a noite está aberta: manhã e tarde são fechadas de propósito (o plantão
 * do especialista é à noite, depois do horário de visita/plantão do corretor).
 */
export const HORARIOS_ATENDIMENTO = ['20:30', '21:00', '21:30', '22:00', '22:30', '23:00'];
export const FUSO_ATENDIMENTO = 'Horário de Brasília (UTC-3)';
export const FUSO_OFFSET_MINUTOS = -180;

/** Data de HOJE no fuso de Brasília (o navegador pode estar em outro fuso). */
export function hojeBrasiliaISO() {
  const d = new Date(Date.now() + FUSO_OFFSET_MINUTOS * 60 * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** 0 = aceita para hoje; 1 = só a partir de amanhã. */
export const ANTECEDENCIA_MINIMA_DIAS = 1;

const NOMES_BLOQUEIO = {
  passado: 'Essa data já passou.',
  semana: 'Não atendemos nesse dia da semana.',
  lista: 'Esse dia está bloqueado na agenda.',
  periodo: 'Esse dia cai num período de recesso.',
  antecedencia: 'Precisamos de pelo menos 1 dia de antecedência.',
};

const soData = (iso) => String(iso || '').slice(0, 10);
const pad = (n) => String(n).padStart(2, '0');
const partes = (iso) => soData(iso).split('-').map(Number);
const isoDeUTC = (ms) => new Date(ms).toISOString().slice(0, 10);

// Toda a matemática é feita em UTC a partir das partes da string: usar
// `new Date('2026-11-23T00:00:00').toISOString()` deslocava o dia em fusos
// positivos (Brasil +10 de teste devolvia o dia anterior e o loop nunca saía).
const diaDaSemana = (iso) => {
  const [a, m, d] = partes(iso);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
};
const somaDias = (iso, dias) => {
  const [a, m, d] = partes(iso);
  return isoDeUTC(Date.UTC(a, m - 1, d + dias));
};
const hojeISO = () => hojeBrasiliaISO();

/**
 * Devolve o motivo do bloqueio ou `null` quando a data pode ser atendida.
 * @param {string} iso data no formato 'AAAA-MM-DD'
 */
export function motivoBloqueio(iso) {
  const dia = soData(iso);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return 'passado';

  const minimo = somaDias(hojeISO(), ANTECEDENCIA_MINIMA_DIAS);
  if (dia < hojeISO()) return 'passado';
  if (dia < minimo) return 'antecedencia';

  const semana = diaDaSemana(dia);
  if (!DIAS_ATENDIDOS.includes(semana)) return 'semana';

  if (DATAS_BLOQUEADAS.map(soData).includes(dia)) return 'lista';

  const dentroDePeriodo = PERIODOS_BLOQUEADOS.some(
    (p) => dia >= soData(p.de) && dia <= soData(p.ate),
  );
  if (dentroDePeriodo) return 'periodo';

  return null;
}

/** Texto pronto para mostrar ao cliente. */
export function textoBloqueio(iso) {
  const motivo = motivoBloqueio(iso);
  if (!motivo) return null;
  if (motivo === 'semana') {
    const nomes = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    return `Não atendemos ${nomes[diaDaSemana(iso)]}. Atendemos de segunda a sexta.`;
  }
  return NOMES_BLOQUEIO[motivo] || 'Data indisponível.';
}

/** Primeira data livre a partir de `aPartirDe` (inclusive), olhando 120 dias. */
export function proximaDataLivre(aPartirDe = hojeISO()) {
  let cursor = soData(aPartirDe) < hojeISO() ? somaDias(hojeISO(), ANTECEDENCIA_MINIMA_DIAS) : soData(aPartirDe);
  for (let i = 0; i < 120; i += 1) {
    if (!motivoBloqueio(cursor)) return cursor;
    cursor = somaDias(cursor, 1);
  }
  return null;
}
