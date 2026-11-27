/**
 * CockpitVisaoGeral.jsx — Cockpit Visual Completo do Processo Imobiliário
 * ============================================================================
 * Aba Visão Geral (src/AdminNovo.jsx).
 * Projetado para que qualquer corretor, do iniciante ao gestor, entenda
 * o fluxo imobiliário de ponta a ponta em uma única tela.
 *
 * Estrutura em 3 Faixas Hierárquicas:
 *   Faixa 1 — Trilho Visual de 7 Etapas Clicáveis + Ações Urgentes do Dia;
 *   Faixa 2 — Gráficos Executivos Determinísticos (SVG/CSS Puro);
 *   Faixa 3 — Radar de Mercado & Indicadores de Balcão (Recolhível).
 *
 * 100% Determinístico: ZERO tokens de IA automáticos.
 * Suporta modo escuro (#020408) e claro com verde esmeralda (#10b981).
 * ============================================================================
 */

import React, { useMemo, useState } from 'react';
import {
  Users, Building2, CalendarClock, FileText, FileCheck2,
  CircleDollarSign, HeartHandshake, ArrowRight, AlertTriangle,
  Clock, ShieldAlert, Sparkles, ChevronDown, ChevronUp,
  TrendingUp, Landmark, Building, Key, ExternalLink,
  CheckCircle2, AlertCircle, FileSpreadsheet, Compass,
  PhoneCall, MessageSquare, PieChart,
} from 'lucide-react';
import {
  calcularCockpit,
  INDICES_MERCADO,
  TENDENCIAS_MERCADO,
  formatarMoeda,
} from '../../lib/cockpitImobiliario.js';

// Mapeamento de ícones do trilho e tendências
const ICONES_MAP = {
  Users,
  Building2,
  CalendarClock,
  FileText,
  FileCheck2,
  CircleDollarSign,
  HeartHandshake,
  Landmark,
  Building,
  TrendingUp,
  Key,
};

export default function CockpitVisaoGeral({
  imoveis = [],
  leads = [],
  visitas = [],
  propostas = [],
  tarefas = [],
  cartorio = [],
  vistorias = [],
  posVenda = [],
  oficinaId = '',
  papelLogado = '',
  usuarioNome = '',
  dadosImobiliaria = null,
  temaClaro = false,
  isEscuro = true,
  onAbrirAba = () => {},
  onAbrirPrestacao = () => {},
  onNovoImovel = () => {},
}) {
  const isTemaClaro = temaClaro || !isEscuro;
  const [radarAberto, setRadarAberto] = useState(true);
  const [filtroAcoes, setFiltroAcoes] = useState('todos');

  // Cálculo determinístico local do cockpit
  const dados = useMemo(() => {
    return calcularCockpit({
      imoveis,
      leads,
      visitas,
      propostas,
      tarefas,
      cartorio,
      vistorias,
      posVenda,
    });
  }, [imoveis, leads, visitas, propostas, tarefas, cartorio, vistorias, posVenda]);

  const { etapas, acoesUrgentes, funil, saudeCarteira, origemClientes, emModoDemo } = dados;

  // Filtragem de ações urgentes
  const acoesFiltradas = useMemo(() => {
    if (filtroAcoes === 'todos') return acoesUrgentes;
    return acoesUrgentes.filter((a) => a.tipo === filtroAcoes);
  }, [acoesUrgentes, filtroAcoes]);

  // Classes de tema adaptativo
  const containerCardCls = isTemaClaro
    ? 'bg-white border border-slate-200 shadow-sm text-slate-800'
    : 'bg-[#020408] border border-slate-800/90 shadow-xl text-slate-200';

  const subCardCls = isTemaClaro
    ? 'bg-slate-50 border border-slate-200 text-slate-700'
    : 'bg-slate-950/70 border border-slate-800/80 text-slate-300';

  const textMutedCls = isTemaClaro ? 'text-slate-500' : 'text-slate-400';
  const textHeadingCls = isTemaClaro ? 'text-slate-900' : 'text-white';

  return (
    <div className="space-y-6">
      {/* ─── BANNER COLD START / MODO DEMO (DISCRETO) ───────────────────────── */}
      {emModoDemo && (
        <div
          data-testid="cockpit-cold-start-banner"
          className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border text-xs ${
            isTemaClaro
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">Modo Ambientação (Demonstração):</span>
            <span className={isTemaClaro ? 'text-emerald-700' : 'text-emerald-400'}>
              Exibindo fluxo completo com 5 imóveis e 6 leads de exemplo para orientação do processo imobiliário.
            </span>
          </div>
          <button
            type="button"
            onClick={onNovoImovel}
            className="font-bold underline hover:opacity-80 transition cursor-pointer text-[11px]"
          >
            Cadastrar 1º imóvel real →
          </button>
        </div>
      )}

      {/* ─── FAIXA 1: TRILHO VISUAL DO PROCESSO (7 ETAPAS) ──────────────────── */}
      <section data-testid="faixa-trilho-processo" className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Compass size={18} />
            </div>
            <div>
              <h2 className={`text-base md:text-lg font-black uppercase tracking-tight ${textHeadingCls}`}>
                Trilha do Processo Imobiliário de Ponta a Ponta
              </h2>
              <p className={`text-xs ${textMutedCls}`}>
                Do primeiro lead à entrega de chaves e pós-venda — clique em qualquer etapa para ir à tela operacional
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
            <span>7 Etapas Integradas</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">100% Determinístico</span>
          </div>
        </div>

        {/* Trilha horizontal responsiva: scroll suave no mobile, 7 colunas no desktop */}
        <div
          data-testid="trilho-7-etapas"
          className="flex overflow-x-auto gap-3 pb-2 pt-1 scrollbar-thin md:grid md:grid-cols-7 md:gap-2.5"
        >
          {etapas.map((etapa, idx) => {
            const IconeComponent = ICONES_MAP[etapa.icone] || Users;
            const isGratis = etapa.plano === 'gratis';
            const isPro = etapa.plano === 'pro';
            const isPlus = etapa.plano === 'plus';

            const badgeEstilo = isGratis
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
              : isPro
              ? 'text-sky-400 bg-sky-500/10 border-sky-500/30'
              : 'text-purple-400 bg-purple-500/10 border-purple-500/30';

            return (
              <div
                key={etapa.id}
                data-testid={`etapa-${etapa.id}`}
                onClick={() => onAbrirAba(etapa.abaDestino)}
                className={`group relative flex-shrink-0 w-[190px] md:w-auto p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border hover:-translate-y-0.5 hover:shadow-lg ${
                  isTemaClaro
                    ? 'bg-white border-slate-200 hover:border-emerald-500 shadow-sm'
                    : 'bg-[#020408] border-slate-800 hover:border-emerald-500/70'
                }`}
              >
                {/* Conector sutil visual para desktop (exceto última etapa) */}
                {idx < etapas.length - 1 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-600/70 pointer-events-none text-xs">
                    ›
                  </div>
                )}

                {/* Topo do Card da Etapa: Passo + Badge de Plano */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-black tracking-widest text-slate-500">
                    PASSO {etapa.passo}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wide border ${badgeEstilo}`}
                  >
                    {etapa.badge}
                  </span>
                </div>

                {/* Ícone com halo e Quantidade em Destaque */}
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-xl border transition-colors group-hover:scale-105"
                    style={{
                      backgroundColor: `${etapa.cor}15`,
                      borderColor: `${etapa.cor}40`,
                      color: etapa.cor,
                    }}
                  >
                    <IconeComponent size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-lg font-black leading-none text-emerald-400">
                      {etapa.quantidade}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate block">
                      {etapa.resumo}
                    </span>
                  </div>
                </div>

                {/* Nome da Etapa */}
                <div className="mt-1">
                  <h3
                    className={`text-xs font-bold leading-tight group-hover:text-emerald-400 transition-colors ${
                      isTemaClaro ? 'text-slate-900' : 'text-slate-100'
                    }`}
                  >
                    {etapa.nome}
                  </h3>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {etapa.descricao}
                  </p>
                </div>

                {/* Micro rodapé com link */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 group-hover:text-emerald-400 transition-colors">
                  <span className="font-semibold">Acessar</span>
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── AÇÕES URGENTES DO HOJE ───────────────────────────────────────── */}
        <div
          data-testid="acoes-urgentes-hoje"
          className={`p-4 rounded-3xl ${containerCardCls}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800/70">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <AlertTriangle size={16} />
              </div>
              <div>
                <h3 className={`text-sm font-extrabold uppercase tracking-tight flex items-center gap-2 ${textHeadingCls}`}>
                  <span>Ações Urgentes do Hoje</span>
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {acoesUrgentes.length} pendências
                  </span>
                </h3>
                <p className={`text-[11px] ${textMutedCls}`}>
                  Leads sem resposta há &gt;24h, certidões perto do vencimento, imóveis parados &gt;40d e pós-venda
                </p>
              </div>
            </div>

            {/* Filtros rápidos das ações */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { id: 'todos', label: 'Todas' },
                { id: 'lead_sem_resposta', label: 'Leads > 24h' },
                { id: 'certidao_vencimento', label: 'Certidões' },
                { id: 'imovel_parado', label: 'Imóveis > 40d' },
                { id: 'pos_venda_pendente', label: 'Pós-Venda' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltroAcoes(f.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    filtroAcoes === f.id
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : isTemaClaro
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Ações Urgentes */}
          {acoesFiltradas.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-1">
              <CheckCircle2 size={24} className="text-emerald-500 mb-1" />
              <span className="font-bold text-slate-300">Nenhuma ação crítica pendente neste filtro!</span>
              <span>Todos os contatos, certidões e imóveis estão com o acompanhamento em dia.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {acoesFiltradas.slice(0, 8).map((acao) => {
                const isLead = acao.tipo === 'lead_sem_resposta';
                const isCert = acao.tipo === 'certidao_vencimento';
                const isImovel = acao.tipo === 'imovel_parado';

                const bordaTipo = isLead
                  ? 'border-amber-500/40 hover:border-amber-400'
                  : isCert
                  ? 'border-rose-500/40 hover:border-rose-400'
                  : isImovel
                  ? 'border-sky-500/40 hover:border-sky-400'
                  : 'border-purple-500/40 hover:border-purple-400';

                return (
                  <div
                    key={acao.id}
                    className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${subCardCls} ${bordaTipo}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isLead
                              ? 'bg-amber-500/10 text-amber-400'
                              : isCert
                              ? 'bg-rose-500/10 text-rose-400'
                              : isImovel
                              ? 'bg-sky-500/10 text-sky-400'
                              : 'bg-purple-500/10 text-purple-400'
                          }`}
                        >
                          {isLead ? 'Lead sem Retorno' : isCert ? 'Alerta Cartório' : isImovel ? 'Giro de Carteira' : 'Pós-Venda'}
                        </span>
                        <Clock size={12} className="text-slate-500" />
                      </div>
                      <h4 className={`text-xs font-bold leading-tight line-clamp-1 ${textHeadingCls}`}>
                        {acao.titulo}
                      </h4>
                      <p className={`text-[11px] leading-tight mt-1 line-clamp-2 ${textMutedCls}`}>
                        {acao.subtitulo}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (acao.tipo === 'imovel_parado' && acao.imovelCompleto) {
                          onAbrirPrestacao(acao.imovelCompleto);
                        } else {
                          onAbrirAba(acao.abaDestino);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-emerald-500 text-slate-300 hover:text-white text-[11px] font-bold transition cursor-pointer border border-slate-800"
                    >
                      <span>{acao.acao}</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── FAIXA 2: GRÁFICOS EXECUTIVOS DE LEITURA RÁPIDA ────────────────── */}
      <section data-testid="faixa-graficos-executivos" className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {/* GRÁFICO 1: Funil de Conversão & VGV */}
        <div data-testid="grafico-funil-conversao" className={`p-4 md:p-5 rounded-3xl ${containerCardCls} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h3 className={`text-sm font-extrabold uppercase tracking-tight ${textHeadingCls}`}>
                    Funil de Conversão & VGV
                  </h3>
                  <p className={`text-[11px] ${textMutedCls}`}>Contatos → Visitas → Propostas → Venda</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                {funil.taxaConversaoGeral}% conv.
              </span>
            </div>

            {/* Barras proporcionais do Funil em SVG/CSS */}
            <div className="space-y-3 my-4">
              {[funil.contatos, funil.visitas, funil.propostas, funil.fechamentos].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="font-mono text-emerald-400">{item.total} ({item.pct}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(item.pct, 4)}%`,
                        backgroundColor: item.cor,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className={textMutedCls}>VGV em Negociação:</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatarMoeda(funil.vgvEmMesa || 2400000)}
            </span>
          </div>
        </div>

        {/* GRÁFICO 2: Saúde & Liquidez da Carteira */}
        <div data-testid="grafico-saude-carteira" className={`p-4 md:p-5 rounded-3xl ${containerCardCls} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Building2 size={16} />
                </div>
                <div>
                  <h3 className={`text-sm font-extrabold uppercase tracking-tight ${textHeadingCls}`}>
                    Saúde & Liquidez da Carteira
                  </h3>
                  <p className={`text-[11px] ${textMutedCls}`}>Tempo dos imóveis cadastrados</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                saudeCarteira.faixaMais40.quantidade > 0
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}>
                {saudeCarteira.total} imóveis
              </span>
            </div>

            {/* Barra empilhada visual SVG/CSS puro */}
            <div className="my-4 space-y-3">
              <div className="h-4 w-full bg-slate-900 rounded-xl overflow-hidden flex border border-slate-800">
                <div
                  style={{ width: `${saudeCarteira.faixa0a20.pct}%`, backgroundColor: saudeCarteira.faixa0a20.cor }}
                  title={saudeCarteira.faixa0a20.label}
                  className="h-full transition-all duration-500"
                />
                <div
                  style={{ width: `${saudeCarteira.faixa21a40.pct}%`, backgroundColor: saudeCarteira.faixa21a40.cor }}
                  title={saudeCarteira.faixa21a40.label}
                  className="h-full transition-all duration-500"
                />
                <div
                  style={{ width: `${saudeCarteira.faixaMais40.pct}%`, backgroundColor: saudeCarteira.faixaMais40.cor }}
                  title={saudeCarteira.faixaMais40.label}
                  className="h-full transition-all duration-500"
                />
              </div>

              {/* Legendas das 3 faixas */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-400">0–20 dias (Alta liquidez)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-200">
                    {saudeCarteira.faixa0a20.quantidade} ({saudeCarteira.faixa0a20.pct}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-slate-400">21–40 dias (Atenção / Meia-vida)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-200">
                    {saudeCarteira.faixa21a40.quantidade} ({saudeCarteira.faixa21a40.pct}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-rose-400 font-semibold">+40 dias (Alerta estagnação)</span>
                  </div>
                  <span className="font-mono font-bold text-rose-400">
                    {saudeCarteira.faixaMais40.quantidade} ({saudeCarteira.faixaMais40.pct}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Atalho para Prestação de Contas */}
          <button
            type="button"
            data-testid="btn-prestacao-contas-cockpit"
            onClick={() => onAbrirAba('mapa_inteligencia')}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <FileSpreadsheet size={14} />
            <span>Gerar Prestação de Contas ao Proprietário →</span>
          </button>
        </div>

        {/* GRÁFICO 3: Origem dos Clientes & Atendimento */}
        <div data-testid="grafico-origem-clientes" className={`p-4 md:p-5 rounded-3xl ${containerCardCls} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className={`text-sm font-extrabold uppercase tracking-tight ${textHeadingCls}`}>
                    Origem dos Clientes & Atendimento
                  </h3>
                  <p className={`text-[11px] ${textMutedCls}`}>Canais de entrada dos leads</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                Canais 24h
              </span>
            </div>

            {/* Lista com barras proporcionais de origem */}
            <div className="space-y-2.5 my-3">
              {Object.entries(origemClientes).map(([key, item]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="font-mono text-slate-200">{item.pct}% ({item.total})</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(item.pct, 3)}%`,
                        backgroundColor: item.cor,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Atendimento comercial contínuo via WhatsApp e Portal.</span>
            <button
              type="button"
              onClick={() => onAbrirAba('funil_leads')}
              className="text-emerald-400 font-bold hover:underline"
            >
              Ver Leads →
            </button>
          </div>
        </div>
      </section>

      {/* ─── FAIXA 3: RADAR DE MERCADO & INDICADORES DE BALCÃO ──────────────── */}
      <section
        data-testid="faixa-radar-mercado"
        className={`p-4 md:p-6 rounded-3xl ${containerCardCls} transition-all`}
      >
        {/* Cabeçalho da Seção Recolhível */}
        <div
          onClick={() => setRadarAberto((prev) => !prev)}
          className="flex items-center justify-between gap-4 cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Landmark size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-black uppercase tracking-tight ${textHeadingCls}`}>
                  Radar do Mercado & Indicadores de Balcão
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Consulta de Mesa
                </span>
              </div>
              <p className={`text-xs ${textMutedCls}`}>
                Taxas de referência (Selic, INCC, IGP-M, TR) e argumentos comerciais rápidos para negociação
              </p>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-700 transition"
          >
            <span>{radarAberto ? 'Recolher' : 'Expandir'}</span>
            {radarAberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Conteúdo do Radar (Quando Expandido) */}
        {radarAberto && (
          <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-6 animate-fadeIn">
            {/* Bloco 1: 4 Cards de Índices Oficiais */}
            <div>
              <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
                📊 Índices Financeiros de Referência
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {INDICES_MERCADO.map((idx) => (
                  <div
                    key={idx.id}
                    data-testid={`card-indice-${idx.id}`}
                    className={`p-3.5 rounded-2xl border ${subCardCls} flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[11px] font-bold text-slate-400">{idx.nome}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${idx.badgeCor}`}>
                          {idx.sigla}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5 my-1">
                        <span className="text-xl font-black text-emerald-400 font-mono">
                          {idx.valor}
                        </span>
                        <span className="text-[10px] text-slate-500">{idx.periodo}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight mb-2">
                        {idx.subtitulo}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/60">
                      <span className="text-[10px] text-slate-300 leading-relaxed block italic">
                        💡 {idx.usoPratico}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bloco 2: 4 Destaques e Tendências do Setor */}
            <div>
              <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
                🧭 Destaques & Tendências do Setor (Argumentos Comerciais)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {TENDENCIAS_MERCADO.map((tendencia) => {
                  const Icone = ICONES_MAP[tendencia.icone] || Landmark;
                  return (
                    <div
                      key={tendencia.id}
                      data-testid={`card-tendencia-${tendencia.id}`}
                      className={`p-4 rounded-2xl border ${subCardCls} space-y-2`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Icone size={15} />
                          </div>
                          <div>
                            <h4 className={`text-xs font-bold ${textHeadingCls}`}>
                              {tendencia.titulo}
                            </h4>
                            <span className="text-[10px] text-emerald-400 font-semibold block">
                              {tendencia.tema}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 leading-snug">
                        {tendencia.resumo}
                      </p>

                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed">
                        <strong className="text-emerald-400">Argumento na mesa: </strong>
                        <span>{tendencia.argumentoComercial}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
