/**
 * portais.js — integração com portais imobiliários (puro, testável)
 * ============================================================================
 * Usado pelo navegador (painel) E pelas funções serverless (/api/*).
 * Sem React, sem Firestore, sem dependência externa: dá para importar no Node.
 * ============================================================================
 */

export const PORTAIS = [
  { key: 'zap', label: 'ZAP Imóveis', origem: 'Portal ZAP/VivaReal' },
  { key: 'vivareal', label: 'VivaReal', origem: 'Portal ZAP/VivaReal' },
  { key: 'olx', label: 'OLX', origem: 'Portal OLX' },
  { key: 'imovelweb', label: 'Imovelweb', origem: 'Portal Imovelweb' },
  { key: 'chavesnamao', label: 'Chaves na Mão', origem: 'Portal Chaves na Mão' },
  { key: 'generico', label: 'Outro / genérico', origem: 'Portal (integração)' },
];

export const ORIGEM_POR_PORTAL = PORTAIS.reduce((acc, p) => ({ ...acc, [p.key]: p.origem }), {});

const LIMITES = { texto: 240, descricao: 4000, mensagem: 1200, url: 500 };

/* --------------------------------- textos -------------------------------- */

/** Escapa & < > " ' — obrigatório em XML. */
export function escapeXml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Remove tags, normaliza espaços e limita tamanho. */
export function sanitizarTexto(valor, max = LIMITES.texto) {
  return String(valor ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Só dígitos, com DDD; devolve '' quando claramente inválido. */
export function normalizarTelefone(valor) {
  const d = String(valor ?? '').replace(/\D/g, '');
  if (d.length === 13 && d.startsWith('55')) return d;
  if (d.length === 11) return `55${d}`;
  if (d.length === 10) return `55${d}`;
  return d.length >= 8 ? d : '';
}

export function numeroOuZero(valor) {
  const n = Number(String(valor ?? '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/* ------------------------------ imóvel/XML ------------------------------- */

const TIPO_POR_EXTENSO = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  terreno: 'Terreno',
  lote: 'Terreno',
  chacara: 'Chácara',
  fazenda: 'Fazenda',
  sitio: 'Sítio',
  comercial: 'Comercial',
  sala: 'Comercial',
  galpao: 'Galpão',
  outro: 'Outros',
};

export function tipoParaPortal(tipo) {
  const t = String(tipo || '').toLowerCase();
  for (const [chave, valor] of Object.entries(TIPO_POR_EXTENSO)) {
    if (t.includes(chave)) return valor;
  }
  return 'Outros';
}

/** Normaliza o documento de imoveis_imobi para o formato do feed. */
export function normalizarImovelParaPortal(imovel = {}, oficina = {}) {
  const fotos = (Array.isArray(imovel.fotos) ? imovel.fotos : [])
    .filter((f) => typeof f === 'string' && /^https?:\/\//i.test(f))
    .slice(0, 20);
  const capa = /^https?:\/\//i.test(imovel.fotoCapa || '') ? imovel.fotoCapa : fotos[0] || '';
  if (capa && !fotos.includes(capa)) fotos.unshift(capa);

  const finalidade = String(imovel.finalidade || 'Venda');
  const ehAluguel = /aluguel|loca[cç][aã]o/i.test(finalidade);

  return {
    codigo: sanitizarTexto(imovel.codigo || imovel.id || '', 40),
    tipo: tipoParaPortal(imovel.tipo),
    subtipo: sanitizarTexto(imovel.padraoImovel || 'Padrão', 40),
    finalidade: ehAluguel ? 'Aluguel' : 'Venda',
    tipoOferta: ehAluguel ? '2' : '1',
    categoria: `${tipoParaPortal(imovel.tipo)} ${sanitizarTexto(imovel.padraoImovel || '', 20)}`.trim(),
    cidade: sanitizarTexto(imovel.cidade || oficina.cidade || '', 60),
    uf: sanitizarTexto(imovel.uf || oficina.uf || '', 2).toUpperCase(),
    bairro: sanitizarTexto(imovel.bairro || '', 80),
    endereco: sanitizarTexto(imovel.endereco || '', 160),
    cep: String(imovel.cep || '').replace(/\D/g, '').slice(0, 8),
    preco: numeroOuZero(imovel.valor),
    condominio: numeroOuZero(imovel.condominio || imovel.valorCondominio),
    areaUtil: numeroOuZero(imovel.metragem || imovel.areaConstruida || imovel.metragemTerreno),
    areaTotal: numeroOuZero(imovel.metragemTerreno || imovel.areaTotal),
    quartos: Number(imovel.quartos) || 0,
    banheiros: Number(imovel.banheiros) || 0,
    vagas: Number(imovel.vagas || imovel.garagem) || 0,
    suites: Number(imovel.suites) || 0,
    descricao: sanitizarTexto(imovel.descricao || imovel.observacoes || imovel.titulo || '', LIMITES.descricao),
    titulo: sanitizarTexto(imovel.titulo || '', 160),
    fotos,
    ehAluguel,
  };
}

/** Um imóvel pode entrar no feed? */
export function imovelPublicavel(imovel = {}) {
  if (!imovel || typeof imovel !== 'object') return false;
  if (imovel.publicarPortais === false) return false;
  if (String(imovel.status || 'Ativo').toLowerCase() !== 'ativo') return false;
  if (!sanitizarTexto(imovel.titulo || '')) return false;
  return numeroOuZero(imovel.valor) > 0;
}

function blocoImovel(i, dataAtualizacao) {
  const linhas = [
    '    <Imovel>',
    `      <CodigoImovel>${escapeXml(i.codigo)}</CodigoImovel>`,
    `      <TipoImovel>${escapeXml(i.tipo)}</TipoImovel>`,
    `      <SubTipoImovel>${escapeXml(i.subtipo)}</SubTipoImovel>`,
    `      <CategoriaImovel>${escapeXml(i.categoria)}</CategoriaImovel>`,
    `      <TipoOferta>${i.tipoOferta}</TipoOferta>`,
    `      <Finalidade>${i.ehAluguel ? 'Residencial' : 'Residencial'}</Finalidade>`,
    `      <Cidade>${escapeXml(i.cidade)}</Cidade>`,
    `      <UF>${escapeXml(i.uf)}</UF>`,
    `      <Bairro>${escapeXml(i.bairro)}</Bairro>`,
  ];
  if (i.endereco) linhas.push(`      <Endereco>${escapeXml(i.endereco)}</Endereco>`);
  if (i.cep) linhas.push(`      <CEP>${escapeXml(i.cep)}</CEP>`);
  if (i.ehAluguel) linhas.push(`      <PrecoAluguel>${i.preco.toFixed(2)}</PrecoAluguel>`);
  else linhas.push(`      <PrecoVenda>${i.preco.toFixed(2)}</PrecoVenda>`);
  if (i.condominio) linhas.push(`      <PrecoCondominio>${i.condominio.toFixed(2)}</PrecoCondominio>`);
  if (i.areaUtil) linhas.push(`      <AreaUtil>${i.areaUtil}</AreaUtil>`);
  if (i.areaTotal) linhas.push(`      <AreaTotal>${i.areaTotal}</AreaTotal>`);
  if (i.quartos) linhas.push(`      <QtdQuartos>${i.quartos}</QtdQuartos>`);
  if (i.suites) linhas.push(`      <QtdSuites>${i.suites}</QtdSuites>`);
  if (i.banheiros) linhas.push(`      <QtdBanheiros>${i.banheiros}</QtdBanheiros>`);
  if (i.vagas) linhas.push(`      <QtdVagas>${i.vagas}</QtdVagas>`);
  linhas.push(`      <Descricao>${escapeXml(i.descricao)}</Descricao>`);

  if (i.fotos.length) {
    linhas.push('      <Fotos>');
    i.fotos.forEach((url, idx) => {
      linhas.push('        <Foto>');
      linhas.push(`          <FotoURL>${escapeXml(url)}</FotoURL>`);
      linhas.push(`          <FotoPrincipal>${idx === 0 ? 1 : 0}</FotoPrincipal>`);
      linhas.push('        </Foto>');
    });
    linhas.push('      </Fotos>');
  }
  linhas.push(`      <DataAtualizacao>${dataAtualizacao}</DataAtualizacao>`);
  linhas.push('    </Imovel>');
  return linhas.join('\n');
}

/**
 * Gera o XML completo (Carga ZAP/VivaReal, compatível com OLX).
 * @param {Array} imoveis documentos de imoveis_imobi
 * @param {{oficina?: object, dataAtualizacao?: string}} opts
 */
export function gerarXmlImoveis(imoveis = [], { oficina = {}, dataAtualizacao } = {}) {
  const data = dataAtualizacao || new Date().toISOString().slice(0, 10);
  const lista = (Array.isArray(imoveis) ? imoveis : [])
    .filter(imovelPublicavel)
    .map((i) => normalizarImovelParaPortal(i, oficina));

  const blocos = lista.map((i) => blocoImovel(i, data)).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Carga>',
    '  <Imobiliaria>',
    `    <NomeImobiliaria>${escapeXml(sanitizarTexto(oficina.nomeOficina || oficina.nome || 'Imobiliária', 120))}</NomeImobiliaria>`,
    oficina.creci ? `    <CRECI>${escapeXml(oficina.creci)}</CRECI>` : '',
    oficina.whatsapp || oficina.telefone ? `    <Telefone>${escapeXml(oficina.whatsapp || oficina.telefone)}</Telefone>` : '',
    oficina.email ? `    <Email>${escapeXml(oficina.email)}</Email>` : '',
    `    <DataAtualizacao>${data}</DataAtualizacao>`,
    '  </Imobiliaria>',
    `  <Imoveis total="${lista.length}">`,
    blocos,
    '  </Imoveis>',
    '</Carga>',
    '',
  ].filter((l) => l !== '').join('\n');
}

/** Contagem rápida para o painel. */
export function resumoFeed(imoveis = []) {
  const total = Array.isArray(imoveis) ? imoveis.length : 0;
  const publicaveis = (imoveis || []).filter(imovelPublicavel).length;
  return { total, publicaveis, ocultos: total - publicaveis };
}

/* -------------------------------- token ---------------------------------- */

/** Comparação em tempo constante (evita side-channel de timing). */
export function validarToken(recebido, esperado) {
  const a = String(recebido ?? '');
  const b = String(esperado ?? '');
  if (!a || !b) return false;
  let diff = a.length ^ b.length;
  const maior = Math.max(a.length, b.length);
  for (let i = 0; i < maior; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/** Token de 32 hex chars. `aleatorio` é injetável para teste. */
export function gerarTokenPortal(aleatorio) {
  const bytes = new Uint8Array(16);
  if (typeof aleatorio === 'function') {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(aleatorio() * 256) % 256;
  } else if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/* ------------------------------- leads ----------------------------------- */

const CAMPOS_NOME = ['nome', 'name', 'nomeContato', 'contactName', 'cliente', 'leadName'];
const CAMPOS_TEL = ['telefone', 'phone', 'celular', 'phoneNumber', 'fone', 'whatsapp', 'contactPhone'];
const CAMPOS_EMAIL = ['email', 'e-mail', 'mail', 'contactEmail'];
const CAMPOS_MSG = ['mensagem', 'message', 'observacoes', 'observacao', 'comments', 'comentario', 'descricao'];
const CAMPOS_CODIGO = ['codigoImovel', 'codigo_imovel', 'propertyCode', 'listingId', 'ad_id', 'imovel', 'codigo', 'reference'];

function primeiroComValor(fonte, chaves) {
  for (const k of chaves) {
    const v = fonte?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return '';
}

/** Detecta o portal pela query, pelo campo `portal`/`fonte` ou pelo path. */
export function detectarPortal({ portal, body, headers } = {}) {
  const declarado = String(portal || body?.portal || body?.fonte || body?.source || '').toLowerCase();
  const achado = PORTAIS.find((p) => p.key === declarado);
  if (achado) return achado.key;

  const texto = JSON.stringify(body || {}).toLowerCase();
  if (texto.includes('olx')) return 'olx';
  if (texto.includes('vivareal') || texto.includes('zap')) return 'zap';
  if (texto.includes('imovelweb')) return 'imovelweb';
  if (texto.includes('chavesnamao') || texto.includes('chaves na mão')) return 'chavesnamao';

  const ua = String(headers?.['user-agent'] || headers?.['User-Agent'] || '').toLowerCase();
  if (ua.includes('olx')) return 'olx';
  if (ua.includes('zap') || ua.includes('vivareal')) return 'zap';
  return 'generico';
}

/**
 * Normaliza o payload do portal em um lead do CRM.
 * Aceita JSON plano, JSON aninhado ({lead:{...}}) e form-urlencoded já parseado.
 */
export function interpretarLeadPortal(body = {}, { portal = 'generico' } = {}) {
  const fonte = body?.lead || body?.data || body?.contato || body || {};
  const codigo = primeiroComValor(fonte, CAMPOS_CODIGO) || primeiroComValor(body, CAMPOS_CODIGO);

  return {
    portal,
    origem: ORIGEM_POR_PORTAL[portal] || ORIGEM_POR_PORTAL.generico,
    nome: sanitizarTexto(primeiroComValor(fonte, CAMPOS_NOME), 120),
    telefone: normalizarTelefone(primeiroComValor(fonte, CAMPOS_TEL)),
    email: sanitizarTexto(primeiroComValor(fonte, CAMPOS_EMAIL), 120).toLowerCase(),
    mensagem: sanitizarTexto(primeiroComValor(fonte, CAMPOS_MSG), LIMITES.mensagem),
    imovelCodigo: sanitizarTexto(codigo, 40),
    recebidoEm: new Date().toISOString(),
  };
}

/** Lead válido = tem nome e ao menos um contato. */
export function leadPortalValido(lead) {
  if (!lead) return false;
  if (!lead.nome) return false;
  return Boolean(lead.telefone || lead.email);
}

/** Payload Firestore do lead (mesmo formato do CRM). */
export function leadParaFirestore(lead, { imovelId = null, corretor = 'Portal' } = {}) {
  return {
    nome: lead.nome,
    telefone: lead.telefone,
    email: lead.email,
    interesse: 'Compra',
    bairro: '',
    orcamento: 0,
    estagio: 'Novo Lead',
    corretorResponsavel: corretor,
    origem: lead.origem,
    observacoes: [lead.mensagem, lead.imovelCodigo ? `Imóvel: ${lead.imovelCodigo}` : ''].filter(Boolean).join(' · ').slice(0, LIMITES.mensagem),
    imovelId: imovelId || null,
    codigoImovelPortal: lead.imovelCodigo || null,
    portal: lead.portal,
  };
}

/* --------------------------- extrator de e-mail -------------------------- */

/**
 * Extrai dados de um e-mail de portal colado pelo corretor.
 * Não é um parser de e-mail completo: procura rótulos comuns e padrões.
 */
export function extrairLeadDeEmail(texto = '') {
  const bruto = String(texto || '');
  const linhas = bruto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const acharPorRotulo = (rotulos) => {
    for (const linha of linhas) {
      for (const rotulo of rotulos) {
        const re = new RegExp(`^\\s*${rotulo}\\s*[:\\-]\\s*(.+)$`, 'i');
        const m = linha.match(re);
        if (m) return m[1].trim();
      }
    }
    return '';
  };

  const nome = sanitizarTexto(
    acharPorRotulo(['nome', 'name', 'cliente', 'contato', 'interessado'])
    || (bruto.match(/^\s*(?:nome|name)\s*[:\-]\s*([^\n]{3,80})/im)?.[1] || ''),
    120,
  );

  const telefoneBruto = acharPorRotulo(['telefone', 'celular', 'phone', 'fone', 'whatsapp', 'contato'])
    || (bruto.match(/(?:\+?55\s*)?\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}/)?.[0] || '');
  const telefone = normalizarTelefone(telefoneBruto);

  const email = sanitizarTexto(
    acharPorRotulo(['e-mail', 'email', 'mail']) || (bruto.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/)?.[0] || ''),
    120,
  ).toLowerCase();

  // Código do imóvel: 1) rótulo explícito; 2) padrão "PREFIXO-1234" no texto.
  // O segundo padrão exige letras no prefixo justamente para não capturar
  // telefone (que é só dígitos/separadores).
  const codigoPorRotulo = acharPorRotulo(['código do imóvel', 'codigo do imovel', 'código', 'codigo', 'código do anúncio', 'referência', 'referencia']);
  const codigoPorPadrao = bruto.match(/\b([A-Z]{2,5}[-_]?\d{3,10})\b/)?.[1] || '';
  const codigo = sanitizarTexto(
    codigoPorRotulo || codigoPorPadrao
    || (bruto.match(/(?:c[oó]digo|refer[eê]ncia)\s*[:#]?\s*([A-Z]{0,4}[-_]?\d{3,10})/i)?.[1] || ''),
    40,
  );

  const mensagem = sanitizarTexto(
    acharPorRotulo(['mensagem', 'message', 'observação', 'observacao']) || '',
    600,
  );

  const portalDetectado = detectarPortal({ body: { texto: bruto }, headers: {} });

  return {
    nome,
    telefone,
    email,
    imovelCodigo: codigo,
    mensagem,
    portal: portalDetectado,
    origem: ORIGEM_POR_PORTAL[portalDetectado] || ORIGEM_POR_PORTAL.generico,
    valido: Boolean(nome && (telefone || email)),
  };
}

/* --------------------------------- URLs ---------------------------------- */

export function urlFeedXml(baseUrl, oficinaId) {
  const base = String(baseUrl || '').replace(/\/$/, '');
  return `${base}/api/xml-portais?oficinaId=${encodeURIComponent(oficinaId || '')}`;
}

export function urlWebhook(baseUrl, oficinaId, token) {
  const base = String(baseUrl || '').replace(/\/$/, '');
  return `${base}/api/webhook-portais?oficinaId=${encodeURIComponent(oficinaId || '')}&token=${encodeURIComponent(token || '')}`;
}
