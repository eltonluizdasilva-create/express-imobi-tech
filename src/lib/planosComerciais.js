/**
 * Copy comercial dos três planos e do serviço adicional de Presença Digital.
 * Preços, recursos e limites são lidos de shared/planos.json.
 */
import { getPlano, precoNoCiclo as precoCatalogo } from './planos.js';

const planoGratis = getPlano('gratis');
const planoPro = getPlano('pro');
const planoOperacaoIA = getPlano('esquadrao_ia');
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
    recursos: textos(planoPro),
    cta: planoPro.cta,
  },
  {
    key: 'automacao',
    nome: planoOperacaoIA.nome,
    tag: 'OPERAÇÃO IA',
    tipo: 'consultivo',
    resumo: planoOperacaoIA.subtitulo,
    detalhePreco: planoOperacaoIA.precoLabel,
    periodo: planoOperacaoIA.periodo,
    implementacao: planoOperacaoIA.setup,
    recursos: textos(planoOperacaoIA),
    cta: planoOperacaoIA.cta,
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
  if (degrau?.key !== 'pro') return '';
  if (ciclo === 'anual') {
    const total = TOTAL_ANUAL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
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
