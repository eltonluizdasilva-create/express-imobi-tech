import React, { useState, useEffect, useMemo } from 'react';
import { useGroq } from '../hooks/useGroq';
import {
    TrendingUp, TrendingDown, Target, DollarSign, Car, Clock,
    Users, Package, AlertTriangle, Trophy, BarChart3,
    Wrench, Star, ArrowUpRight, ArrowDownRight, Brain, Sparkles,
    ChevronRight, Flame, Shield, Activity, CircleDot, Timer,
    UserCheck, ShoppingBag, Loader2, CheckCircle2, XCircle, PowerOff
} from 'lucide-react';

// ─── Utilitários ───────────────────────────────────────────────────────────────

const fmt = (v) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtNum = (v) => Number(v || 0).toLocaleString('pt-BR');

const diasDesde = (dataStr) => {
    if (!dataStr) return 0;
    const d = dataStr?.toDate ? dataStr.toDate() : new Date(dataStr);
    return Math.floor((Date.now() - d.getTime()) / 86_400_000);
};

const mesAtual = () => {
    const now = new Date();
    return { mes: now.getMonth(), ano: now.getFullYear() };
};

const estesMes = (dataStr) => {
    if (!dataStr) return false;
    const d = dataStr?.toDate ? dataStr.toDate() : new Date(dataStr);
    const { mes, ano } = mesAtual();
    return d.getMonth() === mes && d.getFullYear() === ano;
};

// ─── Mini Gráfico de Barras ────────────────────────────────────────────────────

const MiniBarChart = ({ data = [], color = '#10b981' }) => {
    const max = Math.max(...data.map(d => d.v), 1);
    return (
        <div className="flex items-end gap-[3px] h-10">
            {data.map((d, i) => (
                <div key={i} className="flex-1 rounded-t-sm transition-all duration-500" style={{
                    height: `${Math.max((d.v / max) * 100, 4)}%`,
                    background: i === data.length - 1 ? color : `${color}55`,
                }} title={d.label} />
            ))}
        </div>
    );
};

// ─── Termômetro ───────────────────────────────────────────────────────────────

const Termometro = ({ pct = 0, color = '#10b981' }) => (
    <div className="relative h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{
            width: `${Math.min(pct, 100)}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 8px ${color}66`,
        }} />
    </div>
);

// ─── Badge de Posição ─────────────────────────────────────────────────────────

const PodiumBadge = ({ pos }) => {
    const map = { 1: { bg: '#fbbf24', text: '🥇' }, 2: { bg: '#94a3b8', text: '🥈' }, 3: { bg: '#b45309', text: '🥉' } };
    const { text } = map[pos] || { text: '—' };
    return <span className="text-lg leading-none">{text}</span>;
};

// ─── Card Base ────────────────────────────────────────────────────────────────

const BentoCard = ({ children, className = '', glow, onClick }) => (
    <div
        onClick={onClick}
        className={`relative rounded-2xl border border-zinc-800/60 bg-zinc-900/70 backdrop-blur-md overflow-hidden transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-emerald-500/40 hover:scale-[1.01]' : ''} ${className}`}
        style={glow ? { boxShadow: `0 0 0 1px ${glow}22, 0 4px 32px ${glow}18` } : {}}
    >
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }} />
        {children}
    </div>
);

// ─── Badge "Módulo Inativo" ───────────────────────────────────────────────────

const BadgeInativo = ({ onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all duration-200 hover:border-zinc-500 hover:text-zinc-300 active:scale-95"
        style={{ background: 'rgba(39,39,42,0.8)', borderColor: 'rgba(63,63,70,0.7)' }}
        title="Clique para ativar este módulo"
    >
        <PowerOff size={9} className="text-zinc-500" />
        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Módulo Inativo</span>
    </button>
);

// ─── Componente Principal ──────────────────────────────────────────────────────

export default function TorreDeControle360({
    listaCarros = [],
    listaFinanceiro = [],
    listaEstoque = [],
    dadosOficina = {},
    setAbaAtiva,
    moduloLiberado = () => true,
    oficinaId
}) {
    const { analyzeText } = useGroq(oficinaId);

    const [iaLoading, setIaLoading] = useState(false);
    const [iaResposta, setIaResposta] = useState('');
    const [iaAberto, setIaAberto] = useState(false);

    // ── Cálculos Financeiros ──────────────────────────────────────────────────

    const financeiro = useMemo(() => {
        const osMes = listaCarros.filter(os => estesMes(os.data_registro));
        const pagas = osMes.filter(os => {
            const s = (os.statusPagamento || os.status || '').toUpperCase();
            return s === 'PAGO' || s === 'PAGA' || s === 'FINALIZADO' || s === 'FINALIZADA';
        });
        const total = pagas.reduce((acc, os) => acc + Number(os.total || 0), 0);
        const ticketMedio = pagas.length ? total / pagas.length : 0;
        const meta = Number(dadosOficina?.meta_faturamento || 15000);
        const pctMeta = Math.min((total / meta) * 100, 100);

        // Financeiro (entradas/saídas)
        const finMes = listaFinanceiro.filter(f => estesMes(f.data));
        const entradas = finMes.filter(f => f.tipo === 'entrada').reduce((a, f) => a + Number(f.valor || 0), 0);
        const saidas = finMes.filter(f => f.tipo === 'saida').reduce((a, f) => a + Number(f.valor || 0), 0);
        const lucroLiquido = entradas - saidas;

        // Lucro estimado (30% de margem como fallback)
        const lucroEstimado = total * 0.3;

        return { total, ticketMedio, meta, pctMeta, entradas, saidas, lucroLiquido, lucroEstimado, pagas, osMes };
    }, [listaCarros, listaFinanceiro, dadosOficina]);

    // ── O.S. e Pátio ─────────────────────────────────────────────────────────

    const patio = useMemo(() => {
        const pendentes = listaCarros.filter(os => {
            const s = (os.statusPagamento || os.status || '').toUpperCase();
            return s === 'PENDENTE' || s === 'ABERTO' || s === 'ABERTA' || s === 'ORÇAMENTO' || s === 'APROVADO' || s === 'APROVADA' || s === 'EM ANDAMENTO';
        });
        const encalhados = pendentes
            .map(os => ({ ...os, dias: diasDesde(os.data_registro) }))
            .filter(os => os.dias >= 3)
            .sort((a, b) => b.dias - a.dias);
        return { pendentes: pendentes.length, encalhados };
    }, [listaCarros]);

    // ── Ranking de Produtividade ──────────────────────────────────────────────

    const ranking = useMemo(() => {
        const osMes = listaCarros.filter(os => estesMes(os.data_registro));
        const mapa = {};
        osMes.forEach(os => {
            const nome = os.mecanico || os.responsavel || null;
            if (!nome) return;
            if (!mapa[nome]) mapa[nome] = { nome, total: 0, qtd: 0 };
            mapa[nome].total += Number(os.total || 0);
            mapa[nome].qtd += 1;
        });
        return Object.values(mapa).sort((a, b) => b.total - a.total).slice(0, 5);
    }, [listaCarros]);

    // ── Taxa de Conversão ─────────────────────────────────────────────────────

    const conversao = useMemo(() => {
        const osMes = listaCarros.filter(os => estesMes(os.data_registro));
        const pagas = financeiro.pagas.length;
        const total = osMes.length;
        const taxa = total ? Math.round((pagas / total) * 100) : 0;
        return { taxa, total, pagas };
    }, [listaCarros, financeiro]);

    // ── Top Clientes (Curva ABC) ──────────────────────────────────────────────

    const topClientes = useMemo(() => {
        const osMes = listaCarros.filter(os => estesMes(os.data_registro));
        const mapa = {};
        osMes.forEach(os => {
            const nome = os.nomeCliente || os.cliente || 'Anônimo';
            if (!mapa[nome]) mapa[nome] = { nome, total: 0, qtd: 0 };
            mapa[nome].total += Number(os.total || 0);
            mapa[nome].qtd += 1;
        });
        return Object.values(mapa).sort((a, b) => b.total - a.total).slice(0, 3);
    }, [listaCarros]);

    // ── Mini histórico 7 dias para gráficos ─────────────────────────────────

    const historico7dias = useMemo(() => {
        const dias = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const label = d.toLocaleDateString('pt-BR', { weekday: 'short' });
            const v = listaCarros
                .filter(os => {
                    const dt = os.data_registro?.toDate ? os.data_registro.toDate() : new Date(os.data_registro || 0);
                    return dt.toDateString() === d.toDateString();
                })
                .reduce((acc, os) => acc + Number(os.total || 0), 0);
            dias.push({ label, v });
        }
        return dias;
    }, [listaCarros]);

    // ── Estoque: capital parado ───────────────────────────────────────────────

    const capitalParado = useMemo(() =>
        listaEstoque.reduce((acc, item) => acc + (Number(item.preco_custo || 0) * Number(item.quantidade || 0)), 0),
        [listaEstoque]
    );

    // ── IA Copiloto ───────────────────────────────────────────────────────────

    const gerarEstrategia = async () => {
        setIaLoading(true);
        setIaAberto(true);
        setIaResposta('');

        const prompt = `Atue como consultor de negócios focado em oficinas mecânicas. Analise os dados reais de hoje da oficina e dê UMA estratégia direta de ação para aumentar o lucro (máximo 4 linhas, sem usar negritos).
        DADOS DE HOJE:
        Faturamento: ${fmt(financeiro.total)} / Meta: ${fmt(financeiro.meta)}
        Ticket Médio: ${fmt(financeiro.ticketMedio)}
        O.S. Pendentes (Carros parados/Orçamentos não aprovados): ${patio.pendentes}
        Taxa de conversão de clientes: ${conversao.taxa}%`;

        try {
            const res = await analyzeText(prompt);
            setIaResposta(res);
        } catch (error) {
            setIaResposta('⚠️ Erro ao gerar estratégia. Verifique sua conexão com o motor Groq.');
        } finally {
            setIaLoading(false);
        }
    };

    const estoqueAtivo = moduloLiberado('estoque');
    const clientesAtivo = moduloLiberado('clientes');
    const ir = (aba) => { if (setAbaAtiva) setAbaAtiva(aba); };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="w-full min-h-screen px-4 pb-10 pt-2" style={{ background: '#09090b', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

            {/* ── Cabeçalho ────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6 pt-2">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Torre de Controle 360°</span>
                    </div>
                    <h1 className="text-2xl font-black text-white leading-tight tracking-tight">
                        {dadosOficina?.nome || 'Oficina IA'}
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Hoje</p>
                        <p className="text-sm font-bold text-zinc-300">
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                        <Activity size={18} className="text-emerald-400" />
                    </div>
                </div>
            </div>

            {/* ── BENTO GRID ───────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-auto">

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* 1. BLOCO FINANCEIRO — DESTAQUE (col-span-2) */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <BentoCard
                    className="col-span-2 row-span-1 p-5"
                    glow="#10b981"
                    onClick={() => ir('financeiro')}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Financeiro do Mês</span>
                            </div>
                            <p className="text-3xl font-black text-white tracking-tight">{fmt(financeiro.total)}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Meta: {fmt(financeiro.meta)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">% da Meta</p>
                            <p className="text-2xl font-black" style={{
                                color: financeiro.pctMeta >= 100 ? '#10b981' : financeiro.pctMeta >= 60 ? '#f59e0b' : '#ef4444'
                            }}>
                                {financeiro.pctMeta.toFixed(0)}%
                            </p>
                        </div>
                    </div>

                    <Termometro
                        pct={financeiro.pctMeta}
                        color={financeiro.pctMeta >= 100 ? '#10b981' : financeiro.pctMeta >= 60 ? '#f59e0b' : '#ef4444'}
                    />

                    <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="bg-zinc-800/50 rounded-xl p-3">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Ticket Médio</p>
                            <p className="text-sm font-bold text-white">{fmt(financeiro.ticketMedio)}</p>
                        </div>
                        <div className="bg-zinc-800/50 rounded-xl p-3">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Lucro Est.</p>
                            <p className="text-sm font-bold text-emerald-400">{fmt(financeiro.lucroEstimado)}</p>
                        </div>
                        <div className="bg-zinc-800/50 rounded-xl p-3">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">O.S. Pagas</p>
                            <p className="text-sm font-bold text-white">{fmtNum(financeiro.pagas.length)}</p>
                        </div>
                    </div>

                    {/* Mini gráfico 7 dias */}
                    <div className="mt-4">
                        <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-2">Últimos 7 dias</p>
                        <MiniBarChart data={historico7dias} color="#10b981" />
                    </div>
                </BentoCard>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* 2. SECRETÁRIA & PÁTIO */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <BentoCard className="col-span-1 p-5" glow="#6366f1" onClick={() => ir('os')}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                            <Car size={15} className="text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Pátio</span>
                    </div>

                    <p className="text-4xl font-black text-white mb-1">{patio.pendentes}</p>
                    <p className="text-xs text-zinc-500 mb-4">O.S. em aberto</p>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={12} className="text-red-400" />
                                <span className="text-xs text-zinc-400">Encalhados</span>
                            </div>
                            <span className="text-sm font-bold text-red-400">{patio.encalhados.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={12} className="text-emerald-400" />
                                <span className="text-xs text-zinc-400">Pagas hoje</span>
                            </div>
                            <span className="text-sm font-bold text-emerald-400">
                                {listaCarros.filter(os => {
                                    const s = (os.statusPagamento || os.status || '').toUpperCase();
                                    const d = os.data_registro?.toDate ? os.data_registro.toDate() : new Date(os.data_registro || 0);
                                    return (s === 'PAGO' || s === 'PAGA') && d.toDateString() === new Date().toDateString();
                                }).length}
                            </span>
                        </div>
                    </div>
                </BentoCard>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* 3. TAXA DE CONVERSÃO */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <BentoCard className="col-span-1 p-5" glow="#8b5cf6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
                            <Target size={15} className="text-violet-400" />
                        </div>
                        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Conversão</span>
                    </div>

                    <div className="flex items-end gap-2 mb-3">
                        <p className="text-4xl font-black" style={{
                            color: conversao.taxa >= 70 ? '#10b981' : conversao.taxa >= 40 ? '#f59e0b' : '#ef4444'
                        }}>{conversao.taxa}%</p>
                    </div>

                    <Termometro pct={conversao.taxa} color={conversao.taxa >= 70 ? '#10b981' : conversao.taxa >= 40 ? '#f59e0b' : '#ef4444'} />

                    <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                        {conversao.pagas} de {conversao.total} O.S. viraram pagamento
                    </p>

                    <div className="mt-3 p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/40">
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                            {conversao.taxa >= 70
                                ? '🔥 Excelente! Sua equipe está convertendo muito bem.'
                                : conversao.taxa >= 40
                                    ? '⚡ Há espaço para melhorar. Siga os orçamentos pendentes!'
                                    : '⚠️ Atenção! Muitos orçamentos não viram faturamento.'}
                        </p>
                    </div>
                </BentoCard>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* 4. FLUXO DE CAIXA */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <BentoCard className="col-span-2 p-5" glow={financeiro.lucroLiquido >= 0 ? '#10b981' : '#ef4444'} onClick={() => ir('financeiro')}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                            <BarChart3 size={15} className="text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Fluxo de Caixa</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                            <div className="flex items-center gap-1 mb-2">
                                <ArrowUpRight size={12} className="text-emerald-400" />
                                <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Entradas</p>
                            </div>
                            <p className="text-lg font-black text-emerald-400">{fmt(financeiro.entradas)}</p>
                        </div>
                        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                            <div className="flex items-center gap-1 mb-2">
                                <ArrowDownRight size={12} className="text-red-400" />
                                <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold">Saídas</p>
                            </div>
                            <p className="text-lg font-black text-red-400">{fmt(financeiro.saidas)}</p>
                        </div>
                        <div className={`rounded-xl p-3 border ${financeiro.lucroLiquido >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                            <div className="flex items-center gap-1 mb-2">
                                <TrendingUp size={12} className={financeiro.lucroLiquido >= 0 ? 'text-emerald-300' : 'text-red-400'} />
                                <p className={`text-[10px] uppercase tracking-widest font-bold ${financeiro.lucroLiquido >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>Líquido</p>
                            </div>
                            <p className={`text-lg font-black ${financeiro.lucroLiquido >= 0 ? 'text-white' : 'text-red-400'}`}>
                                {fmt(financeiro.lucroLiquido)}
                            </p>
                        </div>
                    </div>

                    {financeiro.lucroLiquido < 0 && (
                        <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                            <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
                            <p className="text-[11px] text-red-300">As saídas estão superando as entradas. Revise suas despesas!</p>
                        </div>
                    )}
                </BentoCard>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* 5. RANKING DE PRODUTIVIDADE */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <BentoCard className="col-span-2 lg:col-span-1 p-5" glow="#f59e0b">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
                            <Trophy size={15} className="text-amber-400" />
                        </div>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Ranking</span>
                    </div>

                    {ranking.length === 0 ? (
                        <p className="text-xs text-zinc-600 text-center py-4">Nenhum dado neste mês</p>
                    ) : (
                        <div className="space-y-2">
                            {ranking.map((m, i) => {
                                const maxTotal = ranking[0]?.total || 1;
                                return (
                                    <div key={m.nome} className="flex items-center gap-3">
                                        <PodiumBadge pos={i + 1} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-xs font-bold text-white truncate">{m.nome}</p>
                                                <p className="text-xs font-black text-emerald-400 ml-2 flex-shrink-0">{fmt(m.total)}</p>
                                            </div>
                                            <Termometro pct={(m.total / maxTotal) * 100} color={i === 0 ? '#fbbf24' : '#10b981'} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </BentoCard>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* 6. TOP CLIENTES (CURVA ABC) */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <BentoCard className="col-span-2 lg:col-span-1 p-5" glow="#3b82f6" onClick={() => ir('clientes')}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center">
                            <Star size={15} className="text-blue-400" />
                        </div>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">VIPs do Mês</span>
                    </div>

                    {topClientes.length === 0 ? (
                        <p className="text-xs text-zinc-600 text-center py-4">Sem dados este mês</p>
                    ) : (
                        <div className="space-y-2">
                            {topClientes.map((c, i) => (
                                <div key={c.nome} className="flex items-center gap-3 p-2 rounded-xl bg-zinc-800/50">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black"
                                        style={{ background: ['#fbbf2422', '#94a3b822', '#b4530922'][i], color: ['#fbbf24', '#94a3b8', '#b45309'][i] }}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{c.nome}</p>
                                        <p className="text-[10px] text-zinc-500">{c.qtd} O.S.</p>
                                    </div>
                                    <p className="text-xs font-black text-blue-400">{fmt(c.total)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </BentoCard>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* 7. GARGALO NO PÁTIO (Encalhados) */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <BentoCard className="col-span-2 p-5" glow={patio.encalhados.length > 0 ? '#ef4444' : '#10b981'}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center">
                                <Timer size={15} className="text-red-400" />
                            </div>
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Gargalo no Pátio</span>
                        </div>
                        {patio.encalhados.length > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/15 border border-red-500/30">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                <span className="text-[10px] font-bold text-red-400">{patio.encalhados.length} alerta{patio.encalhados.length > 1 ? 's' : ''}</span>
                            </div>
                        )}
                    </div>

                    {patio.encalhados.length === 0 ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle2 size={18} className="text-emerald-400" />
                            <p className="text-sm text-emerald-300 font-medium">Nenhum veículo encalhado! Pátio fluindo bem. 🎉</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {patio.encalhados.slice(0, 4).map((os) => (
                                <div key={os.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/8 border border-red-500/20">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center"
                                        style={{ background: os.dias >= 7 ? '#ef444420' : '#f59e0b18', border: `1px solid ${os.dias >= 7 ? '#ef444440' : '#f59e0b30'}` }}>
                                        <span className="text-sm font-black" style={{ color: os.dias >= 7 ? '#ef4444' : '#f59e0b' }}>{os.dias}</span>
                                        <span className="text-[8px]" style={{ color: os.dias >= 7 ? '#ef4444' : '#f59e0b' }}>dias</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white truncate">
                                            {os.modelo || 'Veículo'} — {(os.placa || '???').toUpperCase()}
                                        </p>
                                        <p className="text-[10px] text-zinc-500 truncate">{os.nomeCliente || 'Cliente'}</p>
                                    </div>
                                    {os.dias >= 7 && (
                                        <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                                    )}
                                </div>
                            ))}
                            {patio.encalhados.length > 4 && (
                                <p className="text-[10px] text-zinc-600 text-center pt-1">
                                    +{patio.encalhados.length - 4} mais na lista
                                </p>
                            )}
                        </div>
                    )}
                </BentoCard>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* 8. ESTOQUE */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <BentoCard
                    className="col-span-2 lg:col-span-1 p-5"
                    glow="#10b981"
                    onClick={estoqueAtivo ? () => ir('estoque') : undefined}
                >
                    {/* Header com badge condicional */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                                <Package size={15} className="text-emerald-400" />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Estoque</span>
                        </div>
                        {!estoqueAtivo && <BadgeInativo onClick={() => ir('meuplano')} />}
                    </div>

                    <p className="text-3xl font-black mb-1" style={{ color: estoqueAtivo ? '#fff' : '#3f3f46' }}>
                        {estoqueAtivo ? fmtNum(listaEstoque.length) : '0'}
                    </p>
                    <p className="text-xs text-zinc-500 mb-3">itens cadastrados</p>

                    <div className="p-3 rounded-xl bg-zinc-800/50">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Capital Parado</p>
                        <p className="text-lg font-black" style={{ color: estoqueAtivo ? '#fbbf24' : '#3f3f46' }}>
                            {estoqueAtivo ? fmt(capitalParado) : 'R$ 0,00'}
                        </p>
                    </div>
                </BentoCard>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* 9. CRM / CLIENTES */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <BentoCard
                    className="col-span-2 lg:col-span-1 p-5"
                    glow="#3b82f6"
                    onClick={clientesAtivo ? () => ir('clientes') : undefined}
                >
                    {/* Header com badge condicional */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center">
                                <Users size={15} className="text-blue-400" />
                            </div>
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">CRM Clientes</span>
                        </div>
                        {!clientesAtivo && <BadgeInativo onClick={() => ir('meuplano')} />}
                    </div>

                    <p className="text-3xl font-black mb-1" style={{ color: clientesAtivo ? '#fff' : '#3f3f46' }}>
                        {clientesAtivo ? fmtNum(listaCarros.length) : '0'}
                    </p>
                    <p className="text-xs text-zinc-500 mb-3">O.S. registradas</p>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20"
                        style={{ opacity: clientesAtivo ? 1 : 0.35 }}>
                        <UserCheck size={13} className="text-blue-400" />
                        <p className="text-[11px] text-blue-300">
                            {clientesAtivo ? 'Acesse o histórico completo de clientes' : 'Ative o módulo para ver o histórico'}
                        </p>
                    </div>
                </BentoCard>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* 10. O CÉREBRO — IA COPILOTO (col-span-2, DESTAQUE) */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <div className="col-span-2 rounded-2xl overflow-hidden" style={{
                    background: 'linear-gradient(135deg, #052e16 0%, #0a0a0f 40%, #1e1b4b 100%)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    boxShadow: '0 0 0 1px rgba(16,185,129,0.08), 0 8px 48px rgba(16,185,129,0.12)',
                }}>
                    {/* Estrelas decorativas */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="absolute w-0.5 h-0.5 rounded-full bg-white opacity-30" style={{
                                top: `${10 + Math.sin(i * 2.1) * 35}%`,
                                left: `${5 + (i / 12) * 90}%`,
                                animationDelay: `${i * 0.3}s`,
                            }} />
                        ))}
                    </div>

                    <div className="relative p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 8px #10b981' }} />
                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">IA Copiloto</span>
                                </div>
                                <h3 className="text-lg font-black text-white tracking-tight">O Cérebro da Oficina</h3>
                                <p className="text-xs text-zinc-500 mt-0.5">Cruza todos os dados e te diz o que fazer agora</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #10b98120, #6366f120)', border: '1px solid rgba(16,185,129,0.25)' }}>
                                <Brain size={22} className="text-emerald-300" />
                            </div>
                        </div>

                        {/* Área da resposta IA */}
                        {iaAberto && (
                            <div className="mb-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 min-h-[80px]">
                                {iaLoading ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 size={16} className="text-emerald-400 animate-spin" />
                                        <p className="text-sm text-emerald-300 animate-pulse">Analisando dados da oficina...</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{iaResposta}</p>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={gerarEstrategia}
                                disabled={iaLoading}
                                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    color: '#fff',
                                    boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
                                }}
                            >
                                {iaLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                                {iaLoading ? 'Gerando...' : 'Gerar Estratégia Diária'}
                            </button>

                            {iaAberto && !iaLoading && (
                                <button
                                    onClick={() => { setIaAberto(false); setIaResposta(''); }}
                                    className="px-4 py-3 rounded-xl text-xs font-bold text-zinc-500 bg-zinc-800/80 border border-zinc-700/60 hover:text-white transition-all"
                                >
                                    Limpar
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            </div>{/* fim grid */}

            {/* ── Rodapé ────────────────────────────────────────────────────────── */}
            <div className="mt-6 text-center">
                <p className="text-[9px] text-zinc-700 uppercase tracking-[0.25em]">
                    Express Auto Tech · Torre de Controle 360° · {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
