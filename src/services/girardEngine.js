/**
 * girardEngine.js — Roda de Prospecção Inteligente (método Girard).
 *
 * Duas responsabilidades:
 *  1. registrarEventoLead(): grava o evento na subcoleção do tenant e mantém
 *     os campos de data do lead atualizados (sem sobrescrever histórico).
 *  2. calcularRodaProspeccao(): função PURA e determinística que cruza leads,
 *     visitas, propostas e tarefas já carregados por onSnapshot e devolve
 *     contadores + lista ranqueada de prioridades em linguagem natural.
 *
 * Retrocompatibilidade: registros antigos não têm leadId, ultimoContatoEm nem
 * etapaAlteradaEm. Toda leitura usa fallback em cascata e o vínculo visita →
 * lead cai para o telefone normalizado quando falta o leadId.
 */

import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

export const TIPOS_EVENTO = {
  CONTATO: 'contato',
  CONTATO_WHATSAPP: 'contato_whatsapp',
  MUDANCA_ETAPA: 'mudanca_etapa',
  VISITA_AGENDADA: 'visita_agendada',
  VISITA_REALIZADA: 'visita_realizada',
  PROPOSTA_CRIADA: 'proposta_criada',
  FOLLOWUP_AGENDADO: 'followup_agendado',
  POS_VENDA: 'pos_venda',
};

/** Tipos que contam como interação humana (movem ultimoContatoEm). */
const TIPOS_INTERACAO = new Set([
  TIPOS_EVENTO.CONTATO,
  TIPOS_EVENTO.CONTATO_WHATSAPP,
  TIPOS_EVENTO.VISITA_AGENDADA,
  TIPOS_EVENTO.VISITA_REALIZADA,
  TIPOS_EVENTO.PROPOSTA_CRIADA,
  TIPOS_EVENTO.POS_VENDA,
]);

export const ESTAGIOS_NEGOCIACAO = [
  'Visita Agendada',
  'Visita Realizada',
  'Proposta',
  'Documentação',
  'Em Negociação',
];

const ESTAGIOS_ATIVOS = new Set([
  'Novo Lead',
  'Qualificado IA',
  'Em Atendimento',
  'Visita Agendada',
  'Visita Realizada',
  'Proposta',
  'Documentação',
  'Em Negociação',
]);

const ESTAGIOS_ENCERRADOS = new Set(['Fechado', 'Perdido', 'Descartado']);

/* ─────────────────────── helpers de data/telefone ─────────────────────── */

export function normalizarTelefone(valor) {
  const digitos = String(valor || '').replace(/\D/g, '');
  if (digitos.length > 11 && digitos.startsWith('55')) return digitos.slice(2);
  return digitos;
}

/** Aceita Timestamp do Firestore, Date, ISO, dd/mm/aaaa ou segundos. */
export function paraData(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
  if (typeof valor === 'object') {
    if (typeof valor.toDate === 'function') {
      try { return valor.toDate(); } catch { return null; }
    }
    if (typeof valor.seconds === 'number') return new Date(valor.seconds * 1000);
  }
  if (typeof valor === 'number') {
    const d = new Date(valor < 1e12 ? valor * 1000 : valor);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const texto = String(valor).trim();
  const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
  const d = new Date(texto);
  return Number.isNaN(d.getTime()) ? null : d;
}

function diasDesde(data, hoje = new Date()) {
  if (!data) return null;
  const ms = hoje.getTime() - data.getTime();
  return Math.floor(ms / 86400000);
}

function primeiroValido(...valores) {
  for (const v of valores) {
    const d = paraData(v);
    if (d) return d;
  }
  return null;
}

function normalizarEstagio(lead = {}) {
  return String(lead.estagio || lead.status || '').trim();
}

/* ───────────────────── 1. registro de evento ───────────────────── */

/**
 * Grava o evento e mantém o lead em sincronia.
 * Nunca lança: falha em evento não pode derrubar o fluxo comercial.
 */
export async function registrarEventoLead(db, oficinaId, {
  leadId = null,
  telefone = '',
  tipo = TIPOS_EVENTO.CONTATO,
  canal = 'painel',
  descricao = '',
  autor = '',
  metadados = {},
  proximoFollowUpEm = null,
} = {}) {
  if (!db || !oficinaId) return null;

  const telefoneNorm = normalizarTelefone(telefone);

  try {
    const evento = {
      leadId: leadId || null,
      telefone: telefoneNorm,
      tipo,
      canal,
      descricao,
      autor,
      metadados,
      criadoEm: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'oficinas', oficinaId, 'eventos_lead'), evento);

    if (leadId) {
      const patch = {};
      if (TIPOS_INTERACAO.has(tipo)) patch.ultimoContatoEm = serverTimestamp();
      if (tipo === TIPOS_EVENTO.MUDANCA_ETAPA) patch.etapaAlteradaEm = serverTimestamp();
      if (tipo === TIPOS_EVENTO.POS_VENDA) patch.posVendaStatus = 'concluida';
      if (proximoFollowUpEm) patch.proximoFollowUpEm = proximoFollowUpEm;
      if (Object.keys(patch).length > 0) {
        await updateDoc(doc(db, 'oficinas', oficinaId, 'leads_imobi', leadId), patch);
      }
    }

    return ref.id;
  } catch (erro) {
    console.warn('registrarEventoLead: falhou sem interromper o fluxo', erro);
    return null;
  }
}

/* ───────────────── 2. roda de prospecção (pura) ───────────────── */

function indexarVisitas(visitas = []) {
  const porLead = new Map();
  const porTelefone = new Map();

  for (const v of visitas) {
    const dataVisita = primeiroValido(v?.dataVisita, v?.criadoEm, v?.data, v?.dataHora);
    const item = { ...v, _dataVisita: dataVisita, _telefone: normalizarTelefone(v?.telefone) };
    if (v?.leadId) {
      if (!porLead.has(v.leadId)) porLead.set(v.leadId, []);
      porLead.get(v.leadId).push(item);
    }
    if (item._telefone) {
      if (!porTelefone.has(item._telefone)) porTelefone.set(item._telefone, []);
      porTelefone.get(item._telefone).push(item);
    }
  }

  for (const lista of [...porLead.values(), ...porTelefone.values()]) {
    lista.sort((a, b) => (b._dataVisita?.getTime() || 0) - (a._dataVisita?.getTime() || 0));
  }
  return { porLead, porTelefone };
}

function indexarPropostas(propostas = []) {
  const porLead = new Map();
  const porTelefone = new Map();
  for (const p of propostas) {
    const mov = primeiroValido(p?.ultimaMovimentacaoEm, p?.criadoEm, p?.dataRegistro);
    const item = { ...p, _mov: mov, _telefone: normalizarTelefone(p?.telefone) };
    if (p?.leadId) {
      if (!porLead.has(p.leadId)) porLead.set(p.leadId, []);
      porLead.get(p.leadId).push(item);
    }
    if (item._telefone) {
      if (!porTelefone.has(item._telefone)) porTelefone.set(item._telefone, []);
      porTelefone.get(item._telefone).push(item);
    }
  }
  return { porLead, porTelefone };
}

const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/**
 * @returns {{
 *   contadores: {acompanhar:number, novosProspectos:number, negociacoesParadas:number, posVendasPendentes:number},
 *   prioridades: Array<object>,
 *   detalhe: object
 * }}
 */
export function calcularRodaProspeccao({
  leads = [],
  visitas = [],
  propostas = [],
  tarefas = [],
  corretorFiltro = null,
  hoje = new Date(),
} = {}) {
  const listaLeads = (Array.isArray(leads) ? leads : []).filter((l) => {
    if (!corretorFiltro) return true;
    const dono = l?.corretorResponsavel || l?.corretor || '';
    return String(dono).toLowerCase() === String(corretorFiltro).toLowerCase();
  });

  const idxVisitas = indexarVisitas(visitas);
  const idxPropostas = indexarPropostas(propostas);

  const contadores = { acompanhar: 0, novosProspectos: 0, negociacoesParadas: 0, posVendasPendentes: 0 };
  const prioridades = [];
  const sets = {
    acompanhar: new Set(),
    novosProspectos: new Set(),
    negociacoesParadas: new Set(),
    posVendasPendentes: new Set(),
  };

  for (const lead of listaLeads) {
    const id = lead?.id || lead?.leadId;
    if (!id) continue;

    const nome = String(lead?.nome || 'Lead sem nome').trim();
    const telefone = normalizarTelefone(lead?.telefone);
    const estagio = normalizarEstagio(lead);
    const interesse = lead?.interesse || 'imóvel';
    const origem = lead?.origem || 'portal';
    const criado = primeiroValido(lead?.criadoEm, lead?.data_registro, lead?.dataCriacao);
    const ultimoContato = primeiroValido(lead?.ultimoContatoEm, lead?.ultimoContato);
    const etapaAlterada = primeiroValido(lead?.etapaAlteradaEm, lead?.etapaAlterada) || ultimoContato || criado;
    const proximoFollowUp = primeiroValido(lead?.proximoFollowUpEm, lead?.proximoFollowUp);

    const visitasDoLead = [
      ...(idxVisitas.porLead.get(id) || []),
      ...(telefone ? (idxVisitas.porTelefone.get(telefone) || []) : []),
    ].filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i);

    const propostasDoLead = [
      ...(idxPropostas.porLead.get(id) || []),
      ...(telefone ? (idxPropostas.porTelefone.get(telefone) || []) : []),
    ].filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);

    const diasCriado = diasDesde(criado, hoje);
    const diasContato = diasDesde(ultimoContato, hoje);
    const diasEtapa = diasDesde(etapaAlterada, hoje);
    const followUpVencido = proximoFollowUp ? proximoFollowUp.getTime() <= hoje.getTime() : false;
    const encerrado = ESTAGIOS_ENCERRADOS.has(estagio);
    const emNegociacao = ESTAGIOS_NEGOCIACAO.includes(estagio);

    const visitaRecente = visitasDoLead
      .map((v) => v._dataVisita)
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;

    const propostaAberta = propostasDoLead.find((p) => {
      const st = String(p?.status || '').toLowerCase();
      return !['fechada', 'aceita', 'recusada', 'cancelada', 'perdida'].includes(st);
    }) || null;

    /* ---------- contadores ---------- */
    const precisaAcompanhar = !encerrado && (
      followUpVencido
      || (ESTAGIOS_ATIVOS.has(estagio) && diasContato !== null && diasContato > 3)
    );
    if (precisaAcompanhar) { contadores.acompanhar += 1; sets.acompanhar.add(id); }

    const semInteracaoHumana = diasContato === null;
    const novoProspecto = estagio === 'Novo Lead' && diasCriado !== null && diasCriado <= 7 && semInteracaoHumana;
    if (novoProspecto) { contadores.novosProspectos += 1; sets.novosProspectos.add(id); }

    const propostaParada = propostaAberta
      && (() => {
        const d = diasDesde(propostaAberta._mov, hoje);
        return d === null || d > 4;
      })();

    const negociacaoParada = !encerrado
      && ((emNegociacao && diasEtapa !== null && diasEtapa > 5) || propostaParada);
    if (negociacaoParada) { contadores.negociacoesParadas += 1; sets.negociacoesParadas.add(id); }

    const fechamento = estagio === 'Fechado' ? (etapaAlterada || ultimoContato || criado) : null;
    const diasFechado = diasDesde(fechamento, hoje);
    const posVendaPendente = lead?.posVendaStatus === 'pendente'
      ? true
      : estagio === 'Fechado' && diasFechado !== null && diasFechado >= 7 && diasFechado <= 90 && lead?.posVendaStatus !== 'concluida';
    if (posVendaPendente) { contadores.posVendasPendentes += 1; sets.posVendasPendentes.add(id); }

    /* ---------- candidatos a prioridade ---------- */
    const empurrar = (categoria, score, tagUrgencia, fraseAcao, mensagemSugeridaWhatsapp) => {
      prioridades.push({
        id: `${categoria}:${id}`,
        leadId: id,
        nome,
        telefone,
        categoria,
        score,
        tagUrgencia,
        fraseAcao,
        mensagemSugeridaWhatsapp,
        estagio,
        interesse,
      });
    };

    if (visitaRecente && diasDesde(visitaRecente, hoje) === 1) {
      const imovelVisitado = visitasDoLead.find((v) => v._dataVisita === visitaRecente)?.imovel || interesse;
      empurrar(
        'visita',
        95,
        'Visita ontem',
        `Retornar para ${nome}, que visitou ${imovelVisitado} ontem.`,
        `Olá, ${nome.split(' ')[0]}! Aqui é da imobiliária. Como foi a visita de ontem ao ${imovelVisitado}? Separei mais duas opções parecidas para você comparar.`,
      );
    }

    if (propostaParada || (emNegociacao && diasEtapa !== null && diasEtapa > 4)) {
      const valor = propostaAberta ? ` de ${brl(propostaAberta.valorProposta)}` : '';
      empurrar(
        'negociacao',
        90,
        'Negociação parada',
        `Verificar documentação/proposta de ${nome} (${interesse}).`,
        `Olá, ${nome.split(' ')[0]}! Passando para saber se ficou alguma dúvida sobre a proposta${valor}. Consigo adiantar a análise da documentação hoje se você quiser.`,
      );
    }

    if (followUpVencido || (ESTAGIOS_ATIVOS.has(estagio) && diasContato !== null && diasContato > 3 && !novoProspecto)) {
      empurrar(
        'followup',
        85,
        'Retorno vencido',
        `Retomar contato com ${nome} sobre ${interesse}.`,
        `Olá, ${nome.split(' ')[0]}! Retomando nosso contato sobre ${interesse}. Teve novidade ou quer que eu atualize as opções disponíveis?`,
      );
    }

    if (novoProspecto) {
      empurrar(
        'novo',
        80,
        'Primeiro contato',
        `Realizar primeiro contato com ${nome} (novo lead via ${origem}).`,
        `Olá, ${nome.split(' ')[0]}! Recebi seu contato pelo ${origem}. Você procura ${interesse} em qual região e faixa de valor? Já te mando as opções que encaixam.`,
      );
    }

    if (posVendaPendente) {
      empurrar(
        'posvenda',
        60,
        'Pós-venda',
        `Fazer acompanhamento de pós-venda e pedir indicação para ${nome}.`,
        `Olá, ${nome.split(' ')[0]}! Tudo bem na sua nova fase? Se precisar de qualquer coisa do imóvel, me chama. E se souber de alguém procurando, posso ajudar do mesmo jeito.`,
      );
    }

    const inativo = diasContato !== null ? diasContato : diasCriado;
    const temOptOut = lead?.optOut === true || lead?.naoContatar === true;
    if (!encerrado && inativo !== null && inativo > 90 && !temOptOut) {
      empurrar(
        'inativo',
        30,
        'Lead antigo',
        `Solicitar autorização para contato futuro de ${nome} (lead antigo).`,
        `Olá, ${nome.split(' ')[0]}! Faz um tempo que conversamos sobre ${interesse}. Você ainda está procurando? Se preferir que eu não envie mais mensagens, é só me avisar.`,
      );
    }
  }

  // Um lead pode se encaixar em várias regras; a lista mostra a mais urgente
  // e guarda as demais como contexto (sem repetir a mesma pessoa).
  const porLead = new Map();
  for (const item of prioridades) {
    const atual = porLead.get(item.leadId);
    if (!atual) {
      porLead.set(item.leadId, { ...item, categorias: [item.categoria] });
      continue;
    }
    const vencedor = item.score > atual.score ? { ...item } : { ...atual };
    vencedor.categorias = [...new Set([...atual.categorias, item.categoria])];
    porLead.set(item.leadId, vencedor);
  }

  const ranking = [...porLead.values()].sort((a, b) => b.score - a.score);

  return {
    contadores,
    prioridades: ranking.slice(0, 10),
    detalhe: {
      leadsConsiderados: listaLeads.length,
      visitasIndexadas: (visitas || []).length,
      propostasIndexadas: (propostas || []).length,
      tarefasConsideradas: (tarefas || []).length,
      idsPorCategoria: Object.fromEntries(Object.entries(sets).map(([k, set]) => [k, [...set]])),
    },
  };
}
