#!/usr/bin/env node
/**
 * brain-mcp.js — servidor MCP (stdio) do Company Brain.
 * ============================================================================
 * Dá ao agente leitura e escrita diretas na coleção `company_brain` durante a
 * conversa, sem `npm run brain:pull` nem `brain:push`.
 *
 * FERRAMENTAS
 *   brain_listar                 → os 6 documentos (slug, título, quando e por quem)
 *   brain_ler        {slug}      → conteúdo completo em Markdown
 *   brain_buscar     {termo}     → trechos que citam o termo, com arquivo e linha
 *   brain_registrar  {texto, slug?, data?, obsoletar?, substituto?}
 *                                → anexa a decisão no topo (data AAAA-MM-DD) e,
 *                                  se pedido, marca a regra antiga como [OBSOLETO]
 *   brain_obsoletar  {slug, alvo, substituto?}
 *                                → marca uma linha existente como [OBSOLETO]
 *
 * TRANSPORTE
 *   JSON-RPC 2.0 sobre stdio. Aceita newline-delimited (padrão MCP) e
 *   Content-Length (LSP). Log vai para stderr — stdout é só protocolo.
 *
 * CREDENCIAL
 *   Mesmo padrão do sync: FIREBASE_SERVICE_ACCOUNT ou
 *   scripts-locais/service-account.json (gitignored). Nada no código.
 * ============================================================================
 */

import { createInterface } from 'node:readline';

import {
  DOCS,
  SLUGS,
  PROJETO,
  COLECAO,
  anexarSecao,
  buscarConteudo,
  gravarDoc,
  lerDoc,
  listarDocs,
  marcarObsoleto,
  sa,
  tituloDoMarkdown,
} from './lib/brainStore.js';

const VERSAO = '1.0.0';
const log = (...a) => process.stderr.write(`[brain-mcp] ${a.join(' ')}\n`);

const FERRAMENTAS = [
  {
    name: 'brain_listar',
    description: 'Lista os 6 documentos do Company Brain na nuvem (slug, título, atualização e autor).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'brain_ler',
    description: 'Lê o conteúdo completo (Markdown) de um documento do Company Brain.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', enum: SLUGS, description: 'ID do documento' },
      },
      required: ['slug'],
      additionalProperties: false,
    },
  },
  {
    name: 'brain_buscar',
    description: 'Procura um termo nos 6 documentos e devolve os trechos com slug e linha.',
    inputSchema: {
      type: 'object',
      properties: { termo: { type: 'string', minLength: 2 } },
      required: ['termo'],
      additionalProperties: false,
    },
  },
  {
    name: 'brain_registrar',
    description:
      'Registra uma decisão nova no topo do documento (data automática AAAA-MM-DD) e, opcionalmente, marca a regra que ela substitui como [OBSOLETO].',
    inputSchema: {
      type: 'object',
      properties: {
        texto: { type: 'string', minLength: 3, description: 'A decisão, em markdown simples.' },
        slug: { type: 'string', enum: SLUGS, description: 'Destino (padrão 05-decisoes-ativas)' },
        data: { type: 'string', description: 'AAAA-MM-DD (padrão: hoje)' },
        obsoletar: { type: 'string', description: 'Trecho único da regra antiga a aposentar' },
        substituto: { type: 'string', description: 'Como a nova decisão é referenciada' },
      },
      required: ['texto'],
      additionalProperties: false,
    },
  },
  {
    name: 'brain_obsoletar',
    description: 'Marca uma linha existente como [OBSOLETO] e aponta o substituto.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', enum: SLUGS },
        alvo: { type: 'string', minLength: 6, description: 'Trecho único da linha a aposentar' },
        substituto: { type: 'string' },
      },
      required: ['slug', 'alvo'],
      additionalProperties: false,
    },
  },
];

/* -------------------------------- ferramentas ---------------------------- */
async function executar(nome, args = {}) {
  if (!sa) throw new Error('Credencial ausente: FIREBASE_SERVICE_ACCOUNT ou scripts-locais/service-account.json');

  if (nome === 'brain_listar') {
    const docs = await listarDocs();
    const linhas = DOCS.map((d) => {
      const doc = docs.find((x) => x.slug === d.slug);
      if (!doc) return `- ${d.slug} · ${d.titulo} — (ainda não sincronizado)`;
      return `- ${d.slug} · ${doc.titulo} — ${doc.conteudo.length} chars · ${doc.updatedAt || 'sem data'} · por ${doc.updatedBy || '?'}`;
    });
    return `Company Brain (${PROJETO}/${COLECAO})\n${linhas.join('\n')}`;
  }

  if (nome === 'brain_ler') {
    if (!SLUGS.includes(args.slug)) throw new Error(`slug inválido. Use: ${SLUGS.join(', ')}`);
    const doc = await lerDoc(args.slug);
    if (!doc) return `Documento "${args.slug}" não existe na nuvem. Rode brain:push no PC.`;
    return `# ${doc.titulo} (${doc.slug})\n_atualizado: ${doc.updatedAt} por ${doc.updatedBy}_\n\n${doc.conteudo}`;
  }

  if (nome === 'brain_buscar') {
    const docs = await listarDocs();
    const achados = buscarConteudo(docs, args.termo);
    if (!achados.length) return `Nenhuma ocorrência de "${args.termo}".`;
    return achados.map((a) => `${a.slug}:${a.linha} → ${a.texto}`).join('\n');
  }

  if (nome === 'brain_registrar') {
    const slug = args.slug || '05-decisoes-ativas';
    if (!SLUGS.includes(slug)) throw new Error(`slug inválido. Use: ${SLUGS.join(', ')}`);

    const atual = (await lerDoc(slug)) || { titulo: (DOCS.find((d) => d.slug === slug) || {}).titulo, conteudo: '' };
    let conteudo = atual.conteudo || '';
    const avisos = [];

    if (args.obsoletar) {
      const marca = marcarObsoleto(conteudo, args.obsoletar, args.substituto);
      if (marca.ok) {
        conteudo = marca.conteudo;
        avisos.push('regra antiga marcada como [OBSOLETO]');
      } else {
        avisos.push(`não marquei [OBSOLETO]: ${marca.motivo}`);
      }
    }

    conteudo = anexarSecao(conteudo, args.texto, args.data || new Date().toISOString().slice(0, 10), 'agent');
    await gravarDoc(slug, { titulo: atual.titulo || tituloDoMarkdown(conteudo, slug), conteudo, updatedBy: 'pc' });

    return `Salvo em ${slug} (${conteudo.length} chars).${avisos.length ? ' ' + avisos.join('; ') + '.' : ''}\nRode npm run brain:pull no PC para refletir no arquivo local.`;
  }

  if (nome === 'brain_obsoletar') {
    if (!SLUGS.includes(args.slug)) throw new Error(`slug inválido. Use: ${SLUGS.join(', ')}`);
    const doc = await lerDoc(args.slug);
    if (!doc) throw new Error(`documento ${args.slug} não existe`);

    const marca = marcarObsoleto(doc.conteudo, args.alvo, args.substituto);
    if (!marca.ok) return `Nada alterado: ${marca.motivo}.`;

    await gravarDoc(args.slug, { titulo: doc.titulo, conteudo: marca.conteudo, updatedBy: 'pc' });
    return `Marcado em ${args.slug}:\n${marca.linha}`;
  }

  throw new Error(`ferramenta desconhecida: ${nome}`);
}

/* --------------------------------- JSON-RPC ------------------------------ */
function responder(id, result) {
  enviar({ jsonrpc: '2.0', id, result });
}

function erro(id, code, message) {
  enviar({ jsonrpc: '2.0', id, error: { code, message } });
}

function enviar(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

async function tratar(msg) {
  const { id, method, params } = msg || {};

  if (method === 'initialize') {
    return responder(id, {
      protocolVersion: params?.protocolVersion || '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'company-brain', version: VERSAO },
    });
  }

  if (method === 'notifications/initialized' || method === 'initialized') return undefined;

  if (method === 'ping') return responder(id, {});

  if (method === 'tools/list') {
    return responder(id, { tools: FERRAMENTAS });
  }

  if (method === 'tools/call') {
    const nome = params?.name;
    const args = params?.arguments || {};
    try {
      const texto = await executar(nome, args);
      return responder(id, { content: [{ type: 'text', text: String(texto) }] });
    } catch (e) {
      log(`erro em ${nome}: ${e.message}`);
      return responder(id, { content: [{ type: 'text', text: `Erro: ${e.message}` }], isError: true });
    }
  }

  if (method === 'resources/list') return responder(id, { resources: [] });
  if (method === 'prompts/list') return responder(id, { prompts: [] });

  if (id !== undefined) erro(id, -32601, `método não suportado: ${method}`);
  return undefined;
}

/* ---------------------------------- loop --------------------------------- */
let buffer = '';
let pendentes = 0;

/** Executa sem perder a conta: o processo só encerra quando nada está em voo. */
function despachar(payload) {
  pendentes += 1;
  Promise.resolve()
    .then(() => tratar(payload))
    .catch((e) => log(`falha ao tratar mensagem: ${e.message}`))
    .finally(() => {
      pendentes -= 1;
    });
}

function consumir(texto) {
  buffer += texto;

  // framing LSP (Content-Length)
  while (true) {
    const m = buffer.match(/^Content-Length:\s*(\d+)\r?\n\r?\n/i);
    if (!m) break;
    const tamanho = Number(m[1]);
    const inicio = m[0].length;
    if (buffer.length < inicio + tamanho) return;
    const corpo = buffer.slice(inicio, inicio + tamanho);
    buffer = buffer.slice(inicio + tamanho);
    try {
      despachar(JSON.parse(corpo));
    } catch (e) {
      log(`JSON inválido: ${e.message}`);
    }
  }

  // framing newline-delimited (MCP)
  let idx;
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const linha = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!linha || linha.startsWith('Content-Length')) continue;
    try {
      despachar(JSON.parse(linha));
    } catch (e) {
      log(`JSON inválido: ${e.message}`);
    }
  }
}

const rl = createInterface({ input: process.stdin });
rl.on('line', (linha) => consumir(`${linha}\n`));
rl.on('close', () => {
  const encerrar = () => {
    if (pendentes > 0) return setTimeout(encerrar, 50);
    log('stdin fechado, encerrando');
    process.exit(0);
  };
  encerrar();
});

process.on('uncaughtException', (e) => log(`uncaught: ${e.message}`));
process.on('unhandledRejection', (e) => log(`unhandled: ${e?.message || e}`));

log(`iniciado (${VERSAO}) · projeto ${PROJETO} · credencial ${sa ? 'ok' : 'AUSENTE'}`);
