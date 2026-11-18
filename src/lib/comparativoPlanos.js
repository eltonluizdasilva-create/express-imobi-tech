/**
 * comparativoPlanos.js — gratuito × PRO, sem promessa que o plano não cumpre.
 * Os números vêm de shared/planos.json (limites): grátis 1 módulo / 1 corretor,
 * profissional 5 módulos / 3 corretores.
 */

export const COMPARATIVO_PRO = Object.freeze([
  { recurso: 'Módulos liberados no painel', gratis: '1', pro: '5' },
  { recurso: 'Corretores na equipe', gratis: '1', pro: '3' },
  { recurso: 'Funil, propostas e VGV avançado', gratis: false, pro: true },
  { recurso: 'Vistoria com laudo por IA', gratis: false, pro: true },
  { recurso: 'Relatórios completos', gratis: false, pro: true },
  { recurso: 'Gestão de corretores e equipe', gratis: false, pro: true },
  { recurso: 'Vitrine em /portal e Meta Ads', gratis: true, pro: true },
  { recurso: 'Suporte no WhatsApp', gratis: true, pro: true },
]);

/** Plano PRO comercializado (profissional) ou o primeiro pago auto-ativável. */
export function planoPro(planos = []) {
  const lista = Array.isArray(planos) ? planos : [];
  return (
    lista.find((p) => p.key === 'profissional')
    || lista.find((p) => p.autoAtivavel && Number(p?.preco?.mensal || 0) > 0)
    || null
  );
}

export function precoDoPlano(plano, ciclo = 'mensal') {
  if (!plano?.preco) return plano?.precoLabel || '';
  const valor = Number(plano.preco[ciclo] ?? plano.preco.mensal ?? 0);
  if (!valor) return 'R$ 0';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
}

/** Rótulo curto do valor usado na mensagem do WhatsApp. */
export function valorParaMensagem(plano, ciclo = 'mensal') {
  const preco = precoDoPlano(plano, ciclo);
  return preco ? `${preco}/${ciclo === 'anual' ? 'mês no anual' : 'mês'}` : '';
}
