/**
 * src/lib/simuladorSofia.js — chamada real da Sofia no simulador do painel.
 * ============================================================================
 * Substitui o simulador de regex do `AdminNovo.jsx`, que inventava taxas de
 * juros e fichas fictícias. Aqui nada é inventado:
 *
 *   1. o catálogo vem de `oficinas/{id}/imoveis_imobi` (estado `listaImoveis`),
 *      JÁ filtrado por disponibilidade: vendido, alugado/locado, inativo e
 *      afins nunca são oferecidos ao cliente (`filtrarCatalogoDisponivel`);
 *   2. o prompt/payload é o mesmo do WhatsApp (`src/agent/sofiaPrompt.js`,
 *      D-21.06) em `modo: 'simulacao'`;
 *   3. quem responde é o proxy `/api/ai` — a chave nunca passa pelo navegador;
 *   4. devolvemos apenas o `text` limpo (sem o bloco `[GATILHO_HERMES: ...]`) e,
 *      quando existe, o handoff para a badge discreta do painel (D-21.07).
 *
 * Sem catálogo a função NÃO chama a IA: devolve `catalogo_vazio` para a tela
 * pedir o primeiro cadastro em vez de a Sofia inventar imóvel.
 *
 * Os cabeçalhos (Bearer do Firebase) são injetados pelo chamador
 * (`cabecalhosIA()` de `src/lib/aiAuth.js`), para este módulo continuar testável
 * em Node sem carregar o SDK do Firebase.
 * ============================================================================
 */

import { linhaSegura, montarCorpoSofia, separarGatilho } from '../agent/sofiaPrompt.js';

/**
 * Retorna o período do dia ('Bom dia', 'Boa tarde' ou 'Boa noite')
 * no fuso horário oficial de Brasília (America/Sao_Paulo) com hourCycle h23.
 *
 * @param {Date} [data=new Date()]
 * @returns {'Bom dia' | 'Boa tarde' | 'Boa noite'}
 */
export function getPeriodoDiaBrasilia(data = new Date()) {
  const d = data instanceof Date && !Number.isNaN(data.getTime()) ? data : new Date();
  const horaStr = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: 'numeric',
    hourCycle: 'h23',
  }).format(d);

  const horaBr = parseInt(horaStr, 10);

  if (horaBr >= 5 && horaBr < 12) return 'Bom dia';
  if (horaBr >= 12 && horaBr < 18) return 'Boa tarde';
  return 'Boa noite';
}

export const AVISO_CATALOGO_VAZIO =
  'Nenhum imóvel cadastrado ainda. Cadastre o primeiro imóvel em Captação & Imóveis para a Pólen responder com o catálogo real.';

export const AVISO_SEM_DISPONIVEIS =
  'Todos os imóveis do catálogo estão marcados como vendidos, alugados ou inativos. Reative um imóvel em Captação & Imóveis para a Pólen ter o que oferecer.';

/** 3 perguntas rápidas do simulador da Pólen (1 clique). */
export const ACOES_POLEN = Object.freeze([
  { key: 'visita', rotulo: 'Quero agendar uma visita nesse imóvel', pergunta: 'Quero agendar uma visita nesse imóvel.' },
  { key: 'financiamento', rotulo: 'Tenho interesse, mas preciso financiar', pergunta: 'Tenho interesse, mas preciso financiar' },
  { key: 'condominio', rotulo: 'Qual o valor do condomínio?', pergunta: 'Qual o valor do condomínio e IPTU?' },
]);

/**
 * Status que tira o imóvel da conversa. Comparação sem acento e sem caixa;
 * status ausente (documento legado) continua valendo — o prompt responde
 * "a confirmar" para o que não existe, mas não descarta o imóvel.
 */
export const STATUS_INDISPONIVEIS = [
  'vendido',
  'alugado',
  'locado',
  'inativo',
  'indisponivel',
  'oculto',
  'encerrado',
  'concluido',
  'retirado',
  'suspenso',
  'desativado',
];

function statusNormalizado(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** `true` quando o imóvel pode ser oferecido a um lead. */
export function imovelDisponivel(imovel = {}) {
  const status = statusNormalizado(imovel?.status);
  if (!status) return true;
  return !STATUS_INDISPONIVEIS.includes(status);
}

/** Catálogo do tenant sem os imóveis que já saíram da vitrine. */
export function filtrarCatalogoDisponivel(imoveis = []) {
  const lista = Array.isArray(imoveis) ? imoveis : [];
  return lista.filter((imovel) => imovel && imovelDisponivel(imovel));
}

/** Handoffs que a esteira reconhece hoje (03-mapa-agentes.md, seção 1). */
export const ROTULOS_HANDOFF = {
  CHAMAR_IAGO: 'Handoff → Iago (qualificação)',
  CHAMAR_CORRETOR: 'Handoff → corretor (visita/proposta)',
};

const RE_ACAO = /^[A-Z][A-Z0-9_]{2,39}$/;

/** Normaliza o `gatilho` devolvido pelo proxy (validação espelhada do back). */
export function normalizarGatilho(gatilho) {
  if (!gatilho || typeof gatilho !== 'object') return null;
  const acao = linhaSegura(gatilho.acao, 40).toUpperCase();
  if (!RE_ACAO.test(acao)) return null;
  return { acao, motivo: linhaSegura(gatilho.motivo, 160) };
}

/** Rótulo curto para a badge do painel; `null` quando não é handoff conhecido. */
export function descreverHandoff(gatilho) {
  const normalizado = normalizarGatilho(gatilho);
  if (!normalizado) return null;
  return {
    acao: normalizado.acao,
    motivo: normalizado.motivo,
    rotulo: ROTULOS_HANDOFF[normalizado.acao] || `Gatilho interno: ${normalizado.acao}`,
  };
}

/** Histórico do painel ({autor, texto}) → mensagens do `/api/ai`. */
export function historicoParaMensagens(historico = []) {
  return (Array.isArray(historico) ? historico : [])
    .filter((m) => m && typeof m.texto === 'string' && m.texto.trim())
    .map((m) => ({ role: m.autor === 'cliente' ? 'user' : 'assistant', content: m.texto }));
}

function mensagemDeErroHttp(status, dados) {
  const codigo = dados?.codigo || `http_${status}`;
  if (codigo === 'nao_autorizado') {
    return 'Sessão expirada ou sem permissão: entre novamente no painel para o simulador falar com a IA.';
  }
  if (codigo === 'payload_grande') {
    return 'A conversa ficou grande demais. Reinicie o chat para continuar.';
  }
  const detalhe = linhaSegura(dados?.error || dados?.motivo, 200);
  return `A IA não respondeu (HTTP ${status})${detalhe ? `: ${detalhe}` : '.'}`;
}

/**
 * Uma resposta da Sofia real para o simulador.
 *
 * @param {object} opcoes
 * @param {string} opcoes.mensagem           texto digitado como se fosse o cliente
 * @param {Array}  [opcoes.historico]        [{ autor: 'cliente'|'ia', texto }]
 * @param {Array}  [opcoes.catalogoImoveis]  imóveis reais do tenant
 * @param {string} [opcoes.nomeImobiliaria]
 * @param {string} [opcoes.nomeCorretor]
 * @param {object} [opcoes.cabecalhos]       já com Authorization: Bearer <token>
 * @param {Function} [opcoes.fetchImpl]      injeção para teste
 * @returns {Promise<{ok: true, texto: string, gatilho: null|{acao: string, motivo: string}}
 *                 | {ok: false, codigo: string, erro: string}>}
 */
export async function responderSofiaSimulacao({
  mensagem = '',
  historico = [],
  catalogoImoveis = [],
  nomeImobiliaria,
  nomeCorretor,
  periodoDia,
  cabecalhos = { 'Content-Type': 'application/json' },
  fetchImpl,
} = {}) {
  const texto = String(mensagem || '').trim();
  if (!texto) {
    return { ok: false, codigo: 'mensagem_vazia', erro: 'Escreva uma mensagem como se fosse o cliente.' };
  }

  const cadastrados = (Array.isArray(catalogoImoveis) ? catalogoImoveis : []).filter(Boolean);
  const catalogo = filtrarCatalogoDisponivel(cadastrados);
  if (!catalogo.length) {
    return cadastrados.length
      ? { ok: false, codigo: 'sem_disponiveis', erro: AVISO_SEM_DISPONIVEIS }
      : { ok: false, codigo: 'catalogo_vazio', erro: AVISO_CATALOGO_VAZIO };
  }

  const buscar = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!buscar) {
    return { ok: false, codigo: 'sem_fetch', erro: 'Este navegador não consegue chamar a IA.' };
  }

  const periodo = periodoDia || getPeriodoDiaBrasilia();

  const corpo = montarCorpoSofia({
    historico: [...historicoParaMensagens(historico), { role: 'user', content: texto }],
    catalogoImoveis: catalogo,
    modo: 'simulacao',
    nomeImobiliaria,
    nomeCorretor,
    periodoDia: periodo,
  });

  let resposta;
  try {
    resposta = await buscar('/api/ai', {
      method: 'POST',
      headers: cabecalhos,
      body: JSON.stringify(corpo),
    });
  } catch (erro) {
    return {
      ok: false,
      codigo: 'rede',
      erro: `Não foi possível falar com o servidor de IA (${erro?.message || 'falha de rede'}).`,
    };
  }

  const dados = resposta && typeof resposta.json === 'function' ? await resposta.json().catch(() => null) : null;

  if (!resposta || resposta.ok !== true) {
    return { ok: false, codigo: dados?.codigo || `http_${resposta?.status}`, erro: mensagemDeErroHttp(resposta?.status, dados) };
  }

  const bruto = typeof dados?.text === 'string' ? dados.text : '';
  // O proxy já remove o bloco; o espelho garante que nada vaze se o deploy
  // estiver defasado ou se o texto vier de outro provedor.
  const { texto: limpo, gatilho: gatilhoNoTexto } = separarGatilho(bruto);
  const gatilho = normalizarGatilho(dados?.gatilho) || gatilhoNoTexto;

  if (!limpo) {
    return { ok: false, codigo: 'vazio', erro: 'A IA não devolveu texto nesta tentativa. Reformule a mensagem e tente de novo.' };
  }

  return { ok: true, texto: limpo, gatilho: gatilho || null };
}
