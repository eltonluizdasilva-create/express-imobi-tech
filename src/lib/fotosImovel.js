export const MAX_FOTOS_IMOVEL = 7;

/**
 * Orçamento de bytes das fotos dentro de UM documento do Firestore.
 * O limite duro do Firestore é 1 MiB (1.048.576 bytes) por documento e o
 * `addDoc` do imóvel grava as fotos em base64 no mesmo documento. Sem esta
 * conta, 7 fotos comprimidas a 900px passavam de 1 MB, o `addDoc` falhava com
 * `invalid-argument` e a tela só registava o erro no console — o corretor via
 * "Salvar Imóvel" sem loading e sem o modal fechar (bug de produção).
 */
export const ORCAMENTO_DOCUMENTO_BYTES = 1048576;

/** 68% do teto do documento: sobra espaço para textos, datas e índices. */
export const ORCAMENTO_FOTOS_BYTES = 700000;

export function adicionarFotosImovel(fotosAtuais, fotosNovas) {
  const atuais = Array.isArray(fotosAtuais) ? fotosAtuais.slice(0, MAX_FOTOS_IMOVEL) : [];
  const novas = Array.isArray(fotosNovas) ? fotosNovas : [];
  const vagas = Math.max(0, MAX_FOTOS_IMOVEL - atuais.length);
  return [...atuais, ...novas.slice(0, vagas)];
}

/** Bytes reais de uma foto em data URL (base64 ≈ 3/4 do tamanho em texto). */
export function bytesDaFoto(foto) {
  if (typeof foto !== 'string') return 0;
  if (!foto.startsWith('data:')) return 0; // link http(s) não pesa no documento
  const virgula = foto.indexOf(',');
  if (virgula < 0) return 0;
  const base64 = foto.slice(virgula + 1);
  return Math.ceil((base64.length * 3) / 4);
}

/** Soma o peso das fotos embutidas (data URL) do imóvel. */
export function bytesDeFotos(fotos) {
  return (Array.isArray(fotos) ? fotos : []).reduce((total, foto) => total + bytesDaFoto(foto), 0);
}

/** Verdadeiro quando o conjunto de fotos cabe no orçamento do documento. */
export function fotosCabemNoOrcamento(fotos) {
  return bytesDeFotos(fotos) <= ORCAMENTO_FOTOS_BYTES;
}

/**
 * Mantém as primeiras fotos que cabem no orçamento (ordem do cadastro = ordem
 * da capa). Links externos nunca são descartados por peso.
 */
export function limitarFotosAoOrcamento(fotos) {
  const lista = Array.isArray(fotos) ? fotos : [];
  const aceitas = [];
  let usado = 0;
  for (const foto of lista) {
    const peso = bytesDaFoto(foto);
    if (peso > 0 && usado + peso > ORCAMENTO_FOTOS_BYTES) continue;
    usado += peso;
    aceitas.push(foto);
  }
  return aceitas;
}

