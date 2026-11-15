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

/* ───────────────── 2. identidade do corretor ───────────────── */

/**
 * Decide se o lead pertence ao corretor logado.
 *
 * Ordem (para no primeiro identificador encontrado no lead):
 *   1. corretorId  === uid
 *   2. corretorUid === uid
 *   3. corretorResponsavel === uid   (quando já foi gravado como uid)
 *   4. corretorEquipeId / equipeId === id do documento em oficinas/{id}/equipe
 *   5. legado sem identificador: nome ou e-mail normalizados
 *
 * Regra de segurança: se o lead TEM identificador e ele não bate, o lead é de
 * outro corretor — nomes iguais não podem promover o lead para a minha visão.
 */
export function pertenceAoCorretor(lead = {}, usuarioAtual = {}) {
  if (!usuarioAtual) return true;
  const uid = usuarioAtual.uid || null;
  const equipeId = usuarioAtual.equipeId || usuarioAtual.idEquipe || null;
  const nome = normalizarNome(usuarioAtual.nome);
  const email = normalizarNome(usuarioAtual.email);

  const idDoLead = lead.corretorId || lead.corretorUid || null;
  const donoTexto = lead.corretorResponsavel || lead.corretor || '';

  // 1-3: identificadores fortes
  if (uid) {
    if (lead.corretorId && lead.corretorId === uid) return true;
    if (lead.corretorUid && lead.corretorUid === uid) return true;
    if (lead.corretorResponsavel && lead.corretorResponsavel === uid) return true;
  }

  // 4: vínculo pelo documento da equipe
  const equipeDoLead = lead.corretorEquipeId || lead.equipeId || null;
  if (equipeDoLead) {
    if (!equipeId) return false;             // lead tem vínculo forte e eu não tenho: não é meu
    return equipeDoLead === equipeId;
  }

  // Existe identificador forte no lead (uid) e não bateu: não é meu.
  if (idDoLead && uid && idDoLead !== uid) return false;

  // 5: legado — sem nenhum identificador, cai para nome/e-mail normalizados.
  const donoNormalizado = normalizarNome(donoTexto);
  if (!donoNormalizado) return false;
  if (nome && donoNormalizado === nome) return true;
  if (email && donoNormalizado === email) return true;
  return false;
}

/* ───────────────── 3. roda de prospecção (pura) ───────────────── */

function indexarPorChave(itens = [], obterLeadId, obterTelefone, obterData) {
  const porLead = new Map();
  const porTelefone = new Map();
  for (const item of itens) {
    const chave = obterLeadId(item);
    const tel = obterTelefone(item);
    const data = obterData(item);
    const registro = { ...item, _data: data, _telefone: tel };
    if (chave) {
      if (!porLead.has(chave)) porLead.set(chave, []);
      porLead.get(chave).push(registro);
    }
    if (tel) {
      if (!porTelefone.has(tel)) porTelefone.set(tel, []);
      porTelefone.get(tel).push(registro);
    }
  }
  for (const lista of [...porLead.values(), ...porTelefone.values()]) {
    lista.sort((a, b) => (b._data?.getTime() || 0) - (a._data?.getTime() || 0));
  }
  return { porLead, porTelefone };
}

const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/** Hierarquia de categoria principal: a primeira que bater vence. */
export const HIERARQUIA_CATEGORIAS = ['negociacoesParadas', 'acompanhar', 'novosProspectos', 'posVendasPendentes'];

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
  const usuarioAtual = corretorFiltro && typeof corretorFiltro === 'object'
    ? corretorFiltro
    : (corretorFiltro ? { nome: corretorFiltro } : null);

  const filtrados = (Array.isArray(leads) ? leads : [])
    .filter((l) => (usuarioAtual ? pertenceAoCorretor(l, usuarioAtual) : true));

  // Identidade por lead: NUNCA mesclar cadastros. O telefone só serve como
  // ponte quando existe exatamente um lead ATIVO com aquele número.
  const leadsPorTelefone = new Map();
  for (const l of filtrados) {
    const tel = normalizarTelefone(l?.telefone);
    if (!tel) continue;
    if (!leadsPorTelefone.has(tel)) leadsPorTelefone.set(tel, []);
    leadsPorTelefone.get(tel).push(l);
  }

  const idxVisitas = indexarPorChave(
    visitas,
    (v) => v?.leadId || null,
    (v) => normalizarTelefone(v?.telefone),
    (v) => primeiroValido(v?.dataVisita, v?.criadoEm, v?.data, v?.dataHora),
  );
  const idxPropostas = indexarPorChave(
    propostas,
    (p) => p?.leadId || null,
    (p) => normalizarTelefone(p?.telefone),
    (p) => primeiroValido(p?.ultimaMovimentacaoEm, p?.criadoEm, p?.dataRegistro),
  );

  const contadores = { acompanhar: 0, novosProspectos: 0, negociacoesParadas: 0, posVendasPendentes: 0 };
  const idsPorCategoria = { acompanhar: [], novosProspectos: [], negociacoesParadas: [], posVendasPendentes: [] };
  const prioridades = [];
  const vinculosAmbiguos = [];

  for (const lead of filtrados) {
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

    // ── vínculo visita/proposta ────────────────────────────────────────────
    // leadId manda. Telefone só entra quando o registro não tem leadId E há
    // um único lead ativo com aquele número.
    const telefoneEhInequivoco = telefone && (leadsPorTelefone.get(telefone) || []).length === 1;

    const visitasSemLead = telefoneEhInequivoco ? (idxVisitas.porTelefone.get(telefone) || []) : [];
    const propostasSemLead = telefoneEhInequivoco ? (idxPropostas.porTelefone.get(telefone) || []) : [];

    if (telefone && !telefoneEhInequivoco) {
      const orfas = (idxVisitas.porTelefone.get(telefone) || []).filter((v) => !v.leadId).length
        + (idxPropostas.porTelefone.get(telefone) || []).filter((p) => !p.leadId).length;
      if (orfas > 0) {
        vinculosAmbiguos.push({
          telefone,
          leadId: id,
          registros: orfas,
          motivo: 'telefone compartilhado por mais de um lead ativo',
        });
      }
    }

    const visitasDoLead = [
      ...(idxVisitas.porLead.get(id) || []),
      ...visitasSemLead.filter((v) => !v.leadId),
    ];
    const propostasDoLead = [
      ...(idxPropostas.porLead.get(id) || []),
      ...propostasSemLead.filter((p) => !p.leadId),
    ];

    const diasCriado = diasDesde(criado, hoje);
    const diasContato = diasDesde(ultimoContato, hoje);
    const diasEtapa = diasDesde(etapaAlterada, hoje);
    const followUpVencido = proximoFollowUp ? proximoFollowUp.getTime() <= hoje.getTime() : false;
    const encerrado = ESTAGIOS_ENCERRADOS.has(estagio);
    const emNegociacao = ESTAGIOS_NEGOCIACAO.includes(estagio);

    const visitaRecente = visitasDoLead
      .map((v) => v._data)
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;

    const propostaAberta = propostasDoLead.find((p) => {
      const st = String(p?.status || '').toLowerCase();
      return !['fechada', 'aceita', 'recusada', 'cancelada', 'perdida'].includes(st);
    }) || null;

    const propostaParada = propostaAberta
      && (() => {
        const d = diasDesde(propostaAberta._data, hoje);
        return d === null || d > 4;
      })();

    /* ── flags ── */
    const semInteracaoHumana = diasContato === null;
    const acompanhar = !encerrado && (
      followUpVencido
      || (ESTAGIOS_ATIVOS.has(estagio) && diasContato !== null && diasContato > 3)
    );
    const novoProspecto = estagio === 'Novo Lead' && diasCriado !== null && diasCriado <= 7 && semInteracaoHumana;
    const negociacaoParada = !encerrado
      && ((emNegociacao && diasEtapa !== null && diasEtapa > 5) || propostaParada);

    const fechamento = estagio === 'Fechado' ? (etapaAlterada || ultimoContato || criado) : null;
    const diasFechado = diasDesde(fechamento, hoje);
    const dentroJanelaPosVenda = diasFechado !== null && diasFechado >= 7 && diasFechado <= 90;
    const posVendaPendente = (estagio === 'Fechado' || lead?.posVendaStatus === 'pendente')
      && dentroJanelaPosVenda
      && lead?.posVendaStatus !== 'concluida';

    const flags = {
      negociacoesParadas: negociacaoParada,
      acompanhar,
      novosProspectos: novoProspecto,
      posVendasPendentes: posVendaPendente,
    };
    const categoriasDoLead = HIERARQUIA_CATEGORIAS.filter((c) => flags[c]);

    // ── contador EXCLUSIVO: o lead conta em uma única categoria ────────────
    if (categoriasDoLead.length > 0) {
      const principal = categoriasDoLead[0];
      contadores[principal] += 1;
      idsPorCategoria[principal].push(id);
    }

    /* ── candidatos a prioridade (mantém todos os motivos) ───────────────── */
    const empurrar = (categoria, score, tagUrgencia, fraseAcao, mensagemSugeridaWhatsapp) => {
      prioridades.push({
        id: `${categoria}:${id}`,
        leadId: id,
        nome,
        telefone,
        categoria,
        categorias: categoriasDoLead,
        score,
        tagUrgencia,
        fraseAcao,
        mensagemSugeridaWhatsapp,
        estagio,
        interesse,
        vinculoAmbiguo: !telefoneEhInequivoco && (visitasSemLead.length + propostasSemLead.length) === 0 && Boolean(telefone),
      });
    };

    if (visitaRecente && diasDesde(visitaRecente, hoje) === 1) {
      const imovelVisitado = visitasDoLead.find((v) => v._data === visitaRecente)?.imovel || interesse;
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

    if (acompanhar) {
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

  // Um lead pode ter vários motivos; a lista mostra o mais urgente.
  const porLead = new Map();
  for (const item of prioridades) {
    const atual = porLead.get(item.leadId);
    if (!atual) { porLead.set(item.leadId, { ...item, motivos: [item.categoria] }); continue; }
    const vencedor = item.score > atual.score ? { ...item, ...(atual.motivos ? { motivos: atual.motivos } : {}) } : { ...atual };
    vencedor.categorias = [...new Set([...atual.categorias, ...item.categorias])];
    vencedor.motivos = [...new Set([...(atual.motivos || [atual.categoria]), item.categoria, ...(item.motivos || [])])];
    porLead.set(item.leadId, vencedor);
  }

  const ranking = [...porLead.values()].sort((a, b) => b.score - a.score);

  return {
    contadores,
    prioridades: ranking.slice(0, 10),
    detalhe: {
      leadsConsiderados: filtrados.length,
      somaContadores: Object.values(contadores).reduce((a, b) => a + b, 0),
      visitasIndexadas: (visitas || []).length,
      propostasIndexadas: (propostas || []).length,
      tarefasConsideradas: (tarefas || []).length,
      idsPorCategoria,
      vinculosAmbiguos,
    },
  };
}
