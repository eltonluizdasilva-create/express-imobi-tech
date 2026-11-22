/* eslint-disable */
/**
- Cloud Functions — Express Tech
 *
- ativarPlano      (onCall)    → ativa/troca plano pelo backend, nunca pelo cliente
- pagamentoWebhook (onRequest) → confirma pagamento e libera o plano Pro
 *
- Regras de negócio:
-  - o cliente autenticado só pode trocar de plano pelo ativarPlano;
-  - plano pago exige assinatura com status "ativa" (gravada pelo webhook de pagamento);
-  - claim `admin: true` (definida via scripts-locais/set-admin-claim.js) pode forçar ativação.
 */

const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const dados = require('./planos.json');

admin.initializeApp();

const db = admin.firestore();
const REGIAO = process.env.FUNCTIONS_REGION || 'southamerica-east1';

const ATIVAVEIS = dados.planos.filter((p) => p.autoAtivavel).map((p) => p.key);
const ALIAS_GRATIS = new Set(['', 'gratis', 'grátis', 'gratuito', 'free', 'trial']);
const PAPEIS_ADMIN_TENANT = ['dono', 'master'];

const norm = (v) => String(v ?? '').trim().toLowerCase();

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

  if (['essencial_plus', 'profissional', 'pro'].includes(chave)) {
    return [...new Set([...gratis, ...essencialPlus, ...profissional])];
  }

  if (chave === 'esquadrao_ia' || chave === 'presenca_digital') {
    return [...new Set([...gratis, ...essencialPlus, ...profissional, ...esquadrao])];
  }

  return [...gratis];
}

async function resolverOficinaPorUid(uid) {
  const snap = await db.doc(`usuarios/${uid}`).get();
  if (!snap.exists) return { oficinaId: uid, papel: 'dono' };
  const d = snap.data() || {};
  return { oficinaId: d.oficinaId || uid, papel: d.papel || 'dono' };
}

async function resolverOficinaPorEmail(email) {
  const alvo = norm(email);
  if (!alvo) return null;
  const porDono = await db.collection('oficinas').where('email', '==', alvo).limit(1).get();
  if (!porDono.empty) return porDono.docs[0].id;
  const porUsuario = await db.collection('usuarios').where('email', '==', alvo).limit(1).get();
  if (!porUsuario.empty) {
    const d = porUsuario.docs[0].data() || {};
    return d.oficinaId || porUsuario.docs[0].id;
  }
  return null;
}

/** Grava o plano na organização — única escrita de plano no sistema. */
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
    planoAtualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (!pro) payload.nivelInteligencia = 'padrao';

  if (!snap.exists) {
    await ofiRef.set(
      {
        uid: oficinaId,
        plano: planoKey,
        isPro: pro,
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
  await ofiRef.set(payload, { merge: true });

  return { oficinaId, plano: planoKey, isPro: pro, modulos };
}

async function assinaturaAtiva(oficinaId, planoKey) {
  const snap = await db.doc(`oficinas/${oficinaId}/assinaturas/atual`).get();
  if (!snap.exists) return false;
  const d = snap.data() || {};
  return d.status === 'ativa' && norm(d.plano) === norm(planoKey);
}

/* ------------------------------------------------------------------ */
/* ativarPlano — chamada pelo frontend (Meuplano.jsx)                  */
/* ------------------------------------------------------------------ */

exports.ativarPlano = onCall({ region: REGIAO }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Faça login para alterar o plano.');
  }

  const planoKey = norm(request.data?.plano);
  const ciclo = request.data?.ciclo === 'anual' ? 'anual' : 'mensal';

  if (!ATIVAVEIS.includes(planoKey)) {
    throw new HttpsError('invalid-argument', `Plano inválido: "${planoKey}".`);
  }

  const { oficinaId, papel } = await resolverOficinaPorUid(uid);
  const ehAdminPlataforma = request.auth.token?.admin === true;

  if (!ehAdminPlataforma && !PAPEIS_ADMIN_TENANT.includes(papel)) {
    throw new HttpsError('permission-denied', 'Apenas o dono da conta pode alterar o plano.');
  }

  const pro = isPlanoPro(planoKey);

  if (pro && !ehAdminPlataforma && !(await assinaturaAtiva(oficinaId, planoKey))) {
    logger.info('ativarPlano: pagamento pendente', { uid, oficinaId, planoKey });
    return {
      ok: false,
      codigo: 'pagamento_pendente',
      mensagem: 'Pagamento ainda não confirmado. Conclua a assinatura para liberar o plano Pro.',
    };
  }

  const resultado = await aplicarPlano({
    oficinaId,
    planoKey,
    ciclo,
    origem: ehAdminPlataforma ? 'admin' : 'cliente',
  });

  // Claim com o plano atual (o claim admin é preservado)
  try {
    const userRecord = await admin.auth().getUser(uid);
    await admin.auth().setCustomUserClaims(uid, {
      ...(userRecord.customClaims || {}),
      plano: planoKey,
      pro,
    });
  } catch (e) {
    logger.warn('ativarPlano: falha ao atualizar claim', e?.message);
  }

  logger.info('ativarPlano: ok', { uid, ...resultado });
  return { ok: true, ...resultado };
});

/* ------------------------------------------------------------------ */
/* pagamentoWebhook — confirma pagamento (gateway, n8n, manual)        */
/* ------------------------------------------------------------------ */

exports.pagamentoWebhook = onRequest({ region: REGIAO }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, erro: 'Método não permitido' });
    return;
  }

  const segredoEsperado = process.env.WEBHOOK_SECRET;
  if (!segredoEsperado) {
    logger.error('pagamentoWebhook: WEBHOOK_SECRET não configurado');
    res.status(500).json({ ok: false, erro: 'Webhook sem segredo configurado' });
    return;
  }

  const recebido = String(req.get('x-webhook-secret') || '');
  const crypto = require('crypto');
  const a = Buffer.from(recebido);
  const b = Buffer.from(segredoEsperado);
  const segredoOk = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!segredoOk) {
    logger.warn('pagamentoWebhook: segredo inválido');
    res.status(401).json({ ok: false, erro: 'Não autorizado' });
    return;
  }

  const body = req.body || {};
  const status = norm(body.status || body.event) || 'pago';
  const planoKey = norm(body.plano) || 'profissional';
  const ciclo = body.ciclo === 'anual' ? 'anual' : 'mensal';

  let oficinaId = body.oficinaId ? String(body.oficinaId).trim() : null;
  if (!oficinaId && body.email) {
    oficinaId = await resolverOficinaPorEmail(body.email);
  }

  if (!oficinaId) {
    res.status(400).json({ ok: false, erro: 'oficinaId ou email obrigatório' });
    return;
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
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    const resultado = await aplicarPlano({
      oficinaId,
      planoKey,
      ciclo,
      origem: 'pagamento',
    });
    logger.info('pagamentoWebhook: plano liberado', resultado);
    res.status(200).json({ ok: true, ...resultado });
    return;
  }

  if (status === 'cancelado' || status === 'cancelada' || status === 'estornado') {
    await db.doc(`oficinas/${oficinaId}/assinaturas/atual`).set(
      {
        status: 'cancelada',
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    const resultado = await aplicarPlano({
      oficinaId,
      planoKey: 'gratis',
      ciclo: 'mensal',
      origem: 'cancelamento',
    });
    logger.info('pagamentoWebhook: assinatura cancelada', resultado);
    res.status(200).json({ ok: true, ...resultado });
    return;
  }

  res.status(200).json({ ok: true, ignorado: true, status });
});