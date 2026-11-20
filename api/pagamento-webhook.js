import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import dados from '../shared/planos.json' with { type: 'json' };
import process from 'node:process';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

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

export { resolverOficinaPorEmail };

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, erro: 'Método não permitido' });
  }

  const segredoEsperado = process.env.WEBHOOK_SECRET;
  if (!segredoEsperado) {
    return res.status(500).json({ ok: false, erro: 'WEBHOOK_SECRET não configurado' });
  }

  const recebido = String(req.headers['x-webhook-secret'] || '');
  const a = Buffer.from(recebido);
  const b = Buffer.from(segredoEsperado);
  const segredoOk = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!segredoOk) {
    return res.status(401).json({ ok: false, erro: 'Não autorizado' });
  }

  try {
    const body = req.body || {};
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
