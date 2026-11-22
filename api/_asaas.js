/**
 * _asaas.js — leitura do webhook nativo de cobrança do Asaas (puro, sem I/O).
 * ============================================================================
 * Fica fora do handler para poder ser testado sem Firestore nem credencial:
 * `node tests/asaas-webhook.test.mjs`.
 *
 * Payload (docs.asaas.com/reference/webhook-para-cobrancas):
 *   { id, event: 'PAYMENT_CONFIRMED'|'PAYMENT_RECEIVED'|..., dateCreated, account,
 *     payment: { id, customer, subscription, paymentLink, value, description,
 *                externalReference, billingType, status, ... } }
 * O token configurado no webhook do Asaas chega no cabeçalho
 * `asaas-access-token` (docs.asaas.com/docs/about-webhooks).
 */
import dados from '../shared/planos.json' with { type: 'json' };

/** Só estes dois eventos liberam plano (pagamento feito / valor disponível). */
export const EVENTOS_ASAAS_QUE_ATIVAM = Object.freeze(['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED']);

const EVENTOS_QUE_ATIVAM = new Set(EVENTOS_ASAAS_QUE_ATIVAM);

// Chaves antigas continuam aceitas, mas todas ativam o PRO canônico.
const SINONIMOS_PLANO = [
  { plano: 'pro', rx: /\bessencial[\s_-]*plus\b/i },
  { plano: 'pro', rx: /\bprofissional\b/i },
  { plano: 'pro', rx: /\bessencial\b/i },
  { plano: 'pro', rx: /\bpro\b/i },
];

const arredondar2 = (n) => Math.round(n * 100) / 100;

export function eventoAtivaPlano(evento) {
  return EVENTOS_QUE_ATIVAM.has(String(evento || '').trim().toUpperCase());
}

/** Valor em reais a partir de "39,90", "39.9", 99 ou "R$ 99,00". */
export function valorEmReais(bruto) {
  if (bruto === null || bruto === undefined || bruto === '') return null;
  const numero =
    typeof bruto === 'number' ? bruto : Number(String(bruto).replace(/[^\d,.-]/g, '').replace(',', '.'));
  if (!Number.isFinite(numero) || numero <= 0) return null;
  return arredondar2(numero);
}

/**
 * valor pago → plano/ciclo, montado a partir do catálogo para preços vigentes.
 * Valores de cobranças antigas (R$ 99, R$ 89 e R$ 1.068) continuam mapeados
 * para o PRO para preservar a ativação de assinaturas legadas.
 */
export const PLANO_POR_VALOR = (() => {
  const mapa = new Map();
  const adicionar = (valor, plano, ciclo) => {
    const v = valorEmReais(valor);
    if (v === null || mapa.has(v)) return;
    mapa.set(v, { plano, ciclo });
  };
  for (const plano of Array.isArray(dados.planos) ? dados.planos : []) {
    if (!plano || !plano.preco) continue;
    adicionar(plano.preco.mensal, plano.key, 'mensal');
    adicionar(plano.preco.anual, plano.key, 'anual');
  }
  // Valores legados da escada anterior; não são usados em novos checkouts.
  adicionar(99, 'pro', 'mensal');
  adicionar(89, 'pro', 'anual');
  adicionar(1068, 'pro', 'anual');
  return mapa;
})();

export function planoPorValor(bruto) {
  const direto = valorEmReais(bruto);
  if (direto === null) return null;
  // O valor pode chegar em centavos (ex.: 3990). Tenta o número cru e, quando
  // ele é grande demais para ser preço de plano, também dividido por 100.
  const candidatos = [direto];
  if (direto >= 1000) candidatos.push(arredondar2(direto / 100));
  for (const valor of candidatos) {
    const achado = PLANO_POR_VALOR.get(valor);
    if (achado) return achado;
  }
  return null;
}

export function planoPorTexto(texto) {
  const alvo = String(texto || '');
  if (!alvo) return null;
  for (const { plano, rx } of SINONIMOS_PLANO) {
    if (rx.test(alvo)) return plano;
  }
  return null;
}

export const pareceEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

export function extrairEmail(texto) {
  const m = String(texto || '').match(/[^\s@,;:"']+@[^\s@,;:"']+\.[A-Za-z]{2,}/);
  return m ? m[0] : null;
}

export function extrairOficinaId(texto) {
  const m = String(texto || '').match(/oficina(?:Id|_id|Id\b)?\s*[=:]\s*([A-Za-z0-9_-]{6,})/i);
  return m ? m[1] : null;
}

/** Payload nativo de webhook do Asaas: evento em CAIXA ALTA + objeto payment. */
export function ehPayloadAsaas(body) {
  if (!body || typeof body !== 'object') return false;
  if (!body.payment || typeof body.payment !== 'object') return false;
  return /^[A-Z][A-Z_]*$/.test(String(body.event || ''));
}

/**
 * Plano e ciclo de um evento do Asaas, sem tocar em banco.
 * Ordem: valor pago (mais confiável, vem do gateway) → externalReference/description.
 */
export function lerPlanoDoEvento(body) {
  const pagamento = body?.payment || {};
  const porValor = planoPorValor(pagamento.value);
  const porTexto = planoPorTexto(pagamento.externalReference) || planoPorTexto(pagamento.description);
  const plano = porValor?.plano || porTexto || null;
  const ciclo = porValor?.ciclo || (String(body?.ciclo || '').toLowerCase() === 'anual' ? 'anual' : 'mensal');
  return { plano, ciclo, porValor, porTexto, conflito: Boolean(porValor && porTexto && porValor.plano !== porTexto) };
}
