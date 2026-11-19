/**
 * api/places.js — varredura de estabelecimentos por endereco + raio
 * ============================================================================
 * O navegador NUNCA fala com o Google. Ele chama este endpoint, e a chave fica
 * em `process.env.GOOGLE_MAPS_API_KEY` (Vercel -> Settings -> Environment
 * Variables, sem prefixo VITE_).
 *
 * CONTRATO
 *   POST /api/places
 *     Authorization: Bearer <idToken do Firebase Auth>   (obrigatorio)
 *     {
 *       "endereco": "Av. João Naves de Ávila, 1000, Uberlândia - MG",
 *       "raio": 1000,                    // metros, 100..30000
 *       "objetivo": "comercial" | "entorno",
 *       "tipos": ["restaurant", "..."]   // opcional, so tipos da allowlist
 *     }
 *   -> 200 {
 *        ok, centro: { enderecoFormatado, lat, lng }, raio, objetivo, tipos,
 *        total, truncado, buscas: [{ tipo, quantidade, erro? }],
 *        itens: [{ placeId, nome, categoria, endereco, avaliacao,
 *                  totalAvaliacoes, status, telefone, site, lat, lng }]
 *      }
 *
 *   GET /api/places  -> diagnostico (se a chave existe, sem revelar valor)
 *
 * ERROS (sempre com codigo estavel para o front traduzir)
 *   400 entrada        | 401 nao_autorizado | 405 metodo
 *   422 endereco_nao_encontrado | 429 cota | 502 provedor
 *   503 sem_config     | 504 tempo
 *
 * COMO CONSULTA (Places API New)
 *   1. Geocoding: endereco -> lat/lng.
 *   2. Nearby Search (New) com `locationRestriction.circle` = raio duro,
 *      uma chamada por tipo (paralelas), fundindo por placeId.
 *   3. Ordena por nota e numero de avaliacoes.
 * ============================================================================
 */

import { verificarIdToken } from './_authToken.js';

const KEY = process.env.GOOGLE_MAPS_API_KEY;
const EXIGIR_AUTH = String(process.env.PLACES_REQUIRE_AUTH ?? 'true') !== 'false';

const RAIO_MIN = 100;
const RAIO_MAX = 30000;
const POR_TIPO = 20;
const MAX_TOTAL = 80;

/** Tipos aceitos pela Places API (New) usados em cada objetivo. */
const TIPOS_POR_OBJETIVO = {
  comercial: ['store', 'restaurant', 'cafe', 'bakery', 'car_repair', 'beauty_salon'],
  entorno: ['school', 'hospital', 'supermarket', 'bank', 'pharmacy', 'park'],
};

const TIPOS_VALIDOS = new Set(Object.values(TIPOS_POR_OBJETIVO).flat());

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.types',
  'places.primaryTypeDisplayName',
  'places.rating',
  'places.userRatingCount',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.location',
  'places.businessStatus',
].join(',');

/* ------------------------------- utilidades ------------------------------ */

function respostaErro(res, status, codigo, mensagem, extra = {}) {
  return res.status(status).json({ ok: false, code: codigo, error: mensagem, ...extra });
}

function textoCurto(valor, max = 160) {
  return String(valor ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function categoriaDoLugar(place) {
  const exibido = place?.primaryTypeDisplayName?.text;
  if (exibido) return textoCurto(exibido, 48);
  const tipo = (place?.types || [])[0];
  if (!tipo) return 'Estabelecimento';
  return tipo.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function geocodificar(endereco) {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', endereco);
  url.searchParams.set('key', KEY);
  url.searchParams.set('language', 'pt-BR');
  url.searchParams.set('region', 'br');

  const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
  const j = await r.json().catch(() => ({}));

  if (j.status === 'ZERO_RESULTS') return { erro: 'endereco_nao_encontrado' };
  if (j.status !== 'OK' || !j.results?.length) {
    return { erro: 'provedor', detalhe: `${j.status || r.status} ${j.error_message || ''}`.trim() };
  }

  const primeiro = j.results[0];
  return {
    lat: primeiro.geometry.location.lat,
    lng: primeiro.geometry.location.lng,
    enderecoFormatado: primeiro.formatted_address,
  };
}

async function buscarPorTipo(centro, raio, tipo) {
  const corpo = {
    includedTypes: [tipo],
    maxResultCount: POR_TIPO,
    languageCode: 'pt-BR',
    regionCode: 'BR',
    rankPreference: 'POPULARITY',
    locationRestriction: {
      circle: { center: { latitude: centro.lat, longitude: centro.lng }, radius: raio },
    },
  };

  const r = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(corpo),
    signal: AbortSignal.timeout(12000),
  });

  const j = await r.json().catch(() => ({}));

  if (!r.ok) {
    const status = j?.error?.status || '';
    const codigo = r.status === 429 || status === 'RESOURCE_EXHAUSTED' ? 'cota' : 'provedor';
    return { erro: codigo, detalhe: `${r.status} ${status} ${j?.error?.message || ''}`.trim() };
  }

  return { lugares: j.places || [] };
}

function normalizar(place) {
  return {
    placeId: place.id,
    nome: textoCurto(place.displayName?.text || 'Sem nome', 90),
    categoria: categoriaDoLugar(place),
    endereco: textoCurto(place.formattedAddress || '', 160),
    avaliacao: typeof place.rating === 'number' ? place.rating : null,
    totalAvaliacoes: typeof place.userRatingCount === 'number' ? place.userRatingCount : 0,
    status: place.businessStatus || 'OPERATIONAL',
    telefone: place.nationalPhoneNumber || '',
    site: place.websiteUri || '',
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
  };
}

/* -------------------------------- handler -------------------------------- */

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      configurado: Boolean(KEY),
      exigeAuth: EXIGIR_AUTH,
      objetivos: Object.keys(TIPOS_POR_OBJETIVO),
      raio: { min: RAIO_MIN, max: RAIO_MAX },
      maxTotal: MAX_TOTAL,
    });
  }

  if (req.method !== 'POST') {
    return respostaErro(res, 405, 'metodo', 'Use POST.');
  }

  if (!KEY) {
    return respostaErro(
      res,
      503,
      'sem_config',
      'GOOGLE_MAPS_API_KEY nao configurada no servidor.',
      { hint: 'Vercel -> Settings -> Environment Variables -> GOOGLE_MAPS_API_KEY (sem prefixo VITE_).' }
    );
  }

  if (EXIGIR_AUTH) {
    const auth = await verificarIdToken(req.headers?.authorization);
    if (!auth.ok) {
      return respostaErro(res, 401, 'nao_autorizado', 'Sessao invalida ou ausente.', { motivo: auth.motivo });
    }
  }

  const corpo = typeof req.body === 'string' ? safeJson(req.body) : req.body || {};
  const endereco = textoCurto(corpo.endereco, 160);
  const raio = Number(corpo.raio);
  const objetivo = String(corpo.objetivo || 'comercial');

  if (endereco.length < 3) {
    return respostaErro(res, 400, 'entrada', 'Informe um endereco, bairro ou cidade (min. 3 caracteres).');
  }
  if (!Number.isFinite(raio) || raio < RAIO_MIN || raio > RAIO_MAX) {
    return respostaErro(res, 400, 'entrada', `Raio deve estar entre ${RAIO_MIN} e ${RAIO_MAX} metros.`);
  }
  if (!TIPOS_POR_OBJETIVO[objetivo]) {
    return respostaErro(res, 400, 'entrada', 'Objetivo invalido. Use "comercial" ou "entorno".');
  }

  const tiposPedidos = Array.isArray(corpo.tipos) ? corpo.tipos.map((t) => String(t)) : [];
  const tipos = tiposPedidos.length
    ? tiposPedidos.filter((t) => TIPOS_VALIDOS.has(t)).slice(0, 6)
    : TIPOS_POR_OBJETIVO[objetivo];

  if (!tipos.length) {
    return respostaErro(res, 400, 'entrada', 'Nenhum tipo valido informado.');
  }

  try {
    const ponto = await geocodificar(endereco);

    if (ponto.erro === 'endereco_nao_encontrado') {
      return respostaErro(
        res,
        422,
        'endereco_nao_encontrado',
        'Nao encontramos esse endereco. Tente incluir cidade e estado.'
      );
    }
    if (ponto.erro) {
      return respostaErro(res, 502, 'provedor', 'Falha ao localizar o endereco.', { detalhe: ponto.detalhe });
    }

    const resultados = await Promise.allSettled(tipos.map((tipo) => buscarPorTipo(ponto, raio, tipo)));

    const buscas = [];
    const mapa = new Map();
    let erroCota = false;
    let erroProvedor = null;

    resultados.forEach((resultado, indice) => {
      const tipo = tipos[indice];
      if (resultado.status === 'rejected') {
        buscas.push({ tipo, quantidade: 0, erro: 'tempo' });
        return;
      }
      const valor = resultado.value;
      if (valor.erro) {
        if (valor.erro === 'cota') erroCota = true;
        else erroProvedor = erroProvedor || valor.detalhe;
        buscas.push({ tipo, quantidade: 0, erro: valor.erro });
        return;
      }
      const lugares = valor.lugares || [];
      buscas.push({ tipo, quantidade: lugares.length });
      lugares.forEach((lugar) => {
        if (!lugar?.id || mapa.has(lugar.id)) return;
        mapa.set(lugar.id, normalizar(lugar));
      });
    });

    if (!mapa.size && erroCota) {
      return respostaErro(res, 429, 'cota', 'Cota da Google Places esgotada no momento.', { buscas });
    }
    if (!mapa.size && erroProvedor) {
      return respostaErro(res, 502, 'provedor', 'A Google Places recusou a consulta.', {
        detalhe: erroProvedor,
        hint: 'Confira se a Places API (New) e o Geocoding API estao habilitados e se a chave aceita esse uso.',
        buscas,
      });
    }

    const itens = [...mapa.values()].sort(
      (a, b) => (b.avaliacao || 0) - (a.avaliacao || 0) || (b.totalAvaliacoes || 0) - (a.totalAvaliacoes || 0)
    );

    const truncado = itens.length > MAX_TOTAL;

    return res.status(200).json({
      ok: true,
      centro: ponto,
      raio,
      objetivo,
      tipos,
      total: Math.min(itens.length, MAX_TOTAL),
      encontrados: itens.length,
      truncado,
      buscas,
      itens: itens.slice(0, MAX_TOTAL),
      avisos: erroCota
        ? ['Parte das categorias nao respondeu por cota. O resultado pode estar incompleto.']
        : [],
    });
  } catch (e) {
    const abortado = e?.name === 'TimeoutError' || e?.name === 'AbortError';
    return respostaErro(
      res,
      abortado ? 504 : 502,
      abortado ? 'tempo' : 'provedor',
      abortado ? 'A consulta demorou demais. Tente um raio menor.' : 'Falha inesperada na varredura.',
      { detalhe: String(e?.message || e).slice(0, 200) }
    );
  }
}

function safeJson(texto) {
  try {
    return JSON.parse(texto);
  } catch {
    return {};
  }
}
