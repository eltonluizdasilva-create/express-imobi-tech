/**
 * planosComerciais.js — os 5 degraus de venda da tela Meu Plano.
 * Fonte única da copy comercial: o componente só desenha, o teste confere.
 *
 * ESCADA (2026-11-20):
 *   1. Grátis            — R$ 0        abas operacionais + 7 Agentes de IA (vitrine)
 *   2. Essencial Plus    — R$ 39,90    Propostas & Negócios + Meta Ads & Criativos
 *   3. PRO               — R$ 99,00    demais módulos operacionais e de IA
 *   4. Pólen · Atendimento 24h — R$ 450+  atendimento IA no WhatsApp oficial
 *      (módulo independente; o Tom · Maestro da Imobiliária é R$ 497+, à parte)
 *   5. Presença Digital  — consultivo  site/portal, Google e tráfego pago
 *
 * Preço de verdade do SaaS continua em `shared/planos.json`; aqui está só a copy.
 */

export const ECONOMIA_ANUAL = 120;
export const TOTAL_ANUAL = 1068;

export const DEGRAUS = Object.freeze([
  {
    key: 'essencial',
    nome: 'Grátis',
    tag: 'Grátis',
    tipo: 'gratis',
    resumo: 'Para começar a vender hoje, sem cartão de crédito.',
    detalhePreco: 'R$ 0',
    periodo: '/mês',
    recursos: [
      'Visão Geral e CRM de leads em Kanban',
      'Captação e catálogo de imóveis',
      'Agenda de visitas e financeiro essencial',
      'Conexão WhatsApp padrão',
      '7 Agentes de IA (vitrine interativa gratuita)',
    ],
    cta: 'Plano atual',
  },
  {
    key: 'essencial_plus',
    nome: 'Essencial Plus',
    tag: 'Essencial Plus',
    tipo: 'checkout',
    resumo: 'Para quem já organiza os leads e quer fechar mais negócio.',
    precos: { mensal: 39.9, anual: 39.9 },
    recursos: [
      'Tudo do Grátis',
      'Propostas & Negócios (histórico e follow-up)',
      'Meta Ads & Criativos (copies e link p/ WhatsApp)',
    ],
    cta: 'Assinar Essencial Plus',
  },
  {
    key: 'pro',
    nome: 'Completo PRO',
    tag: 'PRO',
    tipo: 'checkout',
    destaque: true,
    selo: 'Mais escolhido',
    resumo: 'O corretor que opera sozinho e quer fechar mais rápido.',
    precos: { mensal: 99, anual: 89 },
    recursos: [
      'Tudo do Essencial Plus',
      'Avaliação PTAM com comparáveis',
      'Correspondente / Crédito completo',
      'Vistoria & Laudo IA',
      'Repasses & NFS-e',
      'Portais XML (ZAP/VivaReal/OLX)',
      'Assistentes Comercial, Fiscal e Jurídico',
    ],
    cta: 'Assinar Plano PRO Agora',
  },
  {
    key: 'automacao',
    nome: 'Pólen · Atendimento 24h',
    tag: 'Módulos independentes',
    tipo: 'consultivo',
    resumo:
      'Pólen, a atendente IA 24h no WhatsApp oficial da imobiliária. O Tom · Maestro da Imobiliária é um módulo próprio, contratado à parte ou em combo — um não inclui o outro.',
    detalhePreco: 'A partir de R$ 450',
    periodo: '/mês',
    implementacao: 'Taxa única de implantação',
    observacao:
      'Tom · Maestro da Imobiliária: R$ 497+/mês, contratável de forma independente (inclusive para quem já usa outro CRM) ou combinado com a Pólen. Implantação assistida cobrada à parte.',
    recursos: [
      'Tudo do PRO para a equipe',
      'Pólen 24/7 no WhatsApp oficial',
      'Qualificação automática de leads',
      'Consulta de estoque e agendamento',
      'Distribuição na Roleta de Leads',
      'Tom · Maestro da Imobiliária (opcional, à parte) — regras comerciais, processos, auditoria de equipe e memória operacional',
      'Implantação e acompanhamento dedicados',
    ],
    cta: 'Solicitar Implantação / Falar com Especialista',
  },
  {
    key: 'presenca_digital',
    nome: 'Presença Digital & Tráfego',
    tag: 'Sob consulta',
    tipo: 'consultivo',
    resumo: 'Vitrine própria no ar e tráfego sob gestão, com a verba de anúncios à parte.',
    detalhePreco: 'Setup R$ 690',
    periodo: '',
    implementacao: '(Vitrine/Portal sincronizado + Google Meu Negócio) + Gestão de Tráfego opcional R$ 490/mês',
    verba: 'Verba de anúncios à parte (paga direto às plataformas)',
    recursos: [
      'Vitrine/Portal próprio sincronizado — setup R$ 690',
      'Google Meu Negócio configurado e otimizado (incluso no setup)',
      'Gestão de Tráfego opcional — R$ 490/mês',
      'Verba de anúncios paga à parte (direto nas plataformas)',
    ],
    cta: 'Falar com Especialista',
  },
]);

export function precoMensal(degrau, ciclo = 'anual') {
  const valor = Number(degrau?.precos?.[ciclo] ?? degrau?.precos?.mensal ?? 0);
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
}

export function detalheCiclo(degrau, ciclo = 'anual') {
  if (degrau?.key !== 'pro') return '';
  if (ciclo === 'anual') {
    const total = TOTAL_ANUAL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
    return `Cobrado ${total}/ano ou em até 12x • Economize R$ ${ECONOMIA_ANUAL}`;
  }
  return 'Sem fidelidade, cancele quando quiser';
}

export function rotuloEconomia(ciclo = 'anual') {
  return ciclo === 'anual' ? `Economize R$ ${ECONOMIA_ANUAL}` : '';
}

export function degrauPorKey(key) {
  return DEGRAUS.find((d) => d.key === key) || null;
}
