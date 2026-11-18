/**
 * planosComerciais.js — os 3 degraus de venda da tela Meu Plano.
 * Fonte única da copy comercial: o componente só desenha, o teste confere.
 */

export const ECONOMIA_ANUAL = 120;
export const TOTAL_ANUAL = 1068;

export const DEGRAUS = Object.freeze([
  {
    key: 'essencial',
    nome: 'Essencial',
    tag: 'Grátis',
    tipo: 'gratis',
    resumo: 'Para começar a vender hoje, sem cartão de crédito.',
    detalhePreco: 'R$ 0',
    periodo: '/mês',
    recursos: [
      'Vitrine Digital em /portal',
      'CRM básico de leads e funil',
      'Agenda de visitas',
      'Financeiro essencial',
      'Estúdio de Criativos',
    ],
    cta: 'Plano atual',
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
    nome: 'Imobiliárias & Automação WhatsApp 24/7',
    tag: 'Consultivo',
    tipo: 'consultivo',
    resumo: 'Para equipes de 2 a 20+ corretores que querem atendimento sem parar.',
    detalhePreco: 'A partir de R$ 497',
    periodo: '/mês',
    implementacao: 'Taxa única de implementação',
    recursos: [
      'Tudo do PRO para a equipe',
      'Agente Sofia 24/7 no WhatsApp',
      'Qualificação automática de leads',
      'Consulta de estoque e agendamento',
      'Distribuição na Roleta de Leads',
      'Implantação e acompanhamento dedicados',
    ],
    cta: 'Solicitar Implantação / Falar com Especialista',
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
