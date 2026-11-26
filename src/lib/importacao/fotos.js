/**
 * fotos.js — compactação das fotos de imóvel na importação (D-23.16)
 * ============================================================================
 * Regra única da Migração de CRM e da Captação:
 *   • WebP
 *   • largura/altura máxima 1280 px
 *   • qualidade 0.80
 *   • até 7 fotos por imóvel, na ordem enviada — a Foto 1 é a capa
 *
 * Usa `browser-image-compression` (mesmo pacote já usado em lib/utils.js).
 * Em Node/testes a compressão é ignorada: devolve o próprio arquivo, porque
 * canvas só existe no navegador.
 * ============================================================================
 */

import imageCompression from 'browser-image-compression';
import { adicionarFotosImovel, MAX_FOTOS_IMOVEL } from '../fotosImovel.js';

export const WEBP_IMOVEL = Object.freeze({
  maxWidthOrHeight: 1280,
  initialQuality: 0.8,
  fileType: 'image/webp',
  useWebWorker: true,
});

/** Corta para 7 preservando a ordem (a primeira é a capa). */
export function limitarFotos(fotos = []) {
  return adicionarFotosImovel([], Array.isArray(fotos) ? fotos : []).slice(0, MAX_FOTOS_IMOVEL);
}

/** WebP 1280/0.80. Nunca lança: sem suporte, devolve o original. */
export async function comprimirParaWebp(arquivo) {
  if (!arquivo) return null;
  if (typeof document === 'undefined') return arquivo;
  try {
    return await imageCompression(arquivo, WEBP_IMOVEL);
  } catch (erro) {
    console.warn('Falha ao compactar foto — seguindo com o original:', erro?.message || erro);
    return arquivo;
  }
}

/**
 * Lista de arquivos → lista pronta para upload.
 * @param {File[]} arquivos
 * @param {{ onProgresso?: (p: { atual: number, total: number }) => void }} opcoes
 * @returns {Promise<Array<{ arquivo: File, nome: string, capa: boolean }>>}
 */
export async function prepararFotosImovel(arquivos = [], opcoes = {}) {
  const lista = limitarFotos(arquivos);
  const resultado = [];

  for (let indice = 0; indice < lista.length; indice += 1) {
    const original = lista[indice];
    const comprimida = await comprimirParaWebp(original);
    resultado.push({
      arquivo: comprimida || original,
      nome: original?.name || `foto-${indice + 1}.webp`,
      capa: resultado.length === 0,
    });
    if (typeof opcoes.onProgresso === 'function') {
      opcoes.onProgresso({ atual: indice + 1, total: lista.length });
    }
  }

  return resultado;
}

/** Nome estável no Storage: codigo + ordem + `.webp`. */
export function nomeArquivoWebp(codigo, indice, prefixo = 'imovel') {
  const base = String(codigo || prefixo)
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .slice(0, 40) || prefixo;
  return `${base}-${String(indice + 1).padStart(2, '0')}.webp`;
}

/**
 * Baixa a foto do portal para compactar e subir ao Storage.
 * Devolve null quando o portal bloqueia CORS — o chamador mantém a URL
 * original em vez de perder a foto.
 */
export async function baixarFoto(url, buscar = null) {
  const fetchFn = buscar || (typeof fetch === 'function' ? fetch : null);
  if (!fetchFn) return null;
  try {
    const resposta = await fetchFn(url, { mode: 'cors' });
    if (!resposta?.ok) return null;
    const blob = await resposta.blob();
    if (!blob || !/^image\//i.test(blob.type || '')) return null;

    const nome = String(url || '')
      .split('?')[0]
      .split('/')
      .pop()
      .replace(/[^a-zA-Z0-9._-]/g, '_') || 'foto';
    const nomeFinal = /\.[a-z0-9]{2,5}$/i.test(nome) ? nome : `${nome}.jpg`;

    if (typeof File === 'undefined') return { blob, nome: nomeFinal };
    return new File([blob], nomeFinal, { type: blob.type || 'image/jpeg' });
  } catch {
    return null;
  }
}
