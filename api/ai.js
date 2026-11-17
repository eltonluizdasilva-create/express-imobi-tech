/**
 * api/ai.js — proxy serverless das APIs de IA
 * ============================================================================
 * O navegador nunca vê chave de provedor. Ele chama POST /api/ai e esta função
 * fala com DeepSeek, Groq, Gemini, Zhipu e SiliconFlow usando `process.env.*`
 * (sem prefixo VITE_, portanto não empacotado no bundle).
 *
 * Contrato:
 *   POST /api/ai
 *   {
 *     provider: 'deepseek' | 'groq' | 'gemini' | 'zhipu' | 'siliconflow',
 *     prompt?: string,            // atalho: vira uma mensagem de usuário
 *     messages?: [{ role, content }],
 *     systemPrompt?: string,
 *     temperature?: number,       // 0..2
 *     maxTokens?: number,         // 1..4096
 *     model?: string              // precisa estar na allowlist do provedor
 *   }
 *   → 200 { text, provider, model }
 *   → 4xx/5xx { error, detail? }
 *
 * Variáveis de ambiente (Vercel → Settings → Environment Variables):
 *   DEEPSEEK_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, ZHIPU_API_KEY,
 *   SILICONFLOW_API_KEY
 * ============================================================================
 */

const PROVEDORES = {
  deepseek: {
    tipo: 'openai',
    url: 'https://api.deepseek.com/chat/completions',
    env: 'DEEPSEEK_API_KEY',
    modelo: 'deepseek-chat',
    modelos: ['deepseek-chat', 'deepseek-reasoner'],
  },
  groq: {
    tipo: 'openai',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    env: 'GROQ_API_KEY',
    modelo: 'llama-3.3-70b-versatile',
    modelos: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'meta-llama/llama-4-scout-17b-16e-instruct',
    ],
  },
  zhipu: {
    tipo: 'openai',
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    env: 'ZHIPU_API_KEY',
    modelo: 'glm-4-flash',
    modelos: ['glm-4-flash', 'glm-4-plus', 'glm-4.5-flash'],
  },
  siliconflow: {
    tipo: 'openai',
    url: 'https://api.siliconflow.cn/v1/chat/completions',
    env: 'SILICONFLOW_API_KEY',
    modelo: 'Qwen/Qwen2.5-7B-Instruct',
    modelos: [
      'Qwen/Qwen2.5-7B-Instruct',
      'Qwen/Qwen2.5-72B-Instruct',
      'deepseek-ai/DeepSeek-V3',
    ],
  },
  gemini: {
    tipo: 'gemini',
    env: 'GEMINI_API_KEY',
    modelo: 'gemini-2.0-flash-lite',
    modelos: ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash'],
  },
};

const LIMITE_PROMPT = 20000; // caracteres
const LIMITE_MENSAGENS = 40;
const TIMEOUT_MS = 30000;

/* Rate limit simples por IP — melhor esforço (cada instância serverless tem
 * sua própria memória). Para proteção real, use Vercel WAF / Rate Limiting. */
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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST' });
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'desconhecido';

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
    return res.status(400).json({
      error: 'Provedor não suportado',
      suportados: Object.keys(PROVEDORES),
    });
  }

  const chave = process.env[provedor.env];
  if (!chave) {
    // Sem chave configurada: erro explícito, sem vazar nada.
    return res.status(503).json({
      error: `Provedor '${nome}' não configurado no servidor`,
      variavel: provedor.env,
    });
  }

  const modelo = corpo.model && provedor.modelos.includes(corpo.model)
    ? corpo.model
    : provedor.modelo;

  const mensagens = normalizarMensagens(corpo);
  if (mensagens.length === 0) {
    return res.status(400).json({ error: 'Envie prompt ou messages' });
  }

  const temperatura = Number.isFinite(corpo.temperature)
    ? Math.min(Math.max(corpo.temperature, 0), 2)
    : 0.7;

  const maxTokens = Number.isFinite(corpo.maxTokens)
    ? Math.min(Math.max(Math.trunc(corpo.maxTokens), 1), 4096)
    : undefined;

  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TIMEOUT_MS);

  try {
    const { url, init } = montarRequisicao(provedor, nome, modelo, mensagens, temperatura, maxTokens, chave);
    const resposta = await fetch(url, { ...init, signal: controle.signal });
    const bruto = await resposta.text();

    if (!resposta.ok) {
      return res.status(resposta.status === 429 ? 429 : 502).json({
        error: `Falha no provedor ${nome}`,
        status: resposta.status,
        // trecho limitado: nunca ecoa a chave (ela não aparece na resposta do provedor)
        detail: bruto.slice(0, 300),
      });
    }

    const texto = extrairTexto(provedor.tipo, bruto);
    if (!texto) {
      return res.status(502).json({ error: 'Resposta vazia do provedor', provider: nome });
    }

    return res.status(200).json({ text: texto, provider: nome, model: modelo });
  } catch (erro) {
    const abortado = erro?.name === 'AbortError';
    console.error(`[api/ai] ${nome}:`, erro?.message);
    return res.status(abortado ? 504 : 502).json({
      error: abortado ? 'Tempo esgotado no provedor' : 'Erro ao chamar o provedor',
    });
  } finally {
    clearTimeout(timer);
  }
}

function montarRequisicao(provedor, nome, modelo, mensagens, temperatura, maxTokens, chave) {
  if (provedor.tipo === 'gemini') {
    const sistema = mensagens.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
    const conversa = mensagens
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

    const corpo = {
      contents: conversa,
      generationConfig: {
        temperature: temperatura,
        ...(maxTokens ? { maxOutputTokens: maxTokens } : {}),
      },
      ...(sistema ? { systemInstruction: { parts: [{ text: sistema }] } } : {}),
    };

    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${encodeURIComponent(chave)}`,
      init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) },
    };
  }

  // Provedores compatíveis com OpenAI (deepseek, groq, zhipu, siliconflow)
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

function safeJson(texto) {
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}
