/**
 * planilha.js — leitura de leads de planilha, CSV e texto colado (D-23.16)
 * ============================================================================
 * A planilha do cliente nunca tem o mesmo cabeçalho. Aqui os nomes são
 * reconhecidos por alias (com e sem acento) e cada linha vira um lead com:
 * telefone normalizado, data interpretada, temperatura pela régua e a
 * mensagem de WhatsApp pronta.
 *
 * Regras:
 *   • nome + telefone são o mínimo para entrar no CRM (sem telefone o lead é
 *     listado, mas não é selecionado para gravação);
 *   • telefone repetido na mesma importação (ou já existente na conta) é
 *     marcado como duplicado e desmarcado, nunca descartado em silêncio;
 *   • nada é inventado: campo vazio continua vazio.
 *
 * Só funções puras — usado pelo wizard e pelos testes em Node.
 * ============================================================================
 */

import {
  classificarTemperatura,
  formatarTelefone,
  mensagemPorTemperatura,
  normalizarTelefone,
  parseDataContato,
  parseValorMoeda,
  semAcentos,
} from './temperatura.js';

/** Cabeçalhos reconhecidos. A ordem importa: o primeiro alias tem prioridade. */
export const ALIASES = Object.freeze({
  nome: ['nome', 'nome do cliente', 'nome cliente', 'cliente', 'lead', 'contato', 'name', 'full name', 'razao social'],
  telefone: ['telefone', 'celular', 'whatsapp', 'whats', 'fone', 'tel', 'phone', 'numero', 'numero do celular', 'contato'],
  email: ['email', 'e-mail', 'mail', 'correio eletronico'],
  bairro: ['bairro', 'regiao', 'localidade', 'zona', 'neighborhood', 'distrito'],
  cidade: ['cidade', 'municipio', 'city'],
  interesse: ['interesse', 'imovel de interesse', 'imovel', 'tipo de imovel', 'tipologia', 'produto', 'finalidade', 'segmento', 'pretensao'],
  orcamento: ['orcamento', 'valor', 'faixa de preco', 'faixa', 'valor de interesse', 'valor pretendido', 'preco', 'renda', 'budget'],
  status: ['status', 'estagio', 'etapa', 'situacao', 'fase', 'temperatura', 'prioridade', 'qualificacao'],
  dataContato: ['data do contato', 'data do ultimo contato', 'ultimo contato', 'data ultimo contato', 'data de cadastro', 'data cadastro', 'data', 'cadastro', 'criado em', 'atualizado em', 'updated at'],
  observacoes: ['observacoes', 'observacao', 'obs', 'nota', 'anotacao', 'comentario', 'descricao', 'historico'],
  corretor: ['corretor', 'corretor responsavel', 'responsavel', 'atendente', 'consultor'],
  origem: ['origem', 'fonte', 'canal', 'portal', 'campanha'],
});

/** Quando a planilha chega sem cabeçalho, esta é a ordem assumida. */
export const COLUNAS_PADRAO = Object.freeze({
  nome: 0,
  telefone: 1,
  bairro: 2,
  interesse: 3,
  orcamento: 4,
  status: 5,
  dataContato: 6,
});

/** Cabeçalho → chave comparável (sem acento, sem pontuação). */
export function normalizarCabecalho(valor) {
  return semAcentos(valor).replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Descobre em que índice está cada campo conhecido. */
export function mapearColunas(cabecalhos = []) {
  const colunas = (Array.isArray(cabecalhos) ? cabecalhos : []).map(normalizarCabecalho);
  const mapa = {};

  for (const [campo, aliases] of Object.entries(ALIASES)) {
    const procurados = aliases.map(normalizarCabecalho);
    let indice = colunas.findIndex((coluna) => coluna && procurados.includes(coluna));
    if (indice < 0) {
      indice = colunas.findIndex(
        (coluna) => coluna && procurados.some((alias) => coluna === alias || coluna.startsWith(`${alias} `) || coluna.endsWith(` ${alias}`) || coluna.includes(alias)),
      );
    }
    if (indice >= 0) mapa[campo] = indice;
  }
  // "Contato" costuma guardar o telefone: se nome e telefone caíram na mesma
  // coluna, o telefone ganha (sem nome a linha ainda serve; sem telefone, não).
  if (mapa.nome !== undefined && mapa.nome === mapa.telefone) delete mapa.nome;
  return mapa;
}

/** A primeira linha é cabeçalho quando pelo menos nome/telefone são reconhecidos. */
export function pareceCabecalho(linha) {
  if (!Array.isArray(linha)) return false;
  const mapa = mapearColunas(linha);
  const tem = (campo) => mapa[campo] !== undefined;
  return tem('telefone') || (tem('nome') && (tem('bairro') || tem('interesse') || tem('dataContato')));
}

/** Detecta `;`, `,` ou tabulação pela linha mais "cheia". */
export function detectarDelimitador(texto) {
  const primeira = String(texto || '').split(/\r?\n/).find((linha) => linha.trim()) || '';
  const contagem = {
    ';': (primeira.match(/;/g) || []).length,
    ',': (primeira.match(/,/g) || []).length,
    '\t': (primeira.match(/\t/g) || []).length,
  };
  const vencedor = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0];
  return vencedor && vencedor[1] > 0 ? vencedor[0] : ';';
}

/**
 * CSV com aspas, `""` escapado e quebra de linha dentro do campo.
 * Usado quando a planilha chega como texto colado/arquivo .csv.
 */
export function parseCSV(texto, delimitador = detectarDelimitador(texto)) {
  const linhas = [];
  let linha = [];
  let campo = '';
  let dentroDeAspas = false;
  const entrada = String(texto ?? '').replace(/^\uFEFF/, '');

  for (let i = 0; i < entrada.length; i += 1) {
    const caractere = entrada[i];

    if (dentroDeAspas) {
      if (caractere === '"' && entrada[i + 1] === '"') {
        campo += '"';
        i += 1;
      } else if (caractere === '"') {
        dentroDeAspas = false;
      } else {
        campo += caractere;
      }
      continue;
    }

    if (caractere === '"') {
      dentroDeAspas = true;
    } else if (caractere === delimitador) {
      linha.push(campo);
      campo = '';
    } else if (caractere === '\n') {
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = '';
    } else if (caractere !== '\r') {
      campo += caractere;
    }
  }

  if (campo !== '' || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }

  return linhas.filter((item) => item.some((valor) => String(valor).trim()));
}

/* ------------------------------------------------------------------ */
/* REGISTROS                                                           */
/* ------------------------------------------------------------------ */

const limpar = (valor) => String(valor ?? '').replace(/\s+/g, ' ').trim();

/** Objeto da IA/texto rápido → campos canônicos. */
export function mapearObjeto(objeto = {}) {
  const normalizado = {};
  for (const [chave, valor] of Object.entries(objeto || {})) {
    normalizado[normalizarCabecalho(chave)] = valor;
  }

  const registro = {};
  for (const [campo, aliases] of Object.entries(ALIASES)) {
    for (const alias of aliases) {
      const chave = normalizarCabecalho(alias);
      if (normalizado[chave] !== undefined && normalizado[chave] !== null && normalizado[chave] !== '') {
        registro[campo] = normalizado[chave];
        break;
      }
    }
  }
  // Objeto já chega no formato canônico (texto rápido, saída da IA): o nome do
  // campo vale como alias de si mesmo (ex.: `dataContato`).
  for (const campo of Object.keys(ALIASES)) {
    if (registro[campo] !== undefined) continue;
    const valor = normalizado[normalizarCabecalho(campo)];
    if (valor !== undefined && valor !== null && valor !== '') registro[campo] = valor;
  }
  return registro;
}

function linhaParaRegistro(linha, colunas) {
  const registro = {};
  for (const [campo, indice] of Object.entries(colunas || {})) {
    registro[campo] = linha?.[indice];
  }
  return registro;
}

/**
 * Aceita matriz (com/sem cabeçalho) ou lista de objetos (IA, texto rápido).
 * @returns {{ registros: object[], colunas: object, tinhaCabecalho: boolean }}
 */
export function prepararRegistros(entrada, colunasForcadas = null) {
  if (!Array.isArray(entrada) || entrada.length === 0) {
    return { registros: [], colunas: {}, tinhaCabecalho: false };
  }

  const semVazios = entrada.filter((item) => {
    if (Array.isArray(item)) return item.some((valor) => limpar(valor));
    return item && typeof item === 'object' && Object.values(item).some((valor) => limpar(valor));
  });
  if (semVazios.length === 0) return { registros: [], colunas: {}, tinhaCabecalho: false };

  if (!Array.isArray(semVazios[0])) {
    return { registros: semVazios.map(mapearObjeto), colunas: {}, tinhaCabecalho: true };
  }

  const primeira = semVazios[0];
  const temCabecalho = pareceCabecalho(primeira);
  const colunas = colunasForcadas || (temCabecalho ? mapearColunas(primeira) : COLUNAS_PADRAO);
  const linhas = temCabecalho && !colunasForcadas ? semVazios.slice(1) : semVazios;

  return {
    registros: linhas.map((linha) => linhaParaRegistro(linha, colunas)),
    colunas,
    tinhaCabecalho: temCabecalho,
  };
}

/* ------------------------------------------------------------------ */
/* TEXTO RÁPIDO (Ctrl+V)                                               */
/* ------------------------------------------------------------------ */

const RE_TELEFONE = /(?:\+?55[\s.-]*)?(?:\(?\d{2}\)?[\s.-]*)?9?\d{4}[\s.-]?\d{4}/g;
const RE_DATA = /(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}(?:[,\s]+\d{1,2}:\d{2})?)/;
const RE_STATUS = /(proposta|visita|negocia|novo lead|contato|atendimento|qualificad|fechado|perdido|sem interesse)/i;
const RE_INTERESSE = /(apartamento|casa|terreno|lote|sala|loja|chacara|sitio|fazenda|rural|comercial|kitnet|studio|cobertura|galpao)/i;

function acharTelefone(texto) {
  const candidatos = String(texto || '').match(RE_TELEFONE) || [];
  for (const candidato of candidatos) {
    if (normalizarTelefone(candidato)) return candidato.trim();
  }
  return '';
}

function acharData(texto) {
  const achado = String(texto || '').match(RE_DATA);
  return achado ? achado[1] : '';
}

/**
 * Lista colada do WhatsApp, do bloco de notas ou de um campo de texto livre.
 * Formatos aceitos:
 *   Nome; (34) 99999-8888; Bairro; Apartamento 2 quartos
 *   Nome - 34 99999-8888 - Proposta
 *   [25/11/2026, 10:32] João Silva: quero um apartamento no Santa Mônica
 */
export function parseTextoRapido(texto) {
  const linhas = String(texto ?? '').split(/\r?\n/);
  const registros = [];
  const ignoradas = [];

  for (const original of linhas) {
    const linha = limpar(original);
    if (!linha) continue;

    // Exportação de conversa do WhatsApp: a data do cabeçalho é o contato.
    const conversa = linha.match(
      /^\[?(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})(?:[,\s]+(\d{1,2}:\d{2}))?\]?\s*(?:[-–]\s*)?([^:]{2,70}):/,
    );
    if (conversa) {
      registros.push({
        nome: conversa[3].trim(),
        dataContato: `${conversa[1]}${conversa[2] ? ` ${conversa[2]}` : ''}`,
        observacoes: linha.slice(conversa[0].length).trim(),
      });
      continue;
    }

    const telefone = acharTelefone(linha);
    const dataContato = acharData(linha);
    const semTelefone = limpar(linha.replace(telefone, ' ').replace(/[;,|]|\s+[-–]\s+/g, ';'));
    const partes = semTelefone
      .split(';')
      .map((parte) => limpar(parte.replace(RE_DATA, ' ')).replace(/^[-–\s]+|[-–\s]+$/g, ''))
      .filter(Boolean);

    if (!telefone && !dataContato) {
      // Linha sem contato e sem data não é lead (título, cabeçalho, frase).
      if (linha.length > 3) ignoradas.push(linha.slice(0, 80));
      continue;
    }

    const restantes = partes.slice(1);
    const status = restantes.find((parte) => RE_STATUS.test(parte)) || '';
    const interesse =
      restantes.find((parte) => parte !== status && RE_INTERESSE.test(parte)) || '';
    const bairro = restantes.find((parte) => parte !== status && parte !== interesse) || '';

    registros.push({
      nome: partes[0] || 'Contato WhatsApp',
      telefone,
      bairro,
      interesse,
      status,
      dataContato,
    });
  }

  return { registros, ignoradas };
}

/* ------------------------------------------------------------------ */
/* NORMALIZAÇÃO FINAL                                                  */
/* ------------------------------------------------------------------ */

function somenteDigitosDoNome(nome) {
  return semAcentos(nome).replace(/[^a-z0-9]+/g, '-').slice(0, 24) || 'sem-nome';
}

/**
 * Registros crus → leads prontos para a pré-visualização.
 * @param {Array<Array|object>|{registros: object[]}} entrada
 * @param {{ agora?: Date, nomeImobiliaria?: string, telefonesExistentes?: string[], origemArquivo?: string, colunas?: object }} opcoes
 */
export function normalizarLeads(entrada, opcoes = {}) {
  const {
    agora = new Date(),
    nomeImobiliaria = '',
    telefonesExistentes = [],
    origemArquivo = '',
    colunas: colunasForcadas = null,
  } = opcoes;

  const base = Array.isArray(entrada) ? prepararRegistros(entrada, colunasForcadas) : entrada || {};
  const registros = Array.isArray(base.registros) ? base.registros : [];
  const vistos = new Set(
    (Array.isArray(telefonesExistentes) ? telefonesExistentes : [])
      .map(normalizarTelefone)
      .filter(Boolean),
  );

  const leads = [];
  const avisos = [];
  let duplicados = 0;

  registros.forEach((registro, indice) => {
    const nome = limpar(registro?.nome);
    const telefone = normalizarTelefone(registro?.telefone);
    const statusOriginal = limpar(registro?.status);
    const dataContato = parseDataContato(registro?.dataContato);
    const classificacao = classificarTemperatura({ dataContato, status: statusOriginal }, agora);

    const lead = {
      id: `lead-${indice}-${telefone || somenteDigitosDoNome(nome)}`,
      nome,
      telefone,
      telefoneExibicao: formatarTelefone(registro?.telefone),
      email: limpar(registro?.email),
      bairro: limpar(registro?.bairro),
      cidade: limpar(registro?.cidade),
      interesse: limpar(registro?.interesse),
      orcamento: parseValorMoeda(registro?.orcamento),
      statusOriginal,
      dataContatoISO: dataContato ? dataContato.toISOString() : '',
      temperatura: classificacao.temperatura,
      temperaturaOrigem: classificacao.origem,
      diasSemContato: classificacao.diasSemContato,
      observacoes: limpar(registro?.observacoes),
      corretor: limpar(registro?.corretor),
      origem: limpar(registro?.origem) || origemArquivo,
      selecionado: false,
      valido: true,
      motivo: '',
      duplicado: false,
      mensagem: '',
    };

    if (!telefone && !nome) {
      lead.valido = false;
      lead.motivo = 'sem_nome_telefone';
    } else if (!telefone) {
      lead.valido = false;
      lead.motivo = 'sem_telefone';
    } else if (vistos.has(telefone)) {
      lead.valido = false;
      lead.motivo = 'duplicado';
      lead.duplicado = true;
      duplicados += 1;
    } else {
      vistos.add(telefone);
      lead.selecionado = true;
    }

    lead.mensagem = mensagemPorTemperatura(lead, { nomeImobiliaria });
    leads.push(lead);
  });

  if (leads.length === 0) avisos.push('Nenhum contato encontrado no conteúdo enviado.');
  const semTelefone = leads.filter((lead) => lead.motivo === 'sem_telefone').length;
  if (semTelefone) {
    avisos.push(`${semTelefone} contato(s) sem telefone válido — não entram no CRM enquanto o número não for corrigido.`);
  }
  if (duplicados) {
    avisos.push(`${duplicados} contato(s) repetido(s) foram desmarcados para não duplicar o CRM.`);
  }

  return {
    leads,
    avisos,
    duplicados,
    total: leads.length,
    selecionados: leads.filter((lead) => lead.selecionado).length,
    colunas: base.colunas || {},
    tinhaCabecalho: Boolean(base.tinhaCabecalho),
  };
}
