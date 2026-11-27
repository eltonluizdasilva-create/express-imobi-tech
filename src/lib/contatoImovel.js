/**
 * contatoImovel.js — quem o visitante chama no anúncio (puro, testável)
 * ============================================================================
 * Regra de produto (D-23.38): o anúncio de um imóvel na vitrine pública mostra
 * o WhatsApp da IMOBILIÁRIA dona do anúncio — nunca o número da Express Tech.
 * Se o imóvel não tiver WhatsApp do responsável publicado, o portal capta o
 * lead (nome + WhatsApp) em vez de emprestar o número do suporte.
 *
 * Nada aqui importa `contato.js` de propósito: o número do suporte (plataforma)
 * não é candidato a contato de anúncio.
 * ============================================================================
 */

/** DDI usado quando o número vem só com DDD (10 ou 11 dígitos). */
export const DDI_BRASIL = '55';

/** Menor quantidade de dígitos aceita (DDD + 8 ou 9 dígitos). */
export const MIN_DIGITOS_WHATSAPP = 10;

/** Maior quantidade de dígitos aceita em `wa.me` (DDI + DDD + 9). */
export const MAX_DIGITOS_WHATSAPP = 13;

/** Rótulo do imóvel usado em mensagens e links. */
export function rotuloCodigoImovel(imovel, fallback = 'IMÓVEL') {
  const bruto = imovel?.codigo || imovel?.referencia || imovel?.id || '';
  const texto = String(bruto || '').trim();
  return texto ? texto.toUpperCase() : fallback;
}

/**
 * Normaliza um telefone para `wa.me`: só dígitos, com DDI quando dá para inferir.
 * Devolve '' quando o valor não serve (curto demais, letras soltas, vazio).
 */
export function normalizarWhatsappImovel(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '');
  if (!digitos) return '';
  const semZero = digitos.replace(/^0+/, '');
  if (semZero.length < MIN_DIGITOS_WHATSAPP) return '';
  if (semZero.length > MAX_DIGITOS_WHATSAPP) return '';

  if (semZero.startsWith(DDI_BRASIL) && semZero.length >= 12) return semZero;
  // 10/11 dígitos = DDD + número: completa com o DDI do Brasil.
  if (semZero.length <= 11) return `${DDI_BRASIL}${semZero}`;
  // 12/13 dígitos com outro DDI (ex.: +856 do Business): mantém como veio.
  return semZero;
}

/**
 * WhatsApp que o anúncio deve exibir, na ordem de prioridade do cadastro.
 * Nunca devolve número da plataforma: sem dado no imóvel, devolve ''.
 */
export function whatsappDoImovel(imovel) {
  if (!imovel || typeof imovel !== 'object') return '';
  const candidatos = [
    imovel.whatsappCorretor,
    imovel.imobiliariaWhatsapp,
    imovel.whatsapp,
    imovel.telefoneCorretor,
    imovel.corretorWhatsapp,
    imovel.telefone,
  ];
  for (const candidato of candidatos) {
    const numero = normalizarWhatsappImovel(candidato);
    if (numero) return numero;
  }
  return '';
}

/** Nome da imobiliária/corretor responsável pelo anúncio. */
export function nomeDaImobiliariaDoImovel(imovel) {
  if (!imovel || typeof imovel !== 'object') return '';
  return String(
    imovel.imobiliariaNome || imovel.nomeImobiliaria || imovel.corretorResponsavel || '',
  ).trim();
}

/** CRECI que aparece no anúncio (quando publicado pelo tenant). */
export function creciDoImovel(imovel) {
  if (!imovel || typeof imovel !== 'object') return '';
  return String(imovel.imobiliariaCreci || imovel.creci || '').trim();
}

const fmtValor = (valor) => {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero <= 0) return '';
  try {
    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2,
    });
  } catch {
    return `R$ ${numero.toFixed(2)}`;
  }
};

/** Mensagem enviada ao responsável do anúncio. */
export function mensagemInteresseImovel(imovel, { nome = '' } = {}) {
  const imv = imovel && typeof imovel === 'object' ? imovel : {};
  const codigo = rotuloCodigoImovel(imv);
  const titulo = String(imv.titulo || '').trim();
  const onde = [imv.bairro, imv.cidade || imv.municipio]
    .map((v) => String(v || '').trim())
    .filter(Boolean)
    .join(', ');
  const valor = fmtValor(imv.valor);
  const quem = String(nome || '').trim();

  const partes = [];
  partes.push(
    quem
      ? `Olá! Sou ${quem} e tenho interesse no imóvel ${codigo}`
      : `Olá! Tenho interesse no imóvel ${codigo}`,
  );
  if (titulo) partes[0] += ` — ${titulo}`;
  partes[0] += '.';
  if (onde) partes.push(`Localização: ${onde}.`);
  if (valor) partes.push(`Valor anunciado: ${valor}.`);
  partes.push(
    imv.finalidade === 'Locação'
      ? 'Gostaria de saber as condições de locação e agendar uma visita.'
      : 'Gostaria de mais informações e de agendar uma visita.',
  );
  partes.push('Vi este anúncio na vitrine do portal.');
  return partes.join(' ');
}

/**
 * Link `wa.me` do responsável pelo anúncio.
 * Devolve '' quando o imóvel não tem WhatsApp publicado (o portal então capta
 * o lead em formulário próprio — não inventa destinatário).
 */
export function urlWhatsappImovel(imovel, opcoes = {}) {
  const numero = whatsappDoImovel(imovel);
  if (!numero) return '';
  const mensagem = mensagemInteresseImovel(imovel, opcoes);
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

/**
 * Link público do anúncio: `/portal?imobiliariaId=<id>&imovel=<código>`.
 * O código é a referência que o corretor divulga; o id do documento entra como
 * alternativa quando o anúncio ainda não tem código.
 */
export function urlImovelPortal(origem, imovel, { imobiliariaId = '' } = {}) {
  const base = String(origem || '').replace(/\/$/, '');
  const referencia = String(imovel?.codigo || imovel?.id || '').trim();
  const tenant = String(imobiliariaId || imovel?.oficinaId || '').trim();
  const params = new URLSearchParams();
  if (tenant) params.set('imobiliariaId', tenant);
  if (referencia) params.set('imovel', referencia);
  const busca = params.toString();
  return `${base}/portal${busca ? `?${busca}` : ''}`;
}

/** Compara o termo de `?imovel=` com o id do documento e com o código. */
export function imovelCorrespondeAoTermo(imovel, termo) {
  const alvo = String(termo || '').trim().toLowerCase();
  if (!alvo) return false;
  const chaves = [imovel?.id, imovel?.codigo, imovel?.referencia]
    .map((v) => String(v || '').trim().toLowerCase())
    .filter(Boolean);
  return chaves.includes(alvo);
}

/** Chave estável do cartão na vitrine (código, id ou título). */
export function chaveImovelPortal(imovel, indice = 0) {
  const chave = String(imovel?.codigo || imovel?.id || imovel?.titulo || '').trim();
  return chave || `imovel_${indice}`;
}

/** Marca o cartão como exemplo (nada de anúncio fictício disfarçado). */
export function imovelEhExemplo(imovel, { vitrineEmDemonstracao = false } = {}) {
  if (vitrineEmDemonstracao) return true;
  return String(imovel?.id || '').startsWith('vit_demo');
}
