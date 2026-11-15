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
  // Abrir o wa.me NAO significa que a mensagem saiu: e apenas uma tentativa.
  // Nao move ultimoContatoEm e nao tira o lead da fila.
  WHATSAPP_ABERTO: 'whatsapp_aberto',
  // Contato confirmado pelo corretor depois da conversa.
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

/**
 * Quais campos do lead um evento altera. Puro e exportado para teste:
 * whatsapp_aberto NAO altera nada no lead.
 */
export function efeitosDoEvento(tipo, { proximoFollowUpEm = null } = {}) {
  const patch = {};
  if (TIPOS_INTERACAO.has(tipo)) patch.ultimoContatoEm = true;
  if (tipo === TIPOS_EVENTO.MUDANCA_ETAPA) patch.etapaAlteradaEm = true;
  if (tipo === TIPOS_EVENTO.POS_VENDA) patch.posVendaStatus = 'concluida';
  if (proximoFollowUpEm) patch.proximoFollowUpEm = true;
  return patch;
}

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

/** Nome comparável: sem acento, minúsculo, espaços colapsados. */
export function normalizarNome(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

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
 * Grava o evento e, quando há lead, atualiza o documento NA MESMA transação
 * (writeBatch). Evento sem atualização de lead ou vice-versa seria histórico
 * inconsistente — e é isso que o writeBatch impede.
 *
 * Idempotência: quem chama pode passar `chaveIdempotencia`; o documento recebe
 * esse id fixo, então duplo clique / re-render não cria evento repetido.
 *
 * NUNCA engole erro: devolve { ok, id, error } e loga com console.error.
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
  chaveIdempotencia = null,
} = {}) {
  if (!db || !oficinaId) {
    const error = 'registrarEventoLead: oficinaId ausente';
    console.error(error);
    return { ok: false, id: null, error };
  }
  if (!tipo) {
    const error = 'registrarEventoLead: tipo ausente';
    console.error(error);
    return { ok: false, id: null, error };
  }

  const telefoneNorm = normalizarTelefone(telefone);

  try {
    const { writeBatch, doc: docRef, collection: colRef } = await import('firebase/firestore');
    const batch = writeBatch(db);

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

    const colecao = colRef(db, 'oficinas', oficinaId, 'eventos_lead');
    const refEvento = chaveIdempotencia
      ? docRef(colecao, String(chaveIdempotencia))
      : docRef(colecao);
    batch.set(refEvento, evento);

    const patch = efeitosDoEvento(tipo, { proximoFollowUpEm });
    if (leadId && Object.keys(patch).length > 0) {
      const valores = {};
      for (const chave of Object.keys(patch)) {
        if (chave === 'posVendaStatus') valores[chave] = patch[chave];
        else if (chave === 'proximoFollowUpEm') valores[chave] = proximoFollowUpEm;
        else valores[chave] = serverTimestamp();
      }
      batch.update(docRef(db, 'oficinas', oficinaId, 'leads_imobi', leadId), valores);
    }

    await batch.commit();
    return { ok: true, id: refEvento.id, error: null };
  } catch (erro) {
    const mensagem = erro?.message || String(erro);
    console.error('registrarEventoLead falhou:', mensagem, { oficinaId, leadId, tipo });
    return { ok: false, id: null, error: mensagem };
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
  const filtro = corretorFiltro && typeof corretorFiltro === 'object'
    ? { uid: corretorFiltro.uid || null, nome: normalizarNome(corretorFiltro.nome) }
    : { uid: null, nome: normalizarNome(corretorFiltro) };

  const filtrados = (Array.isArray(leads) ? leads : []).filter((l) => {
    if (!filtro.uid && !filtro.nome) return true;
    // 1) vínculo forte por uid (leads novos)
    if (filtro.uid && (l?.corretorUid === filtro.uid || l?.corretorId === filtro.uid)) return true;
    // 2) retrocompatível: nome do responsável (leads antigos, sem uid)
    const dono = normalizarNome(l?.corretorResponsavel || l?.corretor || '');
    return Boolean(filtro.nome) && dono === filtro.nome;
  });

  // Telefone duplicado gera histórico duplicado: mantém o cadastro mais
  // recente e ignora o clone, contando a ocorrência no detalhe.
  const porTelefone = new Map();
  const semTelefone = [];
  const descartadosPorTelefone = [];
  for (const l of filtrados) {
    const tel = normalizarTelefone(l?.telefone);
    if (!tel) { semTelefone.push(l); continue; }
    const atual = porTelefone.get(tel);
    if (!atual) { porTelefone.set(tel, l); continue; }
    const dataAtual = primeiroValido(atual.criadoEm, atual.data_registro);
    const dataNova = primeiroValido(l.criadoEm, l.data_registro);
    const manterNovo = (dataNova?.getTime() || 0) > (dataAtual?.getTime() || 0);
    if (manterNovo) {
      descartadosPorTelefone.push(atual?.id || atual?.leadId);
      porTelefone.set(tel, l);
    } else {
      descartadosPorTelefone.push(l?.id || l?.leadId);
    }
  }
  const listaLeads = [...porTelefone.values(), ...semTelefone];

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
    // A janela de 7 a 90 dias vale para os dois casos (flag explicita ou
    // estagio Fechado): fechou hoje nao e pos-venda pendente.
    const dentroJanelaPosVenda = diasFechado !== null && diasFechado >= 7 && diasFechado <= 90;
    const posVendaPendente = (estagio === 'Fechado' || lead?.posVendaStatus === 'pendente')
      && dentroJanelaPosVenda
      && lead?.posVendaStatus !== 'concluida';
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
      leadsDescartadosPorTelefoneDuplicado: descartadosPorTelefone.filter(Boolean),
    },
  };
}
