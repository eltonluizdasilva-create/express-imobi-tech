/**
 * coresAbas.js — identidade de cor por aba.
 * O CTA superior, a barra ativa e o hero da aba usam a mesma cor,
 * como no painel de referência (Histórico azul, Financeiro âmbar, etc.).
 */

export const CORES_ABAS = {
  dashboard_imobi: { cor: '#10b981', nome: 'Esmeralda' },
  avaliacao_imovel: { cor: '#0ea5e9', nome: 'Azul-céu' },
  radar_captacao: { cor: '#f97316', nome: 'Laranja' },
  credito: { cor: '#0ea5e9', nome: 'Azul-céu' },
  captacao_imobi: { cor: '#22c55e', nome: 'Verde' },
  funil_leads: { cor: '#14b8a6', nome: 'Teal' },
  visitas_imobi: { cor: '#38bdf8', nome: 'Céu' },
  financeiro: { cor: '#f59e0b', nome: 'Âmbar' },
  historico: { cor: '#3b82f6', nome: 'Azul' },
  equipe: { cor: '#a855f7', nome: 'Roxo' },
  marketing: { cor: '#ec4899', nome: 'Rosa' },
  agentes_ia: { cor: '#8b5cf6', nome: 'Violeta' },
  whatsapp_hub: { cor: '#22c55e', nome: 'Verde' },
  copiloto: { cor: '#8b5cf6', nome: 'Violeta' },
  secretaria: { cor: '#7c3aed', nome: 'Violeta escuro' },
  administrador: { cor: '#6366f1', nome: 'Índigo' },
  contador: { cor: '#f97316', nome: 'Laranja' },
  juridico_imobi: { cor: '#f43f5e', nome: 'Rosa forte' },
  roleta_imobi: { cor: '#ef4444', nome: 'Vermelho' },
  tarefa: { cor: '#eab308', nome: 'Amarelo' },
  notafiscal: { cor: '#fb923c', nome: 'Laranja claro' },
  migracao: { cor: '#94a3b8', nome: 'Cinza azulado' },
  acompanhamento_cliente: { cor: '#06b6d4', nome: 'Ciano' },
  config: { cor: '#64748b', nome: 'Cinza' },
  especialista: { cor: '#10b981', nome: 'Esmeralda' },
  meuplano: { cor: '#fbbf24', nome: 'Dourado' },
  burocracias: { cor: '#f59e0b', nome: 'Âmbar' },
  youtube: { cor: '#ef4444', nome: 'Vermelho' },
  especialista: { cor: '#10b981', nome: 'Esmeralda' },
};

export const COR_PADRAO = '#10b981';

export function corDaAba(abaAtiva) {
  return CORES_ABAS[abaAtiva]?.cor || COR_PADRAO;
}

/** Texto legível sobre a cor (preto em tons claros, branco nos escuros) */
export function textoSobreCor(hex) {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return '#0b0f14';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.62 ? '#0b0f14' : '#ffffff';
}

/** rgba a partir do hex, com alpha */
export function comAlpha(hex, alpha) {
  const h = String(hex || COR_PADRAO).replace('#', '');
  if (h.length !== 6) return `rgba(16,185,129,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Copy do hero por aba (chip, manchete, subtítulo) */
export const HERO_ABAS = {
  dashboard_imobi: {
    chip: 'PAINEL EXECUTIVO',
    titulo: 'O seu dia inteiro em uma tela.',
    subtitulo: 'Em 5 segundos: quem responder, quem visitar e quanto vai receber — sem planilha paralela.',
  },
  captacao_imobi: {
    chip: 'CATÁLOGO DE IMÓVEIS',
    titulo: 'Sua carteira, pronta para vender.',
    subtitulo: 'Cadastre em 1 minuto e publique na vitrine e nos portais — sem digitar o mesmo dado duas vezes.',
  },
  funil_leads: {
    chip: 'CRM IMOBILIÁRIO',
    titulo: 'Cada lead no lugar certo, sem planilha.',
    subtitulo: 'Arraste o card conforme o cliente avança — o painel calcula o resto.',
  },
  visitas_imobi: {
    chip: 'AGENDA DE VISITAS',
    titulo: 'Visita marcada é negócio encaminhado.',
    subtitulo: 'Visita confirmada no WhatsApp antes do horário: menos plantão furado, mais negócio fechado.',
  },
  financeiro: {
    chip: 'GESTÃO FINANCEIRA',
    titulo: 'Seu lucro e despesas sob controle.',
    subtitulo: 'Quanto entra, quanto está travado e quanto vai receber — sem fechar o mês no escuro.',
  },
  historico: {
    chip: 'ARQUIVO DIGITAL',
    titulo: 'O histórico da sua imobiliária, organizado.',
    subtitulo: 'Propostas, negócios e laudos acessíveis em segundos — para você e para o cliente.',
  },
  equipe: {
    chip: 'GESTÃO DE EQUIPE',
    titulo: 'Quem vende, quanto vende, com qual acesso.',
    subtitulo: 'Quem está produzindo e quem está parado, por corretor — escala e comissão com número na mão.',
  },
  marketing: {
    chip: 'META ADS & CRIATIVOS',
    titulo: 'Anúncio que puxa conversa no WhatsApp.',
    subtitulo: 'Copy e criativo gerados a partir do imóvel, com link direto para o corretor.',
  },
  agentes_ia: {
    chip: 'ESQUADRÃO DE IA',
    titulo: 'Sete assistentes trabalhando 24 horas.',
    subtitulo: 'Qualificam, respondem e agendam — você entra quando o cliente está quente.',
  },
  whatsapp_hub: {
    chip: 'CONEXÃO WHATSAPP',
    titulo: 'O atendimento da imobiliária, conectado.',
    subtitulo: 'QR Code, teste com mensagem real e reconexão sem perder histórico.',
  },
  roleta_imobi: {
    chip: 'DISTRIBUIÇÃO DE LEADS',
    titulo: 'Lead dividido sem briga, com regra clara.',
    subtitulo: 'Ordem fixa ou por disponibilidade, com retorno automático para a fila.',
  },
  acompanhamento_cliente: {
    chip: 'RASTREIO DE PROCESSOS',
    titulo: 'O cliente acompanha sozinho o processo.',
    subtitulo: 'Código e senha por negócio: cada etapa marcada aparece no link do cliente.',
  },
  meuplano: {
    chip: 'PLANOS & ASSINATURA',
    titulo: 'O que está liberado hoje e o que muda no PRO.',
    subtitulo: 'Compare recursos, veja o trial e ative o plano sem sair do painel.',
  },
};

export function heroDaAba(abaAtiva, infoAba) {
  const hero = HERO_ABAS[abaAtiva];
  if (hero) return hero;
  return {
    chip: infoAba?.tituloCard || 'MÓDULO',
    titulo: infoAba?.tituloLimpo || 'Módulo do painel',
    subtitulo: infoAba?.descricao || 'Recurso do painel Express Imobi Tech.',
  };
}
