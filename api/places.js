/**
 * api/places.js — varredura de estabelecimentos por endereco + raio
 * ============================================================================
 * O navegador NUNCA fala com o provedor. Ele chama este endpoint.
 *
 * DOIS PROVEDORES, MESMO CONTRATO JSON
 *   1. Com `GOOGLE_MAPS_API_KEY` definida  -> Google (Geocoding + Places New).
 *   2. Sem a chave                        -> OpenStreetMap: Nominatim resolve o
 *      endereco e o Overpass API devolve os estabelecimentos no raio.
 * O formato de resposta e identico nos dois casos; o campo `provedor` diz de
 * onde veio. O front nao precisa saber qual esta ativo.
 *
 * CONTRATO
 *   POST /api/places
 *     Authorization: Bearer <idToken do Firebase Auth>   (obrigatorio)
 *     { "endereco": "Av. João Naves, 1000, Uberlândia - MG",
 *       "raio": 1000, "objetivo": "comercial" | "entorno" }
 *   -> 200 { ok, provedor, centro:{enderecoFormatado,lat,lng}, raio, objetivo,
 *            tipos, total, encontrados, truncado, buscas[],
 *            itens:[{ placeId, nome, categoria, endereco, avaliacao,
 *                     totalAvaliacoes, status, telefone, site, lat, lng }] }
 *
 *   GET /api/places  -> diagnostico (provedor ativo, limites, sem revelar chave)
 *
 * ERROS (codigo estavel para o front traduzir)
 *   400 entrada | 401 nao_autorizado | 405 metodo
 *   422 endereco_nao_encontrado | 429 cota | 502 provedor
 *   503 sem_config (so quando nenhum provedor serve) | 504 tempo
 *
 * NOTAS DE OPERACAO
 *   - Nominatim exige User-Agent identificavel e no maximo 1 req/s.
 *   - Overpass: `nwr(around:r,lat,lon)["chave"="valor"]` com igualdade (nao
 *     regex) e o que mantem a consulta em segundos. 3 espelhos com retry.
 *   - Orcamento total de 26 s: a funcao serverless morre em 30 s.
 * ============================================================================
 */

import { verificarIdToken } from './_authToken.js';

const KEY = process.env.GOOGLE_MAPS_API_KEY;
const EXIGIR_AUTH = String(process.env.PLACES_REQUIRE_AUTH ?? 'true') !== 'false';

const RAIO_MIN = 100;
const RAIO_MAX = 30000;
const POR_TIPO = 20;
const MAX_TOTAL = 80;
const ORCAMENTO_MS = 26000;

/* ═════════════════════════════ GOOGLE ═══════════════════════════════════ */

const TIPOS_GOOGLE = {
  comercial: ['store', 'restaurant', 'cafe', 'bakery', 'car_repair', 'beauty_salon'],
  entorno: ['school', 'hospital', 'supermarket', 'bank', 'pharmacy', 'park'],
};

const TIPOS_GOOGLE_VALIDOS = new Set(Object.values(TIPOS_GOOGLE).flat());

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

/* ═════════════════════════════ OPENSTREETMAP ════════════════════════════ */

const ESPELHOS_OVERPASS = [
  'https://overpass-api.de/api/interpreter',       // principal (global, mais completo)
  'https://overpass.kumi.systems/api/interpreter', // espelho global
  'https://overpass.private.coffee/api/interpreter', // espelho comunitário global
];

const AGENTE = 'ExpressImobiTech/1.0 (+https://expresstech.com.br; contato@expresstech.com.br)';

const TAGS_OSM = {
  comercial: {
    shop: ['supermarket', 'convenience', 'bakery', 'butcher', 'greengrocer', 'clothes', 'shoes', 'electronics', 'mobile_phone', 'furniture', 'hardware', 'car', 'car_repair', 'beauty', 'hairdresser', 'florist', 'pet', 'variety_store'],
    amenity: ['restaurant', 'cafe', 'fast_food', 'bar', 'bank', 'fuel', 'dentist', 'veterinary'],
    office: ['estate_agent', 'insurance', 'financial', 'lawyer', 'accountant'],
  },
  entorno: {
    amenity: ['school', 'kindergarten', 'university', 'college', 'hospital', 'clinic', 'pharmacy', 'bank', 'marketplace', 'community_centre'],
    shop: ['supermarket', 'mall', 'department_store'],
    leisure: ['park', 'playground', 'fitness_centre', 'sports_centre'],
  },
};

/** Tradução dos valores do OSM para o rótulo que aparece na tabela. */
const ROTULOS_OSM = {
  supermarket: 'Supermercado',
  convenience: 'Conveniência',
  bakery: 'Padaria',
  butcher: 'Açougue',
  greengrocer: 'Hortifruti',
  clothes: 'Loja de roupas',
  shoes: 'Loja de calçados',
  electronics: 'Eletrônicos',
  mobile_phone: 'Celulares',
  furniture: 'Móveis',
  hardware: 'Material de construção',
  car: 'Loja de veículos',
  car_repair: 'Oficina mecânica',
  beauty: 'Estética',
  hairdresser: 'Cabeleireiro',
  florist: 'Floricultura',
  pet: 'Pet shop',
  variety_store: 'Variedades',
  restaurant: 'Restaurante',
  cafe: 'Cafeteria',
  fast_food: 'Fast food',
  bar: 'Bar',
  bank: 'Banco',
  fuel: 'Posto de combustível',
  dentist: 'Dentista',
  veterinary: 'Veterinária',
  estate_agent: 'Imobiliária',
  insurance: 'Seguradora',
  financial: 'Financeira',
  lawyer: 'Advocacia',
  accountant: 'Contabilidade',
  school: 'Escola',
  kindergarten: 'Educação infantil',
  university: 'Universidade',
  college: 'Faculdade',
  hospital: 'Hospital',
  clinic: 'Clínica',
  pharmacy: 'Farmácia',
  marketplace: 'Mercado público',
  community_centre: 'Centro comunitário',
  mall: 'Shopping',
  department_store: 'Loja de departamentos',
  park: 'Praça / parque',
  playground: 'Playground',
  fitness_centre: 'Academia',
  sports_centre: 'Centro esportivo',
};

/**
 * Fallback quando o Overpass esta fora: o Photon (komoot) indexa o mesmo
 * OpenStreetMap e aceita filtro por tag + vies de coordenada. Testado: so
 * devolve o que interessa quando `q` e `osm_tag` vao juntos.
 */
const TAGS_PHOTON = {
  comercial: [
    'shop:supermarket',
    'amenity:restaurant',
    'shop:bakery',
    'amenity:bank',
    'shop:car_repair',
    'amenity:cafe',
  ],
  entorno: [
    'amenity:school',
    'amenity:pharmacy',
    'amenity:clinic',
    'shop:supermarket',
    'leisure:park',
  ],
};

/* ═════════════════════════════ utilidades ═══════════════════════════════ */

function respostaErro(res, status, codigo, mensagem, extra = {}) {
  return res.status(status).json({ ok: false, code: codigo, error: mensagem, ...extra });
}

function textoCurto(valor, max = 160) {
  return String(valor ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function safeJson(texto) {
  try {
    return JSON.parse(texto);
  } catch {
    return {};
  }
}

function humanizar(valor) {
  return String(valor || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/* ═══════════════════════════ Google: consulta ═══════════════════════════ */

function categoriaDoLugarGoogle(place) {
  const exibido = place?.primaryTypeDisplayName?.text;
  if (exibido) return textoCurto(exibido, 48);
  const tipo = (place?.types || [])[0];
  if (!tipo) return 'Estabelecimento';
  return humanizar(tipo);
}

async function geocodificarGoogle(endereco) {
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

async function buscarGooglePorTipo(centro, raio, tipo) {
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

function normalizarGoogle(place) {
  return {
    placeId: place.id,
    nome: textoCurto(place.displayName?.text || 'Sem nome', 90),
    categoria: categoriaDoLugarGoogle(place),
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

async function consultarGoogle(endereco, raio, objetivo, tiposPedidos) {
  const tipos = tiposPedidos.length
    ? tiposPedidos.filter((t) => TIPOS_GOOGLE_VALIDOS.has(t)).slice(0, 6)
    : TIPOS_GOOGLE[objetivo];

  if (!tipos.length) {
    return { status: 400, body: { ok: false, code: 'entrada', error: 'Nenhum tipo valido informado.' } };
  }

  const ponto = await geocodificarGoogle(endereco);

  if (ponto.erro === 'endereco_nao_encontrado') {
    return {
      status: 422,
      body: {
        ok: false,
        code: 'endereco_nao_encontrado',
        error: 'Nao encontramos esse endereco. Tente incluir cidade e estado.',
      },
    };
  }
  if (ponto.erro) {
    return {
      status: 502,
      body: { ok: false, code: 'provedor', error: 'Falha ao localizar o endereco.', detalhe: ponto.detalhe },
    };
  }

  const resultados = await Promise.allSettled(tipos.map((tipo) => buscarGooglePorTipo(ponto, raio, tipo)));

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
      mapa.set(lugar.id, normalizarGoogle(lugar));
    });
  });

  if (!mapa.size && erroCota) {
    return { status: 429, body: { ok: false, code: 'cota', error: 'Cota da Google Places esgotada no momento.', buscas } };
  }
  if (!mapa.size && erroProvedor) {
    return {
      status: 502,
      body: {
        ok: false,
        code: 'provedor',
        error: 'A Google Places recusou a consulta.',
        detalhe: erroProvedor,
        hint: 'Confira se a Places API (New) e o Geocoding API estao habilitados e se a chave aceita esse uso.',
        buscas,
      },
    };
  }

  const itens = [...mapa.values()].sort(
    (a, b) => (b.avaliacao || 0) - (a.avaliacao || 0) || (b.totalAvaliacoes || 0) - (a.totalAvaliacoes || 0)
  );

  return {
    status: 200,
    body: {
      ok: true,
      provedor: 'google',
      centro: ponto,
      raio,
      objetivo,
      tipos,
      total: Math.min(itens.length, MAX_TOTAL),
      encontrados: itens.length,
      truncado: itens.length > MAX_TOTAL,
      buscas,
      itens: itens.slice(0, MAX_TOTAL),
      avisos: erroCota ? ['Parte das categorias nao respondeu por cota. O resultado pode estar incompleto.'] : [],
    },
  };
}

/* ═══════════════════════ OpenStreetMap: consulta ════════════════════════ */

async function geocodificarOSM(endereco) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('accept-language', 'pt-BR');
  url.searchParams.set('countrycodes', 'br');
  url.searchParams.set('q', endereco);

  const r = await fetch(url, {
    headers: { Accept: 'application/json', 'Accept-Language': 'pt-BR', 'User-Agent': AGENTE },
    signal: AbortSignal.timeout(8000),
  });

  if (!r.ok) return { erro: 'provedor', detalhe: `nominatim HTTP ${r.status}` };

  const dados = await r.json().catch(() => []);
  const achado = Array.isArray(dados) ? dados[0] : null;

  if (!achado?.lat || !achado?.lon) return { erro: 'endereco_nao_encontrado' };

  return {
    lat: Number(achado.lat),
    lng: Number(achado.lon),
    enderecoFormatado: achado.display_name || endereco,
  };
}

/** Monta o Overpass QL: seletor + filtro espacial ANTES do filtro de tag. */
export function montarConsultaOverpass(lat, lon, raio, objetivo) {
  const area = `(around:${Math.round(raio)},${lat.toFixed(6)},${lon.toFixed(6)})`;
  const grupos = TAGS_OSM[objetivo] || TAGS_OSM.comercial;
  const linhas = [];

  Object.entries(grupos).forEach(([chave, valores]) => {
    valores.forEach((valor) => {
      linhas.push(`  nwr${area}["${chave}"="${valor}"];`);
    });
  });

  return `[out:json][timeout:20];\n(\n${linhas.join('\n')}\n);\nout center ${MAX_TOTAL + 40};`;
}

async function chamarOverpass(consulta, prazo) {
  const tentativas = [];

  for (const espelho of ESPELHOS_OVERPASS) {
    if (Date.now() > prazo) break;

    const restante = prazo - Date.now();
    const limite = Math.max(3500, Math.min(6000, restante));

    try {
      const r = await fetch(espelho, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': AGENTE,
          Accept: 'application/json',
        },
        body: new URLSearchParams({ data: consulta }),
        signal: AbortSignal.timeout(limite),
      });

      if (r.status === 400) {
        const texto = await r.text().catch(() => '');
        return { erro: 'provedor', detalhe: `overpass 400: ${texto.slice(0, 160)}`, tentativas };
      }

      if (r.status === 429 || r.status === 502 || r.status === 504) {
        tentativas.push({ espelho, status: r.status });
        continue; // servidor cheio: vale tentar o proximo espelho
      }

      if (!r.ok) {
        tentativas.push({ espelho, status: r.status });
        continue;
      }

      const j = await r.json().catch(() => ({}));
      return { elementos: j.elements || [], espelho, tentativas };
    } catch (e) {
      tentativas.push({ espelho, erro: String(e?.name || e?.message || e).slice(0, 80) });
    }
  }

  return { erro: 'cota', detalhe: 'todos os espelhos do Overpass falharam', tentativas };
}

function enderecoDoOSM(tags) {
  const via = tags['addr:street'];
  const numero = tags['addr:housenumber'];
  const bairro = tags['addr:suburb'] || tags['addr:neighbourhood'];
  const cidade = tags['addr:city'];

  const linha1 = [via, numero].filter(Boolean).join(', ');
  const linha2 = [bairro, cidade].filter(Boolean).join(' - ');

  return textoCurto([linha1, linha2].filter(Boolean).join(', '), 160);
}

function normalizarOSM(elemento) {
  const tags = elemento.tags || {};
  const nome = textoCurto(tags.name || tags.brand || tags.operator || '', 90);
  if (!nome) return null;

  const tipoBruto =
    (tags.shop && `shop:${tags.shop}`) ||
    (tags.amenity && `amenity:${tags.amenity}`) ||
    (tags.office && `office:${tags.office}`) ||
    (tags.leisure && `leisure:${tags.leisure}`) ||
    '';

  const valor = tipoBruto.split(':')[1] || '';
  const categoria = ROTULOS_OSM[valor] || humanizar(valor) || 'Estabelecimento';

  const lat = elemento.lat ?? elemento.center?.lat ?? null;
  const lng = elemento.lon ?? elemento.center?.lon ?? null;

  return {
    placeId: `osm:${elemento.type || 'node'}/${elemento.id}`,
    nome,
    categoria,
    endereco: enderecoDoOSM(tags),
    avaliacao: null,
    totalAvaliacoes: 0,
    status: 'OPERATIONAL',
    telefone: textoCurto(tags.phone || tags['contact:phone'] || '', 32),
    site: textoCurto(tags.website || tags['contact:website'] || '', 120),
    lat,
    lng,
  };
}

function distanciaMetros(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Busca POI pelo Photon (mesma base do OpenStreetMap) e filtra pelo raio de
 * verdade com haversine. As categorias vao em paralelo: 6 chamadas curtas em
 * vez de 6 seguidas, para caber no orcamento da funcao.
 */
async function buscarPOIsPhoton(centro, raio, objetivo, prazo) {
  const alvos = TAGS_PHOTON[objetivo] || TAGS_PHOTON.comercial;
  const tentativas = [];

  const buscarUm = async (alvo) => {
    const [, valor] = alvo.split(':');
    const termo = ROTULOS_OSM[valor] || valor.replace(/_/g, ' ');

    const url = new URL('https://photon.komoot.io/api/');
    url.searchParams.set('q', termo);
    url.searchParams.set('osm_tag', alvo);
    url.searchParams.set('lat', String(centro.lat));
    url.searchParams.set('lon', String(centro.lng));
    url.searchParams.set('limit', '20');

    const r = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': AGENTE },
      signal: AbortSignal.timeout(Math.max(2500, Math.min(8000, prazo - Date.now()))),
    });

    if (!r.ok) return { alvo, erro: `HTTP ${r.status}` };

    const dados = await r.json().catch(() => ({}));
    const feicoes = Array.isArray(dados?.features) ? dados.features : [];

    return {
      alvo,
      itens: feicoes
        .map((feicao) => {
          const props = feicao.properties || {};
          const coords = feicao.geometry?.coordinates;
          if (!Array.isArray(coords) || coords.length < 2) return null;

          const lng = Number(coords[0]);
          const lat = Number(coords[1]);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          if (distanciaMetros(centro.lat, centro.lng, lat, lng) > raio * 1.15) return null;
          if (!props.name) return null;

          return {
            placeId: `osm:${String(props.osm_type || 'node').toLowerCase()}/${props.osm_id}`,
            nome: textoCurto(props.name, 90),
            categoria: ROTULOS_OSM[props.osm_value] || humanizar(props.osm_value || valor),
            endereco: textoCurto(
              [props.street, props.housenumber, props.district, props.city].filter(Boolean).join(', '),
              160
            ),
            avaliacao: null,
            totalAvaliacoes: 0,
            status: 'OPERATIONAL',
            telefone: textoCurto(props.phone || props['contact:phone'] || '', 32),
            site: textoCurto(props.website || '', 120),
            lat,
            lng,
          };
        })
        .filter(Boolean),
    };
  };

  const resultados = await Promise.allSettled(alvos.map((alvo) => buscarUm(alvo)));

  const mapa = new Map();
  resultados.forEach((resultado) => {
    if (resultado.status === 'rejected') {
      tentativas.push({ erro: String(resultado.reason?.name || resultado.reason).slice(0, 40) });
      return;
    }
    const valor = resultado.value;
    if (valor.erro) {
      tentativas.push({ alvo: valor.alvo, erro: valor.erro });
      return;
    }
    (valor.itens || []).forEach((item) => {
      if (!mapa.has(item.placeId)) mapa.set(item.placeId, item);
    });
  });

  return { itens: [...mapa.values()], tentativas };
}

async function consultarOSM(endereco, raio, objetivo) {
  const limite = Date.now() + ORCAMENTO_MS;

  const ponto = await geocodificarOSM(endereco);

  if (ponto.erro === 'endereco_nao_encontrado') {
    return {
      status: 422,
      body: {
        ok: false,
        code: 'endereco_nao_encontrado',
        error: 'Nao encontramos esse endereco no OpenStreetMap. Tente incluir cidade e estado.',
      },
    };
  }
  if (ponto.erro) {
    return {
      status: 502,
      body: {
        ok: false,
        code: 'provedor',
        error: 'Falha ao localizar o endereco no OpenStreetMap.',
        detalhe: ponto.detalhe,
      },
    };
  }

  // O Overpass ganha no maximo 16 s; o resto do orcamento fica para a
  // alternativa do Nominatim, que funciona mesmo quando o Overpass esta caido.
  const consulta = montarConsultaOverpass(ponto.lat, ponto.lng, raio, objetivo);
  const prazoOverpass = Math.min(limite, Date.now() + 7000);
  const resultado = await chamarOverpass(consulta, prazoOverpass);

  const mapa = new Map();
  (resultado.elementos || []).forEach((elemento) => {
    const item = normalizarOSM(elemento);
    if (!item || !item.placeId) return;
    if (mapa.has(item.placeId)) return;
    mapa.set(item.placeId, item);
  });

  // Sem resultado do Overpass (vazio ou fora do ar): tenta o Nominatim com
  // viewbox antes de responder que nao ha nada no raio.
  let usouFallback = false;
  let tentativasFallback = [];
  if (mapa.size === 0) {
    const prazoFallback = Math.min(limite, Date.now() + 15000);
    const alternativa = await buscarPOIsPhoton(ponto, raio, objetivo, prazoFallback);
    tentativasFallback = alternativa.tentativas;
    alternativa.itens.forEach((item) => {
      if (!item.placeId || mapa.has(item.placeId)) return;
      mapa.set(item.placeId, item);
    });
    usouFallback = true;
  }

  // Nada em nenhuma fonte: agora sim devolve erro (ou lista vazia legitima).
  if (resultado.erro && mapa.size === 0) {
    const semTempo = /tempo|timeout|aborted/i.test(String(resultado.detalhe || '')) && !resultado.tentativas?.length;
    return {
      status: semTempo ? 504 : 429,
      body: {
        ok: false,
        code: semTempo ? 'tempo' : 'cota',
        error: semTempo
          ? 'O OpenStreetMap demorou demais para responder. Tente um raio menor.'
          : 'Servidores do OpenStreetMap ocupados agora. Tente novamente em alguns minutos.',
        detalhe: resultado.detalhe,
        tentativas: resultado.tentativas,
        tentativasFallback,
      },
    };
  }

  const grupos = TAGS_OSM[objetivo] || TAGS_OSM.comercial;
  const buscas = Object.entries(grupos).map(([chave, valores]) => ({
    tipo: chave,
    quantidade: valores.length,
  }));

  // O OSM nao traz nota; ordena quem tem contato primeiro e depois por nome.
  const itens = [...mapa.values()].sort((a, b) => {
    const contatoA = (a.telefone ? 1 : 0) + (a.site ? 1 : 0);
    const contatoB = (b.telefone ? 1 : 0) + (b.site ? 1 : 0);
    if (contatoB !== contatoA) return contatoB - contatoA;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });

  return {
    status: 200,
    body: {
      ok: true,
      provedor: 'openstreetmap',
      centro: ponto,
      raio,
      objetivo,
      tipos: Object.keys(grupos),
      total: Math.min(itens.length, MAX_TOTAL),
      encontrados: itens.length,
      truncado: itens.length > MAX_TOTAL,
      buscas,
      itens: itens.slice(0, MAX_TOTAL),
      avisos: [
        'Fonte: OpenStreetMap (dados abertos). Nao ha nota nem avaliacoes do Google; alguns locais podem nao ter telefone ou site.',
        ...(usouFallback && mapa.size
          ? ['O buscador principal (Overpass) estava ocupado; a lista veio da busca alternativa no mesmo OpenStreetMap.']
          : []),
      ],
      fonte: {
        nome: usouFallback ? 'OpenStreetMap / Photon (alternativa)' : 'OpenStreetMap / Overpass',
        espelho: resultado.espelho || null,
        erroOverpass: resultado.erro ? resultado.detalhe : null,
        tentativas: resultado.tentativas,
        tentativasFallback,
        usouFallback,
      },
    },
  };
}

/* ═══════════════════════════════ handler ════════════════════════════════ */

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      provedor: KEY ? 'google' : 'openstreetmap',
      configurado: Boolean(KEY),
      fallbackOSM: !KEY,
      exigeAuth: EXIGIR_AUTH,
      objetivos: Object.keys(TAGS_OSM),
      raio: { min: RAIO_MIN, max: RAIO_MAX },
      maxTotal: MAX_TOTAL,
    });
  }

  if (req.method !== 'POST') {
    return respostaErro(res, 405, 'metodo', 'Use POST.');
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
  if (!TAGS_OSM[objetivo]) {
    return respostaErro(res, 400, 'entrada', 'Objetivo invalido. Use "comercial" ou "entorno".');
  }

  const tiposPedidos = Array.isArray(corpo.tipos) ? corpo.tipos.map((t) => String(t)) : [];

  try {
    const saida = KEY
      ? await consultarGoogle(endereco, raio, objetivo, tiposPedidos)
      : await consultarOSM(endereco, raio, objetivo);

    return res.status(saida.status).json(saida.body);
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
