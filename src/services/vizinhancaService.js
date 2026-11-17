/**
 * vizinhancaService.js — Raio-X de Vizinhança (1 km), 100% gratuito
 * ============================================================================
 * Fluxo: CEP -> ViaCEP (endereço) -> Nominatim/Photon (lat/lon) -> Overpass
 *        (pontos de interesse reais num raio de 1 km) -> Nota de Localização.
 *
 * Overpass: o nginx dele responde 406 para User-Agent vazio/`curl` puro. No
 * navegador o próprio UA do browser resolve; em testes via curl é preciso
 * enviar um UA descritivo.
 *
 * Todas as APIs são públicas e sem chave. Nenhuma chamada lança exceção para o
 * componente: qualquer falha vira { ok: false, motivo } e a avaliação continua
 * funcionando com o PTAM puro.
 * ============================================================================
 */

export const CATEGORIAS_ENTORNO = [
  { key: 'mercados',    label: 'Mercados e supermercados', icone: '🛒', peso: 0.30, ideal: 6  },
  { key: 'escolas',     label: 'Escolas e creches',        icone: '🏫', peso: 0.25, ideal: 4  },
  { key: 'saude',       label: 'Farmácias e saúde',        icone: '⚕️', peso: 0.20, ideal: 5  },
  { key: 'gastronomia', label: 'Padarias e restaurantes',  icone: '🥐', peso: 0.15, ideal: 12 },
  { key: 'lazer',       label: 'Praças e academias',       icone: '🌳', peso: 0.10, ideal: 4  },
];

const TIMEOUT_CURTO = 12000;
const TIMEOUT_LONGO = 30000;

const MIRRORS_OVERPASS = [
  'https://overpass-api.de/api/interpreter',      // principal (mais completo)
  'https://overpass.osm.ch/api/interpreter',      // espelho suíço
  'https://overpass.kumi.systems/api/interpreter',// espelho alternativo
];

/** Regras OSM -> categoria do relatório. A ordem importa (primeiro que casar vence). */
const REGRAS = [
  { cat: 'mercados',    tags: ['shop'],        valores: ['supermarket', 'convenience', 'greengrocer', 'butcher', 'grocery', 'marketplace', 'department_store'] },
  { cat: 'escolas',     tags: ['amenity'],     valores: ['school', 'kindergarten', 'college', 'university', 'library', 'childcare'] },
  { cat: 'saude',       tags: ['amenity'],     valores: ['pharmacy', 'hospital', 'clinic', 'doctors', 'dentist', 'veterinary'] },
  { cat: 'gastronomia', tags: ['amenity'],     valores: ['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'ice_cream', 'food_court'] },
  { cat: 'gastronomia', tags: ['shop'],        valores: ['bakery', 'pastry', 'coffee'] },
  { cat: 'lazer',       tags: ['leisure'],     valores: ['park', 'fitness_centre', 'playground', 'sports_centre', 'pitch', 'garden'] },
  { cat: 'lazer',       tags: ['amenity'],     valores: ['community_centre'] },
];

function categoriaDe(tags = {}) {
  for (const regra of REGRAS) {
    for (const tag of regra.tags) {
      if (tags[tag] && regra.valores.includes(tags[tag])) return regra.cat;
    }
  }
  return null;
}

async function comTimeout(url, opcoes = {}, ms = TIMEOUT_CURTO) {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), ms);
  try {
    return await fetch(url, { ...opcoes, signal: controle.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function normalizarCep(cep = '') {
  const digitos = String(cep).replace(/\D/g, '');
  return digitos.length === 8 ? digitos : '';
}

/** ViaCEP — endereço a partir do CEP. */
export async function buscarEnderecoPorCep(cep) {
  const limpo = normalizarCep(cep);
  if (!limpo) return { ok: false, motivo: 'CEP inválido (precisa de 8 dígitos)' };
  try {
    const r = await comTimeout(`https://viacep.com.br/ws/${limpo}/json/`);
    if (!r.ok) return { ok: false, motivo: `ViaCEP HTTP ${r.status}` };
    const d = await r.json();
    if (d.erro) return { ok: false, motivo: 'CEP não encontrado' };
    return {
      ok: true,
      cep: limpo,
      logradouro: d.logradouro || '',
      bairro: d.bairro || '',
      cidade: d.localidade || '',
      uf: d.uf || '',
      texto: [d.logradouro, d.bairro, d.localidade, d.uf].filter(Boolean).join(', '),
    };
  } catch (erro) {
    return { ok: false, motivo: erro?.name === 'AbortError' ? 'ViaCEP demorou demais' : 'ViaCEP indisponível' };
  }
}

/** Nominatim (OpenStreetMap) com fallback para Photon. */
export async function geocodificar(texto) {
  const consulta = String(texto || '').trim();
  if (consulta.length < 5) return { ok: false, motivo: 'Endereço curto demais para localizar' };

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=pt-BR&countrycodes=br&q=${encodeURIComponent(consulta)}`;
    const r = await comTimeout(url, {
      headers: {
        // Navegador não permite User-Agent customizado; os parâmetros abaixo
        // são o que a política do Nominatim aceita para identificar a aplicação.
        Accept: 'application/json',
        'Accept-Language': 'pt-BR',
      },
    });
    if (r.ok) {
      const dados = await r.json();
      const achado = Array.isArray(dados) ? dados[0] : null;
      if (achado?.lat && achado?.lon) {
        return {
          ok: true,
          lat: Number(achado.lat),
          lon: Number(achado.lon),
          rotulo: achado.display_name || consulta,
          fonte: 'Nominatim',
        };
      }
    }
  } catch { /* segue para o fallback */ }

  try {
    const url = `https://photon.komoot.io/api/?limit=1&lang=pt&q=${encodeURIComponent(consulta)}`;
    const r = await comTimeout(url);
    if (r.ok) {
      const dados = await r.json();
      const f = dados?.features?.[0];
      const coords = f?.geometry?.coordinates;
      if (Array.isArray(coords) && coords.length >= 2) {
        return {
          ok: true,
          lat: Number(coords[1]),
          lon: Number(coords[0]),
          rotulo: f?.properties?.name || consulta,
          fonte: 'Photon',
        };
      }
    }
  } catch { /* sem coordenadas */ }

  return { ok: false, motivo: 'Não foi possível localizar o endereço no mapa' };
}

function distanciaMetros(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

const TAGS_OVERPASS = {
  shop: ['supermarket', 'convenience', 'greengrocer', 'butcher', 'grocery', 'marketplace', 'department_store', 'bakery', 'pastry', 'coffee'],
  amenity: ['school', 'kindergarten', 'college', 'university', 'library', 'childcare', 'pharmacy', 'hospital', 'clinic', 'doctors', 'dentist', 'veterinary', 'restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'ice_cream', 'food_court', 'community_centre'],
  leisure: ['park', 'fitness_centre', 'playground', 'sports_centre', 'pitch', 'garden'],
};

/**
 * Overpass QL: o seletor de elemento e o filtro espacial vêm ANTES do filtro de
 * tag — `nwr(around:1000,lat,lon)["shop"="supermarket"]`. Usar igualdade em vez
 * de regex é MUITO mais barato no servidor (índice x varredura) e reduz o
 * tempo da consulta de ~40 s para poucos segundos.
 */
export function montarConsultaOverpass(lat, lon, raioMetros) {
  const area = `(around:${raioMetros},${lat.toFixed(6)},${lon.toFixed(6)})`;
  const clausulas = [];
  for (const [chave, valores] of Object.entries(TAGS_OVERPASS)) {
    for (const valor of valores) clausulas.push(`  nwr${area}["${chave}"="${valor}"];`);
  }
  return `[out:json][timeout:20];\n(\n${clausulas.join('\n')}\n);\nout center 120;`;
}

function converterElementos(elementos, lat, lon) {
  const pontos = [];
  for (const el of elementos) {
    const tags = el.tags || {};
    const categoria = categoriaDe(tags);
    if (!categoria) continue;
    const nome = tags.name || tags.brand || tags.operator;
    if (!nome) continue;
    const la = el.lat ?? el.center?.lat;
    const lo = el.lon ?? el.center?.lon;
    if (!Number.isFinite(la) || !Number.isFinite(lo)) continue;
    pontos.push({
      nome,
      categoria,
      tipo: tags.shop || tags.amenity || tags.leisure || 'local',
      endereco: [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(', '),
      metros: distanciaMetros(lat, lon, la, lo),
    });
  }
  const vistos = new Set();
  return pontos
    .filter((p) => {
      const chave = `${p.nome}|${p.categoria}`;
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    })
    .sort((a, b) => a.metros - b.metros);
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Overpass com 3 espelhos, retry com backoff e orçamento total de 45 s.
 * 502/504 significam "servidor cheio" — vale insistir; 400 é erro de sintaxe.
 */
export async function buscarPontosDeInteresse({ lat, lon, raioMetros = 1000 }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, motivo: 'Coordenadas inválidas' };
  }
  const consulta = montarConsultaOverpass(lat, lon, raioMetros);
  const limite = Date.now() + 45000;
  let ultimoMotivo = '';

  for (const espelho of MIRRORS_OVERPASS) {
    for (let tentativa = 1; tentativa <= 2; tentativa += 1) {
      if (Date.now() > limite) return { ok: false, motivo: ultimoMotivo || 'Overpass sem resposta a tempo' };
      try {
        const restante = Math.max(5000, Math.min(22000, limite - Date.now()));
        const r = await comTimeout(espelho, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(consulta)}`,
        }, restante);

        if (r.status === 400) {
          ultimoMotivo = 'Overpass rejeitou a consulta (400)';
          break; // erro de sintaxe não melhora trocando de espelho
        }
        if (r.status === 429 || r.status === 502 || r.status === 504 || r.status === 503) {
          ultimoMotivo = `Overpass ocupado (HTTP ${r.status})`;
          await espera(2000 * tentativa);
          continue;
        }
        if (!r.ok) { ultimoMotivo = `Overpass HTTP ${r.status}`; continue; }

        const dados = await r.json();
        const pontos = converterElementos(Array.isArray(dados?.elements) ? dados.elements : [], lat, lon);
        return { ok: true, pontos, fonte: espelho, tentativas: tentativa };
      } catch (erro) {
        ultimoMotivo = erro?.name === 'AbortError' ? 'Overpass demorou demais' : 'Overpass indisponível';
      }
    }
  }
  return { ok: false, motivo: ultimoMotivo || 'Overpass indisponível' };
}

/** Termos de busca por categoria usados no plano B (Nominatim). */
const TERMOS_NOMINATIM = {
  mercados: 'supermercado',
  escolas: 'escola',
  saude: 'farmacia',
  gastronomia: 'padaria',
  lazer: 'academia',
};

/**
 * PLANO B — quando o Overpass está saturado (comum no horário comercial).
 * Consulta o Nominatim uma vez por categoria, respeitando 1 req/s, e filtra por
 * distância real até o imóvel. Cobertura menor que o Overpass; por isso o
 * resultado é marcado como parcial.
 */
export async function buscarPontosViaNominatim({ lat, lon, raioMetros = 1000, cidade = '', uf = '' }) {
  const local = [cidade, uf, 'Brasil'].filter(Boolean).join(', ');
  if (!local || local.length < 4) return { ok: false, motivo: 'Cidade/UF necessários para o plano B' };

  const pontos = [];
  let respondeu = 0;
  for (const [categoria, termo] of Object.entries(TERMOS_NOMINATIM)) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=20&countrycodes=br&accept-language=pt-BR&q=${encodeURIComponent(`${termo}, ${local}`)}`;
    try {
      const r = await comTimeout(url, { headers: { Accept: 'application/json' } }, 15000);
      if (!r.ok) continue;
      const lista = await r.json();
      respondeu += 1;
      for (const item of Array.isArray(lista) ? lista : []) {
        const la = Number(item.lat);
        const lo = Number(item.lon);
        if (!Number.isFinite(la) || !Number.isFinite(lo)) continue;
        const metros = distanciaMetros(lat, lon, la, lo);
        if (metros > raioMetros) continue;
        const nome = item.name || String(item.display_name || '').split(',')[0];
        if (!nome) continue;
        pontos.push({ nome, categoria, tipo: termo, endereco: item.display_name || '', metros });
      }
    } catch { /* categoria sem resposta: segue */ }
    await espera(1100); // política do Nominatim: no máximo 1 requisição/segundo
  }

  if (!respondeu) return { ok: false, motivo: 'Nominatim indisponível' };
  const vistos = new Set();
  const unicos = pontos.filter((p) => {
    const chave = `${p.nome}|${p.categoria}`;
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  }).sort((a, b) => a.metros - b.metros);

  return { ok: true, pontos: unicos, fonte: 'Nominatim (plano B)', parcial: true };
}

/** Nota de Localização 0-100 (densidade com retorno decrescente por categoria). */
export function calcularNotaLocalizacao(contagem = {}) {
  let soma = 0;
  const detalhe = CATEGORIAS_ENTORNO.map((c) => {
    const achados = Number(contagem[c.key]) || 0;
    const fator = Math.min(1, achados / c.ideal);
    soma += fator * c.peso;
    return { ...c, achados, fator: Number(fator.toFixed(2)), pontos: Math.round(fator * c.peso * 100) };
  });
  const nota = Math.max(0, Math.min(100, Math.round(soma * 100)));
  return { nota, detalhe, classificacao: classificarNota(nota) };
}

export function classificarNota(nota) {
  if (nota >= 85) return 'Localização premium';
  if (nota >= 70) return 'Muito bem servido';
  if (nota >= 55) return 'Bem servido';
  if (nota >= 40) return 'Serviços básicos';
  if (nota >= 25) return 'Carente de serviços';
  return 'Isolado / rural';
}

/**
 * Orquestra tudo. Nunca lança: devolve sempre um objeto com `ok`.
 * @param {{ cep?: string, endereco?: string, cidade?: string, uf?: string, raioMetros?: number }} p
 */
export async function raioXDaVizinhanca({ cep = '', endereco = '', cidade = '', uf = '', raioMetros = 1000 } = {}) {
  let local = { ok: true, texto: String(endereco || '').trim(), cidade, uf };
  if (normalizarCep(cep)) {
    const viaCep = await buscarEnderecoPorCep(cep);
    if (viaCep.ok) {
      local = { ...viaCep, ok: true, texto: viaCep.texto };
    } else if (!local.texto) {
      return { ok: false, motivo: viaCep.motivo, nota: null, pontos: [], contagem: {}, categoria: 'indisponível' };
    }
  }

  const consulta = [local.texto, cidade || local.cidade, uf || local.uf, 'Brasil']
    .filter(Boolean).join(', ');
  if (!consulta || consulta.replace(/[,\s]/g, '').length < 5) {
    return { ok: false, motivo: 'Informe CEP ou endereço para o raio-X', nota: null, pontos: [], contagem: {} };
  }

  const geo = await geocodificar(consulta);
  if (!geo.ok) {
    return { ok: false, motivo: geo.motivo, nota: null, pontos: [], contagem: {}, endereco: consulta };
  }

  let pois = await buscarPontosDeInteresse({ lat: geo.lat, lon: geo.lon, raioMetros });
  let aviso = null;
  if (!pois.ok) {
    // Overpass saturado (502/504) é comum em horário comercial: plano B.
    aviso = pois.motivo;
    pois = await buscarPontosViaNominatim({
      lat: geo.lat, lon: geo.lon, raioMetros,
      cidade: local.cidade || cidade, uf: local.uf || uf,
    });
  }
  if (!pois.ok) {
    return {
      ok: false, motivo: `${pois.motivo}${aviso ? ` (Overpass: ${aviso})` : ''}`,
      nota: null, pontos: [], contagem: {},
      endereco: consulta, coords: { lat: geo.lat, lon: geo.lon }, fonteGeo: geo.fonte,
    };
  }

  const contagem = {};
  for (const p of pois.pontos) contagem[p.categoria] = (contagem[p.categoria] || 0) + 1;
  const nota = calcularNotaLocalizacao(contagem);

  return {
    ok: true,
    endereco: local.texto || consulta,
    coords: { lat: geo.lat, lon: geo.lon },
    fonteGeo: geo.fonte,
    fontePoi: pois.fonte,
    parcial: Boolean(pois.parcial),
    aviso,
    raioMetros,
    contagem,
    nota: nota.nota,
    classificacao: nota.classificacao,
    detalhe: nota.detalhe,
    pontos: pois.pontos,
    total: pois.pontos.length,
    consultadoEm: new Date().toISOString(),
  };
}

/** Lista curta para o prompt da IA (economiza tokens). */
export function resumirParaIA(viz) {
  if (!viz?.ok) return 'Vizinhança: indisponível (' + (viz?.motivo || 'sem dados') + ')';
  const porCategoria = CATEGORIAS_ENTORNO.map((c) => {
    const nomes = viz.pontos.filter((p) => p.categoria === c.key).slice(0, 5).map((p) => `${p.nome} (${p.metros}m)`);
    return `- ${c.label}: ${viz.contagem[c.key] || 0}${nomes.length ? ' — ' + nomes.join('; ') : ''}`;
  });
  return `Raio de ${viz.raioMetros}m em ${viz.endereco}. Nota de Localização: ${viz.nota}/100 (${viz.classificacao}). Total de ${viz.total} pontos${viz.parcial ? ' (levantamento parcial via Nominatim: o Overpass estava saturado)' : ''}.\n${porCategoria.join('\n')}`;
}
