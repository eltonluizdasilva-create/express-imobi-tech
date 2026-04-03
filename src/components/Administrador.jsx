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
                                "Elton, seu ticket médio subiu 15% este mês. Focar em serviços de **Ar-Condicionado** e **Estética** no próximo mês pode te fazer bater a meta de R$ 20k mais rápido!"
                            </p>
                            <button className="mt-6 px-6 py-3 bg-black text-white font-black text-[10px] uppercase rounded-xl relative z-10 hover:bg-zinc-900 transition-all">Ver Detalhes</button>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}