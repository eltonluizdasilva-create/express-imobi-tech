/**
 * gravacao.js — gravação da importação no Firestore/Storage (D-23.16)
 * ============================================================================
 * Destinos (os mesmos do painel, nada de coleção paralela):
 *   leads    -> oficinas/{id}/leads_imobi      (Funil CRM / Acompanhamento)
 *   imóveis  -> oficinas/{id}/imoveis_imobi    (Captação & Imóveis / vitrine)
 *   fotos    -> Storage: oficinas/{id}/migracao-imoveis/...
 *
 * Os documentos seguem o formato que o painel já lê: é o que faz o lead
 * aparecer no Funil e o imóvel na vitrine sem nenhuma tela extra.
 * ============================================================================
 */

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebase.js';
import { MAX_FOTOS_IMOVEL } from '../fotosImovel.js';
import { nomeArquivoWebp } from './fotos.js';

export const COLECAO_LEADS = 'leads_imobi';
export const COLECAO_IMOVEIS = 'imoveis_imobi';
export const PASTA_FOTOS = 'migracao-imoveis';

/** Estágio do funil a partir do status escrito na planilha/documento. */
export function estagioDoStatus(status) {
  const texto = String(status || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (/fechado|ganho|assinad|concluid/.test(texto)) return 'Fechado';
  if (/proposta|fechamento|negocia|aprovad|reserva|documenta/.test(texto)) return 'Proposta / Fechamento';
  if (/visita|agendad/.test(texto)) return 'Visita Agendada';
  if (/atendimento|qualificad|contato|interessad/.test(texto)) return 'Em Atendimento';
  return 'Novo Lead';
}

/** Lead da prévia → documento do Firestore (sem `undefined`). */
export function documentoLeadImportado(lead = {}, opcoes = {}) {
  const origemArquivo = String(opcoes.origemArquivo || '').slice(0, 120);
  return {
    nome: String(lead.nome || '').trim().slice(0, 120),
    telefone: String(lead.telefoneExibicao || lead.telefone || '').trim().slice(0, 20),
    telefoneE164: String(lead.telefone || '').slice(0, 16),
    email: String(lead.email || '').trim().slice(0, 120),
    interesse: String(lead.interesse || '').slice(0, 60),
    bairro: String(lead.bairro || '').slice(0, 80),
    cidade: String(lead.cidade || '').slice(0, 80),
    orcamento: Number(lead.orcamento) || 0,
    estagio: estagioDoStatus(lead.statusOriginal),
    statusOriginal: String(lead.statusOriginal || '').slice(0, 60),
    temperatura: lead.temperatura || 'frio',
    temperaturaOrigem: lead.temperaturaOrigem || 'sem-data',
    diasSemContato: Number.isFinite(lead.diasSemContato) ? lead.diasSemContato : null,
    dataUltimoContato: String(lead.dataContatoISO || '') || null,
    mensagemSugerida: String(lead.mensagem || '').slice(0, 500),
    observacoes: String(lead.observacoes || '').slice(0, 1000),
    corretorResponsavel: String(lead.corretor || '').slice(0, 80),
    origem: 'Migração de CRM',
    origemArquivo,
    importadoEm: new Date().toISOString(),
  };
}

/** Imóvel da prévia → documento do Firestore (mesmo formato da Captação). */
export function documentoImovelImportado(imovel = {}, opcoes = {}) {
  const fotos = Array.isArray(opcoes.urlsFotos) ? opcoes.urlsFotos.slice(0, MAX_FOTOS_IMOVEL) : [];
  return {
    titulo: String(imovel.titulo || '').trim().slice(0, 160),
    tipo: String(imovel.tipo || 'Imóvel').slice(0, 40),
    finalidade: String(imovel.finalidade || 'Venda').slice(0, 40),
    padraoImovel: 'Médio Padrão',
    status: 'Ativo',
    publico: false,
    publicarPortais: true,
    bairro: String(imovel.bairro || '').slice(0, 80),
    cidade: String(imovel.cidade || '').slice(0, 80),
    uf: String(imovel.uf || '').slice(0, 2),
    quartos: Number(imovel.quartos) || 0,
    banheiros: Number(imovel.banheiros) || 0,
    vagas: Number(imovel.vagas) || 0,
    areaUtil: Number(imovel.area) || 0,
    valor: Number(imovel.valor) || 0,
    descricao: String(imovel.descricao || '').slice(0, 1200),
    codigo: String(imovel.codigo || '').slice(0, 40),
    fotos,
    fotoCapa: fotos[0] || '',
    whatsappCorretor: String(opcoes.whatsappCorretor || '').slice(0, 20),
    origem: 'Migração de CRM',
    origemArquivo: String(opcoes.origemArquivo || '').slice(0, 120),
    importadoEm: new Date().toISOString(),
  };
}

function exigirConta(imobiliariaId) {
  if (!imobiliariaId) {
    throw new Error('Conta sem identificador de imobiliária (oficinas/{id}) — recarregue o painel e tente de novo.');
  }
}

/** Sobe uma foto já compactada e devolve a URL pública. */
export async function enviarFotoWebp({ imobiliariaId, arquivo, codigo, indice = 0 }) {
  exigirConta(imobiliariaId);
  if (!arquivo) return '';
  const nome = nomeArquivoWebp(codigo, indice);
  const caminho = `oficinas/${imobiliariaId}/${PASTA_FOTOS}/${Date.now()}-${nome}`;
  const referencia = ref(storage, caminho);
  await uploadBytes(referencia, arquivo, { contentType: 'image/webp' });
  return getDownloadURL(referencia);
}

/** Grava o lead em `leads_imobi` e devolve o id criado. */
export async function salvarLeadImportado({ imobiliariaId, lead, origemArquivo = '' }) {
  exigirConta(imobiliariaId);
  const documento = documentoLeadImportado(lead, { origemArquivo });
  const referencia = await addDoc(collection(db, 'oficinas', imobiliariaId, COLECAO_LEADS), {
    ...documento,
    criadoEm: serverTimestamp(),
  });
  return referencia.id;
}

/** Grava o imóvel em `imoveis_imobi` e devolve o id criado. */
export async function salvarImovelImportado({
  imobiliariaId,
  imovel,
  urlsFotos = [],
  whatsappCorretor = '',
  origemArquivo = '',
}) {
  exigirConta(imobiliariaId);
  const documento = documentoImovelImportado(imovel, { urlsFotos, whatsappCorretor, origemArquivo });
  const referencia = await addDoc(collection(db, 'oficinas', imobiliariaId, COLECAO_IMOVEIS), {
    ...documento,
    criadoEm: serverTimestamp(),
  });
  return referencia.id;
}
