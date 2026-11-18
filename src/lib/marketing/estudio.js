/**
 * estudio.js — regras do Estúdio de Posts (puro, testável)
 * ============================================================================
 * Sem DOM, sem Firestore. Só monta prompt, valida limites e interpreta o JSON.
 * LGPD: a entrada é uma LISTA BRANCA — nome, telefone, e-mail e CPF do cliente
 * nunca entram no prompt (o estúdio trabalha com o imóvel, não com a pessoa).
 * ============================================================================
 */

export const LIMITES = {
  headline: 45,
  bullet: 28,
  bullets: 3,
  variacoesTrafego: 3,
};

export const RODAPE_ILUSTRATIVO =
  'Imagem meramente ilustrativa • Condições sujeitas à análise';

export const AVISO_CREDITO =
  'Pré-simulação e condições sujeitas à análise do banco.';

/** Fundos arquitetônicos desenhados em canvas (sem imagem externa). */
export const FUNDOS = [
  { key: 'predios_por_do_sol', label: 'Prédios ao pôr do sol', indice: 0 },
  { key: 'casas_jardim', label: 'Casas com jardim', indice: 1 },
  { key: 'skyline_noturno', label: 'Skyline noturno', indice: 2 },
  { key: 'interior_luz_natural', label: 'Interior com luz natural', indice: 3 },
];

export const MODOS = [
  { key: 'imovel', label: 'Imóvel real', descricao: 'Foto e dados do imóvel da carteira — sem selo ilustrativo.' },
  { key: 'conceitual', label: 'Campanha conceitual', descricao: 'MCMV, bairro ou tema — fundo desenhado e rodapé ilustrativo.' },
];

/** Campos que podem ir para o modelo. */
export const CAMPOS_PERMITIDOS = [
  'modo', 'titulo', 'bairro', 'cidade', 'metragem', 'quartos', 'valor',
  'tema', 'faixaValor', 'subsidio', 'vantagens', 'publico', 'tom',
];

const soTexto = (v, max = 160) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const soNumero = (v) => {
  const n = Number(String(v ?? '').replace(/[^\d,.-]/g, '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/** Lista branca: devolve só o que o prompt precisa. */
export function sanitizarEntradaEstudio(bruto = {}) {
  const modo = bruto.modo === 'conceitual' ? 'conceitual' : 'imovel';
  const vantagens = Array.isArray(bruto.vantagens)
    ? bruto.vantagens.map((v) => soTexto(v, 70)).filter(Boolean).slice(0, 3)
    : [];

  return {
    modo,
    titulo: soTexto(bruto.titulo, 90),
    bairro: soTexto(bruto.bairro, 60),
    cidade: soTexto(bruto.cidade, 60),
    metragem: soNumero(bruto.metragem),
    quartos: soTexto(bruto.quartos, 10),
    valor: soNumero(bruto.valor),
    tema: soTexto(bruto.tema, 80),
    faixaValor: soTexto(bruto.faixaValor, 60),
    subsidio: soTexto(bruto.subsidio, 60),
    vantagens,
    publico: soTexto(bruto.publico, 120),
    tom: ['profissional', 'amigavel', 'urgente'].includes(bruto.tom) ? bruto.tom : 'profissional',
  };
}

const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/** Prompt único que devolve os 5 blocos. */
export function montarPromptEstudio(dados) {
  const d = sanitizarEntradaEstudio(dados);
  const contexto = d.modo === 'imovel'
    ? [
        `Imóvel: ${d.titulo || 'não informado'}`,
        `Bairro/cidade: ${d.bairro || '—'}/${d.cidade || '—'}`,
        `Metragem: ${d.metragem ? `${d.metragem} m²` : 'não informada'} · Quartos: ${d.quartos || '—'}`,
        `Valor: ${d.valor ? brl(d.valor) : 'não informado'}`,
        d.vantagens.length ? `Diferenciais: ${d.vantagens.join('; ')}` : 'Diferenciais: não informados',
      ].join('\n')
    : [
        `Tema da campanha: ${d.tema || 'não informado'}`,
        `Bairro/cidade: ${d.bairro || '—'}/${d.cidade || '—'}`,
        `Faixa de valor: ${d.faixaValor || 'não informada'}`,
        `Subsídio/condição: ${d.subsidio || 'não informado'}`,
        d.vantagens.length ? `Vantagens a destacar: ${d.vantagens.join('; ')}` : 'Vantagens: não informadas',
      ].join('\n');

  return `Você é redator publicitário de uma imobiliária brasileira. Crie o pacote de um post para Instagram/Facebook/TikTok.
Tom de voz: ${d.tom}. Público: ${d.publico || 'compradores e investidores da região'}.

CONTEXTO
${contexto}
Modo: ${d.modo === 'imovel' ? 'IMÓVEL REAL (anúncio direto, sem selo ilustrativo)' : 'CAMPANHA CONCEITUAL (MCMV/bairro; o rodapé "Imagem meramente ilustrativa • Condições sujeitas à análise" será aplicado na arte)'}

REGRAS
- headlineArte: no máximo ${LIMITES.headline} caracteres, sem emoji, sem aspas.
- bulletsArte: exatamente ${LIMITES.bullets} itens, cada um com no máximo ${LIMITES.bullet} caracteres, sem emoji.
- legendaInstagramFacebook: 2 a 4 parágrafos curtos + 6 a 10 hashtags ao final.
- roteiroTikTokReels: roteiro de 30 segundos com três partes nomeadas (gancho, apresentação, CTA), cada uma com 1 a 3 frases e uma dica de enquadramento.
- pacoteTrafegoPago: ${LIMITES.variacoesTrafego} variações de anúncio para Meta Ads, cada uma com titulo, texto, publico e objetivo (alcance, engajamento ou conversão).
- NUNCA invente preço, metragem ou condição que não estejam no contexto. Se faltar dado, use linguagem genérica.
- Não inclua nome de cliente, telefone, CPF ou e-mail.

FORMATO OBRIGATÓRIO (JSON válido, sem markdown):
{"headlineArte":"","bulletsArte":["","",""],"legendaInstagramFacebook":"","roteiroTikTokReels":{"gancho":"","apresentacao":"","cta":""},"pacoteTrafegoPago":[{"titulo":"","texto":"","publico":"","objetivo":""}]}`;
}

const cortar = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/** Interpreta e CLAMPA o JSON do modelo nos limites da arte. */
export function interpretarEstudio(texto = '') {
  const limpo = String(texto).replace(/```json/gi, '').replace(/```/g, '').trim();
  const ini = limpo.indexOf('{');
  const fim = limpo.lastIndexOf('}');
  if (ini === -1 || fim <= ini) return null;

  let d;
  try { d = JSON.parse(limpo.slice(ini, fim + 1)); } catch { return null; }

  const bullets = Array.isArray(d.bulletsArte) ? d.bulletsArte : [];
  const trafego = Array.isArray(d.pacoteTrafegoPago) ? d.pacoteTrafegoPago : [];

  return {
    headlineArte: cortar(d.headlineArte, LIMITES.headline),
    bulletsArte: bullets.slice(0, LIMITES.bullets).map((b) => cortar(b, LIMITES.bullet)),
    legendaInstagramFacebook: String(d.legendaInstagramFacebook || '').trim().slice(0, 2200),
    roteiroTikTokReels: {
      gancho: String(d.roteiroTikTokReels?.gancho || '').trim().slice(0, 400),
      apresentacao: String(d.roteiroTikTokReels?.apresentacao || '').trim().slice(0, 800),
      cta: String(d.roteiroTikTokReels?.cta || '').trim().slice(0, 400),
    },
    pacoteTrafegoPago: trafego.slice(0, LIMITES.variacoesTrafego).map((v) => ({
      titulo: cortar(v?.titulo, 60),
      texto: String(v?.texto || '').trim().slice(0, 600),
      publico: cortar(v?.publico, 160),
      objetivo: cortar(v?.objetivo, 40),
    })),
  };
}

/** Texto corrido do roteiro (para copiar). */
export function roteiroEmTexto(roteiro) {
  if (!roteiro) return '';
  return [
    `GANCHO (0-3s): ${roteiro.gancho || ''}`,
    `APRESENTAÇÃO (3-20s): ${roteiro.apresentacao || ''}`,
    `CTA (20-30s): ${roteiro.cta || ''}`,
  ].join('\n\n');
}

/** Texto corrido do pacote de tráfego (para copiar). */
export function trafegoEmTexto(pacote = []) {
  return (pacote || []).map((v, i) => [
    `VARIAÇÃO ${i + 1} — ${v.titulo}`,
    `Objetivo: ${v.objetivo}`,
    `Público: ${v.publico}`,
    '',
    v.texto,
  ].join('\n')).join('\n\n────────────\n\n');
}

/** Quebra de texto para o canvas (medida em caracteres, com palavra inteira). */
export function quebrarLinhas(texto, maxCharsPorLinha = 24, maxLinhas = 3) {
  const palavras = String(texto || '').trim().split(/\s+/).filter(Boolean);
  const linhas = [];
  let atual = '';
  for (const p of palavras) {
    const tentativa = atual ? `${atual} ${p}` : p;
    if (tentativa.length > maxCharsPorLinha && atual) {
      linhas.push(atual);
      atual = p;
      if (linhas.length === maxLinhas) break;
    } else {
      atual = tentativa;
    }
  }
  if (atual && linhas.length < maxLinhas) linhas.push(atual);
  if (linhas.length === maxLinhas && palavras.join(' ').length > linhas.join(' ').length) {
    linhas[maxLinhas - 1] = `${linhas[maxLinhas - 1].slice(0, Math.max(0, maxCharsPorLinha - 1))}…`;
  }
  return linhas;
}
