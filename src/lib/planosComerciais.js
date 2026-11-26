/**
 * Copy comercial dos degraus e do serviço adicional de Presença Digital.
 * Preços, recursos e limites são lidos de shared/planos.json — nenhum número
 * ou texto de plano é escrito na mão aqui.
 *
 * Escada vigente (D-22.09 + regra de usuários de 23/11/2026):
 *   Grátis R$ 0 · PRO R$ 39,90 (1 usuário) · PLUS R$ 99,90 (até 3 usuários
 *   inclusos, +R$ 19,90/mês por usuário extra) e, contratados à parte, os
 *   módulos de IA: Pólen (R$ 450), Tom Autônomo (R$ 197) e Tom Imobiliária
 *   (R$ 497).
 */
import {
  getPlano,
  precoNoCiclo as precoCatalogo,
  rotuloUsuarios,
} from './planos.js';

const planoGratis = getPlano('gratis');
const planoPro = getPlano('pro');
const planoPlus = getPlano('plus');
const planoPolen = getPlano('esquadrao_ia');
const planoTomAutonomo = getPlano('tom_autonomo');
const planoTomImobiliaria = getPlano('tom_imobiliaria');
const planoPresencaDigital = getPlano('presenca_digital');
const textos = (plano) => (plano?.recursos || []).map((recurso) => recurso.texto);

const precoMensalPro = Number(planoPro?.preco?.mensal || 0);
const precoAnualPro = Number(planoPro?.preco?.anual ?? precoMensalPro);

export const ECONOMIA_ANUAL = Math.max(0, Math.round((precoMensalPro - precoAnualPro) * 12));
export const TOTAL_ANUAL = precoAnualPro * 12;

export const DEGRAUS = Object.freeze([
  {
    key: 'essencial',
    nome: planoGratis.nome,
    tag: 'Grátis',
    tipo: 'gratis',
    resumo: planoGratis.subtitulo,
    detalhePreco: precoCatalogo(planoGratis, 'mensal'),
    periodo: planoGratis.periodo,
    usuarios: rotuloUsuarios('gratis'),
    recursos: textos(planoGratis),
    cta: planoGratis.cta,
  },
  {
    key: 'pro',
    nome: planoPro.nome,
    tag: 'PRO',
    tipo: 'checkout',
    destaque: true,
    selo: 'Mais escolhido',
    resumo: planoPro.subtitulo,
    precos: planoPro.preco,
    periodo: planoPro.periodo,
    usuarios: rotuloUsuarios('pro'),
    recursos: textos(planoPro),
    cta: planoPro.cta,
  },
  {
    key: 'plus',
    nome: planoPlus.nome,
    tag: 'PLUS',
    tipo: 'checkout',
    resumo: planoPlus.subtitulo,
    precos: planoPlus.preco,
    periodo: planoPlus.periodo,
    usuarios: rotuloUsuarios('plus'),
    recursos: textos(planoPlus),
    cta: planoPlus.cta,
  },
  {
    key: 'esquadrao_ia',
    nome: planoPolen.nome,
    tag: 'Atendimento 24h',
    tipo: 'consultivo',
    resumo: planoPolen.subtitulo,
    detalhePreco: 'A partir de R$ 450,00',
    periodo: planoPolen.periodo,
    implementacao: planoPolen.setup,
    recursos: textos(planoPolen),
    cta: planoPolen.cta,
  },
  {
    key: 'tom_autonomo',
    nome: planoTomAutonomo.nome,
    tag: 'Segundo cérebro',
    tipo: 'consultivo',
    resumo: planoTomAutonomo.subtitulo,
    detalhePreco: 'A partir de R$ 197,00',
    periodo: planoTomAutonomo.periodo,
    recursos: textos(planoTomAutonomo),
    cta: planoTomAutonomo.cta,
  },
  {
    key: 'tom_imobiliaria',
    nome: planoTomImobiliaria.nome,
    tag: 'Operação customizada',
    tipo: 'consultivo',
    resumo: planoTomImobiliaria.subtitulo,
    detalhePreco: 'A partir de R$ 497,00',
    periodo: planoTomImobiliaria.periodo,
    implementacao: planoTomImobiliaria.setup,
    recursos: textos(planoTomImobiliaria),
    cta: planoTomImobiliaria.cta,
  },
]);

export const SERVICO_PRESENCA_DIGITAL = Object.freeze({
  key: planoPresencaDigital.key,
  nome: planoPresencaDigital.nome,
  resumo: planoPresencaDigital.subtitulo,
  detalhePreco: planoPresencaDigital.precoLabel,
  implementacao: planoPresencaDigital.setup,
  recursos: textos(planoPresencaDigital),
  cta: planoPresencaDigital.cta,
});

export function precoMensal(degrau, ciclo = 'mensal') {
  const valor = Number(degrau?.precos?.[ciclo] ?? degrau?.precos?.mensal ?? 0);
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
}

export function detalheCiclo(degrau, ciclo = 'mensal') {
  if (degrau?.key !== 'pro' && degrau?.key !== 'plus') return '';
  if (ciclo === 'anual') {
    const anual = Number(degrau?.precos?.anual ?? degrau?.precos?.mensal ?? 0);
    const total = (anual * 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
    return `Cobrado ${total}/ano`;
  }
  return 'Sem fidelidade, cancele quando quiser';
}

export function rotuloEconomia(ciclo = 'mensal') {
  return ciclo === 'anual' && ECONOMIA_ANUAL > 0 ? `Economize R$ ${ECONOMIA_ANUAL}` : '';
}

export function degrauPorKey(key) {
  return DEGRAUS.find((d) => d.key === key) || null;
}
