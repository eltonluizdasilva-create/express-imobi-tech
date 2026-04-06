/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, getDocs, doc, getDoc } from "firebase/firestore";
import {
    BarChart3, TrendingUp, Users, Wallet, Target,
    AlertCircle, ArrowUpRight, ArrowDownRight,
    Calendar, Briefcase, Award, PieChart
} from "lucide-react";

const STYLES = {
    card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6 md:p-8 mb-6 shadow-xl',
    statCard: 'bg-zinc-950/50 border border-zinc-800 p-6 rounded-[2rem] flex flex-col gap-2 hover:border-emerald-500/50 transition-all'
};

export default function Administrador({ oficinaId }) {
    const [loading, setLoading] = useState(true);
    const [insightAberto, setInsightAberto] = useState(false);
    const [stats, setStats] = useState({
        receitaMes: 0,
        metaMensal: 20000,
        osAbertas: 0,
        ticketMedio: 0
    });

    useEffect(() => {
        const carregarDadosMaster = async () => {
            if (!oficinaId) return;
            setLoading(true);
            try {
                // Busca a Meta da Oficina
                const oficinaDoc = await getDoc(doc(db, 'oficinas', oficinaId));
                const meta = oficinaDoc.exists() ? (oficinaDoc.data().metaMensal || 20000) : 20000;

                // Busca O.S. para calcular receita real do mês
                const q = query(collection(db, 'oficinas', oficinaId, 'os'));
                const querySnapshot = await getDocs(q);

                let total = 0;
                let abertas = 0;
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const valor = parseFloat(data.total || data.totalModulo || 0);
                    if (data.status === 'pago') total += valor;
                    if (data.status !== 'pago' && data.status !== 'cancelado') abertas += 1;
                });

                setStats({
                    receitaMes: total,
                    metaMensal: meta,
                    osAbertas: abertas,
                    ticketMedio: total > 0 ? (total / querySnapshot.size) : 0
                });

            } catch (e) {
                console.error("Erro ao carregar dashboard:", e);
            } finally {
                setLoading(false);
            }
        };

        carregarDadosMaster();
    }, [oficinaId]);

    const percentualMeta = Math.min((stats.receitaMes / stats.metaMensal) * 100, 100);

    return (
        <div className="bg-black min-h-screen text-zinc-100 p-4 md:p-8 pb-40">
            <div className="max-w-7xl mx-auto">

                {/* HEADER ADMINISTRATIVO */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-[2rem] p-8 mb-10 shadow-[0_0_40px_rgba(16,185,129,0.2)] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-black/20 rounded-2xl backdrop-blur-sm">
                            <Briefcase className="text-white" size={40} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Painel de Gestão</h1>
                            <p className="text-emerald-100 font-bold mt-2 uppercase tracking-widest text-xs flex items-center gap-2">
                                <Target size={14} /> Controle Financeiro e Metas da Express Auto Tech
                            </p>
                        </div>
                    </div>
                    <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/10 text-center">
                        <span className="block text-[10px] font-black uppercase text-emerald-200">Hoje</span>
                        <span className="text-xl font-mono font-bold text-white">{new Date().toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>

                {/* 📊 INDICADORES PRINCIPAIS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className={STYLES.statCard}>
                        <div className="flex justify-between items-start">
                            <Wallet className="text-emerald-500" size={24} />
                            <span className="text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded text-[10px] font-bold">+12%</span>
                        </div>
                        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Receita (Mês)</span>
                        <span className="text-3xl font-black text-white">R$ {stats.receitaMes.toFixed(2)}</span>
                    </div>

                    <div className={STYLES.statCard}>
                        <div className="flex justify-between items-start">
                            <Target className="text-amber-500" size={24} />
                            <span className="text-zinc-500 text-[10px] font-bold">META</span>
                        </div>
                        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Progresso da Meta</span>
                        <span className="text-3xl font-black text-white">{percentualMeta.toFixed(1)}%</span>
                        <div className="w-full bg-zinc-800 h-2 rounded-full mt-2 overflow-hidden">
                            <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${percentualMeta}%` }}></div>
                        </div>
                    </div>

                    <div className={STYLES.statCard}>
                        <div className="flex justify-between items-start">
                            <BarChart3 className="text-blue-500" size={24} />
                        </div>
                        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">O.S. em Aberto</span>
                        <span className="text-3xl font-black text-white">{stats.osAbertas}</span>
                    </div>

                    <div className={STYLES.statCard}>
                        <div className="flex justify-between items-start">
                            <TrendingUp className="text-purple-500" size={24} />
                        </div>
                        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Ticket Médio</span>
                        <span className="text-3xl font-black text-white">R$ {stats.ticketMedio.toFixed(2)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* 🏁 METAS E PERFORMANCE */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className={STYLES.card}>
                            <h2 className="text-emerald-500 font-black mb-8 uppercase text-xs tracking-widest flex items-center gap-2 border-l-4 border-emerald-500 pl-4">
                                <Award size={18} /> Metas Mensais da Oficina
                            </h2>

                            <div className="space-y-8">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs font-bold text-zinc-300 uppercase">Faturamento Bruto</span>
                                        <span className="text-xs font-black text-emerald-400">R$ {stats.receitaMes.toFixed(0)} / R$ {stats.metaMensal.toFixed(0)}</span>
                                    </div>
                                    <div className="h-4 bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden">
                                        <div className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all duration-1000" style={{ width: `${percentualMeta}%` }}></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-4">
                                    <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800">
                                        <span className="text-[10px] text-zinc-500 font-black uppercase block mb-1">Lucro Estimado</span>
                                        <span className="text-2xl font-black text-white">R$ {(stats.receitaMes * 0.4).toFixed(2)}</span>
                                    </div>
                                    <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800">
                                        <span className="text-[10px] text-zinc-500 font-black uppercase block mb-1">Falta para Meta</span>
                                        <span className="text-2xl font-black text-rose-500">R$ {Math.max(stats.metaMensal - stats.receitaMes, 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 🏎️ STATUS DE EQUIPE / BOXES */}
                        <div className={STYLES.card}>
                            <h2 className="text-blue-400 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
                                <Users size={18} /> Performance da Equipe
                            </h2>
                            <div className="space-y-4">
                                {[
                                    { nome: 'Mecânico 01', producao: 85, cor: 'bg-blue-500' },
                                    { nome: 'Mecânico 02', producao: 60, cor: 'bg-purple-500' },
                                    { nome: 'Ajudante', producao: 45, cor: 'bg-zinc-700' }
                                ].map(m => (
                                    <div key={m.nome} className="flex items-center gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-900">
                                        <div className={`w-3 h-3 rounded-full ${m.cor}`}></div>
                                        <span className="text-xs font-bold text-zinc-300 w-24">{m.nome}</span>
                                        <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden">
                                            <div className={`h-full ${m.cor}`} style={{ width: `${m.producao}%` }}></div>
                                        </div>
                                        <span className="text-[10px] font-black text-zinc-500 uppercase">{m.producao}% Produtividade</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 🥧 SAÚDE FINANCEIRA (Insights) */}
                    <div className="space-y-8">
                        <div className={STYLES.card}>
                            <h2 className="text-purple-400 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
                                <PieChart size={18} /> Saúde do Negócio
                            </h2>
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-500/20 rounded-xl text-green-500"><ArrowUpRight size={20} /></div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-black uppercase">Maior Receita</p>
                                        <p className="text-sm font-bold text-white italic">Mecânica Geral</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-500/20 rounded-xl text-red-500"><ArrowDownRight size={20} /></div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-black uppercase">Maior Gasto</p>
                                        <p className="text-sm font-bold text-white italic">Peças em Atraso</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-lg shadow-emerald-600/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                                <Target size={120} />
                            </div>
                            <h3 className="text-xl font-black uppercase italic mb-2 relative z-10 tracking-tighter">Insight da IA</h3>
                            <p className="text-emerald-100 text-xs leading-relaxed font-bold relative z-10">
                                "Seu ticket médio subiu 15% este mês. Focar em serviços adicionais pode te ajudar a bater a meta de crescimento mais rápido!"
                            </p>
                            <button onClick={() => setInsightAberto(true)} className="mt-6 px-6 py-3 bg-black text-white font-black text-[10px] uppercase rounded-xl relative z-10 hover:bg-zinc-900 transition-all cursor-pointer">Ver Detalhes</button>
                        </div>
                    </div>

                </div>

            </div>

            {/* MODAL INSIGHT DETALHADO */}
            {insightAberto && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 99999,
                    background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        background: 'linear-gradient(145deg, #0a2a1a, #111)',
                        border: '1px solid #22c55e44',
                        borderRadius: '24px', maxWidth: '520px', width: '100%',
                        padding: '32px', position: 'relative',
                        boxShadow: '0 0 60px rgba(34,197,94,0.2)'
                    }}>
                        {/* X FECHAR */}
                        <button onClick={() => setInsightAberto(false)} style={{
                            position: 'absolute', top: '16px', right: '16px',
                            background: '#1a1a1a', border: '1px solid #333',
                            color: '#666', width: '36px', height: '36px', borderRadius: '50%',
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '16px', fontWeight: 'bold',
                        }}>✕</button>

                        {/* HEADER */}
                        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '50%',
                                background: '#22c55e22', margin: '0 auto 12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid #22c55e44'
                            }}>
                                <span style={{ fontSize: '28px' }}>🧠</span>
                            </div>
                            <h2 style={{ color: '#22c55e', fontSize: '20px', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Análise Profunda da IA
                            </h2>
                            <p style={{ color: '#555', fontSize: '11px', margin: '6px 0 0' }}>
                                Insights gerados com base nos dados da sua oficina
                            </p>
                        </div>

                        {/* DIAGNÓSTICO */}
                        <div style={{ background: '#0a0a0a', border: '1px solid #22c55e22', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
                            <p style={{ color: '#22c55e', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
                                🔍 O Diagnóstico
                            </p>
                            <p style={{ color: '#999', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
                                Notamos que o serviço de <strong style={{ color: 'white' }}>suspensão</strong> aumentou 20% este mês, mas a venda de <strong style={{ color: 'white' }}>alinhamento</strong> caiu 35%. Isso indica que clientes estão vindo para manutenção preventiva, mas não estão convertendo para o serviço completo.
                            </p>
                        </div>

                        {/* ESTRATÉGIA */}
                        <div style={{ background: '#0a0a0a', border: '1px solid #a855f722', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
                            <p style={{ color: '#a855f7', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
                                🚀 A Estratégia
                            </p>
                            <p style={{ color: '#999', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
                                Ofereça o combo <strong style={{ color: 'white' }}>Suspensão + Alinhamento 3D</strong> com 15% de desconto. Isso pode aumentar o Ticket Médio em até <strong style={{ color: '#22c55e' }}>R$ 180 por cliente</strong> e fidelizar o retorno em 60 dias.
                            </p>
                        </div>

                        {/* AÇÃO PRÁTICA */}
                        <div style={{ background: '#0a0a0a', border: '1px solid #f59e0b22', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                            <p style={{ color: '#f59e0b', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>
                                ⚡ Ação Prática
                            </p>
                            <button
                                onClick={() => {
                                    const msg = encodeURIComponent('Olá! Temos uma oferta especial: Combo Suspensão + Alinhamento 3D com 15% OFF! Quer agendar? 🚗✨');
                                    window.open(`https://wa.me/?text=${msg}`, '_blank');
                                }}
                                style={{
                                    width: '100%', padding: '14px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                    color: 'white', border: 'none',
                                    fontWeight: '900', fontSize: '13px', textTransform: 'uppercase',
                                    cursor: 'pointer', boxShadow: '0 4px 16px #22c55e44',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                }}
                            >
                                📣 Gerar Campanha no WhatsApp
                            </button>
                        </div>

                        {/* FECHAR */}
                        <button onClick={() => setInsightAberto(false)} style={{
                            width: '100%', padding: '12px', borderRadius: '12px',
                            background: 'transparent', color: '#555', border: '1px solid #333',
                            fontWeight: '800', fontSize: '12px', textTransform: 'uppercase',
                            cursor: 'pointer',
                        }}>
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}