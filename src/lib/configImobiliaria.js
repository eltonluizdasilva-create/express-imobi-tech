/**
 * configImobiliaria.js — identidade da imobiliária (puro, testável)
 * ============================================================================
 * O painel sempre leu `oficinas/{id}/config/geral`, mas a tela de Configurações
 * gravava `oficinas/{id}/configuracoes/geral`. Resultado: o corretor salvava
 * nome/CRECI/WhatsApp e o checklist "Primeiros Passos" continuava em 0/3.
 *
 * Aqui ficam as funções que unificam as duas grafias: qualquer tela pode ler
 * as duas fontes, mesclar (a mais nova vence quando o campo está preenchido) e
 * gravar sempre no caminho canônico, mantendo o espelho legado.
 * ============================================================================
 */

import { normalizarWhatsappImovel } from './contatoImovel.js';

/** Coleção/documento canônico lido pelo painel e pelo onboarding. */
export const CONFIG_CANONICA = Object.freeze({ colecao: 'config', docId: 'geral' });

/** Espelho legado (telas antigas salvaram aqui). Só leitura + espelho. */
export const CONFIG_LEGADA = Object.freeze({ colecao: 'configuracoes', docId: 'geral' });

/** Verdadeiro para valores que valem a pena sobrescrever. */
export function valorPreenchido(valor) {
  if (valor === null || valor === undefined) return false;
  if (typeof valor === 'string') return valor.trim().length > 0;
  if (typeof valor === 'number') return !Number.isNaN(valor);
  if (typeof valor === 'boolean') return true;
  if (Array.isArray(valor)) return valor.length > 0;
  if (typeof valor === 'object') return Object.keys(valor).length > 0;
  return false;
}

/** Mescla fontes da esquerda para a direita; campo preenchido da direita vence. */
export function mesclarConfigImobiliaria(...fontes) {
  const saida = {};
  fontes.forEach((fonte) => {
    if (!fonte || typeof fonte !== 'object') return;
    Object.entries(fonte).forEach(([chave, valor]) => {
      if (!valorPreenchido(valor)) return;
      saida[chave] = valor;
    });
  });
  return saida;
}

/**
 * Devolve a config com os dois nomes de campo em sincronia (`nome`/
 * `nomeImobiliaria` e `telefone`/`whatsapp`). É o formato que a tela de
 * Configurações, o checklist e o anúncio público entendem.
 */
export function normalizarConfigImobiliaria(dados) {
  const base = dados && typeof dados === 'object' ? { ...dados } : {};
  const nome = String(base.nome || base.nomeImobiliaria || base.nomeOficina || '').trim();
  const creci = String(base.creci || base.registroCreci || '').trim();
  const telefoneBruto = base.whatsapp || base.telefone || base.telefoneComercial || base.celular || '';
  const whatsapp = normalizarWhatsappImovel(telefoneBruto) || String(telefoneBruto || '').trim();

  return {
    ...base,
    nome,
    nomeImobiliaria: nome,
    creci,
    whatsapp,
    telefone: base.telefone || whatsapp,
  };
}

/** Dados de identidade que vêm do documento da oficina (fonte secundária). */
function identidadeDaConta(dadosOficina) {
  if (!dadosOficina || typeof dadosOficina !== 'object') return {};
  const nome =
    dadosOficina.nome ||
    dadosOficina.nomeImobiliaria ||
    dadosOficina.nomeOficina ||
    dadosOficina.nomeCorretor ||
    '';
  const telefone = dadosOficina.whatsapp || dadosOficina.telefone || dadosOficina.telefoneComercial || '';
  return { nome, nomeImobiliaria: nome, whatsapp: telefone, creci: dadosOficina.creci || '' };
}

/**
 * Config pronta para `avaliarPassos`/`marcaConfigurada`: a config salva manda,
 * mas o cadastro da oficina cobre o caso de conta criada antes desta correção.
 */
export function configParaOnboarding(config, dadosOficina) {
  return normalizarConfigImobiliaria(
    mesclarConfigImobiliaria(identidadeDaConta(dadosOficina), config || {}),
  );
}

/**
 * Campos que ficam gravados no imóvel ao publicar (`publico: true`), para o
 * portal mostrar o WhatsApp/CRECI da imobiliária mesmo em visitante anónimo.
 */
export function snapshotMarcaImobiliaria(config, dadosOficina) {
  const marca = configParaOnboarding(config, dadosOficina);
  return {
    imobiliariaNome: marca.nome || '',
    imobiliariaWhatsapp: normalizarWhatsappImovel(marca.whatsapp || marca.telefone) || '',
    imobiliariaCreci: String(marca.creci || '').trim(),
  };
}
