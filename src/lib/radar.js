/**
 * radar.js — captação ativa de imóveis particulares.
 *
 * 1. Gerador de buscas (OLX, Facebook Marketplace, Google) filtradas por
 *    cidade/bairro/nicho, apontando para anúncio de particular.
 * 2. Extrator de anúncio colado (texto livre) + leitura de mercado.
 * 3. Scripts de abordagem no WhatsApp focados em PTAM + segurança jurídica.
 * 4. Feed XML padrão de portais (ZAP / VivaReal / OLX).
 */

import { avaliarImovel, TIPOLOGIAS } from './avaliacao.js';
import { regraUF } from './regrasEstaduais.js';

const T = (s) => encodeURIComponent(String(s || '').trim());

/* ───────────────────── 1. buscas prontas ───────────────────── */

const TERMOS_PARTICULAR = '"direto com proprietário" OR "sem corretor" OR "proprietário"';

export function montarBuscas({ cidade = '', bairro = '', uf = 'MG', nicho = 'urbano' } = {}) {
  const tipo = TIPOLOGIAS.find((t) => t.key === nicho) || TIPOLOGIAS[0];
  const alvo = `${tipo.label} ${bairro} ${cidade} ${uf}`.trim();
  const q = `${alvo} ${TERMOS_PARTICULAR}`;

  return [
    {
      portal: 'olx',
      label: 'OLX Imóveis',
      detalhe: 'Anúncios de particular na cidade/bairro',
      url: `https://www.olx.com.br/imoveis?q=${T(q)}`,
    },
    {
      portal: 'facebook',
      label: 'Facebook Marketplace',
      detalhe: 'Particulares e grupos de venda',
      url: `https://www.facebook.com/marketplace/search/?query=${T(alvo)}`,
    },
    {
      portal: 'google',
      label: 'Google (OLX + Marketplace)',
      detalhe: 'Varre os dois portais de uma vez',
      url: `https://www.google.com/search?q=${T(`site:olx.com.br OR site:facebook.com/marketplace ${q}`)}`,
    },
    {
      portal: 'grupos',
      label: 'Google — grupos de Facebook',
      detalhe: 'Grupos locais de compra e venda',
      url: `https://www.google.com/search?q=${T(`site:facebook.com/groups ${alvo} vende aluga`)}`,
    },
  ];
}

/* ────────────────── 2. extrator de anúncio ────────────────── */

function paraNumero(bruto) {
  if (!bruto) return 0;
  const limpo = String(bruto).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.');
  const n = parseFloat(limpo);
  return Number.isFinite(n) ? n : 0;
}

export function extrairAnuncio(texto = '') {
  const t = String(texto || '');

  // preço: R$ 450.000 / 450 mil / 1,2 mi
  let preco = 0;
  const mil = t.match(/r\$\s*([\d.,]+)\s*(mil|milh(?:ão|ao|ões|oes))/i);
  if (mil) {
    const base = paraNumero(mil[1]);
    preco = /milh/i.test(mil[2]) ? base * 1000000 : base * 1000;
  } else {
    const bruto = t.match(/r\$\s*([\d.,]+)/i) || t.match(/\b(\d{3}(?:\.\d{3})+)\b/);
    preco = paraNumero(bruto?.[1]);
  }

  // área: 120 m² / 120m2 / 3.500 m²
  const areaMatch = t.match(/([\d.,]+)\s*(m²|m2|metros quadrados)/i);
  const area = paraNumero(areaMatch?.[1]);

  // quartos e vagas
  const quartos = Number((t.match(/(\d+)\s*(quartos?|dormitórios?|dormitorios?|qto)/i) || [])[1]) || 0;
  const vagas = Number((t.match(/(\d+)\s*(vagas?|garagens?)/i) || [])[1]) || 0;

  // contato
  const tel = t.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?9?\d{4}[-.\s]?\d{4}/);
  const contato = tel ? tel[0].replace(/\s+/g, ' ').trim() : '';

  // tipo
  const tipoKey = /fazenda|s[ií]tio|ch[áa]cara|rural|hectare/i.test(t)
    ? 'rural'
    : /lote|terreno|quadra/i.test(t)
      ? 'loteamento'
      : /cobertura|mans[ãa]o|alto padr[ãa]o|luxo/i.test(t)
        ? 'alto_padrao'
        : 'urbano';

  // bairro: linha com "Bairro:" ou primeira palavra capitalizada após vírgula
  const bairroMatch = t.match(/bairro[:\s]+([A-Za-zÀ-ÿ\s]{3,40})/i);
  const bairro = bairroMatch ? bairroMatch[1].trim().replace(/\s{2,}/g, ' ') : '';

  return {
    preco,
    area,
    quartos,
    vagas,
    contato,
    tipoKey,
    bairro,
    textoOriginal: t.trim(),
    temPreco: preco > 0,
    temArea: area > 0,
  };
}

/** Compara o anúncio com a referência paramétrica da região. */
export function analisarAnuncio(anuncio = {}, { uf = 'MG', bairro = '', cidade = '' } = {}) {
  const referencia = avaliarImovel({
    uf,
    cidade,
    bairro: anuncio.bairro || bairro,
    tipologia: anuncio.tipoKey || 'urbano',
    padrao: 'normal',
    estado: 'bom',
    areaTotal: anuncio.area || 0,
    areaConstruida: anuncio.area || 0,
  });

  const precoM2 = anuncio.area > 0 ? anuncio.preco / anuncio.area : 0;
  const refM2 = referencia.precoUnitario || 0;
  const desvioPct = refM2 > 0 ? ((precoM2 - refM2) / refM2) * 100 : 0;

  let leitura;
  if (!anuncio.temArea || !anuncio.temPreco) {
    leitura = 'Anúncio incompleto: faltou preço ou área para comparar com o mercado.';
  } else if (desvioPct > 15) {
    leitura = `Pedido ${desvioPct.toFixed(0)}% acima da referência da região — argumento de avaliação técnica é forte aqui.`;
  } else if (desvioPct < -15) {
    leitura = `Pedido ${Math.abs(desvioPct).toFixed(0)}% abaixo da referência — preço de oportunidade, priorize a captação.`;
  } else {
    leitura = `Pedido dentro da faixa da região (${desvioPct > 0 ? '+' : ''}${desvioPct.toFixed(0)}%). Abordagem deve focar em prazo e segurança, não em preço.`;
  }

  return {
    uf: regraUF(uf).uf,
    precoM2: Math.round(precoM2),
    referenciaM2: Math.round(refM2),
    desvioPct: Number(desvioPct.toFixed(1)),
    leitura,
    referencia,
    faixa: {
      liquidez: referencia.cenarios[0].valor,
      justo: referencia.cenarios[1].valor,
      teto: referencia.cenarios[2].valor,
    },
  };
}

/* ─────────────── 3. scripts de abordagem ─────────────── */

const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export function gerarScriptsAbordagem(anuncio = {}, analise = {}, { imobiliaria = 'nossa imobiliária', uf = 'MG' } = {}) {
  const imovel = [anuncio.tipoKey === 'rural' ? 'a propriedade' : 'o imóvel', analise.referencia?.bairro].filter(Boolean).join(' ');
  const valor = anuncio.temPreco ? ` de ${brl(anuncio.preco)}` : '';
  const area = anuncio.temArea ? `${anuncio.area} ${analise.referencia?.unidade || 'm²'}` : 'a área informada';
  const sigla = regraUF(uf).imposto;

  return [
    {
      key: 'avaliacao',
      titulo: 'PTAM gratuito (foco em preço)',
      texto:
        `Olá! Vi seu anúncio${valor} (${area}) e trabalho com imóveis na região pela ${imobiliaria}.\n\n` +
        `Tenho um estudo de valores atualizado da sua região: imóveis parecidos estão saindo entre ${brl(analise.faixa?.liquidez || 0)} e ${brl(analise.faixa?.justo || 0)}.\n\n` +
        `Posso te enviar uma Avaliação Técnica (PTAM) gratuita, com os comparáveis que usei? Sem compromisso de exclusividade — é só para você ter o número certo na mão.`,
    },
    {
      key: 'juridico',
      titulo: 'Segurança jurídica (foco em risco)',
      texto:
        `Oi! Vi ${imovel} anunciado por você${valor}.\n\n` +
        `Muita negociação particular trava na documentação: matrícula, certidões, ${sigla} e contrato. Na ${imobiliaria} a gente faz a checagem de tudo antes de qualquer proposta.\n\n` +
        `Quer que eu revise a documentação do imóvel sem custo? Se estiver tudo certo, você vende mais rápido e sem dor de cabeça.`,
    },
    {
      key: 'prazo',
      titulo: 'Prazo real de venda (foco em tempo)',
      texto:
        `Olá! Seu anúncio${valor} está no ar há um tempo, certo?\n\n` +
        `Pela nossa base, imóveis com esse perfil em ${analise.referencia?.bairro || 'região'} levam cerca de ${analise.referencia?.prazoMedioDias || 60} dias para vender no preço justo.\n\n` +
        `Eu te mostro em 10 minutos o que está travando a venda (preço, fotos, ordem de anúncio) e o que muda se você anunciar com a gente. Quer que eu mande o estudo?`,
    },
  ];
}

/* ─────────────── 4. feed XML de portais ─────────────── */

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const TIPO_PORTAL = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  terreno: 'Terreno',
  lote: 'Terreno',
  rural: 'Rural',
  comercial: 'Comercial',
  cobertura: 'Cobertura',
};

function tipoPortal(imovel = {}) {
  const bruto = String(imovel.tipo || imovel.categoria || imovel.tipologia || 'casa').toLowerCase();
  const chave = Object.keys(TIPO_PORTAL).find((k) => bruto.includes(k));
  return TIPO_PORTAL[chave] || 'Casa';
}

/** XML no padrão de carga aceito por ZAP/VivaReal (Grupo OLX) e OLX. */
export function gerarXmlPortais(imoveis = [], oficina = {}) {
  const ativos = (imoveis || []).filter((i) => i && (i.ativo !== false) && (i.status || 'ativo') !== 'vendido');

  const itens = ativos.map((i, idx) => {
    const valor = Number(i.valor || i.preco || 0);
    const areaUtil = Number(i.areaUtil || i.areaConstruida || i.area || 0);
    const areaTotal = Number(i.areaTotal || i.area || areaUtil || 0);
    const fotos = [].concat(i.fotos || [], i.foto || i.fotoUrl || []).filter(Boolean);
    const codigo = i.id || `IMB${String(idx + 1).padStart(3, '0')}`;

    return [
      '    <Imovel>',
      `      <CodigoImovel>${esc(codigo)}</CodigoImovel>`,
      `      <TipoImovel>${esc(tipoPortal(i))}</TipoImovel>`,
      `      <SubTipoImovel>${esc(tipoPortal(i))}</SubTipoImovel>`,
      '      <TipoOferta>Venda</TipoOferta>',
      `      <UF>${esc(i.uf || oficina.uf || 'MG')}</UF>`,
      `      <Cidade>${esc(i.cidade || oficina.cidade || '')}</Cidade>`,
      `      <Bairro>${esc(i.bairro || '')}</Bairro>`,
      `      <Endereco>${esc(i.endereco || i.logradouro || '')}</Endereco>`,
      `      <PrecoVenda>${valor.toFixed(2)}</PrecoVenda>`,
      `      <AreaUtil>${areaUtil || ''}</AreaUtil>`,
      `      <AreaTotal>${areaTotal || ''}</AreaTotal>`,
      `      <QtdeDormitorios>${Number(i.quartos || i.dormitorios || 0)}</QtdeDormitorios>`,
      `      <QtdeBanheiros>${Number(i.banheiros || 0)}</QtdeBanheiros>`,
      `      <QtdeVagas>${Number(i.vagas || 0)}</QtdeVagas>`,
      `      <Observacao>${esc((i.descricao || i.observacao || '').replace(/[\r\n]+/g, ' '))}</Observacao>`,
      ...fotos.slice(0, 20).map((f) => `      <Foto>${esc(typeof f === 'string' ? f : f.url || '')}</Foto>`),
      '    </Imovel>',
    ].join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Carga>',
    '  <Anuncios>',
    ...itens,
    '  </Anuncios>',
    '  <Contato>',
    `    <Nome>${esc(oficina.nomeOficina || oficina.nome || '')}</Nome>`,
    `    <Email>${esc(oficina.email || '')}</Email>`,
    `    <Telefone>${esc(oficina.telefone || oficina.whatsapp || '')}</Telefone>`,
    `    <CRECI>${esc(oficina.creci || '')}</CRECI>`,
    '  </Contato>',
    '</Carga>',
  ].join('\n');
}

export function baixarArquivo(nome, conteudo, mime = 'application/xml') {
  if (typeof document === 'undefined') return null;
  const blob = new Blob([conteudo], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return nome;
}
