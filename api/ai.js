/**
 * api/ai.js — proxy serverless das APIs de IA
 * ============================================================================
 * O navegador nunca vê chave de provedor. Ele chama POST /api/ai e esta função
 * fala com DeepSeek, Groq, Gemini, Zhipu e SiliconFlow usando `process.env.*`.
 *
 * CONTRATO
 *   POST /api/ai  { provider, prompt?, messages?, systemPrompt?, temperature?,
 *                   maxTokens?, model?, images? }  →  200 { text, provider, model }
 *                   images: array de data URLs (data:image/jpeg;base64,...),
 *                   até 3, usadas como inline_data no Gemini. Em provedores
 *                   OpenAI-compatíveis são ignoradas (campo `avisos`).
 *   GET  /api/ai?provider=deepseek          →  diagnóstico (não gasta tokens
 *                                              além de 1 chamada mínima)
 *
 * ERROS (sempre com o motivo real, não mascarado)
 *   { error, provider, status, model, detail, hint, tentativas }
 *
 * VARIÁVEIS (Vercel → Settings → Environment Variables, sem prefixo VITE_)
 *   DEEPSEEK_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, ZHIPU_API_KEY,
 *   SILICONFLOW_API_KEY
 * ============================================================================
 */

const PROVEDORES = {
  deepseek: {
    tipo: 'openai',
    url: 'https://api.deepseek.com/chat/completions',
    env: 'DEEPSEEK_API_KEY',
    // deepseek-chat = V3; deepseek-reasoner = R1
    cadeia: ['deepseek-chat', 'deepseek-reasoner'],
  },
  groq: {
    tipo: 'openai',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    env: 'GROQ_API_KEY',
    // A Groq aposentou a familia llama-3.x/llama-4: a chave do projeto so tem
    // acesso a estes. Confirmado em GET /openai/v1/models (nov/2026).
    cadeia: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'],
  },
  gemini: {
    tipo: 'gemini',
    env: 'GEMINI_API_KEY',
    // Verificado em GET /v1beta/models + chamada real (nov/2026):
    //   3.5-flash-lite e 3.1-flash-lite  -> 200
    //   3.8-flash / 3.5-flash / 3.6-flash -> 503 "high demand" (capacidade)
    //   2.0-flash-lite (desligado 01/06/2026) e 2.5-flash-lite (fechado para
    //   novas contas) -> 404
    // Ordem: primeiro os que respondem, o modelo melhor por último.
    cadeia: ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'],
  },
  zhipu: {
    tipo: 'openai',
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    env: 'ZHIPU_API_KEY',
    cadeia: ['glm-4-flash', 'glm-4.5-flash', 'glm-4-plus'],
  },
  siliconflow: {
    tipo: 'openai',
    url: 'https://api.siliconflow.cn/v1/chat/completions',
    env: 'SILICONFLOW_API_KEY',
    cadeia: ['Qwen/Qwen2.5-7B-Instruct', 'Qwen/Qwen2.5-72B-Instruct', 'deepseek-ai/DeepSeek-V3'],
  },
};

const LIMITE_PROMPT = 20000;
const LIMITE_MENSAGENS = 40;
const TIMEOUT_MS = 30000;
const MAX_TENTATIVAS = 3;

/* ---------------------------- rate limit best-effort --------------------- */
const janelas = new Map();
const JANELA_MS = 60000;
const MAX_POR_JANELA = 30;

function excedeuLimite(ip) {
  const agora = Date.now();
  const janela = janelas.get(ip);
  if (!janela || agora - janela.inicio > JANELA_MS) {
    janelas.set(ip, { inicio: agora, total: 1 });
    return false;
  }
  janela.total += 1;
  return janela.total > MAX_POR_JANELA;
}

/* --------------------------------- helpers ------------------------------- */

/** Limpa a env: espaço, quebras de linha, aspas e prefixo "Bearer " colados. */
function lerChave(nomeEnv) {
  const bruto = process.env[nomeEnv];
  if (!bruto) return { presente: false, valor: '' };
  let valor = String(bruto).trim();
  if (/^bearer\s+/i.test(valor)) valor = valor.replace(/^bearer\s+/i, '');
  valor = valor.replace(/^["']|["']$/g, '').trim();
  return { presente: valor.length > 0, valor };
}

const LIMITE_IMAGENS = 3;
const MAX_BASE64_POR_IMAGEM = 3 * 1024 * 1024; // ~3 MB de base64 (~2,2 MB de imagem)

/**
 * Converte ["data:image/jpeg;base64,AAAA"] em [{ mimeType, data }].
 * Entradas inválidas ou grandes demais são descartadas silenciosamente.
 */
function normalizarImagens(bruto) {
  if (!Array.isArray(bruto)) return [];
  const saida = [];
  for (const item of bruto.slice(0, LIMITE_IMAGENS)) {
    const texto = String(item || '');
    const casou = texto.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
    if (!casou) continue;
    const dados = casou[2].replace(/\s+/g, '');
    if (!dados.length || dados.length > MAX_BASE64_POR_IMAGEM) continue;
    saida.push({ mimeType: casou[1].toLowerCase(), data: dados });
  }
  return saida;
}

function normalizarMensagens(corpo) {
  const lista = [];

  if (typeof corpo.systemPrompt === 'string' && corpo.systemPrompt.trim()) {
    lista.push({ role: 'system', content: corpo.systemPrompt.slice(0, LIMITE_PROMPT) });
  }

  if (Array.isArray(corpo.messages)) {
    corpo.messages.slice(0, LIMITE_MENSAGENS).forEach((m) => {
      if (!m || typeof m.content !== 'string') return;
      const role = ['system', 'assistant', 'user'].includes(m.role) ? m.role : 'user';
      lista.push({ role, content: m.content.slice(0, LIMITE_PROMPT) });
    });
  }

  if (typeof corpo.prompt === 'string' && corpo.prompt.trim()) {
    lista.push({ role: 'user', content: corpo.prompt.slice(0, LIMITE_PROMPT) });
  }

  return lista;
}

function montarRequisicao(nome, provedor, modelo, mensagens, temperatura, maxTokens, chave, imagens = []) {
  if (provedor.tipo === 'gemini') {
    const sistema = mensagens.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
    const conversa = mensagens
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

    // Multimodal: as imagens entram no ÚLTIMO turno do usuário, no formato
    // inline_data do Gemini (v1beta aceita inline_data/inlineData).
    if (imagens.length && conversa.length) {
      let alvo = -1;
      for (let i = conversa.length - 1; i >= 0; i -= 1) {
        if (conversa[i].role === 'user') { alvo = i; break; }
      }
      if (alvo >= 0) {
        for (const img of imagens) {
          conversa[alvo].parts.push({
            inline_data: { mime_type: img.mimeType, data: img.data },
          });
        }
      }
    }

    const corpo = {
      contents: conversa,
      generationConfig: {
        temperature: temperatura,
        ...(maxTokens ? { maxOutputTokens: maxTokens } : {}),
      },
      ...(sistema ? { systemInstruction: { parts: [{ text: sistema }] } } : {}),
    };

    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
        body: JSON.stringify(corpo),
      },
    };
  }

  const corpo = {
    model: modelo,
    messages: mensagens,
    temperature: temperatura,
    ...(maxTokens ? { max_tokens: maxTokens } : {}),
  };

  return {
    url: provedor.url,
    init: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${chave}`,
      },
      body: JSON.stringify(corpo),
    },
  };
}

function extrairTexto(tipo, bruto) {
  let dados;
  try {
    dados = JSON.parse(bruto);
  } catch {
    return '';
  }

  if (tipo === 'gemini') {
    const partes = dados?.candidates?.[0]?.content?.parts;
    if (Array.isArray(partes)) return partes.map((p) => p?.text || '').join('').trim();
    return '';
  }

  return (dados?.choices?.[0]?.message?.content || '').trim();
}

/** Extrai a mensagem real do provedor (OpenAI-style e Gemini-style). */
function mensagemDoProvedor(bruto) {
  try {
    const d = JSON.parse(bruto);
    return (
      d?.error?.message ||
      (Array.isArray(d) ? d[0]?.error?.message : null) ||
      d?.message ||
      JSON.stringify(d).slice(0, 300)
    );
  } catch {
    return String(bruto || '').slice(0, 300);
  }
}

function dicaPara(status, mensagem) {
  const m = String(mensagem || '').toLowerCase();
  if (status === 401) return 'Chave inválida, revogada ou com espaço/aspas na Vercel. Confira e rotacione.';
  if (status === 402) return 'Sem saldo/crédito no provedor. Recarregue a conta.';
  if (status === 403) return 'Chave sem permissão para este modelo ou região.';
  if (status === 429) return 'Cota/limite de requisições atingido. Tente mais tarde.';
  if (status === 404 || /not found|not_found|does not exist|unsupported model|invalid model/.test(m)) {
    return 'Modelo inexistente ou descontinuado para esta chave — ajuste a allowlist em api/ai.js.';
  }
  if (status >= 500) return 'Instabilidade do provedor.';
  if (/quota|billing|exceeded/.test(m)) return 'Cota ou faturamento do provedor.';
  return null;
}

function safeJson(texto) {
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

function ipDaRequisicao(req) {
  return (
    (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'desconhecido'
  );
}

/* ------------------------------ diagnóstico ------------------------------ */

async function diagnostico(req, res) {
  const nome = String(req.query?.provider || '').toLowerCase();
  const provedor = PROVEDORES[nome];

  if (!provedor) {
    return res.status(400).json({
      error: 'Informe ?provider=',
      suportados: Object.keys(PROVEDORES),
      variaveis: Object.values(PROVEDORES).map((p) => p.env),
    });
  }

  const chave = lerChave(provedor.env);
  const base = {
    provider: nome,
    variavel: provedor.env,
    configurada: chave.presente,
    tamanhoDaChave: chave.valor.length,
    prefixo: chave.valor ? `${chave.valor.slice(0, 4)}…` : null,
    modelos: provedor.cadeia,
  };

  if (!chave.presente) {
    return res.status(503).json({
      ...base,
      error: `Variável ${provedor.env} ausente no runtime`,
      hint: 'Cadastre na Vercel (Production + Preview) e faça redeploy sem cache.',
    });
  }

  // Chama o primeiro modelo da cadeia com 1 token, só para ver o status real.
  const modelo = provedor.cadeia[0];
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TIMEOUT_MS);
  try {
    const { url, init } = montarRequisicao(nome, provedor, modelo, [{ role: 'user', content: 'ping' }], 0, 8, chave.valor);
    const r = await fetch(url, { ...init, signal: controle.signal });
    const bruto = await r.text();
    const mensagem = mensagemDoProvedor(bruto);
    return res.status(r.ok ? 200 : 502).json({
      ...base,
      modeloTestado: modelo,
      status: r.status,
      ok: r.ok,
      mensagem,
      hint: r.ok ? null : dicaPara(r.status, mensagem),
      detail: bruto.slice(0, 800),
    });
  } catch (erro) {
    return res.status(504).json({ ...base, error: 'Tempo esgotado/erro de rede', detail: String(erro?.message || erro) });
  } finally {
    clearTimeout(timer);
  }
}

/* --------------------------------- handler ------------------------------- */

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') return diagnostico(req, res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Use POST (ou GET ?provider= para diagnóstico)' });
  }

  const ip = ipDaRequisicao(req);
  if (excedeuLimite(ip)) {
    return res.status(429).json({ error: 'Muitas requisições. Tente em instantes.' });
  }

  const corpo = typeof req.body === 'string' ? safeJson(req.body) : req.body || {};
  if (!corpo || typeof corpo !== 'object') {
    return res.status(400).json({ error: 'Corpo inválido' });
  }

  const nome = String(corpo.provider || 'gemini').toLowerCase();
  const provedor = PROVEDORES[nome];
  if (!provedor) {
    return res.status(400).json({ error: 'Provedor não suportado', suportados: Object.keys(PROVEDORES) });
  }

  const chave = lerChave(provedor.env);
  if (!chave.presente) {
    return res.status(503).json({
      error: `Provedor '${nome}' não configurado no servidor`,
      variavel: provedor.env,
      hint: 'Cadastre a variável na Vercel e faça redeploy sem cache.',
    });
  }

  const mensagens = normalizarMensagens(corpo);
  if (mensagens.length === 0) {
    return res.status(400).json({ error: 'Envie prompt ou messages' });
  }

  const imagens = normalizarImagens(corpo.images);
  const avisos = [];
  if (Array.isArray(corpo.images) && corpo.images.length && !imagens.length) {
    avisos.push('Nenhuma imagem válida: envie data URLs image/*;base64 de até 3 MB.');
  }
  if (imagens.length && provedor.tipo !== 'gemini') {
    avisos.push(`Provedor ${nome} não aceita imagem nesta API — use gemini para análise visual.`);
  }

  const temperatura = Number.isFinite(corpo.temperature)
    ? Math.min(Math.max(corpo.temperature, 0), 2)
    : 0.7;

  const maxTokens = Number.isFinite(corpo.maxTokens)
    ? Math.min(Math.max(Math.trunc(corpo.maxTokens), 1), 4096)
    : undefined;

  // Cadeia de tentativa: modelo pedido (se válido) + os seguintes da lista.
  const pedido = typeof corpo.model === 'string' ? corpo.model : '';
  const inicio = pedido && provedor.cadeia.includes(pedido)
    ? provedor.cadeia.indexOf(pedido)
    : 0;
  const candidatos = provedor.cadeia.slice(inicio, inicio + MAX_TENTATIVAS);

  let ultimo = null;

  for (const modelo of candidatos) {
    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort(), TIMEOUT_MS);
    try {
      const { url, init } = montarRequisicao(
        nome, provedor, modelo, mensagens, temperatura, maxTokens, chave.valor,
        provedor.tipo === 'gemini' ? imagens : [],
      );
      const resposta = await fetch(url, { ...init, signal: controle.signal });
      const bruto = await resposta.text();

      if (resposta.ok) {
        const texto = extrairTexto(provedor.tipo, bruto);
        if (!texto) {
          ultimo = { status: 502, modelo, mensagem: 'Resposta sem texto', bruto };
          continue;
        }
        return res.status(200).json({
          text: texto, provider: nome, model: modelo,
          ...(imagens.length && provedor.tipo === 'gemini' ? { imagensEnviadas: imagens.length } : {}),
          ...(avisos.length ? { avisos } : {}),
        });
      }

      const mensagem = mensagemDoProvedor(bruto);
      ultimo = { status: resposta.status, modelo, mensagem, bruto };

      // Vale trocar de modelo quando o problema é do modelo (404) ou de
      // capacidade daquele modelo (429/503). Erro de chave/cobrança (401/402/
      // 403/400) não melhora trocando de modelo.
      const valeTrocar =
        resposta.status === 404 || resposta.status === 429 || resposta.status === 503 ||
        /model|not found|not_found|unsupported|high demand/i.test(mensagem);
      if (!valeTrocar) break;
    } catch (erro) {
      const abortado = erro?.name === 'AbortError';
      // Nunca ecoar cabeçalhos/URLs: só o essencial, e sem padrões de chave.
      const limpo = String(erro?.cause?.code || erro?.message || erro)
        .replace(/(sk-|gsk_|AQ\.)[A-Za-z0-9._-]+/g, '$1***')
        .slice(0, 160);
      ultimo = { status: abortado ? 504 : 502, modelo, mensagem: limpo, bruto: '' };
      break;
    } finally {
      clearTimeout(timer);
    }
  }

  const status = ultimo?.status || 502;
  const mensagem = ultimo?.mensagem || 'Erro desconhecido';
  console.error(`[api/ai] ${nome} falhou (${status}): ${mensagem}`);

  return res.status(status === 429 ? 429 : 502).json({
    error: `Falha no provedor ${nome} (HTTP ${status}): ${mensagem}`,
    provider: nome,
    status,
    model: ultimo?.modelo || candidatos[0],
    tentativas: candidatos,
    detail: (ultimo?.bruto || '').slice(0, 800),
    hint: dicaPara(status, mensagem),
  });
}
