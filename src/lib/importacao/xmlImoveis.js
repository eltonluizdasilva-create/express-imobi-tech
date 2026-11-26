/**
 * xmlImoveis.js — leitura de XML de portais/CRMs (D-23.16)
 * ============================================================================
 * Suporta os formatos que o mercado imobiliário realmente entrega:
 *   VRSync (projeto padrão), ZAP, VivaReal, OLX e feeds genéricos.
 *
 * O parser é por regex de propósito: roda no navegador e em Node (testes),
 * sem DOMParser e sem dependência nova. Cada bloco é lido por alias de tag,
 * porque cada portal usa um nome diferente para o mesmo campo.
 *
 * REGRA DAS FOTOS: no máximo 7 por imóvel, na ordem do feed, e a Foto 1 é a
 * capa. O limite vem de `lib/fotosImovel.js` (fonte única, MAX_FOTOS_IMOVEL).
 * ============================================================================
 */

import { adicionarFotosImovel, MAX_FOTOS_IMOVEL } from '../fotosImovel.js';
import { parseValorMoeda } from './temperatura.js';

/** Tags que representam UM imóvel no feed. */
const TAGS_ITEM = ['imovel', 'listing', 'property', 'anuncio', 'advert', 'imovelimobi'];

/** Tags/atributos onde as fotos aparecem. */
const TAGS_FOTO = /<(MediaURL|FotoURL|Foto|Foto1|Imagem|Image|Picture|media_url|foto)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
const ATRIBUTOS_FOTO = /[a-z0-9_:-]*(?:url|foto|imagem|image|picture|media|midia)[a-z0-9_:-]*\s*=\s*["']([^"']+)["']/gi;
const URL_IMAGEM = /(?:https?:)?\/\/[^\s"'<>]+?\.(?:jpe?g|png|webp|gif|avif)(?:\?[^\s"'<>]*)?/gi;

const ALIASES_TAG = Object.freeze({
  codigo: ['CodigoImovel', 'Codigo', 'ListingID', 'Referencia', 'Reference', 'IdImovel', 'Id'],
  titulo: ['TituloImovel', 'Titulo', 'Title', 'Nome', 'TituloAnuncio'],
  tipo: ['TipoImovel', 'Tipo', 'PropertyType', 'TipoDeImovel', 'SubtipoImovel'],
  finalidade: ['Finalidade', 'TransactionType', 'Categoria', 'Objetivo'],
  bairro: ['Bairro', 'Neighborhood', 'District', 'Barrio'],
  cidade: ['Cidade', 'City', 'Municipio'],
  uf: ['Estado', 'State', 'UF'],
  valor: ['PrecoVenda', 'ValorVenda', 'Preco', 'Valor', 'Price', 'SalePrice', 'ValorAluguel', 'PrecoAluguel'],
  quartos: ['Quartos', 'Dormitorios', 'Bedrooms', 'QtdQuartos'],
  banheiros: ['Banheiros', 'Bathrooms', 'Suites'],
  vagas: ['Vagas', 'VagasGaragem', 'ParkingSpaces', 'Garagem'],
  area: ['AreaUtil', 'AreaPrivativa', 'AreaTotal', 'LivingArea', 'Metragem', 'Area'],
  descricao: ['Descricao', 'Description', 'Observacoes', 'Detalhes'],
});

/** CDATA, tags internas e entidades → texto limpo de uma linha. */
export function limparTexto(bruto) {
  return String(bruto ?? '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#3[49];/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function textoTag(bloco, aliases) {
  for (const alias of aliases) {
    const regex = new RegExp(`<${alias}\\b[^>]*>([\\s\\S]*?)<\\/${alias}>`, 'i');
    const achado = String(bloco || '').match(regex);
    const texto = achado ? limparTexto(achado[1]) : '';
    if (texto) return texto;
  }
  return '';
}

function numeroDe(texto) {
  const achado = String(texto ?? '').match(/\d+(?:[.,]\d+)?/);
  if (!achado) return 0;
  return Number.parseFloat(achado[0].replace('.', '').replace(',', '.')) || 0;
}

/** O bloco tem cara de imóvel? (evita capturar `<item>` de outra coisa) */
export function pareceImovel(bloco) {
  const texto = String(bloco ?? '');
  const marcadores = [
    /(valor|preco|price|saleprice)/i,
    /(quartos|dormitor|bedroom)/i,
    /(bairro|neighborhood)/i,
    /(metragem|areautil|areatotal|livingarea)/i,
    /(foto|mediaurl|imagem|image)/i,
    /(codigo|listingid|referencia)/i,
  ];
  return marcadores.filter((marcador) => marcador.test(texto)).length >= 2;
}

function blocosDe(xml, tag) {
  const regex = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const blocos = [];
  let achado = regex.exec(xml);
  while (achado) {
    blocos.push(achado[0]);
    achado = regex.exec(xml);
  }
  return blocos;
}

/** Todos os blocos de imóvel do feed (o formato com mais blocos válidos vence). */
export function localizarBlocos(xml) {
  const texto = String(xml ?? '');
  let melhor = [];

  for (const tag of TAGS_ITEM) {
    const blocos = blocosDe(texto, tag).filter(pareceImovel);
    if (blocos.length > melhor.length) melhor = blocos;
  }

  if (melhor.length === 0 && pareceImovel(texto)) return [texto];
  return melhor;
}

/** VRSync, ZAP, VivaReal, OLX ou feed genérico. */
export function detectarFormatoPortal(xml) {
  const texto = String(xml ?? '');
  if (/vrsync/i.test(texto)) return 'VRSync';
  if (/zap\s*im[oó]veis|zapimoveis/i.test(texto)) return 'ZAP';
  if (/vivareal/i.test(texto)) return 'VivaReal';
  if (/olx/i.test(texto)) return 'OLX';
  // Marcadores do formato, mesmo sem o nome do portal no feed.
  if (/listingid/i.test(texto)) return 'ZAP';
  if (/<anuncio\b/i.test(texto)) return 'OLX';
  if (/<(?:imovel|listing|property|imovelimobi)\b/i.test(texto)) return 'Feed XML';
  return 'Desconhecido';
}

/**
 * URLs de foto do bloco, na ordem do feed, sem repetir e no máximo 7.
 * A primeira da lista é a capa.
 */
export function coletarFotos(bloco) {
  const texto = String(bloco ?? '');
  // Tags auto-fechadas (<Foto url="..." />) são lidas por atributo: tirá-las
  // do primeiro passe evita que o regex de tag aberta engula a tag seguinte.
  const semAutoFechadas = texto.replace(/<[a-z0-9_:]+[^>]*\/>/gi, ' ');
  const encontradas = [];
  const empilhar = (url) => {
    const limpa = String(url || '').trim().replace(/&amp;/gi, '&');
    if (!limpa || /\s/.test(limpa)) return;
    const normalizada = limpa.startsWith('//') ? `https:${limpa}` : limpa;
    if (!/^https?:\/\//i.test(normalizada)) return;
    if (!encontradas.includes(normalizada)) encontradas.push(normalizada);
  };

  let achado = TAGS_FOTO.exec(semAutoFechadas);
  while (achado) {
    const atributos = achado[2] || '';
    const atributoUrl = atributos.match(/(?:url|href|src|path)\s*=\s*["']([^"']+)["']/i);
    if (atributoUrl) empilhar(atributoUrl[1]);
    const interno = limparTexto(achado[3]);
    const primeiraUrl = (interno.match(/(?:https?:)?\/\/\S+/) || [])[0] || '';
    empilhar(primeiraUrl);
    achado = TAGS_FOTO.exec(semAutoFechadas);
  }
  TAGS_FOTO.lastIndex = 0;

  let atributo = ATRIBUTOS_FOTO.exec(texto);
  while (atributo) {
    empilhar(atributo[1]);
    atributo = ATRIBUTOS_FOTO.exec(texto);
  }
  ATRIBUTOS_FOTO.lastIndex = 0;

  if (encontradas.length === 0) {
    const urls = texto.match(URL_IMAGEM) || [];
    urls.forEach(empilhar);
  }

  // Ordem do feed (a primeira é a capa), mesmo quando uma foto veio por
  // atributo e a seguinte por tag.
  const posicao = (url) => {
    const bruto = String(url).replace(/^https:/i, '');
    const indices = [texto.indexOf(url), texto.indexOf(bruto)].filter((indice) => indice >= 0);
    return indices.length ? Math.min(...indices) : Number.MAX_SAFE_INTEGER;
  };

  return adicionarFotosImovel([], [...encontradas].sort((a, b) => posicao(a) - posicao(b))).slice(
    0,
    MAX_FOTOS_IMOVEL,
  );
}

/* ------------------------------------------------------------------ */
/* NORMALIZAÇÃO                                                       */
/* ------------------------------------------------------------------ */

function rotuloTipo(texto) {
  const original = String(texto || '').trim();
  const tipo = original
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (!tipo) return 'Imóvel';
  if (/apartamento|apto|flat|studio|kitnet|cobertura|loft/.test(tipo)) return 'Apartamento';
  if (/casa|sobrado|village|residencial/.test(tipo)) return 'Casa';
  if (/fazenda|sitio|chacara|rural|gleba|haras|agricola/.test(tipo)) return 'Rural';
  if (/terreno|lote|quadra|area/.test(tipo)) return 'Terreno';
  if (/sala|loja|galpao|comercial|ponto|predio|barracao/.test(tipo)) return 'Comercial';
  return original;
}

function rotuloFinalidade(texto) {
  const finalidade = String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (/arrend/.test(finalidade)) return 'Arrendamento Rural';
  if (/alug|loca|rent/.test(finalidade)) return 'Locação';
  return 'Venda';
}

/** Campos comuns (XML e IA) → objeto pronto para a prévia e para o Firestore. */
export function montarImovel(campos = {}, indice = 0) {
  const fotos = adicionarFotosImovel([], Array.isArray(campos.fotos) ? campos.fotos : []).slice(
    0,
    MAX_FOTOS_IMOVEL,
  );
  const codigo = String(campos.codigo || '').trim();
  const bairro = String(campos.bairro || '').trim();
  const cidade = String(campos.cidade || '').trim();
  const tipo = rotuloTipo(campos.tipo);
  const valor = Number(campos.valor) || 0;

  const tituloInformado = String(campos.titulo || '').trim();
  const titulo =
    tituloInformado ||
    [tipo, bairro ? `em ${bairro}` : '', codigo ? `· ${codigo}` : ''].filter(Boolean).join(' ') ||
    `Imóvel importado ${indice + 1}`;

  const avisos = [];
  if (!valor) avisos.push('sem valor informado');
  if (!fotos.length) avisos.push('sem fotos no feed');
  if (!codigo) avisos.push('sem código de referência');

  return {
    id: `imovel-${codigo || indice}`,
    codigo,
    titulo,
    tipo,
    finalidade: rotuloFinalidade(campos.finalidade),
    bairro,
    cidade,
    uf: String(campos.uf || '').trim().toUpperCase().slice(0, 2),
    valor,
    quartos: Number(campos.quartos) || 0,
    banheiros: Number(campos.banheiros) || 0,
    vagas: Number(campos.vagas) || 0,
    area: Number(campos.area) || 0,
    descricao: String(campos.descricao || '').trim().slice(0, 1200),
    fotos,
    fotoCapa: fotos[0] || '',
    totalFotos: fotos.length,
    avisos,
    selecionado: true,
    valido: Boolean(valor || fotos.length || codigo || tituloInformado),
  };
}

/** Um bloco XML → imóvel. */
export function normalizarImovel(bloco, indice = 0) {
  return montarImovel(
    {
      codigo: textoTag(bloco, ALIASES_TAG.codigo),
      titulo: textoTag(bloco, ALIASES_TAG.titulo),
      tipo: textoTag(bloco, ALIASES_TAG.tipo),
      finalidade: textoTag(bloco, ALIASES_TAG.finalidade),
      bairro: textoTag(bloco, ALIASES_TAG.bairro),
      cidade: textoTag(bloco, ALIASES_TAG.cidade),
      uf: textoTag(bloco, ALIASES_TAG.uf),
      valor: parseValorMoeda(textoTag(bloco, ALIASES_TAG.valor)),
      quartos: numeroDe(textoTag(bloco, ALIASES_TAG.quartos)),
      banheiros: numeroDe(textoTag(bloco, ALIASES_TAG.banheiros)),
      vagas: numeroDe(textoTag(bloco, ALIASES_TAG.vagas)),
      area: numeroDe(textoTag(bloco, ALIASES_TAG.area)),
      descricao: textoTag(bloco, ALIASES_TAG.descricao),
      fotos: coletarFotos(bloco),
    },
    indice,
  );
}

/**
 * XML completo → imóveis + avisos + formato detectado.
 * @param {string} xml
 * @param {{ limite?: number }} opcoes
 */
export function parseXmlImoveis(xml, opcoes = {}) {
  const limite = Number(opcoes.limite) > 0 ? Number(opcoes.limite) : 200;
  const texto = String(xml ?? '').trim();
  const avisos = [];

  if (!texto || !/<[a-z!?]/i.test(texto)) {
    return { imoveis: [], avisos: ['Conteúdo XML vazio ou inválido.'], formato: 'Desconhecido', total: 0 };
  }

  const formato = detectarFormatoPortal(texto);
  const blocos = localizarBlocos(texto).slice(0, limite);
  const imoveis = blocos.map((bloco, indice) => normalizarImovel(bloco, indice)).filter((imovel) => imovel.valido);

  if (blocos.length === 0) {
    avisos.push('Nenhum bloco de imóvel reconhecido. Confira se o link abre um XML de imóveis (VRSync/ZAP/VivaReal/OLX).');
  } else if (imoveis.length === 0) {
    avisos.push('Os blocos encontrados não tinham valor, código ou foto — nada foi importado.');
  }
  if (blocos.length > limite) {
    avisos.push(`O feed tinha ${blocos.length} imóveis; os ${limite} primeiros foram lidos nesta rodada.`);
  }

  const semFotos = imoveis.filter((imovel) => imovel.totalFotos === 0).length;
  if (semFotos) avisos.push(`${semFotos} imóvel(is) vieram sem foto no feed.`);

  return { imoveis, avisos, formato, total: imoveis.length, blocosLidos: blocos.length };
}

/* ------------------------------------------------------------------ */
/* SAÍDA DA IA (PDF)                                                  */
/* ------------------------------------------------------------------ */

const chaveNormalizada = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Objeto devolvido pela IA → imóvel (mesmo formato do XML). */
export function normalizarImovelObjeto(objeto = {}, indice = 0) {
  const mapa = {};
  for (const [chave, valor] of Object.entries(objeto || {})) mapa[chaveNormalizada(chave)] = valor;

  const ler = (...chaves) => {
    for (const chave of chaves) {
      const valor = mapa[chaveNormalizada(chave)];
      if (valor !== undefined && valor !== null && String(valor).trim() !== '') return valor;
    }
    return '';
  };

  const fotosBrutas = ler('fotos', 'foto', 'imagens', 'urls', 'fotos url', 'imagens url');
  const fotos = (Array.isArray(fotosBrutas) ? fotosBrutas : [])
    .map((foto) => (typeof foto === 'string' ? foto : foto?.url || foto?.src || ''))
    .filter(Boolean);

  return montarImovel(
    {
      codigo: ler('codigo', 'codigo do imovel', 'referencia'),
      titulo: ler('titulo', 'nome', 'descricao curta'),
      tipo: ler('tipo', 'tipo de imovel', 'tipologia'),
      finalidade: ler('finalidade', 'transacao', 'negocio'),
      bairro: ler('bairro', 'regiao'),
      cidade: ler('cidade', 'municipio'),
      uf: ler('uf', 'estado'),
      valor: parseValorMoeda(ler('valor', 'preco', 'valor de venda', 'valor do imovel')),
      quartos: numeroDe(ler('quartos', 'dormitorios')),
      banheiros: numeroDe(ler('banheiros', 'banheiro', 'suites')),
      vagas: numeroDe(ler('vagas', 'garagem', 'vagas de garagem')),
      area: numeroDe(ler('area', 'metragem', 'area util', 'area total')),
      descricao: ler('descricao', 'observacoes', 'detalhes'),
      fotos,
    },
    indice,
  );
}

/** Lista de imóveis extraída de PDF/IA. */
export function normalizarImoveisDeObjetos(lista = []) {
  const imoveis = (Array.isArray(lista) ? lista : [])
    .map((objeto, indice) => normalizarImovelObjeto(objeto, indice))
    .filter((imovel) => imovel.valido);
  return {
    imoveis,
    avisos: imoveis.length ? [] : ['A IA não devolveu imóveis reconhecíveis no documento.'],
    formato: 'PDF/IA',
    total: imoveis.length,
  };
}
