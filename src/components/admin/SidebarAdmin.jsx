import React, { useState, useEffect } from 'react';
import {
  Lock,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  Building2,
  Users,
  CalendarCheck,
  CircleDollarSign,
  Briefcase,
  Compass,
  ArrowLeftRight,
  Award,
  Sliders,
  FileSignature,
  ScanLine,
  Calculator,
  Scale,
  Target,
  Radar,
  TrendingUp,
  Landmark,
  Receipt,
  Mic,
  MessageSquareQuote,
  Cpu,
  Brain,
  Layers,
  Zap,
  Rocket,
  MousePointer2,
  Shuffle,
  FileText,
  KeyRound,
} from 'lucide-react';
import LogoExpress from '../ui/LogoExpress';
import { DOR_SOLUCAO } from '../../lib/copyAbas';
import { AVISO_ABA_GESTAO } from '../../lib/permissoes-menu';

/**
 * SimboloPrismaE — marca vetorial da Express Imobi Tech.
 *
 * Tile squircle com o gradiente oficial (esmeralda → teal → sky) e monograma "E"
 * recortado em diagonal ascendente. Sem imagem, sem sombras dentro do glifo e sem
 * gradientes internos: o símbolo continua nítido de 28 px (sidebar recolhida) a 44 px.
 * O nome exportado é mantido por compatibilidade com `SidebarAdmin.jsx`.
 */
export function SimboloPrismaE({ tamanho = 'md', className = '', temaClaro = false }) {
  const caixa =
    tamanho === 'sm'
      ? 'h-8 w-8 rounded-[11px] p-[7px]'
      : tamanho === 'lg'
        ? 'h-11 w-11 rounded-[14px] p-[9px]'
        : 'h-9 w-9 rounded-xl p-2 md:h-10 md:w-10 md:rounded-[13px]';

  return (
    <div
      className={`group relative flex shrink-0 items-center justify-center overflow-hidden ring-1 transition-all duration-300 ${caixa} ${
        temaClaro
          ? 'ring-black/10 shadow-[0_6px_18px_-10px_rgba(13,148,136,0.7)]'
          : 'ring-white/20 shadow-[0_10px_28px_-12px_rgba(16,185,129,0.95)]'
      } ${className}`}
      style={{
        background: 'linear-gradient(142deg, #34D399 0%, #10B981 40%, #0D9488 70%, #0284C7 100%)',
      }}
    >
      {/* brilho de vidro — profundidade sem pesar no traço */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(120% 90% at 20% 0%, rgba(255,255,255,0.55), rgba(255,255,255,0) 62%)',
        }}
      />
      {/* faixa de luz diagonal: reforça o movimento ascendente do monograma */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-6 top-0 h-full w-14 rotate-[18deg] bg-white/15 blur-[6px] transition-transform duration-500 group-hover:translate-x-6"
      />
      {/* aro interno — acabamento de vidro */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/25"
      />

      <svg
        viewBox="0 0 32 32"
        className="relative h-full w-full transition-transform duration-300 group-hover:scale-105"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Express Imobi Tech"
      >
        {/* Monograma "E": haste cheia + três barras com corte diagonal ascendente */}
        <path
          d="M9.3 7H22.7l-1.5 4.1h-7.4v3.1h6l-1.5 4.1h-4.5v3.1h7.4L22.7 25H9.3V7Z"
          fill="#FFFFFF"
        />
        {/* spark de IA no canto livre — detalhe moderno, longe do traço */}
        <path
          d="M25.9 4.6c.28 1.72.84 2.28 2.56 2.56-1.72.28-2.28.84-2.56 2.56-.28-1.72-.84-2.28-2.56-2.56 1.72-.28 2.28-.84 2.56-2.56Z"
          fill="#FFFFFF"
          fillOpacity="0.85"
        />
      </svg>
    </div>
  );
}

/**
 * TechIconBadge — Micro-badge tecnológico vetorial refinado com bordas
 * levemente preenchidas, sem emojis genéricos, com acabamento visual moderno de IA.
 */
function TechIconBadge({ icon: Icon, color = 'emerald', temaClaro = false, size = 18, className = '' }) {
  if (!Icon) return null;

  const colorMap = {
    emerald: temaClaro
      ? 'bg-emerald-50 text-emerald-600 border-emerald-200/90 shadow-xs'
      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    sky: temaClaro
      ? 'bg-sky-50 text-sky-600 border-sky-200/90 shadow-xs'
      : 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    purple: temaClaro
      ? 'bg-purple-50 text-purple-600 border-purple-200/90 shadow-xs'
      : 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    amber: temaClaro
      ? 'bg-amber-50 text-amber-600 border-amber-200/90 shadow-xs'
      : 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    teal: temaClaro
      ? 'bg-teal-50 text-teal-600 border-teal-200/90 shadow-xs'
      : 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    slate: temaClaro
      ? 'bg-slate-100 text-slate-700 border-slate-200/90'
      : 'bg-slate-800/80 text-slate-300 border-slate-700/80',
  };

  const badgeStyle = colorMap[color] || colorMap.slate;

  return (
    <div
      className={`flex items-center justify-center rounded-xl border p-2 transition-transform duration-200 group-hover:scale-105 shrink-0 ${badgeStyle} ${className}`}
    >
      <Icon size={size} strokeWidth={2.2} />
    </div>
  );
}

/**
 * CursorDestaqueInterativo — Ponteiro de mouse moderno em destaque com radar/ping
 * e micro-pílula tecnológica, sugerindo visual moderno de entrada e transição ao clicar.
 */
function CursorDestaqueInterativo({ temaClaro = false, label = '1 clique para abrir' }) {
  return (
    <div className="pointer-events-none absolute -bottom-3.5 right-4 sm:right-6 z-30 flex items-center gap-1.5 animate-bounce transition-all duration-300">
      {/* Halo de Ping / Radar ao redor do ponteiro */}
      <div className="relative flex items-center justify-center">
        <span className="absolute -inset-1.5 rounded-full bg-emerald-400/40 animate-ping" />
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 text-emerald-500 drop-shadow-[0_2px_8px_rgba(16,185,129,0.5)] transform -rotate-12 fill-emerald-600/30 stroke-emerald-500 stroke-2"
        >
          <path d="M3 3l7 18 3-7 7-3L3 3z" />
        </svg>
      </div>

      {/* Micro-pílula de destaque flutuante */}
      <span
        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border shadow-lg backdrop-blur-md flex items-center gap-1 ${
          temaClaro
            ? 'bg-slate-900/90 text-white border-emerald-400/50 shadow-emerald-500/10'
            : 'bg-[#060a10]/95 text-emerald-300 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        {label}
      </span>
    </div>
  );
}

/**
 * SpotlightCard — Card interativo com rastreamento suave de brilho (spotlight)
 * sob o ponteiro do mouse, micro-elevação e halo luminoso no hover.
 */
function SpotlightCard({
  children,
  className = '',
  corGlow = 'rgba(16, 185, 129, 0.22)',
  corBordaHover = 'hover:border-emerald-500/50',
  onClick,
  title,
  dataTour,
}) {
  const [pos, setPos] = useState({ x: 0, y: 0, active: false });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  };

  const handleMouseLeave = () => {
    setPos((prev) => ({ ...prev, active: false }));
  };

  return (
    <div
      data-tour={dataTour}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      title={title}
      className={`relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${corBordaHover} ${className}`}
    >
      {/* Halo / Spotlight Dinâmico que segue o ponteiro */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: pos.active ? 1 : 0,
          background: `radial-gradient(160px circle at ${pos.x}px ${pos.y}px, ${corGlow}, transparent 75%)`,
        }}
      />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}

export default function SidebarAdmin({
  abaAtiva,
  setAbaAtiva,
  nivelVisao = 'gratis',
  ehAdminTotal = false,
  acessoProLiberado = false,
  acessoPlusLiberado = false,
  bloqueioProAtivo = true,
  bloqueioPlusAtivo = true,
  brainLiberado = false,
  totalImoveisCadastrados = 0,
  ehMasterPlataforma = false,
  filtrarPorPapel = (x) => x,
  sidebarRecuada = true,
  onToggleRecuada = () => {},
  onUpgrade = () => {},
  temaClaro = false,
  ehGestor = false,
}) {
  const ehGestorEfetivo = Boolean(
    ehGestor ||
    ehAdminTotal ||
    ehMasterPlataforma ||
    (typeof filtrarPorPapel === 'function' && filtrarPorPapel([{ id: 'notafiscal' }]).length > 0)
  );

  // Grupo selecionado para o Painel Central de Ferramentas (aberto tanto no PC quanto no celular)
  const [grupoCentralAtivo, setGrupoCentralAtivo] = useState(null);

  // Fecha o modal central com tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setGrupoCentralAtivo(null);
    };
    if (grupoCentralAtivo) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [grupoCentralAtivo]);

  // Os 4 Pilares Comerciais do Sistema com Ícones Tecnológicos Modernos (sem emojis)
  const SECOES = [
    {
      key: 'gratis',
      corKey: 'emerald',
      iconePilar: Layers,
      rotuloCurto: 'Grátis',
      titulo: 'Grátis',
      tituloComPreco: 'Grátis · R$ 0',
      corPilar: '#10B981',
      corGlow: 'rgba(16, 185, 129, 0.25)',
      corHaloShadow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.22)]',
      corBordaHover: 'hover:border-emerald-500/50',
      corBadge: temaClaro
        ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      corAtivoBotao: temaClaro
        ? 'border-emerald-500 bg-emerald-50/90 text-emerald-900 shadow-sm ring-1 ring-emerald-400/20'
        : 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.3)]',
      corInativoBotao: temaClaro
        ? 'border-slate-200/90 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-white shadow-xs'
        : 'border-slate-800/90 bg-[#060a10] text-slate-300 hover:border-emerald-500/40 hover:bg-[#0c141a]',
      descricaoGrupo: '10 módulos essenciais inclusos para sua operação imobiliária diária.',
      mostrarPreco: false,
      incluso: true,
      itens: filtrarPorPapel([
        {
          id: 'dashboard_imobi',
          icone: LayoutDashboard,
          label: 'Visão Geral',
          descricao: 'Métricas, VGV em carteira e status geral da imobiliária.',
        },
        {
          id: 'captacao_imobi',
          icone: Building2,
          label: 'Captação & Imóveis',
          badge: !acessoProLiberado ? `${Math.min(totalImoveisCadastrados, 5)}/5 grátis` : 'Ilimitado',
          badgeCor: !acessoProLiberado && totalImoveisCadastrados >= 5
            ? (temaClaro ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/40')
            : (temaClaro ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'),
          descricao: 'Cadastro de imóveis urbanos, rurais e vitrine digital.',
        },
        {
          id: 'funil_leads',
          icone: Users,
          label: 'Leads & Funil CRM',
          descricao: 'Pipeline de atendimento, qualificação e histórico do cliente.',
        },
        {
          id: 'visitas_imobi',
          icone: CalendarCheck,
          label: 'Agenda de Visitas',
          descricao: 'Agendamento de visitas com confirmação direta pelo WhatsApp.',
        },
        {
          id: 'financeiro',
          icone: CircleDollarSign,
          label: 'Financeiro & VGV',
          descricao: 'Previsão de comissões (6%), receitas e controle de caixa.',
        },
        {
          id: 'equipe',
          icone: Briefcase,
          label: 'Corretores & Equipe',
          descricao: 'Gestão de corretores, metas e desempenho da equipe.',
        },
        {
          id: 'guia_campo_bonus',
          icone: Compass,
          label: 'Arena & Treinamento',
          descricao: 'Simulação real de objeções com IA (5 turnos), voz e feedback executivo.',
        },
        {
          id: 'migracao',
          icone: ArrowLeftRight,
          label: 'Migração de CRM',
          descricao: 'Importação rápida de carteira via planilhas e portais.',
        },
        {
          id: 'meuplano',
          icone: Award,
          label: 'Meu Plano',
          descricao: 'Visualização de planos, upgrade e faturas ativas.',
        },
        {
          id: 'config',
          icone: Sliders,
          label: 'Configurações',
          descricao: 'Logo, CRECI, preferências de contato e dados da imobiliária.',
        },
      ]),
    },
    {
      key: 'pro',
      corKey: 'sky',
      iconePilar: Zap,
      rotuloCurto: 'Pro',
      titulo: 'PRO',
      tituloComPreco: 'PRO · R$ 39,90/mês',
      corPilar: '#0284c7',
      corGlow: 'rgba(56, 189, 248, 0.25)',
      corHaloShadow: 'hover:shadow-[0_0_20px_rgba(56,189,248,0.22)]',
      corBordaHover: 'hover:border-sky-500/50',
      corBadge: temaClaro
        ? 'text-sky-700 bg-sky-50 border-sky-300'
        : 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      corAtivoBotao: temaClaro
        ? 'border-sky-500 bg-sky-50/90 text-sky-900 shadow-sm ring-1 ring-sky-400/20'
        : 'border-sky-500 bg-sky-500/20 text-sky-300 shadow-[0_0_18px_rgba(56,189,248,0.3)]',
      corInativoBotao: temaClaro
        ? 'border-slate-200/90 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-white shadow-xs'
        : 'border-slate-800/90 bg-[#060a10] text-slate-300 hover:border-sky-500/40 hover:bg-[#07131e]',
      descricaoGrupo: '3 ferramentas essenciais de captação ilimitada, propostas e anúncios.',
      mostrarPreco: !acessoProLiberado && !ehAdminTotal,
      incluso: acessoProLiberado || ehAdminTotal,
      itens: filtrarPorPapel([
        {
          id: 'captacao_imobi',
          icone: Building2,
          label: 'Captação & Imóveis Ilimitada',
          badge: 'Ilimitado',
          badgeCor: temaClaro ? 'bg-sky-50 text-sky-700 border-sky-300' : 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          descricao: 'Sem teto de 5 imóveis, fotos em alta resolução e vitrine digital pública.',
          bloqueado: bloqueioProAtivo && !ehAdminTotal,
        },
        {
          id: 'historico',
          icone: FileSignature,
          label: 'Propostas & Negócios',
          descricao: 'Estruturação de propostas, contrapropostas e histórico comercial.',
          bloqueado: bloqueioProAtivo && !ehAdminTotal,
        },
        {
          id: 'marketing',
          icone: Target,
          label: 'Meta Ads & Criativos',
          descricao: 'Geração de copys e campanhas para anúncios no Instagram e Facebook.',
          bloqueado: bloqueioProAtivo && !ehAdminTotal,
        },
      ]),
    },
    {
      key: 'plus',
      corKey: 'purple',
      iconePilar: Rocket,
      rotuloCurto: 'Plus',
      titulo: 'PLUS',
      tituloComPreco: 'PLUS · R$ 99,90/mês',
      corPilar: '#9333ea',
      corGlow: 'rgba(168, 85, 247, 0.25)',
      corHaloShadow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.22)]',
      corBordaHover: 'hover:border-purple-500/50',
      corBadge: temaClaro
        ? 'text-purple-700 bg-purple-50 border-purple-300'
        : 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      corAtivoBotao: temaClaro
        ? 'border-purple-500 bg-purple-50/90 text-purple-900 shadow-sm ring-1 ring-purple-400/20'
        : 'border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_18px_rgba(168,85,247,0.3)]',
      corInativoBotao: temaClaro
        ? 'border-slate-200/90 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-white shadow-xs'
        : 'border-slate-800/90 bg-[#060a10] text-slate-300 hover:border-purple-500/40 hover:bg-[#120b1c]',
      descricaoGrupo: '10 módulos estratégicos de liderança comercial, jurídico, fiscal e inteligência.',
      mostrarPreco: !acessoPlusLiberado && !ehAdminTotal,
      incluso: acessoPlusLiberado || ehAdminTotal,
      itens: [
        {
          id: 'radar_captacao',
          icone: Radar,
          label: 'Radar de Captação',
          descricao: 'Mapeamento de proprietários (OLX) e empresas no Google Maps.',
          bloqueado: bloqueioPlusAtivo && !ehAdminTotal,
        },
        {
          id: 'administrador',
          icone: TrendingUp,
          label: 'Diretor Comercial IA',
          descricao: 'Metas da equipe, auditoria de funil e consultoria estratégica.',
          bloqueado: bloqueioPlusAtivo && !ehAdminTotal,
        },
        {
          id: 'roleta_imobi',
          icone: Shuffle,
          label: 'Roleta de Leads',
          descricao: 'Fila rotativa (Round-Robin) com distribuição justa entre corretores.',
          bloqueado: bloqueioPlusAtivo && !ehAdminTotal,
        },
        {
          id: 'credito',
          icone: Landmark,
          label: 'Correspondente / Crédito',
          descricao: 'Pré-simulação bancária Caixa e correspondente imobiliário.',
          bloqueado: bloqueioPlusAtivo && !ehAdminTotal,
        },
        {
          id: 'notafiscal',
          icone: Receipt,
          label: 'Repasses & NF',
          descricao: 'Divisão de comissões entre corretores e fechamentos mensais.',
          badge: !ehGestorEfetivo ? 'Gestão' : undefined,
          badgeCor: !ehGestorEfetivo ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : undefined,
          bloqueado: (bloqueioPlusAtivo && !ehAdminTotal) || !ehGestorEfetivo,
          bloqueadoGestao: !ehGestorEfetivo,
          avisoGestao: AVISO_ABA_GESTAO,
        },
        {
          id: 'contador',
          icone: Calculator,
          label: 'Simuladores de Custos',
          descricao: 'Cálculo de custos de cartório, ITBI, comissões e rentabilidade.',
          bloqueado: bloqueioPlusAtivo && !ehAdminTotal,
        },
        {
          id: 'juridico_imobi',
          icone: Scale,
          label: 'Assistente Legal',
          descricao: 'Minutas de compromisso de compra e venda e checagem de certidões em 27 UFs.',
          bloqueado: bloqueioPlusAtivo && !ehAdminTotal,
        },
        {
          id: 'tarefa',
          icone: ScanLine,
          label: 'Vistoria & Laudo IA',
          descricao: 'Laudos fotográficos por ambiente com inteligência artificial.',
          bloqueado: bloqueioPlusAtivo && !ehAdminTotal,
        },
        {
          id: 'avaliacao_imovel',
          icone: FileText,
          label: 'Avaliação de Imóvel',
          descricao: 'Estudo de valor de mercado e laudo executivo com 5 agentes de IA.',
          bloqueado: bloqueioPlusAtivo && !ehAdminTotal,
        },
        {
          id: 'reunioes-atas',
          icone: Mic,
          label: 'Reuniões & Atas IA',
          descricao: 'Gravação ao vivo, transcrição e geração de ata executiva com tarefas.',
          bloqueado: !acessoPlusLiberado && !brainLiberado && !ehAdminTotal,
        },
        {
          id: 'pos_venda',
          icone: KeyRound,
          label: 'Pós-Venda, Chaves & Carteira',
          descricao: 'Linha do tempo pós-fechamento, entrega de chaves e relacionamento com IA.',
          bloqueado: bloqueioPlusAtivo && !ehAdminTotal,
        },
      ],
    },
    {
      key: 'ia',
      corKey: 'amber',
      iconePilar: Brain,
      rotuloCurto: 'IA',
      titulo: 'IA',
      tituloComPreco: 'IA · 24h',
      corPilar: '#d97706',
      corGlow: 'rgba(245, 158, 11, 0.25)',
      corHaloShadow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.22)]',
      corBordaHover: 'hover:border-amber-500/50',
      corBadge: temaClaro
        ? 'text-amber-700 bg-amber-50 border-amber-300'
        : 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      corAtivoBotao: temaClaro
        ? 'border-amber-500 bg-amber-50/90 text-amber-900 shadow-sm ring-1 ring-amber-400/20'
        : 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.3)]',
      corInativoBotao: temaClaro
        ? 'border-slate-200/90 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-white shadow-xs'
        : 'border-slate-800/90 bg-[#060a10] text-slate-300 hover:border-amber-500/40 hover:bg-[#1a1306]',
      descricaoGrupo: 'Assistentes inteligentes para atendimento 24h no WhatsApp, rotina e segundo cérebro.',
      mostrarPreco: false,
      incluso: ehAdminTotal,
      itens: filtrarPorPapel([
        {
          id: 'sofia_whatsapp',
          icone: MessageSquareQuote,
          label: ehAdminTotal ? 'IA Pólen · 24h' : 'IA Pólen · a partir de R$ 450',
          badge: 'WhatsApp 24h',
          badgeCor: temaClaro ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          descricao: 'Secretária comercial que atende compradores no WhatsApp 24h.',
        },
        {
          id: 'agentes_ia',
          icone: Cpu,
          label: ehAdminTotal ? 'IA Zara' : 'IA Zara · a partir de R$ 349',
          badge: 'Auditoria Funil',
          badgeCor: temaClaro ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          descricao: 'Audita a rotina matinal 08:00, leads parados e imóveis sem giro.',
          bloqueado: !acessoProLiberado && !ehAdminTotal,
        },
        {
          id: 'brain',
          icone: Brain,
          label: ehAdminTotal ? 'IA Tom' : 'IA Tom · a partir de R$ 197',
          badge: '2º Cérebro',
          badgeCor: temaClaro ? 'bg-teal-50 text-teal-700 border-teal-300' : 'bg-teal-500/10 text-teal-400 border-teal-500/30',
          descricao: 'Segundo cérebro com memória estratégica de VGV e inteligência de carteira.',
        },
      ]),
    },
  ];

  const handleItemClick = (item) => {
    if (item.bloqueadoGestao) {
      alert(item.avisoGestao || 'Área de gestão: pergunte ao dono da conta.');
      return;
    }
    if (item.bloqueado) {
      if (typeof onUpgrade === 'function') {
        onUpgrade(item);
      } else {
        setAbaAtiva('meuplano');
      }
      setGrupoCentralAtivo(null);
      return;
    }

    setAbaAtiva(item.id);
    setGrupoCentralAtivo(null);
  };

  const secaoModalCentral = SECOES.find((s) => s.key === grupoCentralAtivo);

  return (
    <>
      {/* ─── 1. SIDEBAR LATERAL CURTA E RECOLHÍVEL (DESKTOP: md:flex) ───────── */}
      <aside
        style={{ backgroundColor: temaClaro ? '#ffffff' : '#020408' }}
        className={`hidden md:flex fixed top-0 bottom-0 left-0 z-40 flex-col border-r transition-all duration-300 ease-in-out ${
          temaClaro
            ? 'border-slate-200/90 bg-white/95 text-slate-800 shadow-sm backdrop-blur-md'
            : 'border-slate-800/80 bg-[#020408] text-white'
        } ${sidebarRecuada ? 'w-20' : 'w-64'}`}
      >
        {/* Botão de Aba Flutuante na Borda (» / «) para Fácil Acesso no Desktop */}
        <button
          type="button"
          onClick={onToggleRecuada}
          className={`absolute -right-3.5 top-12 z-50 flex h-7 w-7 items-center justify-center rounded-full border transition shadow-lg cursor-pointer text-xs font-black ${
            temaClaro
              ? 'border-slate-200 bg-white text-slate-600 hover:text-emerald-600 hover:border-emerald-500 hover:bg-slate-50'
              : 'border-slate-700 bg-[#0a0d14] text-slate-300 hover:text-emerald-400 hover:border-emerald-500 hover:bg-slate-800'
          }`}
          title={sidebarRecuada ? 'Expandir barra lateral (»)' : 'Recuar barra lateral («)'}
          aria-label={sidebarRecuada ? 'Expandir barra lateral' : 'Recuar barra lateral'}
        >
          {sidebarRecuada ? '»' : '«'}
        </button>

        {/* ─── TOPO DA SIDEBAR: MARCA (MONOGRAMA E) + TOGGLE » / « ─────────── */}
        <div className={`flex items-center justify-between px-3 py-3.5 border-b ${
          temaClaro ? 'border-slate-200/90 bg-slate-50/80' : 'border-slate-800/80 bg-[#04070c]'
        }`}>
          {sidebarRecuada ? (
            /* Visão Curta (w-20): marca centralizada */
            <div className="w-full flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAbaAtiva('dashboard_imobi');
                  setGrupoCentralAtivo(null);
                }}
                className="cursor-pointer"
                title="Express Imobi Tech — Ir para Visão Geral"
              >
                <SimboloPrismaE tamanho="md" temaClaro={temaClaro} />
              </button>
            </div>
          ) : (
            /* Visão Expandida: Símbolo + Wordmark + Botão « */
            <div className="w-full flex items-center justify-between gap-2 min-w-0">
              <div
                className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                onClick={() => setAbaAtiva('dashboard_imobi')}
                title="Express Imobi Tech — Ir para Visão Geral"
              >
                <SimboloPrismaE tamanho="sm" temaClaro={temaClaro} />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1 leading-none">
                    <span className={`text-xs font-black tracking-wider ${temaClaro ? 'text-slate-900' : 'text-white'}`}>
                      EXPRESS
                    </span>
                    <span className="text-xs font-bold text-emerald-500">Imobi</span>
                    <span className={`text-xs font-light ${temaClaro ? 'text-slate-500' : 'text-slate-300'}`}>
                      Tech
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold tracking-widest uppercase mt-0.5 truncate ${
                    temaClaro ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    Plataforma IA
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleRecuada}
                className={`h-7 w-7 rounded-lg border flex items-center justify-center transition cursor-pointer text-xs font-black shrink-0 ${
                  temaClaro
                    ? 'border-slate-200 bg-white text-slate-500 hover:text-emerald-600 hover:border-emerald-400'
                    : 'border-slate-800 bg-[#060a10] text-slate-400 hover:text-emerald-400'
                }`}
                title="Recuar barra lateral («)"
                aria-label="Recuar barra lateral"
              >
                «
              </button>
            </div>
          )}
        </div>

        {/* ─── ATALHO INÍCIO / VISÃO GERAL NO TOPO (ÍCONE MODERNO SEM EMOJI) ─── */}
        <div className="px-2 pt-3 pb-1">
          <SpotlightCard
            onClick={() => {
              setAbaAtiva('dashboard_imobi');
              setGrupoCentralAtivo(null);
            }}
            corGlow="rgba(16, 185, 129, 0.2)"
            corBordaHover="hover:border-emerald-500/50"
            className={`rounded-2xl border transition-all ${
              abaAtiva === 'dashboard_imobi'
                ? temaClaro
                  ? 'border-emerald-500 bg-emerald-50/90 text-emerald-900 shadow-sm ring-1 ring-emerald-400/30'
                  : 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : temaClaro
                  ? 'border-slate-200/90 bg-slate-50/70 text-slate-700 hover:bg-white hover:border-slate-300 shadow-xs'
                  : 'border-slate-800/80 bg-[#04070d]/80 text-slate-300 hover:bg-slate-800/40'
            }`}
            title="Ir para Visão Geral (Início)"
          >
            <div className={`flex items-center ${sidebarRecuada ? 'justify-center h-12 w-full' : 'gap-3 px-3.5 py-2.5'}`}>
              <TechIconBadge icon={LayoutDashboard} color="emerald" temaClaro={temaClaro} size={18} />
              {!sidebarRecuada && (
                <div className="flex flex-col min-w-0">
                  <span className={`text-xs font-black truncate ${temaClaro ? 'text-slate-900' : 'text-white'}`}>
                    Visão Geral
                  </span>
                  <span className={`text-[10px] truncate ${temaClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                    Painel & Métricas
                  </span>
                </div>
              )}
            </div>
          </SpotlightCard>
        </div>

        {/* ─── DOCK LATERAL: OS 4 PILARES TECNOLÓGICOS (GRÁTIS, PRO, PLUS, IA) ─── */}
        {/* Ao clicar em qualquer um, abre o Painel Central Flutuante com as ferramentas */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2.5 scrollbar-none flex flex-col justify-start">
          <span className={`text-[9px] font-black uppercase tracking-widest px-1 ${
            temaClaro ? 'text-slate-500' : 'text-slate-400'
          } ${sidebarRecuada ? 'text-center block' : 'block'}`}>
            {sidebarRecuada ? 'Pilares' : 'Pilares Comerciais'}
          </span>

          {SECOES.map((secao) => {
            const grupoTemAbaAtiva = secao.itens.some((it) => it.id === abaAtiva);
            const IconPilar = secao.iconePilar;

            return (
              <SpotlightCard
                key={secao.key}
                onClick={() => setGrupoCentralAtivo(secao.key)}
                corGlow={secao.corGlow}
                corBordaHover={secao.corBordaHover}
                className={`rounded-2xl border transition-all ${
                  grupoTemAbaAtiva
                    ? secao.corAtivoBotao
                    : secao.corInativoBotao
                } ${secao.corHaloShadow}`}
                title={`${secao.titulo} — Clique para abrir ferramentas no centro da tela`}
              >
                <div
                  className={`flex items-center ${
                    sidebarRecuada
                      ? 'flex-col justify-center h-16 w-full py-1.5'
                      : 'justify-between px-3.5 py-3 w-full'
                  }`}
                >
                  <div className={`flex items-center ${sidebarRecuada ? 'flex-col' : 'gap-3'} min-w-0`}>
                    <TechIconBadge
                      icon={IconPilar}
                      color={secao.corKey}
                      temaClaro={temaClaro}
                      size={18}
                    />
                    <div className={`${sidebarRecuada ? 'text-center mt-1' : 'flex flex-col min-w-0'}`}>
                      <span
                        className="text-[11px] font-black uppercase tracking-wider truncate block"
                        style={{
                          color: grupoTemAbaAtiva
                            ? secao.corPilar
                            : temaClaro
                            ? '#0f172a'
                            : '#f1f5f9',
                        }}
                      >
                        {secao.rotuloCurto}
                      </span>
                      {!sidebarRecuada && (
                        <span className={`text-[10px] truncate block ${temaClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                          {secao.itens.length} ferramentas
                        </span>
                      )}
                    </div>
                  </div>

                  {!sidebarRecuada && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {secao.incluso ? (
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${secao.corBadge}`}>
                          Ativo
                        </span>
                      ) : (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          temaClaro
                            ? 'text-slate-600 bg-slate-100 border-slate-200'
                            : 'text-slate-400 bg-slate-800/80 border-slate-700'
                        }`}>
                          R$ 39+
                        </span>
                      )}
                    </div>
                  )}

                  {/* Indicador de ativo em modo recuado */}
                  {sidebarRecuada && grupoTemAbaAtiva && (
                    <span
                      className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-[#020408]"
                      style={{ backgroundColor: secao.corPilar }}
                    />
                  )}
                </div>
              </SpotlightCard>
            );
          })}
        </div>

        {/* ─── RODAPÉ DA SIDEBAR: MEU PLANO (ÍCONE MODERNO) E CONFIGURAÇÕES ─── */}
        <div className={`p-2 border-t ${
          temaClaro ? 'border-slate-200/90 bg-slate-50/80' : 'border-slate-800/80 bg-[#04070c]'
        }`}>
          <SpotlightCard
            onClick={() => {
              setAbaAtiva('meuplano');
              setGrupoCentralAtivo(null);
            }}
            corGlow="rgba(245, 158, 11, 0.2)"
            corBordaHover="hover:border-amber-500/50"
            className={`rounded-2xl border transition ${
              temaClaro
                ? 'border-slate-200 bg-white hover:bg-amber-50/40 text-slate-700 hover:text-slate-900 shadow-xs'
                : 'border-slate-800/80 bg-[#060a10] hover:bg-[#121008] text-slate-300 hover:text-white'
            }`}
            title="Meu Plano & Assinatura"
          >
            <div className={`flex items-center ${sidebarRecuada ? 'justify-center h-11 w-full' : 'justify-between px-3 py-2 w-full'}`}>
              <div className="flex items-center gap-2 min-w-0">
                <TechIconBadge icon={Award} color="amber" temaClaro={temaClaro} size={16} />
                {!sidebarRecuada && (
                  <div className="flex flex-col min-w-0">
                    <span className={`text-xs font-black truncate ${temaClaro ? 'text-slate-900' : 'text-white'}`}>
                      Meu Plano
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold truncate">
                      {ehAdminTotal ? 'Admin Total' : `Plano ${nivelVisao}`}
                    </span>
                  </div>
                )}
              </div>
              {!sidebarRecuada && (
                <span className={`text-[9px] font-extrabold border px-1.5 py-0.5 rounded-md ${
                  temaClaro
                    ? 'text-emerald-700 border-emerald-300 bg-emerald-50'
                    : 'text-emerald-400 border-emerald-500/40'
                }`}>
                  Ver
                </span>
              )}
            </div>
          </SpotlightCard>
        </div>
      </aside>

      {/* ─── 2. BARRA INFERIOR FIXA NO CELULAR (< 768px) ────────────────── */}
      {/* 4 pilares tecnológicos + Início com experiência limpa e moderna */}
      <nav
        style={{ backgroundColor: temaClaro ? '#ffffff' : '#070a0f' }}
        className={`md:hidden fixed bottom-0 inset-x-0 z-40 border-t px-1.5 py-1.5 flex items-center justify-around shadow-2xl backdrop-blur-md ${
          temaClaro
            ? 'border-slate-200 bg-white/95 text-slate-700'
            : 'border-slate-800/90 bg-[#070a0f]/95 text-slate-300'
        }`}
        aria-label="Navegação móvel"
      >
        {/* Botão Início (Visão Geral) */}
        <button
          type="button"
          onClick={() => {
            setAbaAtiva('dashboard_imobi');
            setGrupoCentralAtivo(null);
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer active:scale-95 ${
            abaAtiva === 'dashboard_imobi'
              ? 'text-emerald-600 dark:text-emerald-400 font-black'
              : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LayoutDashboard size={18} strokeWidth={2.2} />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight">Início</span>
        </button>

        {/* Os 4 Pilares: Grátis, Pro, Plus, IA */}
        {SECOES.map((secao) => {
          const isAtivo = secao.itens.some((it) => it.id === abaAtiva);
          const IconPilar = secao.iconePilar;

          return (
            <button
              key={secao.key}
              type="button"
              onClick={() => setGrupoCentralAtivo(secao.key)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer relative active:scale-95 ${
                isAtivo ? 'font-black scale-105' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <IconPilar size={18} strokeWidth={2.2} style={{ color: isAtivo ? secao.corPilar : undefined }} />
              <span
                className="text-[10px] font-extrabold mt-0.5 tracking-tight"
                style={{ color: isAtivo ? secao.corPilar : undefined }}
              >
                {secao.rotuloCurto}
              </span>
              {isAtivo && (
                <span
                  className="absolute -bottom-1 h-1 w-4 rounded-full"
                  style={{ backgroundColor: secao.corPilar }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ─── 3. DOCK CENTRAL ANIMADO FLUTUANTE (PC E CELULAR) ─────────────── */}
      {/* Abre com animação suave e alto contraste nítido em modo claro */}
      {grupoCentralAtivo && secaoModalCentral && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-painel-central"
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-md transition-all duration-300 ease-out animate-in fade-in"
          onClick={() => setGrupoCentralAtivo(null)}
        >
          <div
            style={{ backgroundColor: temaClaro ? '#ffffff' : '#0B1215' }}
            className={`w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all duration-300 ease-out transform scale-100 opacity-100 ${
              temaClaro
                ? 'border-slate-200 bg-white text-slate-900 shadow-[0_25px_65px_rgba(0,0,0,0.14)]'
                : 'border-slate-700/80 bg-[#0B1215] text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.8)]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Painel Central */}
            <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
              temaClaro ? 'border-slate-200 bg-slate-50/90' : 'border-slate-800 bg-[#070d10]'
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                <TechIconBadge
                  icon={secaoModalCentral.iconePilar}
                  color={secaoModalCentral.corKey}
                  temaClaro={temaClaro}
                  size={22}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2
                      id="titulo-painel-central"
                      className={`text-base sm:text-lg font-black truncate ${
                        temaClaro ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      Ferramentas {secaoModalCentral.titulo}
                    </h2>
                    {secaoModalCentral.incluso ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                        temaClaro
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      }`}>
                        Incluso no Plano
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase border border-amber-500/40 bg-amber-500/20 text-amber-600 dark:text-amber-300">
                        {secaoModalCentral.tituloComPreco}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${
                    temaClaro ? 'text-slate-600 font-medium' : 'text-slate-400'
                  }`}>
                    {secaoModalCentral.descricaoGrupo}
                  </p>
                </div>
              </div>

              {/* Botão de Fechar */}
              <button
                type="button"
                onClick={() => setGrupoCentralAtivo(null)}
                className={`h-8 w-8 rounded-full border flex items-center justify-center transition cursor-pointer shrink-0 ${
                  temaClaro
                    ? 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    : 'border-slate-800 bg-[#121920] text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                aria-label="Fechar painel"
              >
                <X size={16} />
              </button>
            </div>

            {/* Abas de Navegação Rápida entre os 4 Pilares no Topo do Modal */}
            <div className={`px-3 sm:px-4 py-2 border-b flex items-center gap-1.5 overflow-x-auto scrollbar-none ${
              temaClaro ? 'border-slate-200 bg-slate-50/50' : 'border-slate-800/80 bg-[#090f13]'
            }`}>
              {SECOES.map((sec) => {
                const ativo = sec.key === grupoCentralAtivo;
                const IconSec = sec.iconePilar;

                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => setGrupoCentralAtivo(sec.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      ativo
                        ? temaClaro
                          ? 'bg-white text-slate-900 border border-slate-300 shadow-sm font-black'
                          : 'bg-slate-800 text-white border border-slate-600 shadow-sm'
                        : temaClaro
                          ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent font-medium'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <IconSec size={14} className={ativo ? (temaClaro ? 'text-emerald-600' : 'text-emerald-400') : 'text-slate-400'} />
                    <span style={{ color: ativo ? sec.corPilar : undefined }}>{sec.rotuloCurto}</span>
                  </button>
                );
              })}
            </div>

            {/* Grade Elegante de Ferramentas com Efeito Spotlight e Alto Contraste */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              <span className={`text-[10px] font-black uppercase tracking-wider block mb-1 ${
                temaClaro ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Selecione uma ferramenta com 1 clique para abrir no painel:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                {secaoModalCentral.itens.map((item, idx) => {
                  const ativo = abaAtiva === item.id;
                  const bloqueado = item.bloqueado;
                  const ganhoContextual = DOR_SOLUCAO[item.id]?.ganho || item.descricao;
                  const IconItem = item.icone;

                  return (
                    <SpotlightCard
                      key={item.id}
                      dataTour={`tab-${item.id}`}
                      onClick={() => handleItemClick(item)}
                      corGlow={secaoModalCentral.corGlow}
                      corBordaHover={secaoModalCentral.corBordaHover}
                      className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 group relative ${
                        ativo
                          ? temaClaro
                            ? 'border-emerald-500 bg-emerald-50/80 text-slate-900 shadow-sm ring-1 ring-emerald-400/30'
                            : 'border-emerald-500 bg-emerald-500/15 shadow-[0_0_20px_rgba(16,185,129,0.2)] text-white'
                          : bloqueado
                            ? temaClaro
                              ? 'border-slate-200 bg-slate-50/70 hover:border-amber-400 hover:bg-slate-100/70 text-slate-900'
                              : 'border-slate-800/80 bg-[#070c10]/80 hover:border-amber-500/40 hover:bg-[#0e161c] text-white'
                            : temaClaro
                              ? 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-slate-50/50 hover:shadow-sm text-slate-900'
                              : 'border-slate-800 bg-[#070c10] hover:bg-[#0e161c] text-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <TechIconBadge
                            icon={IconItem}
                            color={secaoModalCentral.corKey}
                            temaClaro={temaClaro}
                            size={18}
                          />
                          <div className="min-w-0">
                            <h3
                              className={`text-xs sm:text-sm font-black transition truncate ${
                                temaClaro ? 'text-slate-900' : 'text-white'
                              }`}
                              style={{ color: ativo ? secaoModalCentral.corPilar : undefined }}
                            >
                              {item.label}
                            </h3>
                            {item.badge && (
                              <span
                                className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                  item.badgeCor || (temaClaro ? 'border-slate-200 bg-slate-100 text-slate-700' : 'border-slate-700 bg-slate-800 text-slate-300')
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {item.bloqueadoGestao ? (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-black text-amber-500 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full"
                              title="Exclusivo para gestão"
                            >
                              <Lock size={10} /> Gestão
                            </span>
                          ) : bloqueado ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-500 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                              <Lock size={10} /> Upgrade
                            </span>
                          ) : ativo ? (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                temaClaro
                                  ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              }`}
                            >
                              Ativo
                            </span>
                          ) : (
                            <span className={`group-hover:translate-x-0.5 transition-all text-xs font-bold ${
                              temaClaro ? 'text-emerald-700' : 'text-slate-400 group-hover:text-emerald-400'
                            }`}>
                              Abrir →
                            </span>
                          )}
                        </div>
                      </div>

                      {ganhoContextual && (
                        <p className={`text-[11px] leading-relaxed line-clamp-2 ${
                          temaClaro ? 'text-slate-600 font-medium' : 'text-slate-400'
                        }`}>
                          {ganhoContextual}
                        </p>
                      )}

                      {/* Cursor de Rato (Seta) com efeito visual moderno de entrada / transição */}
                      {idx === 0 && (
                        <CursorDestaqueInterativo temaClaro={temaClaro} label="1 clique para abrir" />
                      )}
                    </SpotlightCard>
                  );
                })}
              </div>
            </div>

            {/* Rodapé do Painel Central */}
            <div className={`p-3 sm:p-4 border-t flex items-center justify-between ${
              temaClaro ? 'border-slate-200 bg-slate-50/90' : 'border-slate-800 bg-[#070d10]'
            }`}>
              <span className={`text-[11px] ${temaClaro ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                1 clique para abrir e carregar instantaneamente na área de trabalho.
              </span>
              <button
                type="button"
                onClick={() => setGrupoCentralAtivo(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  temaClaro
                    ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
