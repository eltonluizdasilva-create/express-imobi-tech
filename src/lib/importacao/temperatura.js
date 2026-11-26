/**
 * temperatura.js — RÉGUA DE CLASSIFICAÇÃO AUTOMÁTICA DE LEADS (D-23.16)
 * ============================================================================
 * Fonte única da régua usada pela Migração de CRM. Nenhuma tela repete o
 * número 5/10 nem o texto da mensagem: tudo sai daqui.
 *
 *   🔥 Quente  -> últimos 5 dias (0 a 5)          -> prioridade máxima
 *   🌤️ Morno   -> entre 6 e 10 dias               -> acompanhamento rápido
 *   ❄️ Frio    -> mais de 11 dias OU sem data     -> reativação inteligente
 *
 * STATUS EXPLÍCITO MANDA. Se a planilha já traz "Proposta", "Visita" ou
 * "Negociação", o lead entra como Quente mesmo com data antiga — o estágio
 * comercial vale mais que o calendário. "Perdido"/"Sem interesse"/"Inativo"
 * entram como Frio pelo mesmo motivo.
 *
 * Só funções puras: roda em Node (testes) e no navegador.
 * ============================================================================
 */

export const LIMITE_QUENTE_DIAS = 5;
export const LIMITE_MORNO_DIAS = 10;

export const REGUA_TEMPERATURA = Object.freeze([
  Object.freeze({
    id: 'quente',
    emoji: '🔥',
    label: 'Quente',
    janela: '0 a 5 dias',
    prioridade: 1,
    resumo: 'Prioridade máxima no CRM',
    descricao: 'Falar hoje, enquanto o cliente lembra da conversa e da visita.',
    cor: '#f97316',
  }),
  Object.freeze({
    id: 'morno',
    emoji: '🌤️',
    label: 'Morno',
    janela: '6 a 10 dias',
    prioridade: 2,
    resumo: 'Acompanhamento rápido',
    descricao: 'Mensagem curta de retomada nas próximas 48h.',
    cor: '#0284c7',
  }),
  Object.freeze({
    id: 'frio',
    emoji: '❄️',
    label: 'Frio',
    janela: '11+ dias ou sem data',
    prioridade: 3,
    resumo: 'Base de reativação inteligente',
    descricao: 'Entra na fila de reativação com oferta de imóvel compatível.',
    cor: '#64748b',
  }),
]);

export const TEMPERATURAS = Object.freeze(
  REGUA_TEMPERATURA.reduce((acc, item) => ({ ...acc, [item.id]: item }), {}),
);

export const ORDEM_TEMPERATURA = Object.freeze(REGUA_TEMPERATURA.map((item) => item.id));

/** Minúsculas e sem acento — comparar texto de planilha sem depender da grafia. */
export function semAcentos(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Status da planilha → temperatura explícita (ou null quando não é decisivo). */
export function statusParaTemperatura(status) {
  const texto = semAcentos(status);
  if (!texto) return null;

  // Estágio comercial avançado: vale mais que a data do último contato.
  if (/(proposta|negocia|visita|agendad|fechamento|aprovad|contrato|assinad|reserva|documenta)/.test(texto)) {
    return 'quente';
  }
  // Descarte explícito: não faz sentido tratar como prioridade.
  if (/(perdid|sem interesse|descartad|inativ|nao responde|sem contato|arquivad)/.test(texto)) {
    return 'frio';
  }
  return null;
}

/** Data local do início do dia — diferença em dias de calendário, não em horas. */
function inicioDoDia(data) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

/** Dias inteiros entre a data e agora (0 quando é hoje ou data futura). */
export function diasDesde(data, agora = new Date()) {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) return null;
  const referencia = agora instanceof Date ? agora : new Date(agora);
  if (Number.isNaN(referencia.getTime())) return null;
  const diff = inicioDoDia(referencia).getTime() - inicioDoDia(data).getTime();
  if (!Number.isFinite(diff)) return null;
  return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
}

/** Data/hora vinda de planilha: Date, serial Excel, epoch, ISO ou dd/mm/aaaa. */
export function parseDataContato(valor) {
  if (!valor && valor !== 0) return null;
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : valor;
  }
  if (typeof valor === 'number') {
    // Serial do Excel (1900): 1 = 01/01/1900, base real 30/12/1899.
    if (valor > 20000 && valor < 80000) {
      const ms = Math.round(valor * 24 * 60 * 60 * 1000);
      return new Date(Date.UTC(1899, 11, 30) + ms);
    }
    const porEpoch = new Date(valor);
    return Number.isNaN(porEpoch.getTime()) ? null : porEpoch;
  }

  const texto = String(valor).trim();
  if (!texto) return null;

  const br = texto.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2}))?/);
  if (br) {
    const dia = Number(br[1]);
    const mes = Number(br[2]);
    let ano = Number(br[3]);
    if (ano < 100) ano += ano >= 70 ? 1900 : 2000;
    const data = new Date(ano, mes - 1, dia, Number(br[4] || 0), Number(br[5] || 0));
    return Number.isNaN(data.getTime()) ? null : data;
  }

  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const data = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(data.getTime()) ? null : data;
  }

  const fallback = new Date(texto);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Classifica um lead pela régua.
 * @param {{ dataContato?: Date|string|number|null, status?: string }} entrada
 * @returns {{ temperatura: 'quente'|'morno'|'frio', origem: 'status'|'data'|'sem-data', diasSemContato: number|null }}
 */
export function classificarTemperatura(entrada = {}, agora = new Date()) {
  const data = parseDataContato(entrada?.dataContato);
  const dias = diasDesde(data, agora);
  const porStatus = statusParaTemperatura(entrada?.status);

  if (porStatus) {
    return { temperatura: porStatus, origem: 'status', diasSemContato: dias };
  }
  if (dias === null) {
    return { temperatura: 'frio', origem: 'sem-data', diasSemContato: null };
  }
  if (dias <= LIMITE_QUENTE_DIAS) {
    return { temperatura: 'quente', origem: 'data', diasSemContato: dias };
  }
  if (dias <= LIMITE_MORNO_DIAS) {
    return { temperatura: 'morno', origem: 'data', diasSemContato: dias };
  }
  return { temperatura: 'frio', origem: 'data', diasSemContato: dias };
}

/* ------------------------------------------------------------------ */
/* WHATSAPP                                                            */
/* ------------------------------------------------------------------ */

/** Só dígitos. */
export function somenteDigitos(valor) {
  return String(valor ?? '').replace(/\D+/g, '');
}

/**
 * Telefone brasileiro pronto para o wa.me: `55` + DDD + número (10 ou 11
 * dígitos). Devolve '' quando não há número utilizável.
 */
export function normalizarTelefone(valor) {
  let digitos = somenteDigitos(valor);
  if (!digitos) return '';
  digitos = digitos.replace(/^0+/, '');
  if (digitos.length > 11 && digitos.startsWith('55')) digitos = digitos.slice(2);
  if (digitos.length !== 10 && digitos.length !== 11) return '';
  return `55${digitos}`;
}

/** `(34) 99999-8888` para exibir na pré-visualização. */
export function formatarTelefone(valor) {
  const digitos = normalizarTelefone(valor);
  if (!digitos) return String(valor ?? '').trim();
  const ddd = digitos.slice(2, 4);
  const numero = digitos.slice(4);
  if (numero.length === 9) return `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`;
  return `(${ddd}) ${numero.slice(0, 4)}-${numero.slice(4)}`;
}

/** Link do WhatsApp com a mensagem já codificada ('' quando sem telefone). */
export function linkWhatsApp(telefone, mensagem = '') {
  const numero = normalizarTelefone(telefone);
  if (!numero) return '';
  const texto = String(mensagem || '').trim();
  return `https://wa.me/${numero}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
}

function primeiroNome(nome) {
  const limpo = String(nome || '').trim().replace(/\s+/g, ' ');
  if (!limpo) return '';
  return limpo.split(' ')[0];
}

function trechoInteresse(lead) {
  const interesse = String(lead?.interesse || '').trim();
  const bairro = String(lead?.bairro || '').trim();
  if (interesse && bairro) return ` em ${bairro}`;
  if (bairro) return ` na região de ${bairro}`;
  if (interesse) return ` por ${interesse}`;
  return '';
}

/**
 * Sugestão de mensagem de WhatsApp conforme a temperatura.
 * Curta de propósito: o corretor lê, ajusta e envia.
 */
export function mensagemPorTemperatura(lead = {}, opcoes = {}) {
  const nome = primeiroNome(lead.nome);
  const imobiliaria = String(opcoes.nomeImobiliaria || '').trim();
  const assinatura = imobiliaria ? ` — ${imobiliaria}` : '';
  const saudacao = nome ? `Oi ${nome}!` : 'Oi!';
  const alvo = trechoInteresse(lead);
  const dias = Number.isFinite(lead.diasSemContato) ? lead.diasSemContato : null;

  if (lead.temperatura === 'quente') {
    return `${saudacao} Aqui é da equipe${assinatura}. Você demonstrou interesse${alvo} e eu separei as opções que mais combinam com o seu perfil. Posso te mandar as fotos e os valores agora?`;
  }
  if (lead.temperatura === 'morno') {
    const quando = dias === null ? 'há alguns dias' : `há ${dias} dias`;
    return `${saudacao} Falamos ${quando} sobre o seu interesse${alvo}. Apareceram opções novas dentro do que você procura — quer que eu atualize as fotos e os valores?${assinatura}`;
  }
  return `${saudacao} Retomando os contatos que buscaram imóvel${alvo}. O mercado mudou e tenho opções novas com preço melhor. Você ainda está procurando? Me diga o que não pode faltar que eu filtro para você.${assinatura}`;
}

/** Sugestão já com o lead classificado (usada na pré-visualização). */
export function sugestaoDeMensagem(lead = {}, opcoes = {}) {
  const temperatura = lead.temperatura || classificarTemperatura(lead).temperatura;
  return mensagemPorTemperatura({ ...lead, temperatura }, opcoes);
}

/* ------------------------------------------------------------------ */
/* DINHEIRO                                                            */
/* ------------------------------------------------------------------ */

/** "R$ 350.000,00" | "350000" | "350.000" -> 350000 (Number) ou 0. */
export function parseValorMoeda(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  const texto = String(valor ?? '').replace(/[^\d,.-]/g, '').trim();
  if (!texto) return 0;

  const temVirgula = texto.includes(',');
  const normalizado = temVirgula
    ? texto.replace(/\./g, '').replace(',', '.')
    : texto.replace(/\.(?=\d{3}(\D|$))/g, '');
  const numero = Number.parseFloat(normalizado);
  return Number.isFinite(numero) ? numero : 0;
}
