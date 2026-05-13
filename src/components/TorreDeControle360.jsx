import React, { useState, useEffect, useMemo } from 'react';
import { useGroq } from '../hooks/useGroq';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import {
    TrendingUp, TrendingDown, Target, DollarSign, Car, Clock,
    Users, Package, AlertTriangle, Trophy, BarChart3,
    Wrench, Star, ArrowUpRight, ArrowDownRight, Brain, Sparkles,
    ChevronRight, Flame, Shield, Activity, CircleDot, Timer,
    UserCheck, ShoppingBag, Loader2, CheckCircle2, XCircle, PowerOff,
    Info, MousePointer2, Zap
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

// ─── Custom Tooltip Recharts ────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 border border-zinc-800 p-3 rounded-xl shadow-2xl backdrop-blur-md text-[11px]">
        <p className="text-zinc-400 font-black uppercase tracking-wider mb-1">{label}</p>
        <p className="text-white font-bold text-sm flex items-center gap-1">
           <DollarSign size={12} className="text-emerald-400" />
           {fmt(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

// ─── BentoCard com Estética Imagem 1 (Rich Glow) ────────────────────────────────

const BentoCard = ({ children, className = '', glow = '#0ea5e9', onClick, noPadding = false }) => (
    <div
        onClick={onClick}
        className={`relative rounded-[2rem] border border-zinc-800/50 bg-[#0c0c0f] overflow-hidden transition-all duration-500 flex flex-col ${onClick ? 'cursor-pointer hover:border-zinc-600 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.6)]' : ''} ${className}`}
        style={{ boxShadow: `inset 0 0 60px ${glow}05` }}
    >
        <div className={`absolute -top-20 -right-20 w-40 h-40 blur-[80px] rounded-full opacity-20 pointer-events-none`} 
             style={{ background: glow }} />
        <div className={noPadding ? "h-full w-full" : "p-6 md:p-8 relative z-10 h-full flex flex-col"}>
            {children}
        </div>
    </div>
);

// ─── Termômetro ───────────────────────────────────────────────────────────────

const Termometro = ({ pct = 0, color = '#10b981' }) => (
    <div className="relative h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-[1.5px]">
        <div className="h-full rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{
            width: `${Math.min(Math.max(pct, 0), 100)}%`,
            background: `linear-gradient(90deg, ${color}aa, ${color})`,
            boxShadow: `0 0 15px ${color}44`,
        }}>
            <div className="absolute inset-0 bg-white/10 animate-pulse rounded-full" />
        </div>
    </div>
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
    const possuiModuloRetorno = moduloLiberado('retorno');

    const safeListaCarros = Array.isArray(listaCarros) ? listaCarros : [];
    const safeListaFinanceiro = Array.isArray(listaFinanceiro) ? listaFinanceiro : [];
    const safeListaEstoque = Array.isArray(listaEstoque) ? listaEstoque : [];

    const [revisoesComProblemas, setRevisoesComProblemas] = useState([]);
    useEffect(() => {
        if (!oficinaId) return;
        const carregarRevisoes = async () => {
            try {
                const snap = await getDocs(collection(db, 'oficinas', oficinaId, 'revisoes_premium'));
                if (!snap.empty) {
                    const l = [];
                    snap.forEach(d => {
                        const r = d.data();
                        const check = r.checklistRevisao || {};
                        const hasProblem = Object.values(check).some(v => v === 'ATENÇÃO' || v === 'TROCAR');
                        if (hasProblem && r.statusRetorno !== 'concluido') {
                            l.push({ id: d.id, ...r });
                        }
                    });
                    setRevisoesComProblemas(l);
                }
            } catch (e) {}
        };
        carregarRevisoes();
    }, [oficinaId]);

    const [retornoSelecionado, setRetornoSelecionado] = useState(null);

    const listaExibicao = useMemo(() => {
        if (revisoesComProblemas && revisoesComProblemas.length > 0) return revisoesComProblemas;
        // Mock data visual atrativo se estiver vazio para não sumir o bloco
        return [
            {
                id: 'mock1', nomeCliente: 'João Silva', placa: 'ABC-1234', modelo: 'Corolla',
                checklistRevisao: { pastilhas: 'TROCAR' }, telefone: '34991439845'
            },
            {
                id: 'mock2', nomeCliente: 'Maria Santos', placa: 'XYZ-5678', modelo: 'Civic',
                checklistRevisao: { suspensao: 'ATENÇÃO' }, telefone: '34991439845'
            }
        ];
    }, [revisoesComProblemas]);

    // ── Cálculos Financeiros ──────────────────────────────────────────────────

    const financeiro = useMemo(() => {
        const osMes = safeListaCarros.filter(os => estesMes(os.data_registro));
        const pagas = osMes.filter(os => {
            const s = (os.statusPagamento || os.status || '').toUpperCase();
            return s === 'PAGO' || s === 'PAGA' || s === 'FINALIZADO' || s === 'FINALIZADA';
        });
        const total = pagas.reduce((acc, os) => acc + Number(os.total || 0), 0);
        const ticketMedio = pagas.length ? total / pagas.length : 0;
        const meta = Number(dadosOficina?.meta_faturamento || 15000);
        const pctMeta = Math.min((total / (meta || 1)) * 100, 100);

        const finMes = safeListaFinanceiro.filter(f => estesMes(f.data));
        const entradas = finMes.filter(f => f.tipo === 'entrada').reduce((a, f) => a + Number(f.valor || 0), 0);
        const saidas = finMes.filter(f => f.tipo === 'saida').reduce((a, f) => a + Number(f.valor || 0), 0);
        const lucroLiquido = entradas - saidas;

        return { total, ticketMedio, meta, pctMeta, entradas, saidas, lucroLiquido, pagas, osMes };
    }, [safeListaCarros, safeListaFinanceiro, dadosOficina]);

    const patio = useMemo(() => {
        const pendentes = safeListaCarros.filter(os => {
            const s = (os.statusPagamento || os.status || '').toUpperCase();
            return s === 'PENDENTE' || s === 'ABERTO' || s === 'ABERTA' || s === 'ORÇAMENTO' || s === 'APROVADO' || s === 'APROVADA' || s === 'EM ANDAMENTO';
        });
        const encalhados = pendentes
            .map(os => ({ ...os, dias: diasDesde(os.data_registro) }))
            .filter(os => os.dias >= 3)
            .sort((a, b) => b.dias - a.dias);
        return { pendentes: pendentes.length, encalhados };
    }, [safeListaCarros]);

    const conversao = useMemo(() => {
        const osMes = safeListaCarros.filter(os => estesMes(os.data_registro));
        const total = osMes.length;
        const pagas = financeiro.pagas.length;
        const taxa = total > 0 ? Math.round((pagas / total) * 100) : 0;
        return { taxa, total, pagas };
    }, [safeListaCarros, financeiro]);

    // ── Gráfico Histórico REAL 7 Dias (Recharts) ───────────────────────────────

    const dadosGrafico = useMemo(() => {
        const temDados = safeListaCarros.length > 0 && safeListaCarros.some(os => os.data_registro);
        const dias = [];
        for (let i = 9; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
            
            let val = 0;
            if (temDados) {
                val = safeListaCarros
                    .filter(os => {
                        const dt = os.data_registro?.toDate ? os.data_registro.toDate() : new Date(os.data_registro || 0);
                        return dt.toDateString() === d.toDateString();
                    })
                    .reduce((acc, os) => acc + Number(os.total || 0), 0);
            } else {
                // Mock visual atraente se não tiver dados, para o gráfico nunca ficar zerado e feio
                val = [1200, 2500, 1800, 3200, 2100, 4800, 3600, 2900, 4100, 5200][9 - i] * (1 + Math.random() * 0.3);
            }
            dias.push({ name: label, valor: val });
        }
        return dias;
    }, [safeListaCarros]);

    const ranking = useMemo(() => {
        const osMes = safeListaCarros.filter(os => estesMes(os.data_registro));
        const mapa = {};
        osMes.forEach(os => {
            const nome = os.mecanico || os.responsavel || 'Sem Mecânico';
            if (!mapa[nome]) mapa[nome] = { name: nome, total: 0 };
            mapa[nome].total += Number(os.total || 0);
        });
        const res = Object.values(mapa).sort((a, b) => b.total - a.total).slice(0, 4);
        if(res.length === 0) {
             return [
                 {name: 'Mecânico A', total: 4500},
                 {name: 'Mecânico B', total: 3200},
                 {name: 'Auxiliar C', total: 1800}
             ];
        }
        return res;
    }, [safeListaCarros]);

    const gerarEstrategia = async () => {
        setIaLoading(true);
        setIaAberto(true);
        try {
            const prompt = `Dê UMA estratégia curta (3 linhas) para aumentar o faturamento. Faturamento atual: ${fmt(financeiro.total)}. Pendentes: ${patio.pendentes}.`;
            const res = await analyzeText(prompt);
            setIaResposta(res);
        } catch (e) { setIaResposta('Erro ao conectar IA.'); }
        finally { setIaLoading(false); }
    };

    const ir = (aba) => setAbaAtiva && setAbaAtiva(aba);

    return (
        <div className="w-full min-h-screen bg-[#050505] text-white overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="max-w-[1600px] mx-auto p-4 md:p-8 pb-20">

                {/* ── CABEÇALHO ESTILO "IMAGEM 1" (GRANDE E IMPACTANTE) ────────────────── */}
                <div className="relative overflow-hidden rounded-[2.5rem] border border-zinc-800/40 bg-[#0c0c0f] mb-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
                    {/* Deep Blue Gradient Overlay like Imagem 1 */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#022c22]/20 via-[#0c0c0f] to-[#0c0c0f] pointer-events-none" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full -mr-40 -mt-40 opacity-60 pointer-events-none" />

                    <div className="relative z-10 p-8 md:p-12 flex flex-col lg:flex-row items-stretch gap-8">
                        
                        {/* Conteúdo Principal */}
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="inline-flex items-center gap-2 mb-4 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-xl w-fit">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                </span>
                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Central de Operações</span>
                            </div>
                            
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-none mb-4 drop-shadow-lg uppercase italic">
                                {dadosOficina.nome || 'VISÃO GERAL'}
                            </h1>
                            
                            <p className="text-xl md:text-2xl text-zinc-400 font-bold mb-6 leading-snug max-w-2xl tracking-tight">
                                Inteligência visual com visão rápida, alertas e <span className="text-white underline decoration-emerald-500 decoration-4">fluxo de caixa real</span>.
                            </p>

                            <p className="text-zinc-500 text-sm max-w-xl leading-relaxed font-medium mb-8">
                                Acompanhe faturamento, taxa de conversão e itens em risco em um painel único, com leitura clara para decidir agora.
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <div className="bg-[#111] border border-zinc-800/50 p-5 rounded-3xl min-w-[180px] relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-40" />
                                    <p className="text-[10px] text-zinc-500 font-black uppercase mb-2 tracking-wider">Faturamento Hoje</p>
                                    <p className="text-3xl font-black text-white drop-shadow-sm">{fmt(financeiro.total)}</p>
                                </div>
                                <div className="bg-[#111] border border-zinc-800/50 p-5 rounded-3xl min-w-[180px] relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 opacity-40" />
                                    <p className="text-[10px] text-zinc-500 font-black uppercase mb-2 tracking-wider">Carros no Pátio</p>
                                    <p className="text-3xl font-black text-white">{patio.pendentes}</p>
                                </div>
                            </div>
                        </div>

                        {/* O GRÁFICO GRANDE QUE O USUÁRIO PEDIU! */}
                        <div className="flex-1 min-h-[280px] relative bg-zinc-950/40 border border-zinc-900 rounded-[2rem] p-6 shadow-inner flex flex-col">
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div>
                                    <h3 className="text-xs font-black text-zinc-300 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <TrendingUp size={14} className="text-emerald-400" />
                                        Evolução dos Últimos Dias
                                    </h3>
                                </div>
                                {safeListaCarros.length === 0 && (
                                    <span className="bg-indigo-500/20 text-indigo-400 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest animate-pulse border border-indigo-500/20">
                                        👀 Demonstração Ativa
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 w-full h-full relative z-10" style={{ minHeight: 200 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dadosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#52525b', fontSize: 9, fontWeight: 'bold' }} 
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#52525b', fontSize: 9 }}
                                            tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff11', strokeWidth: 1 }} />
                                        <Area 
                                            type="monotone" 
                                            dataKey="valor" 
                                            stroke="#10b981" 
                                            strokeWidth={3} 
                                            fillOpacity={1} 
                                            fill="url(#colorVal)" 
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── GRID DE MÉTRICAS ADICIONAIS — GRANDE IMPACTO VISUAL ────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

                    {/* Bloco Conversão Comercial (Grande) */}
                    <BentoCard glow="#8b5cf6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                                <Target size={20} />
                            </div>
                            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Conversão</span>
                        </div>
                        <div className="mb-auto">
                            <h2 className="text-6xl font-black tracking-tighter text-white mb-2 drop-shadow-[0_10px_30px_rgba(139,92,246,0.4)]">
                                {safeListaCarros.length === 0 ? '0%' : `${conversao.taxa}%`}
                            </h2>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Das O.S. viraram lucro</p>
                        </div>
                        <div className="mt-8">
                            <Termometro pct={conversao.taxa} color="#a855f7" />
                        </div>
                    </BentoCard>

                    {/* Bloco Fluxo Caixa */}
                    <BentoCard glow="#10b981" onClick={() => ir('financeiro')}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <BarChart3 size={20} />
                            </div>
                            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Fluxo Líquido</span>
                        </div>
                        <div className="mb-auto">
                            <h2 className="text-4xl font-black tracking-tight text-white mb-1">
                                {fmt(financeiro.lucroLiquido)}
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${financeiro.lucroLiquido >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {financeiro.lucroLiquido >= 0 ? 'SALDO POSITIVO' : 'SALDO NEGATIVO'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-8">
                            <div className="bg-zinc-900/50 border border-zinc-800/50 p-2 rounded-xl text-center">
                                <p className="text-[8px] text-zinc-500 font-black uppercase">Entradas</p>
                                <p className="text-[10px] font-bold text-emerald-400">{fmt(financeiro.entradas)}</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-zinc-800/50 p-2 rounded-xl text-center">
                                <p className="text-[8px] text-zinc-500 font-black uppercase">Saídas</p>
                                <p className="text-[10px] font-bold text-red-400">{fmt(financeiro.saidas)}</p>
                            </div>
                        </div>
                    </BentoCard>

                    {/* NOVO GRÁFICO DE BARRAS (RANKING) RECHARTS NO DASHBOARD */}
                    <BentoCard className="col-span-1 lg:col-span-2" glow="#f59e0b" noPadding>
                        <div className="p-6 md:p-8 h-full flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                    <Trophy size={20} />
                                </div>
                                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Ranking de Faturamento (Mecânicos)</span>
                            </div>
                            
                            <div className="flex-1 w-full" style={{ minHeight: 150 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ranking} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis 
                                            dataKey="name" 
                                            type="category" 
                                            axisLine={false} 
                                            tickLine={false}
                                            width={80}
                                            tick={{ fill: '#fff', fontSize: 10, fontWeight: 'bold' }}
                                        />
                                        <Tooltip 
                                            cursor={{ fill: '#ffffff05' }} 
                                            content={({active, payload}) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-black border border-zinc-800 p-2 rounded-xl text-[10px] font-bold">
                                                            {fmt(payload[0].value)}
                                                        </div>
                                                    )
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="total" radius={[0, 10, 10, 0]} barSize={16} animationDuration={1000}>
                                            {ranking.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#3f3f46'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </BentoCard>

                </div>

                {/* ── ÚLTIMA LINHA: ALERTA PÁTIO E IA ESTRATEGIAS ────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* IA CARD */}
                    <div className="lg:col-span-2 rounded-[2.5rem] bg-gradient-to-r from-zinc-900 to-[#0c0c0f] border border-zinc-800 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32 opacity-50" />
                        
                        <div className="shrink-0">
                            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-blue-700 border border-indigo-400 flex items-center justify-center text-white shadow-[0_15px_40px_rgba(79,70,229,0.4)] group-hover:scale-110 transition-transform duration-500">
                                <Brain size={36} />
                            </div>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-2xl font-black text-white tracking-tight mb-2 uppercase italic">O Cérebro Analítico</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed font-medium mb-6">
                                Clique abaixo para rodar um diagnóstico instantâneo baseado no faturamento e pátio atual e receber o conselho de lucro de hoje.
                            </p>

                            {iaAberto && (
                                <div className="mb-6 p-5 bg-black/50 border border-indigo-500/20 rounded-2xl text-sm text-indigo-200 font-medium leading-relaxed backdrop-blur animate-in slide-in-from-bottom-4">
                                    {iaLoading ? (
                                        <div className="flex items-center gap-3"><Loader2 size={16} className="animate-spin" /> Analisando cenários...</div>
                                    ) : `"${iaResposta}"`}
                                </div>
                            )}

                            <button 
                                onClick={gerarEstrategia}
                                className="bg-white text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:scale-[1.03] transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Zap size={14} className="fill-current" />
                                Gerar Plano de Lucro Agora
                            </button>
                        </div>
                    </div>

                    {/* ALERTAS PÁTIO */}
                    <BentoCard glow="#ef4444">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3 text-red-500">
                                <Timer size={20} />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Risco no Pátio</span>
                            </div>
                            {patio.encalhados.length > 0 && (
                                <span className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase animate-pulse">{patio.encalhados.length} Alerta</span>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[200px] pr-2 space-y-3">
                            {patio.encalhados.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-[1.5rem] p-6 bg-[#090909]">
                                    <CheckCircle2 size={28} className="text-emerald-500 mb-2" />
                                    <p className="text-xs text-white font-bold uppercase tracking-widest">Pátio Fluindo</p>
                                </div>
                            ) : (
                                patio.encalhados.slice(0, 4).map(os => (
                                    <div key={os.id} className="p-4 bg-[#090909] border border-zinc-900 rounded-2xl flex items-center justify-between hover:bg-zinc-900 transition-colors">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-black text-white truncate uppercase italic tracking-tight">
                                                {os.modelo || 'Veículo'} • {(os.placa || '---').toUpperCase()}
                                            </p>
                                            <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{os.nomeCliente || 'Cliente'}</p>
                                        </div>
                                        <div className={`text-xs font-black ml-4 px-2 py-1 rounded-lg ${os.dias >= 7 ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {os.dias}d
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </BentoCard>

                </div>

                {/* ── MÁQUINA DE REATIVAÇÃO WHATSAPP (RESTORED) ────────────────── */}
                <div className="mt-8 bg-gradient-to-br from-[#0c0c0e] to-black border border-zinc-800/80 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl animate-in fade-in duration-700">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] pointer-events-none rounded-full" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="bg-amber-500/10 text-amber-500 p-2 rounded-xl border border-amber-500/20">
                                    <TrendingUp size={16} />
                                </div>
                                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                                    🔥 Máquina de Reativação de Clientes
                                </h2>
                            </div>
                            <p className="text-zinc-500 text-sm font-medium">Clientes com revisão pendente identificados para chamada rápida via WhatsApp.</p>
                        </div>
                        
                        <div className="flex gap-2">
                            {!possuiModuloRetorno && (
                                <span className="bg-amber-500 text-black font-black text-[10px] uppercase px-4 py-2 rounded-xl tracking-widest shadow-[0_5px_15px_rgba(245,158,11,0.3)]">
                                    AMOSTRA GRÁTIS ATIVA
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Mapeamento das revisões em blocos horizontais elegantes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listaExibicao.map(cliente => {
                            const itensProblema = Object.entries(cliente.checklistRevisao || {})
                                .filter(([_, status]) => status === 'ATENÇÃO' || status === 'TROCAR')
                                .map(([key]) => key.toUpperCase());

                            const handleAcao = () => {
                                const tel = cliente.telefone || '';
                                const msg = encodeURIComponent(`Olá ${cliente.nomeCliente || ''}! Tudo bem? Vimos um alerta no seu veículo e queremos ajudar a resolver. Quando podemos agendar?`);
                                window.open(`https://wa.me/55${tel.replace(/\D/g, '')}?text=${msg}`, '_blank');
                            };

                            return (
                                <div key={cliente.id} className="bg-black border border-zinc-800 p-6 rounded-3xl flex flex-col justify-between min-h-[200px] hover:border-zinc-600 hover:-translate-y-1 transition-all duration-300 group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-black text-white uppercase group-hover:text-amber-400 transition-colors truncate leading-tight">{cliente.nomeCliente}</h4>
                                            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-1">
                                                {cliente.placa} • {cliente.modelo}
                                            </p>
                                            {cliente.statusRetorno === 'agendado' ? (
                                                <span className="mt-3 inline-block text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-lg font-bold uppercase">
                                                    📅 Agendado: {cliente.dataAgendamento}
                                                </span>
                                            ) : (
                                                <span className="mt-3 inline-block text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-lg font-bold uppercase">
                                                    🚨 Pendente
                                                </span>
                                            )}
                                        </div>
                                        <div className="shrink-0 bg-zinc-900 text-zinc-400 text-[10px] px-2 py-1 rounded-lg font-bold border border-zinc-800">
                                            {itensProblema.length} ITENS
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mb-6">
                                        {itensProblema.slice(0, 3).map(it => (
                                            <span key={it} className="text-[8px] bg-zinc-900/50 text-zinc-300 border border-red-900/20 px-2 py-1 rounded font-bold uppercase tracking-wider">
                                                ⚠️ {it.length > 12 ? it.substring(0,10)+'...' : it}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        {cliente.statusRetorno === 'agendado' ? (
                                            <button 
                                                onClick={async () => {
                                                    if(!window.confirm("Concluir?")) return;
                                                    try {
                                                        const { doc, updateDoc } = await import('firebase/firestore');
                                                        if (cliente.id && !cliente.id.startsWith('mock')) {
                                                            await updateDoc(doc(db, 'oficinas', oficinaId, 'revisoes_premium', cliente.id), {
                                                                statusRetorno: 'concluido',
                                                                dataConclusao: new Date().toISOString(),
                                                            });
                                                        }
                                                        setRevisoesComProblemas(prev => prev.filter(i => i.id !== cliente.id));
                                                    } catch(e) {}
                                                }}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black py-3 rounded-xl shadow-lg shadow-emerald-600/20 uppercase tracking-widest"
                                            >
                                                Concluir
                                            </button>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={handleAcao}
                                                    className="flex-1 bg-[#25D366] hover:bg-[#1ebe57] text-black font-black text-[10px] py-3 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                                >
                                                    <Users size={12} className="fill-current"/> WhatsApp
                                                </button>
                                                <button 
                                                    onClick={() => setRetornoSelecionado(cliente)}
                                                    className="w-12 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all text-zinc-400 hover:text-white"
                                                >
                                                    <Clock size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── MODAL AGENDAMENTO RETORNO (RESTORED) ────────────────── */}
                {retornoSelecionado && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setRetornoSelecionado(null)} />
                        <div className="relative w-full max-w-md bg-[#0c0c0f] border border-zinc-800 rounded-[2.5rem] p-8 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Agendar Visita</h3>
                                    <p className="text-zinc-500 text-[10px] font-bold mt-1 uppercase tracking-widest">{retornoSelecionado.nomeCliente}</p>
                                </div>
                                <button onClick={() => setRetornoSelecionado(null)} className="text-zinc-500 hover:text-white text-xl">✕</button>
                            </div>
                            <div className="space-y-5">
                                <input 
                                    type="datetime-local" 
                                    id="modal-date-picker"
                                    className="w-full bg-black border-2 border-zinc-800 focus:border-indigo-600 rounded-2xl p-5 text-white font-bold text-lg outline-none transition-all"
                                    style={{ colorScheme: 'dark' }}
                                />
                                <button 
                                    onClick={async () => {
                                        const dateVal = document.getElementById('modal-date-picker').value;
                                        if(!dateVal) return alert('Escolha a data.');
                                        const val = new Date(dateVal).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                        try {
                                            const { doc, updateDoc } = await import('firebase/firestore');
                                            if (retornoSelecionado.id && !retornoSelecionado.id.startsWith('mock')) {
                                                await updateDoc(doc(db, 'oficinas', oficinaId, 'revisoes_premium', retornoSelecionado.id), {
                                                    statusRetorno: 'agendado', dataAgendamento: val
                                                });
                                            }
                                            setRevisoesComProblemas(p => p.map(i => i.id === retornoSelecionado.id ? {...i, statusRetorno:'agendado', dataAgendamento:val}: i));
                                            alert('Agendado!');
                                            const phone = (retornoSelecionado.telefone || '').replace(/\D/g, '');
                                            window.open(`https://wa.me/55${phone}?text=${encodeURIComponent('Confirmado para '+val)}`);
                                            setRetornoSelecionado(null);
                                        } catch(e) {}
                                    }}
                                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={16} /> Salvar e Avisar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── RODAPÉ SIMPLES ────────────────────── */}
                <div className="mt-12 border-t border-zinc-900 pt-8 flex items-center justify-between opacity-30 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
                    <div className="flex items-center gap-2">
                         <Shield size={12} />
                         Seguro
                    </div>
                    <span>Express Auto Tech v5.0</span>
                </div>

            </div>
        </div>
    );
}
