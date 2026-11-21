import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import dados from '../shared/planos.json' with { type: 'json' };
import process from 'node:process';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import {
  lerPlanoDoEvento,
  eventoAtivaPlano,
  ehPayloadAsaas,
  extrairEmail,
  extrairOficinaId,
  pareceEmail,
} from './_asaas.js';

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

const ALIAS_GRATIS = new Set(['', 'gratis', 'grátis', 'gratuito', 'free', 'trial']);
const norm = (v) => String(v ?? '').trim().toLowerCase();

// Documentos criados por testes/seed antigos. Não podem vencer um cadastro real
// quando o mesmo e-mail existe em mais de um documento de `oficinas`.
const ID_LEGADO = /^oficina_teste(_|$)|^oficina_ia_teste(_|$)/i;
const CAMPOS_LEGADO = new Set(['senha']);

function ehDocumentoLegado(id, dados) {
  if (ID_LEGADO.test(String(id))) return true;
  return Object.keys(CAMPOS_LEGADO).some((campo) => Object.prototype.hasOwnProperty.call(dados || {}, campo));
}

function msDoTimestamp(valor) {
  if (!valor) return 0;
  if (typeof valor.toDate === 'function') return valor.toDate().getTime();
  if (typeof valor._seconds === 'number') return valor._seconds * 1000;
  const t = new Date(valor).getTime();
  return Number.isFinite(t) ? t : 0;
}

function isPlanoPro(plano) {
  const chave = norm(plano);
  if (ALIAS_GRATIS.has(chave)) return false;
  return dados.planosPro.includes(chave);
}

function modulosDoPlano(planoKey) {
  const chave = norm(planoKey);
  const gratis = dados.modulos.gratis || [];
  const essencialPlus = dados.modulos.essencial_plus_extra || [];
  const profissional = dados.modulos.profissional_extra || [];
  const esquadrao = dados.modulos.esquadrao_extra || [];

  if (chave === 'essencial_plus') {
    return [...new Set([...gratis, ...essencialPlus])];
  }
  if (chave === 'profissional' || chave === 'pro') {
    return [...new Set([...gratis, ...essencialPlus, ...profissional])];
  }
  if (chave === 'esquadrao_ia' || chave === 'presenca_digital') {
    return [...new Set([...gratis, ...essencialPlus, ...profissional, ...esquadrao])];
  }
  return [...gratis];
}

async function resolverOficinaPorEmail(email) {
  const alvo = norm(email);
  if (!alvo) return null;

  const [porDono, porUsuario] = await Promise.all([
    db.collection('oficinas').where('email', '==', alvo).get(),
    db.collection('usuarios').where('email', '==', alvo).get(),
  ]);

  // Vínculo canônico: usuarios.oficinaId (ou o próprio id do documento de usuário).
  const vinculados = new Set();
  let oficinaDoUsuario = null;
  for (const doc of porUsuario.docs) {
    const d = doc.data() || {};
    const destino = String(d.oficinaId || doc.id || '').trim();
    if (!destino) continue;
    vinculados.add(destino);
    if (!oficinaDoUsuario) oficinaDoUsuario = destino;
  }

  const candidatos = porDono.docs.map((doc) => {
    const dados = doc.data() || {};
    return {
      id: doc.id,
      vinculado: vinculados.has(doc.id),
      legado: ehDocumentoLegado(doc.id, dados),
      criadoEm: msDoTimestamp(dados.criadoEm) || msDoTimestamp(dados.data_cadastro) || msDoTimestamp(doc.createTime),
    };
  });

  if (!candidatos.length) return oficinaDoUsuario;

  // Prioridade: vinculado em usuarios.oficinaId → cadastro real (não legado)
  // → mais recente → id ascendente (desempate estável).
  candidatos.sort(
    (a, b) =>
      Number(b.vinculado) - Number(a.vinculado) ||
      Number(a.legado) - Number(b.legado) ||
      b.criadoEm - a.criadoEm ||
      a.id.localeCompare(b.id)
  );
  const escolhido = candidatos[0];

  if (candidatos.length > 1) {
    console.warn(
      'pagamento-webhook: múltiplas oficinas para o mesmo e-mail',
      JSON.stringify({
        email: alvo,
        escolhido: { id: escolhido.id, vinculado: escolhido.vinculado, legado: escolhido.legado },
        ignorados: candidatos.slice(1).map((c) => ({ id: c.id, vinculado: c.vinculado, legado: c.legado })),
      })
    );
  }

  return escolhido.id;
}

/* ============================================================================
   ASAAS — webhook nativo de cobrança
   ============================================================================
   Payload (docs.asaas.com/reference/webhook-para-cobrancas):
     { id, event: 'PAYMENT_CONFIRMED'|'PAYMENT_RECEIVED'|..., dateCreated, account,
       payment: { id, customer, subscription, paymentLink, value, description,
                  externalReference, billingType, status, ... } }
   O token configurado no webhook do Asaas chega no cabeçalho `asaas-access-token`
   (docs.asaas.com/docs/about-webhooks) e é comparado com WEBHOOK_SECRET.

   Identificação do plano: pelo valor pago (fonte: shared/planos.json + total
   anual do PRO) e, quando o valor não casa, pelo texto de
   externalReference/description ("essencial plus", "PRO", "profissional").
   ========================================================================== */

async function oficinaExiste(id) {
  const alvo = String(id || '').trim();
  if (!alvo || alvo.includes('/')) return false;
  const snap = await db.doc(`oficinas/${alvo}`).get();
  return snap.exists;
}

/**
 * E-mail do pagador quando o payload só traz `payment.customer`. Opcional: exige
 * ASAAS_API_KEY (header `access_token`) e aceita ASAAS_API_URL para sandbox.
 * Sem chave devolve null sem quebrar o fluxo.
 */
async function emailDoClienteAsaas(customerId) {
  const chave = String(process.env.ASAAS_API_KEY || '').trim();
  const id = String(customerId || '').trim();
  if (!chave || !id) return null;
  const base = String(process.env.ASAAS_API_URL || 'https://api.asaas.com/v3').replace(/\/+$/, '');
  try {
    const resp = await fetch(`${base}/customers/${encodeURIComponent(id)}`, {
      headers: { access_token: chave, accept: 'application/json', 'User-Agent': 'ExpressImobiTech/1.0' },
    });
    if (!resp.ok) {
      console.warn('pagamento-webhook: consulta de cliente no Asaas falhou', resp.status, id);
      return null;
    }
    const cliente = await resp.json();
    const email = String(cliente?.email || '').trim();
    return pareceEmail(email) ? email : null;
  } catch (err) {
    console.warn('pagamento-webhook: erro consultando cliente no Asaas', err?.message || String(err));
    return null;
  }
}

/**
 * Descobre a oficina a partir do payload do Asaas, sem confiar em campo ausente:
 * 1. externalReference (e-mail ou oficinaId que exista em `oficinas`);
 * 2. description (`oficinaId=...` ou e-mail);
 * 3. cliente do Asaas (e-mail), quando ASAAS_API_KEY está configurada.
 */
async function resolverOficinaDoPagamentoAsaas(pagamento) {
  const ref = String(pagamento?.externalReference || '').trim();
  const descricao = String(pagamento?.description || '');

  if (ref) {
    if (pareceEmail(ref)) {
      const id = await resolverOficinaPorEmail(ref);
      if (id) return { oficinaId: id, via: 'externalReference:email' };
    } else if (await oficinaExiste(ref)) {
      return { oficinaId: ref, via: 'externalReference:oficinaId' };
    }
  }

  const idNaDescricao = extrairOficinaId(descricao);
  if (idNaDescricao && (await oficinaExiste(idNaDescricao))) {
    return { oficinaId: idNaDescricao, via: 'description:oficinaId' };
  }

  const email = extrairEmail(descricao) || (pareceEmail(ref) ? null : extrairEmail(ref));
  if (email) {
    const id = await resolverOficinaPorEmail(email);
    if (id) return { oficinaId: id, via: 'description:email' };
  }

  const emailCliente = await emailDoClienteAsaas(pagamento?.customer);
  if (emailCliente) {
    const id = await resolverOficinaPorEmail(emailCliente);
    if (id) return { oficinaId: id, via: 'asaas:customer' };
  }

  return null;
}

async function processarEventoAsaas(body) {
  const evento = String(body.event || '').trim().toUpperCase();
  const pagamento = body.payment || {};
  const valor = pagamento.value ?? null;
  const referencia = String(pagamento.externalReference || '').trim();
  const descricao = String(pagamento.description || '');

  if (!eventoAtivaPlano(evento)) {
    console.warn(
      'pagamento-webhook: evento Asaas sem ativação',
      JSON.stringify({ evento, pagamentoId: pagamento.id || null })
    );
    return {
      status: 200,
      corpo: { ok: true, ignorado: true, gateway: 'asaas', evento, motivo: 'evento não ativa plano' },
    };
  }

  const { plano: planoKey, ciclo, porValor, porTexto, conflito } = lerPlanoDoEvento(body);

  if (conflito) {
    console.warn(
      'pagamento-webhook: valor e descrição divergem sobre o plano; usando o valor pago',
      JSON.stringify({ valor, planoPorValor: porValor.plano, planoPorTexto: porTexto, referencia, descricao })
    );
  }

  if (!planoKey) {
    console.warn(
      'pagamento-webhook: plano não identificado no webhook do Asaas',
      JSON.stringify({ evento, valor, referencia, descricao, pagamentoId: pagamento.id || null })
    );
    return {
      status: 200,
      corpo: {
        ok: true,
        ignorado: true,
        gateway: 'asaas',
        evento,
        motivo: 'plano não identificado pelo valor nem por externalReference/description',
      },
    };
  }

  const alvo = await resolverOficinaDoPagamentoAsaas(pagamento);
  if (!alvo) {
    console.warn(
      'pagamento-webhook: oficina não identificada no webhook do Asaas',
      JSON.stringify({ evento, planoKey, valor, referencia, descricao, pagamentoId: pagamento.id || null })
    );
    return {
      status: 200,
      corpo: {
        ok: true,
        ignorado: true,
        gateway: 'asaas',
        evento,
        plano: planoKey,
        motivo: 'oficina não identificada (externalReference/description sem e-mail ou oficinaId)',
      },
    };
  }

  await db.doc(`oficinas/${alvo.oficinaId}/assinaturas/atual`).set(
    {
      status: 'ativa',
      plano: planoKey,
      ciclo,
      valor,
      gateway: 'asaas',
      pagamentoId: pagamento.id || null,
      evento,
      externalReference: referencia || null,
      atualizadoEm: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const resultado = await aplicarPlano({
    oficinaId: alvo.oficinaId,
    planoKey,
    ciclo,
    origem: 'pagamento',
  });

  return { status: 200, corpo: { ok: true, gateway: 'asaas', evento, via: alvo.via, ...resultado } };
}

export { resolverOficinaPorEmail, processarEventoAsaas };
// Reexporta os leitores puros (vivem em `_asaas.js` para poderem ser testados
// sem credencial): valorEmReais, planoPorValor, planoPorTexto, extrairEmail,
// extrairOficinaId, ehPayloadAsaas, lerPlanoDoEvento.
export * from './_asaas.js';

async function aplicarPlano({ oficinaId, planoKey, ciclo, origem }) {
  const pro = isPlanoPro(planoKey);
  const modulos = modulosDoPlano(planoKey);
  const ofiRef = db.doc(`oficinas/${oficinaId}`);
  const snap = await ofiRef.get();

  const payload = {
    plano: planoKey,
    isPro: pro,
    tipoPlano: ciclo,
    modulosOperacionais: modulos,
    planoOrigem: origem,
    planoAtualizadoEm: FieldValue.serverTimestamp(),
  };
  if (!pro) payload.nivelInteligencia = 'padrao';

  if (!snap.exists) {
    await ofiRef.set(
      {
        uid: oficinaId,
        plano: planoKey,
        isPro: pro,
        criadoEm: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
  await ofiRef.set(payload, { merge: true });

  return { oficinaId, plano: planoKey, isPro: pro, modulos };
}

/** Comparação em tempo constante, exigindo o mesmo tamanho (não vaza prefixo). */
function segredoConfere(recebido, esperado) {
  const a = Buffer.from(String(recebido || ''));
  const b = Buffer.from(String(esperado || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Aceita o body já parseado (Vercel) ou uma string JSON (outros runtimes). */
function corpoJson(bruto) {
  if (typeof bruto === 'string') {
    try {
      return JSON.parse(bruto);
    } catch {
      return {};
    }
  }
  return bruto && typeof bruto === 'object' ? bruto : {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, erro: 'Método não permitido' });
  }

  const segredoEsperado = process.env.WEBHOOK_SECRET;
  if (!segredoEsperado) {
    return res.status(500).json({ ok: false, erro: 'WEBHOOK_SECRET não configurado' });
  }

  // Asaas envia `asaas-access-token`; o formato JSON direto continua usando
  // `x-webhook-secret`. Os dois são comparados com o mesmo WEBHOOK_SECRET.
  const recebido = String(req.headers['asaas-access-token'] || req.headers['x-webhook-secret'] || '');
  if (!segredoConfere(recebido, segredoEsperado)) {
    return res.status(401).json({ ok: false, erro: 'Não autorizado' });
  }

  try {
    const body = corpoJson(req.body);

    if (ehPayloadAsaas(body)) {
      const { status, corpo } = await processarEventoAsaas(body);
      return res.status(status).json(corpo);
    }

    const status = norm(body.status || body.event) || 'pago';
    const planoKey = norm(body.plano) || 'profissional';
    const ciclo = body.ciclo === 'anual' ? 'anual' : 'mensal';

    let oficinaId = body.oficinaId ? String(body.oficinaId).trim() : null;
    if (!oficinaId && body.email) {
      oficinaId = await resolverOficinaPorEmail(body.email);
    }

    if (!oficinaId) {
      return res.status(400).json({ ok: false, erro: 'oficinaId ou email obrigatório' });
    }

    if (status === 'pago' || status === 'pagamento_confirmado' || status === 'ativo') {
      await db.doc(`oficinas/${oficinaId}/assinaturas/atual`).set(
        {
          status: 'ativa',
          plano: planoKey,
          ciclo,
          valor: body.valor ?? null,
          gateway: body.gateway || 'desconhecido',
          pagamentoId: body.pagamentoId || null,
          atualizadoEm: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      const resultado = await aplicarPlano({
        oficinaId,
        planoKey,
        ciclo,
        origem: 'pagamento',
      });
      return res.status(200).json({ ok: true, ...resultado });
    }

    if (status === 'cancelado' || status === 'cancelada' || status === 'estornado') {
      await db.doc(`oficinas/${oficinaId}/assinaturas/atual`).set(
        {
          status: 'cancelada',
          atualizadoEm: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      const resultado = await aplicarPlano({
        oficinaId,
        planoKey: 'gratis',
        ciclo: 'mensal',
        origem: 'cancelamento',
      });
      return res.status(200).json({ ok: true, ...resultado });
    }

    return res.status(200).json({ ok: true, ignorado: true, status });
  } catch (err) {
    console.error('pagamento-webhook erro:', err);
    return res.status(500).json({ ok: false, erro: 'Erro interno ao processar webhook' });
  }
}
