/**
 * fotosExemplo.js — fotos de BANCO DE IMAGENS usadas como demonstração.
 * ============================================================================
 * As URLs abaixo apontam para o Unsplash (licença Unsplash: uso comercial livre,
 * sem exigência de crédito). Elas NÃO são fotos de imóvel de nenhum cliente.
 *
 * Regra (D-22.05): foto de exemplo nunca pode passar por foto real de anúncio.
 *   - `ehFotoExemplo()` é a única forma de detectar uma foto de demonstração;
 *   - a vitrine pública e o painel marcam a imagem com o selo "Exemplo";
 *   - o aviso ao corretor (`AVISO_FOTO_EXEMPLO`) aparece ao inserir a foto.
 *
 * Se um endereço novo entrar no produto, ele entra AQUI — assim as duas telas
 * que exibem a foto acompanham sozinhas.
 * ============================================================================
 */

const BASE_UNSPLASH = 'https://images.unsplash.com/';

/** Fotos de demonstração (mesmas três do "1-clique" e da vitrine de exemplo). */
export const FOTOS_EXEMPLO = Object.freeze({
  apartamento: `${BASE_UNSPLASH}photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80`,
  casa: `${BASE_UNSPLASH}photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=80`,
  fazenda: `${BASE_UNSPLASH}photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80`,
  interior: `${BASE_UNSPLASH}photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80`,
});

export const LISTA_FOTOS_EXEMPLO = Object.freeze(Object.values(FOTOS_EXEMPLO));

export const AVISO_FOTO_EXEMPLO =
  'Foto ilustrativa de banco de imagens (Unsplash), não é o imóvel do cliente. Troque pela foto real antes de publicar no portal.';

/** Compara só a parte estável da URL (sem os parâmetros de recorte). */
export function ehFotoExemplo(url) {
  const alvo = String(url || '').trim();
  if (!alvo) return false;
  return LISTA_FOTOS_EXEMPLO.some((exemplo) => alvo.startsWith(exemplo.split('?')[0]));
}

/** Alguma foto da lista é de exemplo? Usado para avisar antes de publicar. */
export function temFotoExemplo(urls) {
  const lista = Array.isArray(urls) ? urls : [urls];
  return lista.some((url) => ehFotoExemplo(url));
}
